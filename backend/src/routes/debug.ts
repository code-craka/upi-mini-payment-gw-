/**
 * Debug Routes for UPI Mini Gateway v2.0 RBAC System
 *
 * Provides debugging endpoints for development and testing.
 * These endpoints are only available in development mode.
 *
 * Author: Sayem Abdullah Rihan (@code-craka)
 * Created: 2024-12-23
 */

import { Router } from "express";
import { protect, superadmin, AuthRequest } from "../middleware/auth.js";
import { debugUserPermissions, debugSystemIntegrity, rbacDebugger } from "../utils/debugUtils.js";
import { logger } from "../utils/logger.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { DataFilters, PermissionHelpers } from "../utils/roleHelpers.js";

const router = Router();

// Only enable debug routes in development
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.RBAC_DEBUG === 'true';

if (!isDevelopment) {
    // Return 404 for all debug routes in production
    router.use('*', (req, res) => {
        res.status(404).json({ message: 'Debug endpoints not available in production' });
    });
} else {
    /**
     * GET /debug/info - Basic debug information
     */
    router.get('/info', async (req: AuthRequest, res) => {
        try {
            const debugInfo = await rbacDebugger.generateDebugInfo(req);

            res.json({
                success: true,
                debug: {
                    enabled: rbacDebugger.isEnabled(),
                    environment: process.env.NODE_ENV,
                    timestamp: new Date().toISOString(),
                    info: debugInfo
                }
            });
        } catch (error) {
            logger.error(`Debug info endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Debug info generation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /debug/permissions/:userId? - Check user permissions
     */
    router.get('/permissions/:userId?', protect, debugUserPermissions);

    /**
     * GET /debug/permissions - Check current user permissions
     */
    router.get('/permissions', protect, debugUserPermissions);

    /**
     * GET /debug/system - System integrity check
     */
    router.get('/system', protect, superadmin, debugSystemIntegrity);

    /**
     * GET /debug/roles - Role hierarchy information
     */
    router.get('/roles', (req, res) => {
        try {
            const roleInfo = {
                hierarchy: {
                    superadmin: {
                        level: 3,
                        description: 'Full system access',
                        permissions: {
                            createAnyUser: true,
                            viewAllData: true,
                            invalidateOrders: true,
                            deleteAnyUser: true,
                            accessAnalytics: true
                        }
                    },
                    merchant: {
                        level: 2,
                        description: 'Manage their users and orders',
                        permissions: {
                            createUsers: true,
                            viewOwnData: true,
                            manageOwnUsers: true,
                            verifyOrders: true
                        }
                    },
                    user: {
                        level: 1,
                        description: 'Access only their own data',
                        permissions: {
                            viewOwnData: true,
                            createOrders: true,
                            updateOwnProfile: true
                        }
                    }
                },
                permissionMatrix: {
                    actions: [
                        { action: 'Create User', superadmin: true, merchant: true, user: false },
                        { action: 'Create Merchant', superadmin: true, merchant: false, user: false },
                        { action: 'View All Users', superadmin: true, merchant: false, user: false },
                        { action: 'View All Orders', superadmin: true, merchant: false, user: false },
                        { action: 'Invalidate Orders', superadmin: true, merchant: false, user: false },
                        { action: 'Delete Users', superadmin: true, merchant: 'own only', user: false },
                        { action: 'Verify Orders', superadmin: true, merchant: true, user: false }
                    ]
                }
            };

            res.json({
                success: true,
                roles: roleInfo,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Debug roles endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Role information generation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /debug/filters - Show data filters for current user
     */
    router.get('/filters', protect, async (req: AuthRequest, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const userFilter = DataFilters.getUserFilter(req.user.role, req.user.userId);
            const orderFilter = DataFilters.getOrderFilter(req.user.role, req.user.userId);

            // Test the filters
            const userCount = await User.countDocuments(userFilter);
            const orderCount = await Order.countDocuments(orderFilter);

            res.json({
                success: true,
                filters: {
                    user: {
                        filter: userFilter,
                        resultCount: userCount
                    },
                    order: {
                        filter: orderFilter,
                        resultCount: orderCount
                    }
                },
                currentUser: {
                    id: req.user.userId,
                    role: req.user.role
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Debug filters endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Filter testing failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /debug/relationships - Validate data relationships
     */
    router.get('/relationships', protect, superadmin, async (req: AuthRequest, res) => {
        try {
            const userIssues = await rbacDebugger.validateUserRelationships();
            const orderIssues = await rbacDebugger.validateOrderRelationships();

            // Find orphaned records
            const orphanedUsers = await User.find({
                role: 'user',
                $or: [
                    { parent: null },
                    { parent: { $exists: false } }
                ]
            }).select('username role createdAt');

            const ordersWithoutMerchant = await Order.find({
                $or: [
                    { merchant: null },
                    { merchant: { $exists: false } }
                ]
            }).select('orderId user createdAt');

            res.json({
                success: true,
                validation: {
                    userIssues,
                    orderIssues,
                    orphanedUsers: orphanedUsers.map(u => ({
                        id: u._id,
                        username: u.username,
                        role: u.role,
                        createdAt: u.createdAt
                    })),
                    ordersWithoutMerchant: ordersWithoutMerchant.map(o => ({
                        orderId: o.orderId,
                        user: o.user,
                        createdAt: o.createdAt
                    }))
                },
                summary: {
                    totalUserIssues: userIssues.length,
                    totalOrderIssues: orderIssues.length,
                    orphanedUsersCount: orphanedUsers.length,
                    ordersWithoutMerchantCount: ordersWithoutMerchant.length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Debug relationships endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Relationship validation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * POST /debug/test-permissions - Test specific permission scenarios
     */
    router.post('/test-permissions', protect, async (req: AuthRequest, res) => {
        try {
            const { targetUserId, targetRole, action } = req.body;

            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const tests = [];

            // Test role hierarchy
            if (targetRole) {
                const canCreateRole = PermissionHelpers.canCreateRole(req.user.role, targetRole as any);
                tests.push({
                    test: `Can create ${targetRole}`,
                    result: canCreateRole,
                    description: `User with role ${req.user.role} ${canCreateRole ? 'can' : 'cannot'} create ${targetRole}`
                });
            }

            // Test user management
            if (targetUserId) {
                const targetUser = await User.findById(targetUserId);
                if (targetUser) {
                    const canManage = await User.findById(req.user.userId);
                    const canManageResult = canManage ? canManage.canManage(targetUser) : false;

                    tests.push({
                        test: `Can manage user ${targetUser.username}`,
                        result: canManageResult,
                        description: `User ${req.user.userId} ${canManageResult ? 'can' : 'cannot'} manage ${targetUser.username}`
                    });
                }
            }

            // Test order permissions
            if (action === 'invalidateOrder') {
                const canInvalidate = PermissionHelpers.canInvalidateOrder(req.user.role);
                tests.push({
                    test: 'Can invalidate orders',
                    result: canInvalidate,
                    description: `User with role ${req.user.role} ${canInvalidate ? 'can' : 'cannot'} invalidate orders`
                });
            }

            res.json({
                success: true,
                tests,
                currentUser: {
                    id: req.user.userId,
                    role: req.user.role
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Debug test permissions endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Permission testing failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /debug/stats - Detailed system statistics
     */
    router.get('/stats', protect, superadmin, async (req: AuthRequest, res) => {
        try {
            const stats = {
                users: {
                    total: await User.countDocuments(),
                    active: await User.countDocuments({ isActive: true }),
                    inactive: await User.countDocuments({ isActive: false }),
                    byRole: {
                        superadmin: await User.countDocuments({ role: 'superadmin' }),
                        merchant: await User.countDocuments({ role: 'merchant' }),
                        user: await User.countDocuments({ role: 'user' })
                    },
                    withParent: await User.countDocuments({ parent: { $exists: true, $ne: null } }),
                    withoutParent: await User.countDocuments({ $or: [{ parent: null }, { parent: { $exists: false } }] })
                },
                orders: {
                    total: await Order.countDocuments(),
                    active: await Order.countDocuments({ isActive: true }),
                    inactive: await Order.countDocuments({ isActive: false }),
                    byStatus: {
                        pending: await Order.countDocuments({ status: 'PENDING' }),
                        submitted: await Order.countDocuments({ status: 'SUBMITTED' }),
                        verified: await Order.countDocuments({ status: 'VERIFIED' }),
                        expired: await Order.countDocuments({ status: 'EXPIRED' }),
                        cancelled: await Order.countDocuments({ status: 'CANCELLED' }),
                        invalidated: await Order.countDocuments({ status: 'INVALIDATED' })
                    },
                    withMerchant: await Order.countDocuments({ merchant: { $exists: true, $ne: null } }),
                    withoutMerchant: await Order.countDocuments({ $or: [{ merchant: null }, { merchant: { $exists: false } }] })
                },
                system: {
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV,
                    uptime: Math.floor(process.uptime()),
                    memoryUsage: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            };

            res.json({
                success: true,
                statistics: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`Debug stats endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            res.status(500).json({
                error: 'Statistics generation failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /debug/health - Health check with RBAC status
     */
    router.get('/health', async (req, res) => {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'healthy',
                    rbac: 'enabled',
                    debugging: rbacDebugger.isEnabled() ? 'enabled' : 'disabled'
                },
                environment: process.env.NODE_ENV,
                version: '2.0.0'
            };

            // Test database connectivity
            try {
                await User.findOne().limit(1);
                health.services.database = 'healthy';
            } catch (dbError) {
                health.services.database = 'error';
                health.status = 'degraded';
            }

            res.json(health);
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'Health check failed',
                timestamp: new Date().toISOString()
            });
        }
    });

    logger.info('Debug routes enabled', {
        action: 'DEBUG_ROUTES_INIT',
        metadata: {
            environment: process.env.NODE_ENV,
            debugEnabled: rbacDebugger.isEnabled()
        }
    });
}

export default router;