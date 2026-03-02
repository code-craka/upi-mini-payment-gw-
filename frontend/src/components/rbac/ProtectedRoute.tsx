import { Navigate } from "react-router-dom";
import type { ProtectedRouteProps } from "../../types/types";
import PermissionGate from "./PermissionGate";

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  fallback
}: ProtectedRouteProps) {
  const token = localStorage.getItem("token");

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Default fallback for insufficient permissions
  const defaultFallback = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-300 mb-4">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <PermissionGate
      requiredRole={requiredRole}
      requiredRoles={requiredRoles}
      fallback={fallback || defaultFallback}
    >
      {children}
    </PermissionGate>
  );
}