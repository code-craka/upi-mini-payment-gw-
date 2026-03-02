import type { User } from "../../types/types";
import RoleBadge from "./RoleBadge";
import { FiArrowDown, FiUsers, FiUser } from "react-icons/fi";

interface UserHierarchyProps {
  user: User;
  showParent?: boolean;
  showChildren?: boolean;
  children?: User[];
  compact?: boolean;
}

export default function UserHierarchy({
  user,
  showParent = true,
  showChildren = true,
  children = [],
  compact = false
}: UserHierarchyProps) {
  if (compact) {
    return (
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-medium">{user.username}</h3>
              <RoleBadge role={user.role} size="sm" />
            </div>
            {user.parent && (
              <p className="text-xs text-slate-400">
                Under: {user.parent.username}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
      {/* Parent Level */}
      {showParent && user.parent && (
        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.parent.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user.parent.username}</p>
              <RoleBadge role={user.parent.role} size="sm" variant="outline" />
            </div>
          </div>
          <div className="flex justify-center my-2">
            <FiArrowDown className="text-slate-400" />
          </div>
        </div>
      )}

      {/* Current User */}
      <div className="mb-4">
        <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-white font-semibold text-lg">{user.username}</h3>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-slate-300 text-sm">
              {user.role === "superadmin" && "Global system administrator"}
              {user.role === "merchant" && "Manages users and orders"}
              {user.role === "user" && "Individual user account"}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Created: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-xs text-slate-400 mt-1">
              {user.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Children Level */}
      {showChildren && children.length > 0 && (
        <div>
          <div className="flex justify-center mb-2">
            <FiArrowDown className="text-slate-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-3">
              <FiUsers className="text-slate-400" />
              <p className="text-slate-400 text-sm font-medium">
                {children.length} {children.length === 1 ? 'User' : 'Users'} Under {user.username}
              </p>
            </div>
            {children.map((child) => (
              <div key={child._id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <FiUser className="text-white text-sm" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-white font-medium">{child.username}</p>
                    <RoleBadge role={child.role} size="sm" variant="subtle" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Created: {new Date(child.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${child.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Children Message */}
      {showChildren && children.length === 0 && user.role !== "user" && (
        <div>
          <div className="flex justify-center mb-2">
            <FiArrowDown className="text-slate-400" />
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <FiUsers className="mx-auto text-slate-400 text-2xl mb-2" />
            <p className="text-slate-400 text-sm">
              No users under {user.username}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}