/**
 * Debugging Utilities for UPI Mini Gateway v2.0 RBAC System
 *
 * Provides comprehensive debugging tools for role-based access control,
 * data filtering, permission checking, and performance monitoring.
 *
 * Author: Sayem Abdullah Rihan (@code-craka)
 * Created: 2024-12-23
 */

import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import User, { IUser, UserRole } from "../models/User.js";
import Order, { IOrder } from "../models/Order.js";
import { logger, LogContext } from "./logger.js";
import { DataFilters, PermissionHelpers } from "./roleHelpers.js";

/**
 * Debug information interface
 */
export interface DebugInfo {
    timestamp: string;
    request: {
        method: string;
        url: string;
        userId?: string;
        role?: UserRole;
        ip?: string;
        userAgent?: string;
    };
    permissions: {
        canCreateUsers: boolean;
        canCreateMerchants: boolean;
        canInvalidateOrders: boolean;
        canViewAllUsers: boolean;
        canViewAllOrders: boolean;
    };
    filters: {
        userFilter: any;
        orderFilter: any;
    };
    performance: {
        queryTime?: number;
        resultCount?: number;
        memoryUsage?: NodeJS.MemoryUsage;
    };
    errors?: string[];
}

/**
 * RBAC Debug Helper Class
 */
export class RBACDebugger {
    private enabled: boolean;

    constructor() {
        this.enabled = process.env.RBAC_DEBUG === 'true' || process.env.NODE_ENV === 'development';
    }

