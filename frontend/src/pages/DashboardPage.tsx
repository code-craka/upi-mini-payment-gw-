import { useEffect, useState } from "react";
import type { UserRole, User } from "../types/types";
import { SuperadminDashboard, MerchantDashboard, UserDashboard } from "../components/dashboards";
import { ProtectedRoute } from "../components/rbac";

function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem("user");
    const role = localStorage.getItem("role") as UserRole;

    if (userStr) {
      return JSON.parse(userStr);
    }

    // Fallback to legacy storage
    return role ? { role } : null;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-400/30 rounded-full animate-spin border-t-purple-400"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/30 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl">Authentication required</div>
        </div>
      </div>
    );
  }

  const role = user.role as UserRole;

  return (
    <ProtectedRoute requiredRoles={["superadmin", "merchant", "user"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Role-specific Dashboard Content */}
        <div className="relative">
          {role === "superadmin" && <SuperadminDashboard />}
          {role === "merchant" && <MerchantDashboard />}
          {role === "user" && <UserDashboard />}
        </div>
      </div>
    </ProtectedRoute>
  );
}