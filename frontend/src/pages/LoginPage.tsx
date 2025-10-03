import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiLock, FiArrowRight, FiShield, FiEye, FiEyeOff } from "react-icons/fi";
import { apiClient } from "../utils/api";
import type { LoginResponse } from "../types/types";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        console.log("Attempting login with username:", username);
        console.log("API URL:", import.meta.env.VITE_API_URL);
        
        try {
            const response = await apiClient.post<LoginResponse>("/api/auth/login", {
                username,
                password,
            });
            
            console.log("API Response:", response);
            
            // Handle both response formats for backward compatibility
            let token: string;
            let user: { role: string; username: string; _id?: string };
            
            if ('user' in response && response.user) {
                // New format: { token, user: { role, username, ... } }
                token = response.token;
                user = response.user;
            } else {
                // Legacy format: { token, role, username, ... }
                const legacyResponse = response as unknown as { 
                    token: string; 
                    role: string; 
                    username: string; 
                    _id?: string; 
                };
                token = legacyResponse.token;
                user = {
                    role: legacyResponse.role,
                    username: legacyResponse.username,
                    _id: legacyResponse._id || 'unknown'
                };
            }
            
            const { role, username: userUsername } = user;

            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("username", userUsername);
            localStorage.setItem("user", JSON.stringify(user));

            console.log("Login successful! User role:", role);

            // Navigate based on role - all roles go to dashboard
            if (role === "superadmin") {
                navigate("/admin/dashboard");
            } else if (role === "merchant") {
                navigate("/admin/dashboard");
            } else {
                navigate("/");
            }
        } catch (err: unknown) {
            console.error("Login failed:", err);
            let errorMessage = "Login failed. Please try again.";
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'object' && err !== null && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-xl"
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        rotate: [0, -5, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-xl"
                />
            </div>

            <div className="relative flex items-center justify-center min-h-screen p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Main Login Container */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                >
                                    <FiShield className="w-10 h-10 text-white" />
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2"
                                >
                                    Welcome Back
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="text-slate-300"
                                >
                                    Sign in to your UPI Gateway account
                                </motion.p>
                            </div>


                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Login Form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Username Input */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <FiUser className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Username"
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                            required
                                        />
                                    </div>
                                </motion.div>

                                {/* Password Input */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <FiLock className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <FiEyeOff className="w-5 h-5" />
                                            ) : (
                                                <FiEye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* Login Button */}
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.7 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-purple-500 hover:to-blue-500 transition-all duration-300">
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In</span>
                                                <FiArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </div>
                                </motion.button>
                            </form>


                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.9 }}
                                className="mt-8 text-center"
                            >
                                <p className="text-slate-400 text-sm">
                                    Secured by <span className="text-purple-400 font-semibold">UPI Gateway</span>
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}