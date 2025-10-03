import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiPieChart, FiShield } from "react-icons/fi";
import type { DashboardStats, RecentActivity, User } from "../../types/types";
import { RoleBadge } from "../rbac";

interface MerchantDashboardProps {
  className?: string;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
}

export default function MerchantDashboard({ className = "" }: MerchantDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
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
        setRecentActivity(data.recentActivity || []);
        setTopUsers(data.topUsers || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, change }: StatCardProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
        </div>
        {change && (
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${change.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              <FiTrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{change.trend === 'up' ? '+' : ''}{change.value}%</span>
            </div>
            <p className="text-slate-400 text-xs">vs last month</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
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
            <FiShield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Merchant Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Welcome back, {user.username}</p>
        </div>
        <RoleBadge role="merchant" size="lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={FiUsers}
          title="My Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          subtitle="Under your merchant account"
          gradient="bg-gradient-to-r from-blue-500 to-indigo-500"
          change={{ value: 5, trend: 'up' }}
        />
        <StatCard
          icon={FiShoppingBag}
          title="Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          subtitle={`${stats?.todayOrders || 0} today, ${stats?.pendingOrders || 0} pending`}
          gradient="bg-gradient-to-r from-green-500 to-emerald-500"
          change={{ value: 12, trend: 'up' }}
        />
        <StatCard
          icon={FiDollarSign}
          title="Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          subtitle="Total from your users"
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          change={{ value: 8, trend: 'up' }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiShoppingBag className="w-5 h-5 text-green-400" />
            <span>Recent Orders</span>
          </h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity
                .filter(activity => activity.type === 'order_created')
                .slice(0, 5)
                .map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {activity.user}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium">₹{activity.amount}</p>
                      <p className="text-slate-400 text-xs">Order #{activity.orderId?.slice(-6)}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8">
                <FiShoppingBag className="mx-auto text-slate-400 text-3xl mb-2" />
                <p className="text-slate-400">No recent orders</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Users */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiUsers className="w-5 h-5 text-blue-400" />
            <span>Top Users</span>
          </h2>
          <div className="space-y-4">
            {topUsers.length > 0 ? (
              topUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.username}</p>
                      <p className="text-slate-400 text-xs">
                        {user.orderStats?.total || 0} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto text-slate-400 text-3xl mb-2" />
                <p className="text-slate-400 mb-2">No users yet</p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm">
                  Create First User
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 lg:col-span-2"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiPieChart className="w-5 h-5 text-purple-400" />
            <span>Performance Overview</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {stats?.verifiedOrders || 0}
              </div>
              <div className="text-slate-400 text-sm">Verified Orders</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {stats?.pendingOrders || 0}
              </div>
              <div className="text-slate-400 text-sm">Pending Orders</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {stats?.activeOrders || 0}
              </div>
              <div className="text-slate-400 text-sm">Active Orders</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {stats?.totalOrders ? Math.round((stats.verifiedOrders! / stats.totalOrders) * 100) : 0}%
              </div>
              <div className="text-slate-400 text-sm">Success Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}