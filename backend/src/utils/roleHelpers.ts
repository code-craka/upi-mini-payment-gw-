import { UserRole } from "../models/User.js";

/**
 * Role hierarchy definitions for UPI Mini Gateway
 * Higher numbers indicate higher privileges
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    user: 1,
    merchant: 2,
    superadmin: 3
};

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    user: "User",
    merchant: "Merchant",
    superadmin: "Super Admin"
};

/**
 * Role colors for UI elements
 */
export const ROLE_COLORS: Record<UserRole, string> = {
    user: "#10B981", // Green
    merchant: "#3B82F6", // Blue
    superadmin: "#8B5CF6" // Purple
};

/**
 * Check if a role is at or above a certain level
 * @param userRole The user's current role
 * @param requiredRole The minimum required role
 * @returns boolean indicating if the user meets the requirement
 */
export const isRoleAtOrAbove = (userRole: UserRole, requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Check if a role is above another role
 * @param userRole The user's current role
 * @param targetRole The role to compare against
 * @returns boolean indicating if the user role is higher
 */
export const isRoleAbove = (userRole: UserRole, targetRole: UserRole): boolean => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Get all roles at or below a certain level
 * @param role The reference role
 * @returns Array of roles at or below the given role
 */
export const getRolesAtOrBelow = (role: UserRole): UserRole[] => {
    const hierarchy = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level <= hierarchy)
        .map(([roleName]) => roleName as UserRole);
};

/**
 * Get all roles above a certain level
 * @param role The reference role
 * @returns Array of roles above the given role
 */
export const getRolesAbove = (role: UserRole): UserRole[] => {
    const hierarchy = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level > hierarchy)
        .map(([roleName]) => roleName as UserRole);
};

/**
 * Permission checking utilities
 */
export const PermissionHelpers = {
    /**
     * Check if a user can create another user of a specific role
     * @param creatorRole The role of the user creating
     * @param targetRole The role being created
     * @returns boolean indicating permission
     */
    canCreateRole: (creatorRole: UserRole, targetRole: UserRole): boolean => {
        switch (creatorRole) {
            case "superadmin":
                return true; // Can create any role
            case "merchant":
                return targetRole === "user"; // Can only create users
            case "user":
                return false; // Cannot create any users
            default:
                return false;
        }
    },

    /**
     * Check if a user can delete another user
     * @param deleterRole The role of the user deleting
     * @param targetRole The role being deleted
     * @param isOwnAccount Whether the user is deleting their own account
     * @returns boolean indicating permission
     */
    canDeleteUser: (deleterRole: UserRole, targetRole: UserRole, isOwnAccount: boolean = false): boolean => {
        if (isOwnAccount && deleterRole !== "superadmin") {
            return false; // Users cannot delete their own accounts (except superadmin)
        }

        switch (deleterRole) {
            case "superadmin":
                return true; // Can delete anyone
            case "merchant":
                return targetRole === "user"; // Can only delete users
            case "user":
                return false; // Cannot delete anyone
            default:
                return false;
        }
    },

    /**
     * Check if a user can view another user's data
     * @param viewerRole The role of the viewer
     * @param targetRole The role of the target user
     * @param isSameParent Whether they share the same parent (for merchant-user relationships)
     * @param isOwnAccount Whether viewing own account
     * @returns boolean indicating permission
     */
    canViewUser: (
        viewerRole: UserRole,
        targetRole: UserRole,
        isSameParent: boolean = false,
        isOwnAccount: boolean = false
    ): boolean => {
        if (isOwnAccount) return true;

        switch (viewerRole) {
            case "superadmin":
                return true; // Can view anyone
            case "merchant":
                return targetRole === "user" && isSameParent; // Can view their users
            case "user":
                return false; // Can only view themselves
            default:
                return false;
        }
    },

    /**
     * Check if a user can manage orders
     * @param userRole The user's role
     * @param orderOwnerId The ID of the order owner
     * @param orderMerchantId The ID of the merchant associated with the order
     * @param userId The ID of the current user
     * @returns boolean indicating permission
     */
    canManageOrder: (
        userRole: UserRole,
        orderOwnerId: string,
        orderMerchantId: string,
        userId: string
    ): boolean => {
        switch (userRole) {
            case "superadmin":
                return true; // Can manage all orders
            case "merchant":
                return orderMerchantId === userId; // Can manage orders from their users
            case "user":
                return orderOwnerId === userId; // Can only manage their own orders
            default:
                return false;
        }
    },

    /**
     * Check if a user can invalidate orders (superadmin only)
     * @param userRole The user's role
     * @returns boolean indicating permission
     */
    canInvalidateOrder: (userRole: UserRole): boolean => {
        return userRole === "superadmin";
    }
};

/**
 * Data filtering utilities for role-based access
 */
export const DataFilters = {
    /**
     * Get user filter based on role
     * @param userRole The user's role
     * @param userId The user's ID
     * @returns MongoDB filter object
     */
    getUserFilter: (userRole: UserRole, userId: string) => {
        switch (userRole) {
            case "superadmin":
                return { isActive: true }; // See all active users
            case "merchant":
                return {
                    $and: [
                        { isActive: true },
                        {
                            $or: [
                                { _id: userId }, // Themselves
                                { parent: userId } // Their users
                            ]
                        }
                    ]
                };
            case "user":
                return { _id: userId, isActive: true }; // Only themselves
            default:
                return { _id: null }; // No access
        }
    },

    /**
     * Get order filter based on role
     * @param userRole The user's role
     * @param userId The user's ID
     * @returns MongoDB filter object
     */
    getOrderFilter: (userRole: UserRole, userId: string) => {
        switch (userRole) {
            case "superadmin":
                return { isActive: true }; // See all active orders
            case "merchant":
                return {
                    isActive: true,
                    merchant: userId // Orders from their merchant account
                };
            case "user":
                return {
                    isActive: true,
                    user: userId // Only their own orders
                };
            default:
                return { _id: null }; // No access
        }
    }
};

/**
 * Validation helpers
 */
export const ValidationHelpers = {
    /**
     * Validate role transition
     * @param fromRole Current role
     * @param toRole Target role
     * @param editorRole Role of the user making the change
     * @returns boolean indicating if transition is valid
     */
    isValidRoleTransition: (fromRole: UserRole, toRole: UserRole, editorRole: UserRole): boolean => {
        // Only superadmin can change roles
        if (editorRole !== "superadmin") return false;

        // Prevent demotion of superadmin (must be done carefully)
        if (fromRole === "superadmin" && toRole !== "superadmin") {
            return false; // Requires special handling
        }

        return true;
    },

    /**
     * Check if a role name is valid
     * @param role The role string to validate
     * @returns boolean indicating validity
     */
    isValidRole: (role: string): role is UserRole => {
        return Object.keys(ROLE_HIERARCHY).includes(role);
    }
};

export default {
    ROLE_HIERARCHY,
    ROLE_DISPLAY_NAMES,
    ROLE_COLORS,
    isRoleAtOrAbove,
    isRoleAbove,
    getRolesAtOrBelow,
    getRolesAbove,
    PermissionHelpers,
    DataFilters,
    ValidationHelpers
};