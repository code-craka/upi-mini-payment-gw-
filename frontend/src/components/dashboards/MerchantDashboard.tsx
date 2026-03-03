import { useState, useEffect, useCallback, type ReactNode, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiLink,
  FiDollarSign,
  FiAtSign,
  FiShoppingBag,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import Swal from "sweetalert2";
import type { User, OrderEnhanced } from "../../types/types";
import { RoleBadge } from "../rbac";

interface MerchantDashboardProps {
  className?: string;
}

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL ?? "https://www.loanpayment.live";
const API_URL = import.meta.env.VITE_API_URL ?? "";

function statusBadge(status: string): ReactNode {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    verified: "bg-green-500/20 text-green-300 border border-green-500/30",
    expired: "bg-red-500/20 text-red-300 border border-red-500/30",
    invalidated: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };
  const cls =
    map[status] ?? "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function MerchantDashboard({ className = "" }: MerchantDashboardProps) {
  const [currentUser] = useState<Partial<User>>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}") as Partial<User>;
    } catch {
      return {};
    }
  });

  const [amount, setAmount] = useState<string>("");
  const [vpa, setVpa] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const [orders, setOrders] = useState<OrderEnhanced[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // API may return { orders: [...] } or an array directly
      const data = res.data;
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleGenerateLink = async (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 1) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Amount",
        text: "Please enter an amount of at least ₹1.",
        background: "#1e293b",
        color: "#f1f5f9",
      });
      return;
    }
    if (!vpa.trim()) {
      await Swal.fire({
        icon: "error",
        title: "VPA Required",
        text: "Please enter a valid UPI VPA.",
        background: "#1e293b",
        color: "#f1f5f9",
      });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/orders`,
        { amount: parsedAmount, vpa: vpa.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = res.data as { orderId: string; [key: string]: unknown };
      if (!data.orderId) throw new Error("Server returned no orderId");
      const paymentLink = `${FRONTEND_URL}/pay/${data.orderId}`;

      const result = await Swal.fire({
        icon: "success",
        title: "Payment Link Created",
        html: `<p style="color:#94a3b8;margin-bottom:8px;">Share this link with your customer:</p>
               <code style="background:#0f172a;color:#38bdf8;padding:6px 10px;border-radius:6px;word-break:break-all;font-size:0.85rem;">${paymentLink}</code>`,
        confirmButtonText: "Copy Link",
        showCancelButton: true,
        cancelButtonText: "Close",
        background: "#1e293b",
        color: "#f1f5f9",
        confirmButtonColor: "#3b82f6",
      });

      if (result.isConfirmed) {
        await navigator.clipboard.writeText(paymentLink).catch(() => {});
        await Swal.fire({
          icon: "success",
          title: "Copied!",
          text: "Payment link copied to clipboard.",
          timer: 1500,
          showConfirmButton: false,
          background: "#1e293b",
          color: "#f1f5f9",
        });
      }

      setAmount("");
      setVpa("");
      await fetchOrders();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? (err.response?.data?.error as string | undefined) ??
            "Failed to create payment link."
          : "Failed to create payment link.";
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        background: "#1e293b",
        color: "#f1f5f9",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyUTR = async (order: OrderEnhanced) => {
    setVerifyingId(order._id);

    const { value: utr, isConfirmed } = await Swal.fire({
      title: `Verify UTR for #${order.orderId}`,
      input: "text",
      inputLabel: "Enter UTR Number",
      inputPlaceholder: "e.g. 123456789012",
      showCancelButton: true,
      confirmButtonText: "Verify",
      background: "#1e293b",
      color: "#f1f5f9",
      confirmButtonColor: "#3b82f6",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "UTR number is required.";
        return null;
      },
    });

    if (!isConfirmed || !utr) {
      setVerifyingId(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/orders/${order._id}/verify`,
        { utr: utr.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await Swal.fire({
        icon: "success",
        title: "Verified",
        text: `Order #${order.orderId} has been verified.`,
        timer: 2000,
        showConfirmButton: false,
        background: "#1e293b",
        color: "#f1f5f9",
      });
      await fetchOrders();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? (err.response?.data?.error as string | undefined) ??
            "Failed to verify order."
          : "Failed to verify order.";
      await Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: message,
        background: "#1e293b",
        color: "#f1f5f9",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiShield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Merchant Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Welcome back, {currentUser.username ?? "Merchant"}</p>
        </div>
        <RoleBadge role="merchant" size="lg" />
      </div>

      {/* Section 1: Payment Link Generator */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <FiLink className="w-5 h-5 text-blue-400" />
          <span>Payment Link Generator</span>
        </h2>
        <form onSubmit={handleGenerateLink} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-slate-300 text-sm font-medium mb-1">
              UPI VPA
            </label>
            <div className="relative">
              <FiAtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="merchant@upi"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <FiLink className="w-4 h-4" />
              <span>{generating ? "Generating..." : "Generate Link"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Recent Orders */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FiShoppingBag className="w-5 h-5 text-green-400" />
            <span>Recent Orders</span>
          </h2>
          <button
            onClick={fetchOrders}
            disabled={ordersLoading}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <FiShoppingBag className="mx-auto text-slate-400 w-10 h-10 mb-3" />
            <p className="text-slate-400">No orders yet. Generate your first payment link above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">Order ID</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">Amount</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">Status</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">Created</th>
                  <th className="text-left text-slate-400 font-medium pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 text-white font-mono">
                      #{order.orderId}
                    </td>
                    <td className="py-3 pr-4 text-green-300 font-medium">
                      ₹{order.amount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(order.status)}</td>
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      {order.status === "pending" ? (
                        <button
                          onClick={() => handleVerifyUTR(order)}
                          disabled={verifyingId === order._id}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-lg text-green-300 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          <span>Verify UTR</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
