import { Link, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiUser, FiShield, FiLogOut, FiCreditCard } from "react-icons/fi";

export default function Layout() {
    const navigate = useNavigate();
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        navigate("/login");
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

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
            >
                <div className="border-b border-white/10 backdrop-blur-lg bg-white/5">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex justify-between items-center">
                            {/* Logo/Brand */}
                            <Link to="/" className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <FiCreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                                        UPI Gateway
                                    </h1>
                                    <p className="text-xs text-slate-400">Payment Link Generator</p>
                                </div>
                            </Link>

                            {/* Navigation */}
                            <nav className="flex items-center space-x-6">
                                {username ? (
                                    <>
                                        {/* Welcome Message */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="hidden md:block">
                                                <p className="text-white font-medium">Welcome, {username}</p>
                                                <p className="text-xs text-slate-400 capitalize">{role} User</p>
                                            </div>
                                        </div>

                                        {/* Admin Dashboard Link */}
                                        {role === "admin" && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white hover:text-purple-300 transition-all duration-300"
                                            >
                                                <FiShield className="w-4 h-4" />
                                                <span className="hidden md:inline">Dashboard</span>
                                            </Link>
                                        )}

                                        {/* Home Link */}
                                        <Link
                                            to="/"
                                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white hover:text-blue-300 transition-all duration-300"
                                        >
                                            <FiHome className="w-4 h-4" />
                                            <span className="hidden md:inline">Home</span>
                                        </Link>

                                        {/* Logout Button */}
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-red-300 hover:text-red-200 transition-all duration-300"
                                        >
                                            <FiLogOut className="w-4 h-4" />
                                            <span className="hidden md:inline">Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    /* Login Link */
                                    <Link
                                        to="/login"
                                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                                    >
                                        <FiUser className="w-4 h-4" />
                                        <span>Login</span>
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="relative z-10">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto">
                <div className="border-t border-white/10 backdrop-blur-lg bg-white/5">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="text-center">
                            <p className="text-slate-400 text-sm">
                                © 2024 UPI Gateway. Secured payment link generation.
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                                Built with modern web technologies for secure UPI transactions
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}