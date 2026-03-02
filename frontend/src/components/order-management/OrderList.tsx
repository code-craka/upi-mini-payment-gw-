import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiShoppingBag, FiSearch, FiFilter, FiUser, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAlertTriangle, FiEye, FiX } from "react-icons/fi";
import type { OrderEnhanced, OrderFilters, User } from "../../types/types";
import { RoleBadge, PermissionGate } from "../rbac";

interface OrderListProps {
  className?: string;
}

export default function OrderList({ className = "" }: OrderListProps) {
  const [orders, setOrders] = useState<OrderEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<OrderFilters>({
    status: "",
    search: "",
    page: 1,
    limit: 10
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      // Add filters to query
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof OrderFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "",
      search: "",
      page: 1,
      limit: 10
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return FiClock;
      case "verified": return FiCheckCircle;
      case "completed": return FiCheckCircle;
      case "expired": return FiAlertTriangle;
      default: return FiShoppingBag;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-400/20";
      case "verified": return "text-green-400 bg-green-400/20";
      case "completed": return "text-blue-400 bg-blue-400/20";
      case "expired": return "text-red-400 bg-red-400/20";
      default: return "text-slate-400 bg-slate-400/20";
    }
  };

  const canViewOrderDetails = (order: OrderEnhanced): boolean => {
    if (!currentUser) return false;

    switch (currentUser.role) {
      case "superadmin":
        return true;
      case "merchant":
        return order.merchant?._id === currentUser._id;
      case "user":
        return order.user?._id === currentUser._id;
      default:
        return false;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl">Authentication required</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
      <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <FiShoppingBag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Order Management</h2>
              <p className="text-slate-300">
                {currentUser.role === "superadmin" && "Manage all system orders"}
                {currentUser.role === "merchant" && "Manage your users' orders"}
                {currentUser.role === "user" && "View your orders"}
              </p>
            </div>
          </div>

          <RoleBadge role={currentUser.role} />
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search orders by ID, amount, or user..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:bg-white/10 focus:border-purple-400 focus:outline-none transition-all duration-300"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-medium transition-all duration-300"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-300"
            >
              <FiFilter className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Status</label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  >
                    <option value="" className="bg-slate-800">All Statuses</option>
                    <option value="pending" className="bg-slate-800">Pending</option>
                    <option value="verified" className="bg-slate-800">Verified</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                    <option value="expired" className="bg-slate-800">Expired</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:bg-white/10 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all duration-300"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            <span className="ml-3 text-white">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <FiShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const statusColor = getStatusColor(order.status);

              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-white font-medium">#{order.orderId}</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <FiDollarSign className="w-4 h-4" />
                            <span>₹{order.amount}</span>
                          </div>

                          {order.user && (
                            <div className="flex items-center space-x-2 text-slate-300">
                              <FiUser className="w-4 h-4" />
                              <span>{order.user.username}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-slate-300">
                            <FiCalendar className="w-4 h-4" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Show merchant info for superadmin */}
                        <PermissionGate requiredRole="superadmin">
                          {order.merchant && (
                            <div className="mt-2 flex items-center space-x-2 text-xs text-purple-400">
                              <span>Merchant:</span>
                              <RoleBadge role="merchant" size="sm" />
                              <span>{order.merchant.username}</span>
                            </div>
                          )}
                        </PermissionGate>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {canViewOrderDetails(order) && (
                        <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all duration-300">
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}

                      {/* Superadmin-only invalidate button */}
                      <PermissionGate requiredRole="superadmin">
                        {order.status !== "expired" && (
                          <button className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all duration-300">
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </PermissionGate>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
            <div className="text-slate-400 text-sm">
              Showing {orders.length} orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange("page", Math.max(1, (filters.page || 1) - 1))}
                disabled={(filters.page || 1) <= 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-all duration-300"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange("page", (filters.page || 1) + 1)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}