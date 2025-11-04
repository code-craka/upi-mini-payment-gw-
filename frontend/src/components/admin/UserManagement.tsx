import axios from "axios";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
    FiAlertTriangle,
    FiEdit3,
    FiLock,
    FiShield,
    FiTrash2,
    FiUser,
    FiUserCheck,
    FiUserPlus,
    FiUsers,
} from "react-icons/fi";
import Swal from "sweetalert2";
import type { User, UserCreateRequest, UserRole } from "../../types/types";

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("user");
    const [creating, setCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [merchants, setMerchants] = useState<User[]>([]);
    const [parentId, setParentId] = useState<string>("");
    const [merchantError, setMerchantError] = useState("");

    const api =
        import.meta.env.VITE_API_URL || "https://api.loanpaymentsystem.xyz";
    const token = localStorage.getItem("token");

    // Get current user from localStorage
    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.role === "superadmin") {
            const fetchMerchants = async () => {
                try {
                    const res = await axios.get(`${api}/api/users/merchants`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const merchantList = res.data || [];
                    setMerchants(merchantList);
                } catch (err) {
                    console.error("Failed to fetch merchants:", err);
                }
            };
            fetchMerchants();
        }
    }, [api, token, currentUser]);

    console.log("Merchants are here", merchants);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${api}/api/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data.users || res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    }, [api, token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMerchantError("");

        // Validation check
        if (currentUser?.role === "superadmin" && role === "user") {
            if (merchants.length === 0) {
                return; // stop execution
            }

            if (!parentId) {
                setMerchantError("Please select a merchant account.");
                return; // stop execution
            }
        }

        setCreating(true);
        try {
            const userData: UserCreateRequest = {
                username,
                password,
                role,
            };

            // Add parentId only if superadmin creating a user
            if (currentUser?.role === "superadmin" && role === "user") {
                userData.parentId = parentId;
            }

            await axios.post(`${api}/api/users`, userData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Swal.fire({
                icon: "success",
                title: "User Created",
                text: `User "${username}" has been successfully created.`,
                confirmButtonColor: "#10b981",
            });

            setUsername("");
            setPassword("");
            setRole("user");
            setParentId("");
            fetchUsers();
        } catch (err) {
            console.error("Failed to create user:", err);

            Swal.fire({
                icon: "error",
                title: "Creation Failed",
                text: "An error occurred while creating the user.",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setCreating(false);
        }
    };

    const deleteUser = async (id: string, username: string) => {
        Swal.fire({
            title: `Delete user "${username}"?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444", // red
            cancelButtonColor: "#6b7280", // gray
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            width: 350,
            padding: "1.5rem",
            backdrop: true,
            showClass: {
                popup: "animate__animated animate__fadeInDown",
            },
            hideClass: {
                popup: "animate__animated animate__fadeOutUp",
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${api}/api/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: `User "${username}" has been deleted.`,
                        timer: 1500,
                        showConfirmButton: false,
                        toast: true,
                        position: "top-right",
                        background: "#111827",
                        color: "#fff",
                    });

                    fetchUsers();
                } catch (err) {
                    console.error("Failed to delete user:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Failed to delete user. Try again.",
                        confirmButtonColor: "#ef4444",
                    });
                }
            }
        });
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case "superadmin":
                return FiShield;
            case "merchant":
                return FiUserCheck;
            case "user":
                return FiUser;
            default:
                return FiUser;
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case "superadmin":
                return "from-orange-500 to-red-500";
            case "merchant":
                return "from-purple-500 to-pink-500";
            case "user":
                return "from-blue-500 to-purple-500";
            default:
                return "from-blue-500 to-purple-500";
        }
    };

    const getAvailableRoles = (): UserRole[] => {
        if (currentUser?.role === "superadmin") {
            return ["user", "merchant", "superadmin"];
        } else if (currentUser?.role === "merchant") {
            return ["user"];
        }
        return ["user"];
    };

    if (loading) {
        return (
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        <span className="ml-3 text-white">
                            Loading users...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <div className="p-3 bg-purple-500/20 rounded-xl mr-4">
                        <FiUsers className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            User Management
                        </h2>
                        <p className="text-slate-300">
                            Create and manage system users
                        </p>
                    </div>
                </div>

                {/* Create User Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    className="mb-8"
                >
                    <div className="bg-white/5 rounded-xl px-6 pt-6 pb-8 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <FiUserPlus className="w-5 h-5 mr-2 text-green-400" />
                            Add New User
                        </h3>
                        {currentUser?.role === "superadmin" &&
                            role === "user" &&
                            merchants.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-start bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 px-4 py-3 rounded-lg mb-4"
                                >
                                    <FiAlertTriangle className="w-5 h-5 mr-2 text-yellow-400 mt-0.5" />
                                    <span>
                                        No merchants found in the system. Please
                                        create a{" "}
                                        <span className="font-semibold text-yellow-200">
                                            merchant account
                                        </span>{" "}
                                        before adding a user.
                                    </span>
                                </motion.div>
                            )}
                        <form
                            onSubmit={createUser}
                            className="grid grid-cols-1 md:grid-cols-5 gap-4"
                        >
                            {/* Username Input */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiUser className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        placeholder="Username"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiLock className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Password"
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role Select */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <FiShield className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value as UserRole)
                                        }
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300 appearance-none"
                                        aria-label="User role selection"
                                    >
                                        {getAvailableRoles().map(
                                            (roleOption) => (
                                                <option
                                                    key={roleOption}
                                                    value={roleOption}
                                                    className="bg-slate-800 capitalize"
                                                >
                                                    {roleOption === "superadmin"
                                                        ? "Superadmin"
                                                        : roleOption
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          roleOption.slice(1)}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>
                            {/* Merchant Parent Select (only for superadmin creating a user) */}
                            {currentUser?.role === "superadmin" &&
                                role === "user" && (
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <FiUserCheck className="w-4 h-4 text-green-400" />
                                            </div>
                                            <select
                                                onChange={(e) => {
                                                    setParentId(e.target.value);
                                                    setMerchantError(""); // hide error instantly
                                                }}
                                                className={`w-full pl-10 pr-3 py-3 bg-white/5 border ${
                                                    !parentId && creating
                                                        ? "border-red-400"
                                                        : "border-white/20"
                                                } rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300 appearance-none`}
                                            >
                                                <option value="">
                                                    Merchant Parent
                                                </option>
                                                {merchants.map((m) => (
                                                    <option
                                                        key={m._id}
                                                        value={m._id}
                                                        className="bg-slate-800"
                                                    >
                                                        {m.username}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Error absolutely positioned below select */}
                                            {merchantError && (
                                                <motion.p
                                                    initial={{
                                                        opacity: 0,
                                                        y: -4,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.3,
                                                    }}
                                                    className="absolute left-0 -bottom-6 text-red-400 text-sm"
                                                >
                                                    {merchantError}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={creating}
                                className="relative group overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-green-500 hover:to-teal-500 transition-all duration-300">
                                    {creating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus className="w-4 h-4" />
                                            <span>Create User</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <FiEdit3 className="w-5 h-5 mr-2 text-blue-400" />
                            Existing Users ({users.length})
                        </h3>
                    </div>

                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <FiUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-400">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.map((user, index) => {
                                        const RoleIcon = getRoleIcon(user.role);
                                        return (
                                            <motion.tr
                                                key={user._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.9 + index * 0.1,
                                                }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div
                                                            className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(
                                                                user.role
                                                            )} rounded-full flex items-center justify-center mr-3`}
                                                        >
                                                            <span className="text-white font-bold text-sm">
                                                                {user.username
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">
                                                                {user.username}
                                                            </div>
                                                            <div className="text-slate-400 text-sm">
                                                                ID:{" "}
                                                                {user._id.slice(
                                                                    -6
                                                                )}
                                                                {user.parent && (
                                                                    <span className="ml-2 text-purple-400">
                                                                        ←{" "}
                                                                        {
                                                                            user
                                                                                .parent
                                                                                .username
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(
                                                            user.role
                                                        )} text-white`}
                                                    >
                                                        <RoleIcon className="w-3 h-3 mr-1" />
                                                        {user.role ===
                                                        "superadmin"
                                                            ? "Superadmin"
                                                            : user.role
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              user.role.slice(
                                                                  1
                                                              )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                                                    {user.createdAt
                                                        ? new Date(
                                                              user.createdAt
                                                          ).toLocaleDateString()
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.05,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.95,
                                                        }}
                                                        onClick={() =>
                                                            deleteUser(
                                                                user._id,
                                                                user.username
                                                            )
                                                        }
                                                        className="relative group overflow-hidden cursor-pointer"
                                                        title={`Delete user ${user.username}`}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="relative bg-gradient-to-r from-red-600 to-pink-600 text-white p-2 rounded-lg hover:from-red-500 hover:to-pink-500 transition-all duration-300">
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </div>
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
