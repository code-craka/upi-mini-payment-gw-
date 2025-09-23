import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole, IUser } from "../models/User.js";
import { isRoleAtOrAbove } from "../utils/roleHelpers.js";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: UserRole;
    };
    userData?: IUser;
}

/**
 * JWT payload interface
 */
interface JWTPayload {
    userId: string;
    role: UserRole;
}

/**
 * Enhanced protect middleware with user data population
 */
export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Not authorized, no token provided",
                code: "NO_TOKEN"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as JWTPayload;

        // Fetch user data and validate
        const userData = await User.findById(decoded.userId)
            .select("-password")
            .populate("parent", "username role")
            .populate("createdBy", "username role");

        if (!userData || !userData.isActive) {
            return res.status(401).json({
                message: "User not found or inactive",
                code: "USER_INACTIVE"
            });
        }

        // Update role in case it changed in database
        req.user = {
            userId: decoded.userId,
            role: userData.role
        };
        req.userData = userData;

        next();
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({
            message: "Not authorized, token failed",
            code: "TOKEN_INVALID"
        });
    }
};

/**
 * Superadmin-only middleware
 */
export const superadmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "superadmin") {
        next();
    } else {
        res.status(403).json({
            message: "Access denied. Superadmin privileges required.",
            code: "INSUFFICIENT_PRIVILEGES",
            required: "superadmin",
            current: req.user?.role || "none"
        });
    }
};

/**
 * Merchant or above middleware
 */
export const merchant = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && isRoleAtOrAbove(req.user.role, "merchant")) {
        next();
    } else {
        res.status(403).json({
            message: "Access denied. Merchant privileges or above required.",
            code: "INSUFFICIENT_PRIVILEGES",
            required: "merchant",
            current: req.user?.role || "none"
        });
    }
};

/**
 * Merchant-only middleware (excludes superadmin)
 */
export const merchantOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "merchant") {
        next();
    } else {
        res.status(403).json({
            message: "Access denied. Merchant-only access.",
            code: "INSUFFICIENT_PRIVILEGES",
            required: "merchant",
            current: req.user?.role || "none"
        });
    }
};

/**
 * Role-based middleware factory
 */
export const roleOrAbove = (requiredRole: UserRole) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user && isRoleAtOrAbove(req.user.role, requiredRole)) {
            next();
        } else {
            res.status(403).json({
                message: `Access denied. ${requiredRole} privileges or above required.`,
                code: "INSUFFICIENT_PRIVILEGES",
                required: requiredRole,
                current: req.user?.role || "none"
            });
        }
    };
};

/**
 * Utility function to check if user can manage another user
 */
export const canManageUser = async (managerId: string, targetUserId: string): Promise<boolean> => {
    try {
        const [manager, targetUser] = await Promise.all([
            User.findById(managerId),
            User.findById(targetUserId)
        ]);

        if (!manager || !targetUser || !manager.isActive || !targetUser.isActive) {
            return false;
        }

        return manager.canManage(targetUser);
    } catch (error) {
        console.error("Error checking user management permissions:", error);
        return false;
    }
};

/**
 * Middleware to check if user can manage the target user in params
 */
export const canManageTargetUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const targetUserId = req.params.id || req.params.userId;
        if (!targetUserId) {
            return res.status(400).json({
                message: "Target user ID required",
                code: "MISSING_TARGET_USER"
            });
        }

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                code: "NOT_AUTHENTICATED"
            });
        }

        // Superadmins can manage anyone
        if (req.user.role === "superadmin") {
            return next();
        }

        const canManage = await canManageUser(req.user.userId, targetUserId);
        if (canManage) {
            next();
        } else {
            res.status(403).json({
                message: "Access denied. Cannot manage this user.",
                code: "CANNOT_MANAGE_USER"
            });
        }
    } catch (error) {
        console.error("Error in canManageTargetUser middleware:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
};

/**
 * Legacy admin middleware for backward compatibility
 * Maps old "admin" role to new "superadmin" role
 */
export const admin = superadmin;
