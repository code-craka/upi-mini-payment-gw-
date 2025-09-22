import axios from "axios";
import { useEffect, useState } from "react";
import { FiUsers, FiShoppingBag, FiTrendingUp, FiDollarSign, FiAlertTriangle } from "react-icons/fi";
import { motion } from "framer-motion";
import * as Sentry from "@sentry/react";
import UserManagement from "../components/admin/UserManagement";

interface Stats {
    totalUsers: number;
    totalOrders: number;
    userOrders: { username: string; count: number }[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const api = import.meta.env.VITE_API_URL || "https://api.loanpaymentsystem.xyz";
    const token = localStorage.getItem("token");

    // Sentry testing functions
    const testSentryError = () => {
        Sentry.startSpan({
            op: "ui.click",
            name: "Test Sentry Error Button",
        }, () => {
            Sentry.logger.info("User clicked test error button");
            throw new Error("Test error from frontend!");
        });
    };

    const testSentryLog = () => {
        Sentry.logger.warn("This is a test warning from the frontend", {
            user: localStorage.getItem("username") || "unknown",
            timestamp: new Date().toISOString(),
            action: "test_sentry_log"
        });
        alert("Test log sent to Sentry! Check your dashboard.");
    };

    const testBackendError = async () => {
        try {
            await axios.get(`${api}/debug-sentry`);
        } catch (error) {
            console.log("Backend error test triggered successfully:", error);
            alert("Backend error test triggered! Check Sentry dashboard.");
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get<Stats>(`${api}/api/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setStats(res.data);
            } catch (err) {
                console.error(err);
                console.error("Failed to fetch stats:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [api, token]);

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

    if (!stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <div className="text-white text-xl">Failed to load stats</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            <div className="relative container mx-auto p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-300 text-lg">Monitor your UPI payment gateway performance</p>
                </motion.div>

                {/* Sentry Test Section - Only visible in development */}
                {import.meta.env.DEV && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <FiAlertTriangle className="text-red-400" />
                            <h3 className="text-red-400 font-semibold">Sentry Testing (Development Only)</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={testSentryError}
                                className="px-3 py-1 bg-red-600/20 text-red-300 rounded border border-red-500/30 hover:bg-red-600/30 transition-colors text-sm"
                            >
                                Test Frontend Error
                            </button>
                            <button
                                onClick={testSentryLog}
                                className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors text-sm"
                            >
                                Test Frontend Log
                            </button>
                            <button
                                onClick={testBackendError}
                                className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-sm"
                            >
                                Test Backend Error
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            These buttons test Sentry error capturing. Check your Sentry dashboard after clicking.
                        </p>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <FiUsers className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                                    <p className="text-slate-300 text-sm">Total Users</p>
                                </div>
                            </div>
                            <div className="flex items-center text-green-400 text-sm">
                                <FiTrendingUp className="w-4 h-4 mr-1" />
                                <span>+12% from last month</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <FiShoppingBag className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
                                    <p className="text-slate-300 text-sm">Total Orders</p>
                                </div>
                            </div>
                            <div className="flex items-center text-green-400 text-sm">
                                <FiTrendingUp className="w-4 h-4 mr-1" />
                                <span>+8% from last month</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-500/20 rounded-xl">
                                    <FiDollarSign className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-white">₹{(stats.totalOrders * 250).toLocaleString()}</p>
                                    <p className="text-slate-300 text-sm">Revenue</p>
                                </div>
                            </div>
                            <div className="flex items-center text-green-400 text-sm">
                                <FiTrendingUp className="w-4 h-4 mr-1" />
                                <span>+15% from last month</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-500/20 rounded-xl">
                                    <FiTrendingUp className="w-6 h-6 text-orange-400" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-white">98.5%</p>
                                    <p className="text-slate-300 text-sm">Success Rate</p>
                                </div>
                            </div>
                            <div className="flex items-center text-green-400 text-sm">
                                <FiTrendingUp className="w-4 h-4 mr-1" />
                                <span>+2% from last month</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Orders by User - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="relative group mb-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FiShoppingBag className="w-6 h-6 mr-3 text-purple-400" />
                            Orders by User
                        </h2>
                        <div className="space-y-3">
                            {stats.userOrders.map((user, index) => (
                                <motion.div
                                    key={user.username}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                                >
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-white font-bold text-sm">
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-white font-medium">{user.username}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-2xl font-bold text-white mr-2">{user.count}</span>
                                        <span className="text-slate-400 text-sm">orders</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <UserManagement />
            </div>
        </div>
    );
}