import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiAlertTriangle,
  FiTrendingUp, FiTrendingDown, FiShield, FiRefreshCw, FiActivity
} from "react-icons/fi";
import { RoleBadge } from "../rbac";

interface StatusBreakdown {
  [status: string]: { count: number; amount: number };
}

interface SystemOverview {
  totalUsers: number;
  totalMerchants: number;
  totalRegularUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface MerchantStat {
  merchantName: string;
  totalOrders: number;
  totalRevenue: number;
  verifiedOrders: number;
  conversionRate: number;
}

interface RecentOrder {
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { username: string };
  merchant?: { username: string };
}

interface AdminStats {
  systemOverview: SystemOverview;
  merchantPerformance: MerchantStat[];
  statusBreakdown?: StatusBreakdown;
  recentOrders?: RecentOrder[];
}

interface BasicStats {
  overview: {
    totalUsers: number;
    totalMerchants: number;
    totalOrders: number;
    totalRevenue: number;
  };
  statusBreakdown: StatusBreakdown;
  recentOrders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     "text-yellow-400",
  SUBMITTED:   "text-blue-400",
  VERIFIED:    "text-green-400",
  EXPIRED:     "text-slate-400",
  CANCELLED:   "text-orange-400",
  INVALIDATED: "text-red-400",
};

const STATUS_DOT: Record<string, string> = {
  PENDING:     "bg-yellow-400",
  SUBMITTED:   "bg-blue-400",
  VERIFIED:    "bg-green-400",
  EXPIRED:     "bg-slate-400",
  CANCELLED:   "bg-orange-400",
  INVALIDATED: "bg-red-400",
};

export default function SuperadminDashboard({ className = "" }: { className?: string }) {
  const [basicStats, setBasicStats]   = useState<BasicStats | null>(null);
  const [adminStats, setAdminStats]   = useState<AdminStats | null>(null);
  const [apiLatency, setApiLatency]   = useState<number | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const API = import.meta.env.VITE_API_URL || "https://api.loanpayment.live";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    try {
      const t0 = performance.now();

      const [basicRes, adminRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { headers }),
        fetch(`${API}/api/dashboard/admin-stats?timeframe=30`, { headers }),
      ]);

      const latency = Math.round(performance.now() - t0);
      setApiLatency(latency);
      setDbConnected(basicRes.ok);

