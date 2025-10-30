import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { protect, superadmin, merchant, AuthRequest } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import User, { UserRole } from "../models/User.js";
import { PermissionHelpers, ROLE_DISPLAY_NAMES } from "../utils/roleHelpers.js";

const router = Router();

/**
 * POST /register - Enhanced registration with parent assignment logic
 * ⚠️ DEPRECATED: Use POST /api/users instead (RESTful endpoint)
 *
 * This endpoint is maintained for backward compatibility.
 * Functionality is duplicated in users.ts route.
 * All new implementations should use POST /api/users endpoint.
 *
 * Role-based registration restrictions maintained
 */
router.post(
    "/register",
    protect,
    merchant, // Merchants and above can register users
    async (req: AuthRequest, res: Response) => {
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
                    message: `Cannot create ${ROLE_DISPLAY_NAMES[targetRole]} role`,
                    code: "INSUFFICIENT_PRIVILEGES",
                    allowedRoles: req.user!.role === "merchant" ? ["user"] : ["superadmin", "merchant", "user"]
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

            return res.status(201).json({
                message: "User registered successfully",
                user: responseUser,
                code: "USER_CREATED"
            });
        } catch (error) {
            console.error("Registration error:", error);
            if (error instanceof Error && error.message.includes("Users must have a merchant parent")) {
                return res.status(400).json({
                    message: "Users must have a merchant parent",
                    code: "MERCHANT_PARENT_REQUIRED"
                });
            }
            return res.status(500).json({
                message: "Internal server error",
                code: "INTERNAL_ERROR"
            });
        }
    }
);

/**
 * POST /login - Enhanced login with comprehensive user data
 * Maintains backward compatibility
 */
/**
 * POST /login - User authentication
 * Rate limited to prevent brute force attacks
 */
router.post("/login", authLimiter, async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
                code: "MISSING_CREDENTIALS"
            });
        }

        // Find user with password and populate relationships
        const user = await User.findOne({ username, isActive: true })
            .select("+password")
            .populate("parent", "username role")
            .populate("createdBy", "username role");

        if (!user || !user.password) {
            return res.status(401).json({
                message: "Invalid credentials",
                code: "INVALID_CREDENTIALS"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
                code: "INVALID_CREDENTIALS"
            });
        }

        // Generate JWT token with role information
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        // Prepare user data for response (exclude password)
        const userResponse = {
            _id: user._id,
            username: user.username,
            role: user.role,
            parent: user.parent,
            createdBy: user.createdBy,
            createdAt: user.createdAt,
            isActive: user.isActive
        };

        console.log(`Login successful for ${user.role}: ${username}`);

        return res.json({
            message: "Login successful",
            token,
            user: userResponse,
            expiresIn: "24h",
            code: "LOGIN_SUCCESS"
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /profile - Get current user profile
 */
router.get("/profile", protect, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userData) {
            return res.status(401).json({
                message: "User data not available",
                code: "USER_DATA_UNAVAILABLE"
            });
        }

        // Return profile without sensitive information
        const profileData = {
            _id: req.userData._id,
            username: req.userData.username,
            role: req.userData.role,
            parent: req.userData.parent,
            createdBy: req.userData.createdBy,
            createdAt: req.userData.createdAt,
            isActive: req.userData.isActive
        };

        return res.json({
            profile: profileData,
            permissions: {
                canCreateUsers: PermissionHelpers.canCreateRole(req.userData.role, "user"),
                canCreateMerchants: PermissionHelpers.canCreateRole(req.userData.role, "merchant"),
                canInvalidateOrders: PermissionHelpers.canInvalidateOrder(req.userData.role)
            }
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * PUT /change-password - Change user password
 */
router.put("/change-password", protect, async (req: AuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required",
                code: "MISSING_PASSWORDS"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long",
                code: "PASSWORD_TOO_SHORT"
            });
        }

        // Find user with current password
        const user = await User.findById(req.user!.userId).select("+password");
        if (!user || !user.password) {
            return res.status(404).json({
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Current password is incorrect",
                code: "INVALID_CURRENT_PASSWORD"
            });
        }

        // Update password (will be hashed by pre-save middleware)
        user.password = newPassword;
        await user.save();

        return res.json({
            message: "Password changed successfully",
            code: "PASSWORD_CHANGED"
        });
    } catch (error) {
        console.error("Password change error:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * POST /logout - Logout user (client-side token removal)
 * This endpoint exists for consistency but actual logout is handled client-side
 */
router.post("/logout", protect, async (req: AuthRequest, res: Response) => {
    try {
        // In a JWT system, logout is primarily handled client-side by removing the token
        // This endpoint can be used for logging purposes or future token blacklisting

        console.log(`User ${req.user!.userId} logged out`);

        return res.json({
            message: "Logged out successfully",
            code: "LOGOUT_SUCCESS"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /verify-token - Verify JWT token validity
 */
router.get("/verify-token", protect, async (req: AuthRequest, res: Response) => {
    try {
        // If we reach this point, the token is valid (protect middleware passed)
        return res.json({
            valid: true,
            user: {
                userId: req.user!.userId,
                role: req.user!.role,
                username: req.userData?.username
            },
            code: "TOKEN_VALID"
        });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

// Legacy routes for backward compatibility
export const legacyRoutes = {
    register: router.post.bind(router),
    login: router.post.bind(router)
};

export default router;
