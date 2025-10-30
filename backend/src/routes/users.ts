import { Router } from "express";
import {
    protect,
    superadmin,
    merchant,
    canManageTargetUser,
    AuthRequest
} from "../middleware/auth.js";
import User, { UserRole } from "../models/User.js";
import { DataFilters, PermissionHelpers } from "../utils/roleHelpers.js";

const router = Router();

/**
 * GET / - Get users based on role
 * - Superadmin: sees all users
 * - Merchant: sees themselves and their users
 * - User: sees only themselves
 */
router.get("/", protect, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                code: "NOT_AUTHENTICATED"
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filter = DataFilters.getUserFilter(req.user.role, req.user.userId);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .populate("parent", "username role")
                .populate("createdBy", "username role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /merchants - Get all merchants (superadmin only)
 * Used for dropdowns and user assignment
 */
router.get("/merchants", protect, superadmin, async (req: AuthRequest, res) => {
    try {
        const merchants = await User.find({
            role: "merchant",
            isActive: true
        })
            .select("username role createdAt")
            .sort({ username: 1 });

        res.json(merchants);
    } catch (error) {
        console.error("Error fetching merchants:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * POST / - Create a new user with role-based restrictions (CANONICAL ENDPOINT)
 * ✅ RECOMMENDED: Use this endpoint for user creation
 *
 * Permissions by role:
 * - Superadmin: can create any role (superadmin, merchant, user)
 * - Merchant: can only create users under themselves
 * - User: cannot create users
 *
 * Note: Deprecated endpoint /api/auth/register has identical functionality.
 * This RESTful endpoint should be used for all new implementations.
 *
 * @param {string} username - User's login name (required)
 * @param {string} password - User's password (required)
 * @param {string} role - User's role (optional, defaults to "user")
 * @param {string} parentId - Merchant ID for users (required when superadmin creates users)
 *
 * @returns {object} - { message, user, code }
 */
router.post("/", protect, merchant, async (req: AuthRequest, res) => {
    try {
        const { username, password, role, parentId } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
                code: "MISSING_REQUIRED_FIELDS"
            });
        }

        const targetRole: UserRole = role || "user";

        // Check if the creator can create this role
        if (!PermissionHelpers.canCreateRole(req.user!.role, targetRole)) {
            return res.status(403).json({
                message: `Cannot create ${targetRole} role`,
                code: "INSUFFICIENT_PRIVILEGES",
                allowedRoles: req.user!.role === "merchant" ? ["user"] : []
            });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
                code: "USERNAME_EXISTS"
            });
        }

        // Determine parent based on role and creator
        let parent = null;
        if (targetRole === "user") {
            if (req.user!.role === "superadmin") {
                // Superadmin must specify a merchant parent
                if (!parentId) {
                    return res.status(400).json({
                        message: "Merchant parent required for user creation",
                        code: "MERCHANT_PARENT_REQUIRED"
                    });
                }
                const merchantParent = await User.findById(parentId);
                if (!merchantParent || merchantParent.role !== "merchant") {
                    return res.status(400).json({
                        message: "Invalid merchant parent",
                        code: "INVALID_MERCHANT_PARENT"
                    });
                }
                parent = parentId;
            } else if (req.user!.role === "merchant") {
                // Merchant creates users under themselves
                parent = req.user!.userId;
            }
        }

        const userData = {
            username,
            password,
            role: targetRole,
            parent,
            createdBy: req.user!.userId,
            isActive: true
        };

        const user = await User.create(userData);

        // Return user without password
        const responseUser = await User.findById(user._id)
            .select("-password")
            .populate("parent", "username role")
            .populate("createdBy", "username role");

        res.status(201).json({
            message: "User created successfully",
            user: responseUser
        });
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error && error.message.includes("Users must have a merchant parent")) {
            return res.status(400).json({
                message: "Users must have a merchant parent",
                code: "MERCHANT_PARENT_REQUIRED"
            });
        }
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * PUT /:id - Update a user with ownership validation
 */
router.put("/:id", protect, canManageTargetUser, async (req: AuthRequest, res) => {
    try {
        const { username, role, isActive } = req.body;
        const targetUserId = req.params.id;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        // Build update object
        const updateData: any = {};

        if (username) {
            // Check username uniqueness (excluding current user)
            const existingUser = await User.findOne({
                username,
                _id: { $ne: targetUserId }
            });
            if (existingUser) {
                return res.status(400).json({
                    message: "Username already exists",
                    code: "USERNAME_EXISTS"
                });
            }
            updateData.username = username;
        }

        // Role changes (superadmin only)
        if (role && req.user!.role === "superadmin") {
            updateData.role = role;
        }

        // Active status changes (superadmin and merchants for their users)
        if (typeof isActive === "boolean") {
            if (req.user!.role === "superadmin" ||
                (req.user!.role === "merchant" && targetUser.role === "user")) {
                updateData.isActive = isActive;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            targetUserId,
            updateData,
            { new: true, runValidators: true }
        )
            .select("-password")
            .populate("parent", "username role")
            .populate("createdBy", "username role");

        res.json({
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * DELETE /:id - Soft delete a user with permission checking
 */
router.delete("/:id", protect, canManageTargetUser, async (req: AuthRequest, res) => {
    try {
        const targetUserId = req.params.id;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        // Check if user can be deleted
        if (!PermissionHelpers.canDeleteUser(req.user!.role, targetUser.role)) {
            return res.status(403).json({
                message: "Cannot delete this user",
                code: "CANNOT_DELETE_USER"
            });
        }

        // Soft delete by setting isActive to false
        await User.findByIdAndUpdate(targetUserId, {
            isActive: false,
            deletedAt: new Date(),
            deletedBy: req.user!.userId
        });

        res.json({
            message: "User deleted successfully",
            code: "USER_DELETED"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

// Legacy admin route for backward compatibility
export const adminRoutes = {
    // Keep old endpoints working
    getAllUsers: router.get.bind(router),
    createUser: router.post.bind(router),
    deleteUser: router.delete.bind(router)
};

export default router;