      if (basicRes.ok) setBasicStats(await basicRes.json());
      if (adminRes.ok) setAdminStats(await adminRes.json());
    } catch {
      setDbConnected(false);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [API]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived values from real data
  const overview    = adminStats?.systemOverview ?? basicStats?.overview ?? null;
  const statusBD    = basicStats?.statusBreakdown ?? {};
  const recentOrders: RecentOrder[] = basicStats?.recentOrders ?? [];
  const merchantPerf: MerchantStat[] = adminStats?.merchantPerformance ?? [];

  const totalOrders   = overview?.totalOrders ?? 0;
  const totalRevenue  = overview?.totalRevenue ?? 0;
  const totalMerchants = overview?.totalMerchants ?? 0;
  const totalUsers    = overview?.totalUsers ?? 0;

  const pendingCount  = statusBD["PENDING"]?.count ?? 0;
  const verifiedCount = statusBD["VERIFIED"]?.count ?? 0;
  const submittedCount = statusBD["SUBMITTED"]?.count ?? 0;

  // Real success rate = verified / (verified + expired + cancelled + invalidated + submitted + pending)
  const failedCount   = (statusBD["EXPIRED"]?.count ?? 0) + (statusBD["CANCELLED"]?.count ?? 0) + (statusBD["INVALIDATED"]?.count ?? 0);
  const successRate   = totalOrders > 0 ? ((verifiedCount / totalOrders) * 100).toFixed(1) : "—";

  // Trend: compare verified vs pending+submitted (positive if more verified)
  const pendingTrend  = totalOrders > 0 ? -Math.round((pendingCount / totalOrders) * 100) : 0;
  const revenueTrend  = verifiedCount > 0 ? Math.round((verifiedCount / totalOrders) * 100) : 0;

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-xl mb-4" />
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-8 bg-white/10 rounded mb-1" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
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
          <p className="text-slate-400 text-sm">
            Global system overview · Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-slate-300 text-sm transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <RoleBadge role="superadmin" size="lg" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FiUsers}
          title="Total Users"
          value={totalUsers.toLocaleString()}
          subtitle={`${totalMerchants} merchants`}
          gradient="bg-gradient-to-r from-blue-500 to-indigo-500"
          trend={null}
        />
        <StatCard
          icon={FiShoppingBag}
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          subtitle={`${submittedCount} awaiting verification`}
          gradient="bg-gradient-to-r from-green-500 to-emerald-500"
          trend={null}
        />
        <StatCard
          icon={FiDollarSign}
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle={`${verifiedCount} verified orders`}
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          trend={revenueTrend > 0 ? revenueTrend : null}
        />
        <StatCard
          icon={FiAlertTriangle}
          title="Pending Orders"
          value={pendingCount.toLocaleString()}
          subtitle={`${submittedCount} submitted`}
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
          trend={pendingTrend !== 0 ? pendingTrend : null}
        />
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {["PENDING", "SUBMITTED", "VERIFIED", "EXPIRED", "CANCELLED", "INVALIDATED"].map((status) => {
          const data = statusBD[status];
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 border border-white/20 rounded-xl p-4 text-center"
            >
              <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${STATUS_DOT[status]}`} />
              <p className={`text-xs font-medium mb-1 ${STATUS_COLORS[status]}`}>{status}</p>
              <p className="text-white text-xl font-bold">{data?.count ?? 0}</p>
              <p className="text-slate-400 text-xs">₹{(data?.amount ?? 0).toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders as Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiActivity className="w-5 h-5 text-green-400" />
            <span>Recent Orders</span>
          </h2>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 8).map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[order.status] ?? "bg-slate-400"}`} />
                    <div>
                      <p className="text-white text-sm font-medium">
                        #{order.orderId}
                        {order.user?.username && (
                          <span className="text-slate-400 font-normal"> · {order.user.username}</span>
                        )}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-white text-sm font-bold">₹{order.amount.toLocaleString()}</p>
                    <p className={`text-xs ${STATUS_COLORS[order.status] ?? "text-slate-400"}`}>{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiTrendingUp className="mx-auto text-slate-400 text-3xl mb-2" />
                <p className="text-slate-400">No recent orders</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Health — live data */}
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
          <div className="space-y-3">
            <HealthRow
              label="API Status"
              value={apiLatency !== null ? "Operational" : "Unreachable"}
              valueClass={apiLatency !== null ? "text-green-400" : "text-red-400"}
              dot={apiLatency !== null ? "bg-green-400" : "bg-red-400"}
            />
            <HealthRow
              label="Database"
              value={dbConnected ? "Connected" : "Error"}
              valueClass={dbConnected ? "text-green-400" : "text-red-400"}
              dot={dbConnected ? "bg-green-400" : "bg-red-400"}
            />
            <HealthRow
              label="Success Rate"
              value={`${successRate}%`}
              valueClass="text-white"
            />
            <HealthRow
              label="Avg Response"
              value={apiLatency !== null ? `${apiLatency}ms` : "—"}
              valueClass={apiLatency !== null && apiLatency < 300 ? "text-green-400" : "text-yellow-400"}
            />
            <HealthRow
              label="Total Orders"
              value={totalOrders.toLocaleString()}
              valueClass="text-white"
            />
            <HealthRow
              label="Failed / Invalid"
              value={failedCount.toLocaleString()}
              valueClass={failedCount > 0 ? "text-orange-400" : "text-green-400"}
            />
          </div>
        </motion.div>
      </div>

      {/* Merchant Performance Table */}
      {merchantPerf.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <FiTrendingUp className="w-5 h-5 text-purple-400" />
            <span>Merchant Performance</span>
            <span className="text-sm font-normal text-slate-400 ml-2">(last 30 days)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 pr-4">Merchant</th>
                  <th className="text-right py-2 pr-4">Orders</th>
                  <th className="text-right py-2 pr-4">Revenue</th>
                  <th className="text-right py-2 pr-4">Verified</th>
                  <th className="text-right py-2">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {merchantPerf.map((m, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                          {m.merchantName[0]?.toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{m.merchantName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-300">{m.totalOrders}</td>
                    <td className="py-3 pr-4 text-right text-white font-medium">₹{m.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-green-400">{m.verifiedOrders}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.conversionRate >= 50 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {m.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, title, value, subtitle, gradient, trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string;
  trend: number | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-slate-300 text-sm font-medium mb-1">{title}</h3>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
        </div>
        {trend !== null && (
          <div className={`flex items-center space-x-1 text-sm font-medium flex-shrink-0 ml-2 ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
            {trend > 0 ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
            <span>{trend > 0 ? "+" : ""}{trend}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HealthRow({
  label, value, valueClass, dot,
}: {
  label: string;
  value: string;
  valueClass: string;
  dot?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <span className="text-slate-300 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {dot && <div className={`w-2 h-2 rounded-full ${dot}`} />}
        <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}
