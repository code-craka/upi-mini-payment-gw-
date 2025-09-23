import { Request, Response, Router } from "express";
import { rateLimit } from "express-rate-limit";
import { customAlphabet } from "nanoid";
import {
    admin,
    AuthRequest,
    protect,
    superadmin,
    merchant
} from "../middleware/auth.js";
import Order, { OrderMetadata } from "../models/Order.js";
import User from "../models/User.js";
import { buildUpiLink, isValidVpa, maskVpa } from "../utils/upi.js";
import { DataFilters, PermissionHelpers } from "../utils/roleHelpers.js";

const router = Router();
const nano = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);
const utrLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });

/**
 * POST / - Create a new order with enhanced metadata tracking
 */
router.post("/", protect, async (req: AuthRequest, res: Response) => {
    try {
        const {
            amount,
            vpa,
            merchantName,
            note,
            expiresInSec = 5400,
        } = req.body;

        if (!amount || !vpa) {
            return res.status(400).json({
                message: "Amount and VPA are required",
                code: "MISSING_REQUIRED_FIELDS"
            });
        }

        if (!isValidVpa(vpa)) {
            return res.status(400).json({
                message: "Invalid VPA format",
                code: "INVALID_VPA"
            });
        }

        const orderId = nano();
        const upiLink = buildUpiLink({
            pa: vpa,
            pn: merchantName || "Merchant",
            am: amount,
            tn: note,
            tr: orderId,
        });
        const expiresAt = new Date(Date.now() + Number(expiresInSec) * 1000);

        // Capture metadata
        const metadata: OrderMetadata = {
            ipAddress: req.ip || req.connection.remoteAddress || "unknown",
            userAgent: req.get("User-Agent") || "unknown",
            platform: req.get("X-Platform") || "web"
        };

        const order = await Order.create({
            user: req.user?.userId,
            createdBy: req.user?.userId,
            orderId,
            amount,
            vpa,
            merchantName,
            note,
            upiLink,
            expiresAt,
            metadata
        });

        return res.json({
            orderId,
            payPageUrl: `${process.env.APP_BASE_URL}/pay/${orderId}`,
            upiLink,
            expiresAt
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET / - Get orders based on role with pagination
 * - Superadmin: sees all orders
 * - Merchant: sees orders from their users
 * - User: sees only their own orders
 */
router.get("/", protect, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                code: "NOT_AUTHENTICATED"
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const status = req.query.status as string;

        const filter = DataFilters.getOrderFilter(req.user.role, req.user.userId) as any;

        // Add status filter if provided
        if (status) {
            filter.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate("user", "username role")
                .populate("merchant", "username")
                .populate("createdBy", "username role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter)
        ]);

        // Mask VPA for security (except for superadmin)
        const sanitizedOrders = orders.map(order => ({
            ...order,
            vpa: req.user!.role === "superadmin" ? order.vpa : maskVpa(order.vpa)
        }));

        res.json({
            orders: sanitizedOrders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /all - Superadmin-only endpoint for global order view with comprehensive stats
 */
router.get("/all", protect, superadmin, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        // Advanced filtering options for superadmin
        const filter: any = { isActive: true };
        const { status, merchantId, startDate, endDate, minAmount, maxAmount } = req.query;

        if (status) filter.status = status;
        if (merchantId) filter.merchant = merchantId;
        if (startDate) filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate as string) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate as string) };
        if (minAmount) filter.amount = { ...filter.amount, $gte: Number(minAmount) };
        if (maxAmount) filter.amount = { ...filter.amount, $lte: Number(maxAmount) };

        const [orders, total, stats] = await Promise.all([
            Order.find(filter)
                .populate("user", "username role")
                .populate("merchant", "username")
                .populate("createdBy", "username role")
                .populate("invalidatedBy", "username role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
            Order.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        avgAmount: { $avg: "$amount" },
                        statusBreakdown: {
                            $push: {
                                status: "$status",
                                amount: "$amount"
                            }
                        }
                    }
                }
            ])
        ]);

        const statusStats = stats[0]?.statusBreakdown?.reduce((acc: any, order: any) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {}) || {};

        res.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            statistics: {
                totalAmount: stats[0]?.totalAmount || 0,
                averageAmount: stats[0]?.avgAmount || 0,
                statusBreakdown: statusStats
            }
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * GET /:orderId - Get specific order with role-based access
 */
router.get("/:orderId", async (req: Request, res: Response) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            isActive: true
        })
            .populate("user", "username")
            .populate("merchant", "username")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        // Public view - mask sensitive data
        const publicOrder = {
            orderId: order.orderId,
            amount: order.amount,
            merchantName: order.merchantName,
            maskedVpa: maskVpa(order.vpa),
            upiLink: order.upiLink,
            status: order.status,
            expiresAt: order.expiresAt,
            createdAt: order.createdAt
        };

        return res.json(publicOrder);
    } catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * POST /:orderId/utr - Submit UTR for order verification
 */
router.post(
    "/:orderId/utr",
    utrLimiter,
    async (req: Request, res: Response) => {
        try {
            const { utr } = req.body;
            if (!utr || !/^[0-9A-Za-z]{6,32}$/.test(utr)) {
                return res.status(400).json({
                    message: "Invalid UTR format",
                    code: "INVALID_UTR"
                });
            }

            const order = await Order.findOne({
                orderId: req.params.orderId,
                isActive: true
            });

            if (!order) {
                return res.status(404).json({
                    message: "Order not found",
                    code: "ORDER_NOT_FOUND"
                });
            }

            if (order.expiresAt && new Date() > order.expiresAt) {
                order.status = "EXPIRED";
                await order.save();
                return res.status(400).json({
                    message: "Order has expired",
                    code: "ORDER_EXPIRED"
                });
            }

            if (order.status !== "PENDING") {
                return res.status(400).json({
                    message: "Order is not pending",
                    code: "INVALID_ORDER_STATUS",
                    currentStatus: order.status
                });
            }

            order.utr = utr;
            order.status = "SUBMITTED";
            await order.save();

            return res.json({
                message: "UTR submitted successfully",
                code: "UTR_SUBMITTED"
            });
        } catch (error) {
            console.error("Error submitting UTR:", error);
            return res.status(500).json({
                message: "Internal server error",
                code: "INTERNAL_ERROR"
            });
        }
    }
);

/**
 * POST /:orderId/verify - Verify order (role-based permissions)
 */
router.post("/:orderId/verify", protect, merchant, async (req: AuthRequest, res: Response) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        // Check if user can manage this order
        const canManage = PermissionHelpers.canManageOrder(
            req.user!.role,
            order.user.toString(),
            order.merchant.toString(),
            req.user!.userId
        );

        if (!canManage) {
            return res.status(403).json({
                message: "Cannot verify this order",
                code: "INSUFFICIENT_PRIVILEGES"
            });
        }

        if (order.status !== "SUBMITTED") {
            return res.status(400).json({
                message: "Order must be submitted before verification",
                code: "INVALID_ORDER_STATUS",
                currentStatus: order.status
            });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status: "VERIFIED" },
            { new: true }
        );

        return res.json({
            message: "Order verified successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Error verifying order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * POST /:orderId/invalidate - Superadmin-only order invalidation
 */
router.post("/:orderId/invalidate", protect, superadmin, async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({
            orderId: req.params.orderId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        if (order.status === "INVALIDATED") {
            return res.status(400).json({
                message: "Order is already invalidated",
                code: "ALREADY_INVALIDATED"
            });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            {
                status: "INVALIDATED",
                invalidatedBy: req.user!.userId,
                invalidatedAt: new Date(),
                invalidationReason: reason
            },
            { new: true }
        );

        return res.json({
            message: "Order invalidated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Error invalidating order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

/**
 * DELETE /:orderId - Superadmin-only soft deletion
 */
router.delete("/:orderId", protect, superadmin, async (req: AuthRequest, res: Response) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            {
                isActive: false,
                deletedAt: new Date(),
                deletedBy: req.user!.userId
            }
        );

        return res.json({
            message: "Order deleted successfully",
            code: "ORDER_DELETED"
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        return res.status(500).json({
            message: "Internal server error",
            code: "INTERNAL_ERROR"
        });
    }
});

// Legacy admin route for backward compatibility
export const adminRoutes = {
    verifyOrder: router.post.bind(router)
};

export default router;
