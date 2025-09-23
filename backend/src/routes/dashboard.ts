import { Router } from "express";
import { admin, protect, superadmin, merchant, AuthRequest } from "../middleware/auth.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { DataFilters } from "../utils/roleHelpers.js";

const router = Router();

/**
 * GET /stats - Role-based dashboard stats (backward compatible)
 * - Superadmin: global stats across all merchants
 * - Merchant: stats for their users and orders
 * - User: basic stats for their own orders
 */
router.get("/stats", protect, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                code: "NOT_AUTHENTICATED"
            });
        }

        const userId = req.user.userId;
        const userRole = req.user.role;

        // Get base filters for role-based data access
        const userFilter = DataFilters.getUserFilter(userRole, userId);
        const orderFilter = DataFilters.getOrderFilter(userRole, userId);

        let stats: any = {};

        if (userRole === "superadmin") {
            // Global stats for superadmin
            const [
                totalUsers,
                totalMerchants,
                totalOrders,
                totalRevenue,
                statusBreakdown,
                recentOrders
            ] = await Promise.all([
                User.countDocuments({ role: "user", isActive: true }),
                User.countDocuments({ role: "merchant", isActive: true }),
                Order.countDocuments({ isActive: true }),
                Order.aggregate([
                    { $match: { status: "VERIFIED", isActive: true } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                Order.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
                ]),
                Order.find({ isActive: true })
                    .populate("user", "username")
                    .populate("merchant", "username")
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean()
            ]);

            stats = {
                overview: {
                    totalUsers,
                    totalMerchants,
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0
                },
                statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
                    acc[item._id] = { count: item.count, amount: item.amount };
                    return acc;
                }, {}),
                recentOrders: recentOrders.slice(0, 5)
            };
        } else if (userRole === "merchant") {
            // Merchant-specific stats
            const [
                merchantUsers,
                merchantOrders,
                merchantRevenue,
                statusBreakdown,
                userOrderBreakdown
            ] = await Promise.all([
                User.countDocuments({ parent: userId, isActive: true }),
                Order.countDocuments(orderFilter),
                Order.aggregate([
                    { $match: { ...orderFilter, status: "VERIFIED" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                Order.aggregate([
                    { $match: orderFilter },
                    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
                ]),
                Order.aggregate([
                    { $match: orderFilter },
                    { $group: { _id: "$user", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "user"
                        }
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            _id: 0,
                            username: "$user.username",
                            orderCount: "$count",
                            totalAmount: "$amount"
                        }
                    }
                ])
            ]);

            stats = {
                overview: {
                    totalUsers: merchantUsers,
                    totalOrders: merchantOrders,
                    totalRevenue: merchantRevenue[0]?.total || 0
                },
                statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
                    acc[item._id] = { count: item.count, amount: item.amount };
                    return acc;
                }, {}),
                userOrders: userOrderBreakdown
            };
        } else {
            // User-specific stats
            const [
                userOrders,
                userRevenue,
                statusBreakdown
            ] = await Promise.all([
                Order.countDocuments(orderFilter),
                Order.aggregate([
                    { $match: { ...orderFilter, status: "VERIFIED" } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                Order.aggregate([
                    { $match: orderFilter },
                    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
                ])
            ]);

            stats = {
                overview: {
                    totalOrders: userOrders,
                    totalAmount: userRevenue[0]?.total || 0
                },
                statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
                    acc[item._id] = { count: item.count, amount: item.amount };
                    return acc;
                }, {})
            };
        }

        res.json(stats);
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /admin-stats - Superadmin comprehensive analytics
 */
router.get("/admin-stats", protect, superadmin, async (req: AuthRequest, res) => {
    try {
        const timeframe = req.query.timeframe as string || "30"; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));

        const [
            systemOverview,
            merchantStats,
            orderTrends,
            userGrowth,
            revenueByMerchant,
            topPerformingUsers
        ] = await Promise.all([
            // System overview
            Promise.all([
                User.countDocuments({ isActive: true }),
                User.countDocuments({ role: "merchant", isActive: true }),
                User.countDocuments({ role: "user", isActive: true }),
                Order.countDocuments({ isActive: true }),
                Order.aggregate([
                    { $match: { status: "VERIFIED", isActive: true } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ])
            ]).then(([totalUsers, merchants, users, orders, revenue]) => ({
                totalUsers,
                totalMerchants: merchants,
                totalRegularUsers: users,
                totalOrders: orders,
                totalRevenue: revenue[0]?.total || 0
            })),

            // Merchant performance stats
            Order.aggregate([
                { $match: { isActive: true } },
                { $group: {
                    _id: "$merchant",
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$amount" },
                    avgOrderValue: { $avg: "$amount" },
                    verifiedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] }
                    }
                }},
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "merchant"
                    }
                },
                { $unwind: "$merchant" },
                {
                    $project: {
                        _id: 0,
                        merchantId: "$_id",
                        merchantName: "$merchant.username",
                        totalOrders: 1,
                        totalRevenue: 1,
                        avgOrderValue: { $round: ["$avgOrderValue", 2] },
                        verifiedOrders: 1,
                        conversionRate: {
                            $round: [
                                { $multiply: [{ $divide: ["$verifiedOrders", "$totalOrders"] }, 100] },
                                2
                            ]
                        }
                    }
                }
            ]),

            // Order trends over time
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            status: "$status"
                        },
                        count: { $sum: 1 },
                        amount: { $sum: "$amount" }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]),

            // User growth trends
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            role: "$role"
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]),

            // Revenue by merchant
            Order.aggregate([
                {
                    $match: {
                        status: "VERIFIED",
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: "$merchant",
                        revenue: { $sum: "$amount" },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "merchant"
                    }
                },
                { $unwind: "$merchant" },
                {
                    $project: {
                        _id: 0,
                        merchantName: "$merchant.username",
                        revenue: 1,
                        orderCount: 1
                    }
                },
                { $sort: { revenue: -1 } }
            ]),

            // Top performing users
            Order.aggregate([
                {
                    $match: {
                        status: "VERIFIED",
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: "$user",
                        totalSpent: { $sum: "$amount" },
                        orderCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 0,
                        username: "$user.username",
                        totalSpent: 1,
                        orderCount: 1,
                        avgOrderValue: { $divide: ["$totalSpent", "$orderCount"] }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 10 }
            ])
        ]);

        res.json({
            timeframe: `${timeframe} days`,
            systemOverview,
            merchantPerformance: merchantStats,
            orderTrends,
            userGrowth,
            revenueByMerchant,
            topPerformingUsers
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /revenue-trends - Superadmin revenue trends analysis
 */
router.get("/revenue-trends", protect, superadmin, async (req: AuthRequest, res) => {
    try {
        const period = req.query.period as string || "daily"; // daily, weekly, monthly
        const timeframe = parseInt(req.query.timeframe as string) || 30; // days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);

        let groupBy: any;
        switch (period) {
            case "weekly":
                groupBy = {
                    year: { $year: "$createdAt" },
                    week: { $week: "$createdAt" }
                };
                break;
            case "monthly":
                groupBy = {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                };
                break;
            default: // daily
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        }

        const [revenueTrends, statusTrends, merchantComparison] = await Promise.all([
            // Revenue trends over time
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: "VERIFIED",
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: groupBy,
                        revenue: { $sum: "$amount" },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: "$amount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),

            // Status trends
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: {
                            period: groupBy,
                            status: "$status"
                        },
                        count: { $sum: 1 },
                        amount: { $sum: "$amount" }
                    }
                },
                { $sort: { "_id.period": 1 } }
            ]),

            // Merchant comparison
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: "VERIFIED",
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: "$merchant",
                        totalRevenue: { $sum: "$amount" },
                        orderCount: { $sum: 1 },
                        avgOrderValue: { $avg: "$amount" }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "merchant"
                    }
                },
                { $unwind: "$merchant" },
                {
                    $project: {
                        _id: 0,
                        merchantName: "$merchant.username",
                        totalRevenue: 1,
                        orderCount: 1,
                        avgOrderValue: { $round: ["$avgOrderValue", 2] }
                    }
                },
                { $sort: { totalRevenue: -1 } }
            ])
        ]);

        res.json({
            period,
            timeframe: `${timeframe} days`,
            revenueTrends,
            statusTrends,
            merchantComparison
        });
    } catch (error) {
        console.error("Error fetching revenue trends:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

// Legacy admin route for backward compatibility
export const adminRoutes = {
    getDashboardStats: router.get.bind(router)
};

export default router;
