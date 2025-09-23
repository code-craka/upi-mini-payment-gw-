import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiLock, FiUserPlus, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { UserFormData, UserRole, User } from "../../types/types";
import { RoleBadge, PermissionGate } from "../rbac";

interface UserCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
  className?: string;
}

export default function UserCreateForm({
  isOpen,
  onClose,
  onUserCreated,
  className = ""
}: UserCreateFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    password: "",
    role: "user",
    parentId: ""
  });
  const [merchants, setMerchants] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserRole = currentUser.role as UserRole;

  // Determine available roles based on current user's role
  const getAvailableRoles = (): UserRole[] => {
    switch (currentUserRole) {
      case "superadmin":
        return ["merchant", "user"];
      case "merchant":
        return ["user"];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    if (isOpen && currentUserRole === "superadmin") {
      fetchMerchants();
    }
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, currentUserRole]);

  const fetchMerchants = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users?role=merchant`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMerchants(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "user",
      parentId: ""
    });
    setErrors({});
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // If superadmin is creating a user (not merchant), require parent selection
    if (currentUserRole === "superadmin" && formData.role === "user" && !formData.parentId) {
      newErrors.parentId = "Please select a merchant for this user";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        ...(formData.parentId && { parentId: formData.parentId })
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        onUserCreated(data.user);

        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Failed to create user" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FiUserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New User</h2>
              <p className="text-slate-400 text-sm">Add a new user to the system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-green-400">
              <FiCheck className="w-4 h-4" />
              <span className="text-sm font-medium">User created successfully!</span>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <FiAlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiUser className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:outline-none transition-all duration-300 ${
                  errors.username ? "border-red-500/50" : "border-white/20 focus:border-purple-400"
                }`}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiLock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:outline-none transition-all duration-300 ${
                  errors.password ? "border-red-500/50" : "border-white/20 focus:border-purple-400"
                }`}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Role
            </label>
            <div className="space-y-2">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    disabled={loading}
                  />
                  <RoleBadge role={role} size="sm" />
                  <span className="text-slate-300 text-sm">
                    {role === "merchant" && "Can manage users and orders"}
                    {role === "user" && "Individual user account"}
                  </span>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="text-red-400 text-xs mt-1">{errors.role}</p>
            )}
          </div>

          {/* Merchant Selection (for superadmin creating users) */}
          <PermissionGate requiredRole="superadmin">
            {formData.role === "user" && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Assign to Merchant
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => handleInputChange("parentId", e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:bg-white/10 focus:outline-none transition-all duration-300 ${
                    errors.parentId ? "border-red-500/50" : "border-white/20 focus:border-purple-400"
                  }`}
                  disabled={loading}
                >
                  <option value="" className="bg-slate-800">Select a merchant...</option>
                  {merchants.map((merchant) => (
                    <option key={merchant._id} value={merchant._id} className="bg-slate-800">
                      {merchant.username}
                    </option>
                  ))}
                </select>
                {errors.parentId && (
                  <p className="text-red-400 text-xs mt-1">{errors.parentId}</p>
                )}
              </div>
            )}
          </PermissionGate>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : success ? (
                <div className="flex items-center justify-center space-x-2">
                  <FiCheck className="w-4 h-4" />
                  <span>Created!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <FiUserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}