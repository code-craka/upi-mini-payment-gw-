import type { PermissionGateProps, UserRole } from "../../types/types";

// Role hierarchy levels for permission checking
const roleHierarchy: Record<UserRole, number> = {
  superadmin: 3,
  merchant: 2,
  user: 1
};

function hasPermission(
  userRole: UserRole,
  requiredRole?: UserRole,
  requiredRoles?: UserRole[]
): boolean {
  if (!requiredRole && !requiredRoles) return true;

  if (requiredRole) {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  if (requiredRoles) {
    return requiredRoles.includes(userRole);
  }

  return false;
}

function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem("user");
    const role = localStorage.getItem("role") as UserRole;
    const userId = localStorage.getItem("userId");

    if (userStr) {
      return JSON.parse(userStr);
    }

    // Fallback to legacy storage
    return role ? { role, _id: userId } : null;
  } catch {
    return null;
  }
}

export default function PermissionGate({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
  allowSelf = false,
  resourceOwnerId
}: PermissionGateProps) {
  const user = getUserFromStorage();

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;
  const userId = user._id;

  // Check if user owns the resource (for self-access scenarios)
  if (allowSelf && resourceOwnerId && userId === resourceOwnerId) {
    return <>{children}</>;
  }

  // Check role-based permissions
  if (hasPermission(userRole, requiredRole, requiredRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}