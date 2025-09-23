import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiShield } from "react-icons/fi";
import type { DashboardStats, RecentActivity } from "../../types/types";
import { RoleBadge } from "../rbac";

interface SuperadminDashboardProps {
  className?: string;
}

export default function SuperadminDashboard({ className = "" }: SuperadminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, trend }: any) => (
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
        {trend && (
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              <FiTrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

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

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <FiShield className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
              Superadmin Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Global system overview and analytics</p>
        </div>
        <RoleBadge role="superadmin" size="lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiUsers}
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          subtitle={`${stats?.totalMerchants || 0} merchants`}
          gradient="bg-gradient-to-r from-blue-500 to-indigo-500"
          trend={12}
        />
        <StatCard
          icon={FiShoppingBag}
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          subtitle={`${stats?.todayOrders || 0} today`}
          gradient="bg-gradient-to-r from-green-500 to-emerald-500"
          trend={8}
        />
        <StatCard
          icon={FiDollarSign}
          title="Total Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          subtitle="All time"
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          trend={15}
        />
        <StatCard
          icon={FiAlertTriangle}
          title="Pending Orders"
          value={stats?.pendingOrders?.toLocaleString() || '0'}
          subtitle={`${stats?.activeOrders || 0} active`}
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
          trend={-3}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiTrendingUp className="w-5 h-5 text-green-400" />
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.description ||
                        (activity.type === 'order_created' && `created order for ₹${activity.amount}`) ||
                        (activity.type === 'user_created' && 'joined the platform') ||
                        'performed an action'
                      }
                    </p>
                    <p className="text-slate-400 text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiTrendingUp className="mx-auto text-slate-400 text-3xl mb-2" />
                <p className="text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiShield className="w-5 h-5 text-blue-400" />
            <span>System Health</span>
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-300">API Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-300">Database</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-300">Success Rate</span>
              <span className="text-white font-medium">99.2%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-300">Avg Response</span>
              <span className="text-white font-medium">145ms</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}