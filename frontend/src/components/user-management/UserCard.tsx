import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiEdit2, FiTrash2, FiPower, FiEye, FiCalendar, FiShoppingBag } from "react-icons/fi";
import { UserCardProps, UserRole } from "../../types/types";
import { RoleBadge, PermissionGate } from "../rbac";

function canManageUser(currentUserRole: UserRole, targetUser: any, currentUserId: string): boolean {
  // Superadmin can manage everyone except themselves (with confirmation)
  if (currentUserRole === "superadmin") {
    return true;
  }

  // Merchant can manage their own users
  if (currentUserRole === "merchant" && targetUser.parent?._id === currentUserId) {
    return true;
  }

  // Users can view/edit their own profile
  if (currentUserRole === "user" && targetUser._id === currentUserId) {
    return true;
  }

  return false;
}

export default function UserCard({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  compact = false
}: UserCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = currentUser.role as UserRole;
  const currentUserId = currentUser._id;

  const canManage = canManageUser(currentUserRole, user, currentUserId);
  const isOwnProfile = user._id === currentUserId;

  const handleToggleStatus = async () => {
    if (!onToggleStatus) return;

    setLoading(true);
    try {
      await onToggleStatus(user);
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setLoading(true);
    try {
      await onDelete(user);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{user.username}</h3>
                <RoleBadge role={user.role} size="sm" variant="outline" />
              </div>
              {user.parent && (
                <p className="text-xs text-slate-400">
                  Under: {user.parent.username}
                </p>
              )}
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-xl opacity-50"></div>
      <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-white font-semibold text-lg">{user.username}</h3>
                <RoleBadge role={user.role} />
                {isOwnProfile && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              user.isActive
                ? 'bg-green-400/20 text-green-400'
                : 'bg-red-400/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Parent Information */}
          {user.parent && (
            <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
              <FiUser className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-slate-400 text-xs">Under Merchant</p>
                <p className="text-white font-medium">{user.parent.username}</p>
              </div>
            </div>
          )}

          {/* Created By */}
          {user.createdBy && (
            <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
              <FiCalendar className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-slate-400 text-xs">Created By</p>
                <p className="text-white font-medium">{user.createdBy.username}</p>
              </div>
            </div>
          )}

          {/* Order Stats */}
          {user.orderStats && (
            <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
              <FiShoppingBag className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-slate-400 text-xs">Total Orders</p>
                <p className="text-white font-medium">{user.orderStats.total}</p>
              </div>
            </div>
          )}

          {/* Role Description */}
          <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
            <div className="w-4 h-4 flex items-center justify-center">
              {user.role === "superadmin" && "🛡️"}
              {user.role === "merchant" && "🏪"}
              {user.role === "user" && "👤"}
            </div>
            <div>
              <p className="text-slate-400 text-xs">Role</p>
              <p className="text-white font-medium">
                {user.role === "superadmin" && "System Administrator"}
                {user.role === "merchant" && "Merchant Account"}
                {user.role === "user" && "Individual User"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && canManage && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              {/* View/Edit Profile */}
              {(isOwnProfile || currentUserRole === "superadmin" ||
                (currentUserRole === "merchant" && user.role === "user")) && (
                <PermissionGate allowSelf resourceOwnerId={user._id}>
                  <button
                    onClick={() => onEdit?.(user)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {isOwnProfile ? <FiEye className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                    <span className="text-sm">
                      {isOwnProfile ? "View Profile" : "Edit"}
                    </span>
                  </button>
                </PermissionGate>
              )}

              {/* Toggle Status */}
              <PermissionGate requiredRoles={["superadmin", "merchant"]}>
                {!isOwnProfile && onToggleStatus && (
                  <button
                    onClick={handleToggleStatus}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      user.isActive
                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                    }`}
                    disabled={loading}
                  >
                    <FiPower className="w-4 h-4" />
                    <span className="text-sm">
                      {user.isActive ? "Deactivate" : "Activate"}
                    </span>
                  </button>
                )}
              </PermissionGate>
            </div>

            {/* Delete User */}
            <PermissionGate requiredRoles={["superadmin", "merchant"]}>
              {!isOwnProfile && onDelete && (
                <div className="relative">
                  {!showConfirmDelete ? (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span className="text-sm">Delete</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                        disabled={loading}
                      >
                        {loading ? "Deleting..." : "Confirm"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </PermissionGate>
          </div>
        )}
      </div>
    </motion.div>
  );
}