    /**
     * Check if debugging is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Generate comprehensive debug information for a request
     */
    public async generateDebugInfo(req: AuthRequest): Promise<DebugInfo> {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        const debugInfo: DebugInfo = {
            timestamp: new Date().toISOString(),
            request: {
                method: req.method,
                url: req.originalUrl || req.url,
                userId: req.user?.userId,
                role: req.user?.role,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            },
            permissions: {
                canCreateUsers: false,
                canCreateMerchants: false,
                canInvalidateOrders: false,
                canViewAllUsers: false,
                canViewAllOrders: false
            },
            filters: {
                userFilter: {},
                orderFilter: {}
            },
            performance: {},
            errors: []
        };

        try {
            // Calculate permissions if user is authenticated
            if (req.user?.role) {
                debugInfo.permissions = {
                    canCreateUsers: PermissionHelpers.canCreateRole(req.user.role, "user"),
                    canCreateMerchants: PermissionHelpers.canCreateRole(req.user.role, "merchant"),
                    canInvalidateOrders: PermissionHelpers.canInvalidateOrder(req.user.role),
                    canViewAllUsers: req.user.role === "superadmin",
                    canViewAllOrders: req.user.role === "superadmin"
                };

                // Generate filters
                debugInfo.filters = {
                    userFilter: DataFilters.getUserFilter(req.user.role, req.user.userId),
                    orderFilter: DataFilters.getOrderFilter(req.user.role, req.user.userId)
                };
            }

            // Performance metrics
            const endTime = Date.now();
            const endMemory = process.memoryUsage();

            debugInfo.performance = {
                queryTime: endTime - startTime,
                memoryUsage: {
                    rss: endMemory.rss - startMemory.rss,
                    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                    external: endMemory.external - startMemory.external,
                    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
                }
            };

        } catch (error) {
            debugInfo.errors = debugInfo.errors || [];
            debugInfo.errors.push(`Debug info generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return debugInfo;
    }

    /**
     * Log permission check results
     */
    public logPermissionCheck(
        action: string,
        resource: string,
        granted: boolean,
        reason?: string,
        context?: LogContext
    ): void {
        if (!this.enabled) return;

        logger.debug(`Permission Check: ${action} on ${resource}`, {
            ...context,
            action: 'PERMISSION_CHECK',
            resource,
            metadata: {
                ...context?.metadata,
                permissionGranted: granted,
                action,
                resource,
                reason
            }
        });
    }

    /**
     * Log data filter application
     */
    public logDataFilter(
        resource: string,
        originalQuery: any,
        appliedFilter: any,
        resultCount?: number,
        context?: LogContext
    ): void {
        if (!this.enabled) return;

        logger.debug(`Data Filter Applied: ${resource}`, {
            ...context,
            action: 'DATA_FILTER',
            resource,
            metadata: {
                ...context?.metadata,
                originalQuery,
                appliedFilter,
                resultCount,
                resource
            }
        });
    }

    /**
     * Log role hierarchy decisions
     */
    public logRoleHierarchy(
        userRole: UserRole,
        requiredRole: UserRole,
        granted: boolean,
        context?: LogContext
    ): void {
        if (!this.enabled) return;

        logger.debug(`Role Hierarchy Check: ${userRole} >= ${requiredRole}`, {
            ...context,
            action: 'ROLE_HIERARCHY',
            metadata: {
                ...context?.metadata,
                userRole,
                requiredRole,
                granted
            }
        });
    }

    /**
     * Validate user relationships and log issues
     */
    public async validateUserRelationships(userId?: string): Promise<string[]> {
        if (!this.enabled) return [];

        const issues: string[] = [];

        try {
            const query = userId ? { _id: userId } : {};
            const users = await User.find(query).populate('parent createdBy');

            for (const user of users) {
                // Check user role constraints
                if (user.role === 'user' && !user.parent) {
                    issues.push(`User ${user.username} (${user._id}) has no merchant parent`);
                }

                if ((user.role === 'merchant' || user.role === 'superadmin') && user.parent) {
                    issues.push(`${user.role} ${user.username} (${user._id}) should not have a parent`);
                }

                // Check parent relationship validity
                if (user.parent) {
                    const parent = await User.findById(user.parent);
                    if (!parent) {
                        issues.push(`User ${user.username} (${user._id}) has invalid parent reference`);
                    } else if (parent.role !== 'merchant') {
                        issues.push(`User ${user.username} (${user._id}) parent is not a merchant`);
                    }
                }
            }

            if (issues.length > 0) {
                logger.warn(`User relationship validation found ${issues.length} issues`, {
                    action: 'VALIDATION',
                    metadata: { issues, userId }
                });
            }

        } catch (error) {
            const errorMsg = `User relationship validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            issues.push(errorMsg);
            logger.error(errorMsg);
        }

        return issues;
    }

    /**
     * Validate order relationships and log issues
     */
    public async validateOrderRelationships(orderId?: string): Promise<string[]> {
        if (!this.enabled) return [];

        const issues: string[] = [];

        try {
            const query = orderId ? { orderId } : {};
            const orders = await Order.find(query).populate('user merchant createdBy');

            for (const order of orders) {
                // Check merchant assignment
                if (!order.merchant) {
                    issues.push(`Order ${order.orderId} has no merchant assigned`);
                    continue;
                }

                // Validate merchant relationship
                const user = await User.findById(order.user);
                const merchant = await User.findById(order.merchant);

                if (!user) {
                    issues.push(`Order ${order.orderId} has invalid user reference`);
                    continue;
                }

                if (!merchant) {
                    issues.push(`Order ${order.orderId} has invalid merchant reference`);
                    continue;
                }

                // Check user-merchant relationship
                if (user.role === 'user') {
                    if (user.parent?.toString() !== order.merchant.toString()) {
                        issues.push(`Order ${order.orderId}: user's parent (${user.parent}) doesn't match order merchant (${order.merchant})`);
                    }
                } else if (user.role === 'merchant') {
                    if ((user._id as any).toString() !== order.merchant.toString()) {
                        issues.push(`Order ${order.orderId}: merchant user ID doesn't match order merchant`);
                    }
                }
            }

            if (issues.length > 0) {
                logger.warn(`Order relationship validation found ${issues.length} issues`, {
                    action: 'VALIDATION',
                    metadata: { issues, orderId }
                });
            }

        } catch (error) {
            const errorMsg = `Order relationship validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            issues.push(errorMsg);
            logger.error(errorMsg);
        }

        return issues;
    }

    /**
     * Generate performance report for database queries
     */
    public async generatePerformanceReport(): Promise<any> {
        if (!this.enabled) return {};

        const report = {
            timestamp: new Date().toISOString(),
            database: {
                userCollectionStats: {},
                orderCollectionStats: {},
                indexUsage: []
            },
            queries: {
                slowQueries: [],
                frequentQueries: []
            }
        };

        try {
            // This would integrate with MongoDB explain() and profiling
            // For now, we'll return a placeholder structure
            logger.info('Performance report generated', {
                action: 'PERFORMANCE_REPORT',
                metadata: report
            });

        } catch (error) {
            logger.error(`Performance report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return report;
    }
}

// Create singleton debugger instance
export const rbacDebugger = new RBACDebugger();

/**
 * Debug middleware to add debugging capabilities to requests
 */
export const debugMiddleware = async (req: AuthRequest, res: Response, next: any): Promise<void> => {
    if (!rbacDebugger.isEnabled()) {
        return next();
    }

    try {
        // Add debug info to request
        const debugInfo = await rbacDebugger.generateDebugInfo(req);
        (req as any).debugInfo = debugInfo;

        // Add debug response header
        res.setHeader('X-RBAC-Debug', 'enabled');

        // Log debug info
        logger.debug('Request debug info generated', {
            ...logger.extractRequestContext(req),
            action: 'DEBUG_MIDDLEWARE',
            metadata: debugInfo
        });

        next();

    } catch (error) {
        logger.error(`Debug middleware failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        next(); // Continue even if debugging fails
    }
};

/**
 * Debug endpoint to check user permissions and relationships
 */
export const debugUserPermissions = async (req: AuthRequest, res: Response): Promise<any> => {
    if (!rbacDebugger.isEnabled()) {
        return res.status(404).json({ message: 'Debug endpoints disabled' });
    }

    try {
        const { userId } = req.params;
        const targetUserId = userId || req.user?.userId;

        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Get user details
        const user = await User.findById(targetUserId).populate('parent createdBy');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate permission matrix
        const permissions = {
            canCreateUser: PermissionHelpers.canCreateRole(user.role, 'user'),
            canCreateMerchant: PermissionHelpers.canCreateRole(user.role, 'merchant'),
            canCreateSuperadmin: PermissionHelpers.canCreateRole(user.role, 'superadmin'),
            canDeleteUser: PermissionHelpers.canDeleteUser(user.role, 'user'),
            canDeleteMerchant: PermissionHelpers.canDeleteUser(user.role, 'merchant'),
            canInvalidateOrder: PermissionHelpers.canInvalidateOrder(user.role)
        };

        // Get data filters
        const filters = {
            userFilter: DataFilters.getUserFilter(user.role, targetUserId),
            orderFilter: DataFilters.getOrderFilter(user.role, targetUserId)
        };

        // Validate relationships
        const userIssues = await rbacDebugger.validateUserRelationships(targetUserId);
        const orderIssues = await rbacDebugger.validateOrderRelationships();

        const debugReport = {
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                parent: user.parent,
                createdBy: user.createdBy,
                isActive: user.isActive
            },
            permissions,
            filters,
            validation: {
                userIssues,
                orderIssues: orderIssues.filter(issue => issue.includes(targetUserId))
            },
            relationships: {
                canManageSelf: user.canManage(user),
                parentRelationship: user.parent ? 'Has merchant parent' : 'No parent (expected for merchant/superadmin)'
            }
        };

        res.json({
            success: true,
            debug: debugReport,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error(`Debug user permissions failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        res.status(500).json({
            error: 'Debug operation failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Debug endpoint to validate system integrity
 */
export const debugSystemIntegrity = async (req: AuthRequest, res: Response): Promise<any> => {
    if (!rbacDebugger.isEnabled()) {
        return res.status(404).json({ message: 'Debug endpoints disabled' });
    }

    try {
        // Validate all user relationships
        const userIssues = await rbacDebugger.validateUserRelationships();

        // Validate all order relationships
        const orderIssues = await rbacDebugger.validateOrderRelationships();

        // Generate performance report
        const performanceReport = await rbacDebugger.generatePerformanceReport();

        // Database statistics
        const stats = {
            users: {
                total: await User.countDocuments(),
                superadmin: await User.countDocuments({ role: 'superadmin' }),
                merchant: await User.countDocuments({ role: 'merchant' }),
                user: await User.countDocuments({ role: 'user' }),
                active: await User.countDocuments({ isActive: true }),
                inactive: await User.countDocuments({ isActive: false })
            },
            orders: {
                total: await Order.countDocuments(),
                active: await Order.countDocuments({ isActive: true }),
                pending: await Order.countDocuments({ status: 'PENDING' }),
                verified: await Order.countDocuments({ status: 'VERIFIED' }),
                invalidated: await Order.countDocuments({ status: 'INVALIDATED' })
            }
        };

        const integrityReport = {
            validation: {
                userIssuesCount: userIssues.length,
                orderIssuesCount: orderIssues.length,
                userIssues: userIssues.slice(0, 10), // Limit for response size
                orderIssues: orderIssues.slice(0, 10)
            },
            statistics: stats,
            performance: performanceReport,
            system: {
                nodeVersion: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                environment: process.env.NODE_ENV
            }
        };

        res.json({
            success: true,
            integrity: integrityReport,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error(`Debug system integrity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        res.status(500).json({
            error: 'System integrity check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Utility to print detailed role hierarchy information
 */
export const printRoleHierarchy = (): void => {
    if (!rbacDebugger.isEnabled()) return;

    console.log('\n🔐 UPI Gateway v2.0 - Role Hierarchy Debug');
    console.log('==========================================');
    console.log('Roles (in order of hierarchy):');
    console.log('1. superadmin - Full system access');
    console.log('2. merchant   - Manage their users and orders');
    console.log('3. user       - Access only their own data');
    console.log('\nPermission Matrix:');
    console.log('┌─────────────┬───────────┬──────────┬──────┐');
    console.log('│ Action      │ Superadmin│ Merchant │ User │');
    console.log('├─────────────┼───────────┼──────────┼──────┤');
    console.log('│ Create User │     ✓     │    ✓     │  ✗   │');
    console.log('│ Create Merchant│   ✓     │    ✗     │  ✗   │');
    console.log('│ View All Users│   ✓     │    ✗     │  ✗   │');
    console.log('│ View All Orders│  ✓     │    ✗     │  ✗   │');
    console.log('│ Invalidate Orders│ ✓    │    ✗     │  ✗   │');
    console.log('│ Delete Users │    ✓     │    ✓*    │  ✗   │');
    console.log('└─────────────┴───────────┴──────────┴──────┘');
    console.log('* Merchant can only delete their own users');
    console.log('==========================================\n');
};

export default {
    RBACDebugger,
    rbacDebugger,
    debugMiddleware,
    debugUserPermissions,
    debugSystemIntegrity,
    printRoleHierarchy
};