import { useState } from "react";
import { motion } from "framer-motion";
import { FiShield, FiX, FiAlertTriangle, FiMessageSquare, FiUser } from "react-icons/fi";
import type { OrderEnhanced } from "../../types/types";
import { PermissionGate } from "../rbac";

interface SuperadminOrderToolsProps {
  order: OrderEnhanced;
  onOrderInvalidated: (order: OrderEnhanced) => void;
  className?: string;
}

export default function SuperadminOrderTools({
  order,
  onOrderInvalidated,
  className = ""
}: SuperadminOrderToolsProps) {
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [invalidationReason, setInvalidationReason] = useState("");
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInvalidateOrder = async () => {
    if (!invalidationReason.trim()) {
      setErrors({ reason: "Invalidation reason is required" });
      return;
    }

    setIsInvalidating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${order._id}/invalidate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: invalidationReason.trim()
        })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        onOrderInvalidated(updatedOrder.order);
        setShowInvalidateModal(false);
        setInvalidationReason("");
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Failed to invalidate order" });
      }
    } catch (err) {
      console.error("Failed to invalidate order:", err);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsInvalidating(false);
    }
  };

  const canInvalidateOrder = (order: OrderEnhanced): boolean => {
    return !["expired", "invalidated"].includes(order.status);
  };

  return (
    <PermissionGate requiredRole="superadmin">
      <div className={`space-y-4 ${className}`}>

        {/* Order Actions Header */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FiShield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Superadmin Tools</h3>
              <p className="text-slate-300 text-sm">Advanced order management actions</p>
            </div>
          </div>

          {/* Order Invalidation */}
          {canInvalidateOrder(order) ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Invalidate Order</div>
                  <div className="text-slate-400 text-sm">Mark this order as invalid and prevent further processing</div>
                </div>
                <button
                  onClick={() => setShowInvalidateModal(true)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all duration-300 flex items-center space-x-2"
                >
                  <FiX className="w-4 h-4" />
                  <span>Invalidate</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-500">
              <FiAlertTriangle className="w-4 h-4" />
              <span className="text-sm">Order cannot be invalidated (status: {order.status})</span>
            </div>
          )}

          {/* Order Metadata */}
          <div className="mt-4 pt-4 border-t border-orange-500/20">
            <div className="text-sm text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.createdBy && (
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4" />
                    <span>Created by: {order.createdBy.username}</span>
                  </div>
                )}

                {order.invalidatedBy && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <FiX className="w-4 h-4" />
                    <span>Invalidated by: {order.invalidatedBy.username}</span>
                  </div>
                )}

                {order.metadata?.ipAddress && (
                  <div className="text-xs text-slate-500">
                    IP: {order.metadata.ipAddress}
                  </div>
                )}

                {order.metadata?.userAgent && (
                  <div className="text-xs text-slate-500">
                    Device: {order.metadata.device || "Unknown"}
                  </div>
                )}
              </div>

              {order.invalidationReason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <FiMessageSquare className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <div className="text-red-300 font-medium text-sm">Invalidation Reason:</div>
                      <div className="text-red-200 text-sm">{order.invalidationReason}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invalidation Modal */}
        {showInvalidateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <FiX className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Invalidate Order</h2>
                    <p className="text-slate-400 text-sm">Order #{order.orderId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvalidateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close modal"
                  title="Close"
                >
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Warning */}
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <div className="text-red-300 font-medium">Warning</div>
                    <div className="text-red-200 text-sm mt-1">
                      This action will permanently invalidate the order and cannot be undone.
                      The order will be marked as invalid and no further processing will be possible.
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400">
                    <FiAlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{errors.submit}</span>
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Invalidation Reason *
                </label>
                <textarea
                  value={invalidationReason}
                  onChange={(e) => {
                    setInvalidationReason(e.target.value);
                    if (errors.reason) {
                      setErrors(prev => ({ ...prev, reason: "" }));
                    }
                  }}
                  placeholder="Explain why this order is being invalidated..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:outline-none transition-all duration-300 resize-none ${
                    errors.reason ? "border-red-500/50" : "border-white/20 focus:border-purple-400"
                  }`}
                  disabled={isInvalidating}
                />
                {errors.reason && (
                  <p className="text-red-400 text-xs mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInvalidateModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 font-medium"
                  disabled={isInvalidating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvalidateOrder}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isInvalidating}
                >
                  {isInvalidating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Invalidating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <FiX className="w-4 h-4" />
                      <span>Invalidate Order</span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}