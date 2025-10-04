import { Request, Response, Router } from "express";
import { body, query, validationResult } from "express-validator";
import { customAlphabet } from "nanoid";
import {
    AuthRequest,
    protect,
    superadmin,
    merchant
} from "../middleware/auth.js";
import {
    orderLimiter,
    apiLimiter,
    dashboardLimiter
} from "../middleware/rateLimiter.js";
import Order, { OrderMetadata } from "../models/Order.js";
import { buildUpiLink, isValidVpa, maskVpa } from "../utils/upi.js";
import { DataFilters, PermissionHelpers } from "../utils/roleHelpers.js";
import { QuerySanitizer, InputSanitizer } from "../utils/queryHelpers.js";

const router = Router();
const nano = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

// Input validation helpers
const validOrderStatuses = ['PENDING', 'SUBMITTED', 'VERIFIED', 'EXPIRED', 'INVALIDATED'];

/**
 * POST / - Create a new order with enhanced metadata tracking
 */
router.post("/", 
    orderLimiter,
    protect,
    [
        body('amount').isNumeric().withMessage('Amount must be numeric'),
        body('vpa').isString().trim().withMessage('VPA must be a string'),
        body('merchantName').optional().isString().trim(),
        body('note').optional().isString().trim(),
        body('expiresInSec').optional().isInt({ min: 60, max: 86400 })
    ],
    async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                errors: errors.array()
            });
        }

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

        await Order.create({
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
router.get("/", 
    dashboardLimiter,
    protect,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(validOrderStatuses)
    ],
    async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                code: "NOT_AUTHENTICATED"
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                errors: errors.array()
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;
        const status = req.query.status as string;

        const baseFilter = DataFilters.getOrderFilter(req.user.role, req.user.userId);
        const sanitizedFilter = QuerySanitizer.buildOrderFilter(baseFilter, { status });

        const [orders, total] = await Promise.all([
            Order.find(sanitizedFilter)
                .populate("user", "username role")
                .populate("merchant", "username")
                .populate("createdBy", "username role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(sanitizedFilter)
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
router.get("/all", 
    apiLimiter,
    protect, 
    superadmin,
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(validOrderStatuses),
        query('merchantId').optional().isMongoId(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('minAmount').optional().isFloat({ min: 0 }),
        query('maxAmount').optional().isFloat({ min: 0 })
    ],
    async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                errors: errors.array()
            });
        }

        const { page: validPage, limit: validLimit, skip } = QuerySanitizer.validatePagination(req.query.page, req.query.limit);

        // Advanced filtering options for superadmin with secure input handling
        const baseFilter = { isActive: true };
        const sanitizedFilter = QuerySanitizer.buildOrderFilter(baseFilter, req.query);

        const [orders, total, stats] = await Promise.all([
            Order.find(sanitizedFilter)
                .populate("user", "username role")
                .populate("merchant", "username")
                .populate("createdBy", "username role")
                .populate("invalidatedBy", "username role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(validLimit)
                .lean(),
            Order.countDocuments(sanitizedFilter),
            Order.aggregate([
                { $match: sanitizedFilter },
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
                page: validPage,
                limit: validLimit,
                total,
                pages: Math.ceil(total / validLimit)
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
router.get("/:orderId", apiLimiter, async (req: Request, res: Response) => {
    try {
        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);
        if (!sanitizedOrderId) {
            return res.status(400).json({
                message: "Invalid order ID format",
                code: "INVALID_ORDER_ID"
            });
        }

        const order = await Order.findOne({
            orderId: sanitizedOrderId,
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
    orderLimiter,
    [
        body('utr').isString().trim().matches(/^[0-9A-Za-z]{6,32}$/).withMessage('Invalid UTR format')
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    message: "Validation failed",
                    code: "VALIDATION_ERROR",
                    errors: errors.array()
                });
            }

            const { utr } = req.body;
            const sanitizedUTR = InputSanitizer.sanitizeUTR(utr);
            const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);

            if (!sanitizedUTR) {
                return res.status(400).json({
                    message: "Invalid UTR format",
                    code: "INVALID_UTR"
                });
            }

            if (!sanitizedOrderId) {
                return res.status(400).json({
                    message: "Invalid order ID format",
                    code: "INVALID_ORDER_ID"
                });
            }

            const order = await Order.findOne({
                orderId: sanitizedOrderId,
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

            order.utr = sanitizedUTR;
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
router.post("/:orderId/verify", apiLimiter, protect, merchant, async (req: AuthRequest, res: Response) => {
    try {
        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);
        if (!sanitizedOrderId) {
            return res.status(400).json({
                message: "Invalid order ID format",
                code: "INVALID_ORDER_ID"
            });
        }

        const order = await Order.findOne({
            orderId: sanitizedOrderId,
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
            { orderId: sanitizedOrderId },
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
router.post("/:orderId/invalidate", 
    apiLimiter,
    protect, 
    superadmin,
    [
        body('reason').optional().isString().trim().isLength({ max: 500 })
    ],
    async (req: AuthRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                errors: errors.array()
            });
        }

        const { reason } = req.body;
        const sanitizedReason = reason ? InputSanitizer.sanitizeString(reason, 500) : undefined;
        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);

        if (!sanitizedOrderId) {
            return res.status(400).json({
                message: "Invalid order ID format",
                code: "INVALID_ORDER_ID"
            });
        }
        
        const order = await Order.findOne({
            orderId: sanitizedOrderId,
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
            { orderId: sanitizedOrderId },
            {
                status: "INVALIDATED",
                invalidatedBy: req.user!.userId,
                invalidatedAt: new Date(),
                invalidationReason: sanitizedReason
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
router.delete("/:orderId", apiLimiter, protect, superadmin, async (req: AuthRequest, res: Response) => {
    try {
        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(req.params.orderId);
        if (!sanitizedOrderId) {
            return res.status(400).json({
                message: "Invalid order ID format",
                code: "INVALID_ORDER_ID"
            });
        }

        const order = await Order.findOne({
            orderId: sanitizedOrderId,
            isActive: true
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        await Order.findOneAndUpdate(
            { orderId: sanitizedOrderId },
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
