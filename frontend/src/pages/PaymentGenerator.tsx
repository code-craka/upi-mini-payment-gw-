import axios from "axios";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiCreditCard, FiUser, FiDollarSign, FiRefreshCw, FiLink2, FiCopy, FiCheck, FiArrowRight } from "react-icons/fi";
import Swal from "sweetalert2";
import type { CreateOrderResp } from "../types/types";

export default function PaymentGenerator() {
    const [amount, setAmount] = useState<number | "">("");
    const [vpa, setVpa] = useState("");
    const [merchantName, setMerchantName] = useState("My Business");
    const [result, setResult] = useState<CreateOrderResp | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const api = import.meta.env.VITE_API_URL || "https://api.loanpaymentsystem.xyz";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "Please login to generate a payment link.",
                background: "#1e293b",
                color: "#ffffff",
                confirmButtonColor: "#8b5cf6",
            });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post<CreateOrderResp>(
                `${api}/api/orders`,
                {
                    amount,
                    vpa,
                    merchantName,
                    note: "Order",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setResult(response.data);

            Swal.fire({
                icon: "success",
                title: "Payment Link Generated! 🎉",
                text: `Order ID: ${response.data.orderId}`,
                background: "#1e293b",
                color: "#ffffff",
                confirmButtonColor: "#10b981",
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: err.response?.data?.message || err.message,
                    background: "#1e293b",
                    color: "#ffffff",
                    confirmButtonColor: "#ef4444",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Unexpected Error",
                    text: "Something went wrong.",
                    background: "#1e293b",
                    color: "#ffffff",
                    confirmButtonColor: "#ef4444",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const resetForm = () => {
        setAmount("");
        setVpa("");
        setResult(null);
        setMerchantName("My Business");
    };

    return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-2xl"
                >
                    {/* Main Form Container */}
                    <div className="relative group mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                        <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                >
                                    <FiCreditCard className="w-8 h-8 text-white" />
                                </motion.div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent mb-2">
                                    Payment Link Generator
                                </h1>
                                <p className="text-slate-300">Create secure UPI payment links instantly</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={submit} className="space-y-6">
                                {/* Amount Input */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <FiDollarSign className="w-5 h-5 text-green-400" />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            value={amount}
                                            onChange={(e) =>
                                                setAmount(e.target.value ? Number(e.target.value) : "")
                                            }
                                            placeholder="Amount (₹)"
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                            required
                                        />
                                    </div>
                                </motion.div>

                                {/* UPI ID Input */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <FiLink2 className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={vpa}
                                            onChange={(e) => setVpa(e.target.value)}
                                            placeholder="UPI ID e.g. myshop@upi"
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                            required
                                        />
                                    </div>
                                </motion.div>

                                {/* Merchant Name Input */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                    className="relative group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <FiUser className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={merchantName}
                                            onChange={(e) => setMerchantName(e.target.value)}
                                            placeholder="Merchant name"
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
                                            required
                                        />
                                    </div>
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 }}
                                    className="flex gap-4 pt-4"
                                >
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 relative group overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-purple-500 hover:to-blue-500 transition-all duration-300">
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Generate Link</span>
                                                    <FiArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="relative group overflow-hidden"
                                        title="Reset form"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-gray-500 hover:to-gray-600 transition-all duration-300">
                                            <FiRefreshCw className="w-5 h-5" />
                                        </div>
                                    </button>
                                </motion.div>
                            </form>
                        </div>
                    </div>

                    {/* Result Section */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-3xl blur-xl"></div>
                            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8">
                                <div className="text-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    >
                                        <FiCheck className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Payment Link Created!</h2>
                                    <p className="text-slate-300">Your secure payment link is ready to use</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Order ID */}
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-slate-400 text-sm mb-1">Order ID</div>
                                        <div className="text-white font-mono text-lg">{result.orderId}</div>
                                    </div>

                                    {/* Payment URL */}
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-slate-400 text-sm">Payment URL</div>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(result.payPageUrl)}
                                                className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                {copied ? (
                                                    <>
                                                        <FiCheck className="w-4 h-4" />
                                                        <span className="text-sm">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCopy className="w-4 h-4" />
                                                        <span className="text-sm">Copy</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <a
                                            href={result.payPageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 transition-colors break-all font-mono text-sm"
                                        >
                                            {result.payPageUrl}
                                        </a>
                                    </div>

                                    {/* Open Link Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => window.open(result.payPageUrl, "_blank")}
                                        className="w-full relative group overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative bg-gradient-to-r from-teal-600 to-green-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-teal-500 hover:to-green-500 transition-all duration-300">
                                            <span>Open Payment Page</span>
                                            <FiArrowRight className="w-5 h-5" />
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
        </div>
    );
}