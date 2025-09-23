import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiShoppingBag, FiDollarSign, FiClock, FiCheckCircle, FiUser, FiActivity } from "react-icons/fi";
import type { DashboardStats, OrderEnhanced } from "../../types/types";
import { RoleBadge } from "../rbac";

interface UserDashboardProps {
  className?: string;
}

export default function UserDashboard({ className = "" }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderEnhanced[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'verified': return 'text-green-400 bg-green-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      case 'expired': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-xl mb-4"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded mb-1"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiUser className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
              My Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Welcome back, {user.username}</p>
        </div>
        <RoleBadge role="user" size="lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiShoppingBag}
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          subtitle="All time orders"
          gradient="bg-gradient-to-r from-blue-500 to-indigo-500"
        />
        <StatCard
          icon={FiDollarSign}
          title="Total Spent"
          value={`₹${(stats?.totalSpent || 0).toLocaleString()}`}
          subtitle="Amount spent"
          gradient="bg-gradient-to-r from-green-500 to-emerald-500"
        />
        <StatCard
          icon={FiClock}
          title="Pending Orders"
          value={stats?.pendingOrders?.toLocaleString() || '0'}
          subtitle="Awaiting verification"
          gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
        />
        <StatCard
          icon={FiCheckCircle}
          title="Completed"
          value={stats?.verifiedOrders?.toLocaleString() || '0'}
          subtitle="Successfully processed"
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiActivity className="w-5 h-5 text-blue-400" />
            <span>Recent Orders</span>
          </h2>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <FiShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">₹{order.amount.toLocaleString()}</p>
                      <p className="text-slate-400 text-sm">{order.merchantName}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">
                      #{order.orderId.slice(-6)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FiShoppingBag className="mx-auto text-slate-400 text-4xl mb-3" />
                <p className="text-slate-400 mb-4">No orders yet</p>
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 font-medium">
                  Create Your First Order
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions & Account Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 font-medium">
                <div className="flex items-center space-x-2">
                  <FiShoppingBag className="w-4 h-4" />
                  <span>Create New Order</span>
                </div>
              </button>
              <button className="w-full p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 font-medium border border-white/20">
                <div className="flex items-center space-x-2">
                  <FiActivity className="w-4 h-4" />
                  <span>View All Orders</span>
                </div>
              </button>
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Account Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Member Since</span>
                <span className="text-white">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Account Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-white">{user.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              {user.parent && (
                <div className="flex justify-between">
                  <span className="text-slate-300">Merchant</span>
                  <span className="text-white">{user.parent.username}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-300">Success Rate</span>
                <span className="text-green-400">
                  {stats?.totalOrders ? Math.round((stats.verifiedOrders! / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Order Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">This Month</span>
                <span className="text-white font-medium">{stats?.todayOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Average Order</span>
                <span className="text-white font-medium">
                  ₹{stats?.totalOrders ? Math.round((stats.totalSpent || 0) / stats.totalOrders) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Largest Order</span>
                <span className="text-white font-medium">
                  ₹{Math.max(...(recentOrders.map(o => o.amount) || [0])).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}