/**
 * Enhanced Error Handling Utility for UPI Mini Gateway v2.0
 *
 * Provides centralized error handling with role-based context,
 * structured error responses, and comprehensive error logging.
 *
 * Author: Sayem Abdullah Rihan (@code-craka)
 * Created: 2024-12-23
 */

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { logger, LogContext, SecurityEventType } from "./logger.js";

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
    // Authentication & Authorization
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT_PRIVILEGES',
    USER_INACTIVE = 'USER_INACTIVE',

    // User Management
    USERNAME_EXISTS = 'USERNAME_EXISTS',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INVALID_USER_DATA = 'INVALID_USER_DATA',
    CANNOT_MANAGE_USER = 'CANNOT_MANAGE_USER',
    MERCHANT_PARENT_REQUIRED = 'MERCHANT_PARENT_REQUIRED',
    INVALID_MERCHANT_PARENT = 'INVALID_MERCHANT_PARENT',

    // Order Management
    ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
    INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
    ORDER_EXPIRED = 'ORDER_EXPIRED',
    CANNOT_MANAGE_ORDER = 'CANNOT_MANAGE_ORDER',
    INVALID_VPA = 'INVALID_VPA',
    INVALID_UTR = 'INVALID_UTR',

    // Validation
    MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
    INVALID_INPUT = 'INVALID_INPUT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // System
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Business Logic
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    RESOURCE_LOCKED = 'RESOURCE_LOCKED',
    OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * Custom application error class
 */
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly severity: ErrorSeverity;
    public readonly isOperational: boolean;
    public readonly context?: LogContext;
    public readonly details?: Record<string, any>;

    constructor(
        message: string,
        code: ErrorCode,
        statusCode: number = 500,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        isOperational: boolean = true,
        context?: LogContext,
        details?: Record<string, any>
    ) {
        super(message);

        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.severity = severity;
        this.isOperational = isOperational;
        this.context = context;
        this.details = details;

        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Authentication error factory
 */
export class AuthError extends AppError {
    constructor(message: string, code: ErrorCode, context?: LogContext) {
        super(message, code, 401, ErrorSeverity.MEDIUM, true, context);
    }
}

/**
 * Authorization error factory
 */
export class AuthorizationError extends AppError {
    constructor(message: string, code: ErrorCode, context?: LogContext, details?: Record<string, any>) {
        super(message, code, 403, ErrorSeverity.HIGH, true, context, details);
    }
}

/**
 * Validation error factory
 */
export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>, context?: LogContext) {
        super(message, ErrorCode.VALIDATION_ERROR, 400, ErrorSeverity.LOW, true, context, details);
    }
}

/**
 * Business logic error factory
 */
export class BusinessError extends AppError {
    constructor(message: string, code: ErrorCode, details?: Record<string, any>, context?: LogContext) {
        super(message, code, 400, ErrorSeverity.MEDIUM, true, context, details);
    }
}

/**
 * Database error factory
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error, context?: LogContext) {
        super(message, ErrorCode.DATABASE_ERROR, 500, ErrorSeverity.HIGH, true, context, {
            originalError: originalError?.message,
            stack: originalError?.stack
        });
    }
}

/**
 * Rate limiting error factory
 */
export class RateLimitError extends AppError {
    constructor(message: string = "Rate limit exceeded", context?: LogContext) {
        super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, ErrorSeverity.MEDIUM, true, context);
    }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: ErrorCode;
        details?: Record<string, any>;
        timestamp: string;
        requestId?: string;
    };
}

/**
 * Format error for API response
 */
export const formatErrorResponse = (error: AppError, requestId?: string): ErrorResponse => {
    return {
        success: false,
        error: {
            message: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date().toISOString(),
            requestId
        }
    };
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authReq = req as AuthRequest;
    const context = logger.extractRequestContext(req);
    const requestId = req.headers['x-request-id'] as string;

    let appError: AppError;

    // Convert different error types to AppError
    if (err instanceof AppError) {
        appError = err;
    } else if (err.name === 'ValidationError') {
        // Mongoose validation error
        appError = new ValidationError('Validation failed', {
            validationErrors: (err as any).errors
        }, context);
    } else if (err.name === 'CastError') {
        // MongoDB cast error (invalid ObjectId)
        appError = new ValidationError('Invalid resource ID', {
            field: (err as any).path,
            value: (err as any).value
        }, context);
    } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
        // Database errors
        appError = new DatabaseError('Database operation failed', err, context);
    } else if (err.name === 'JsonWebTokenError') {
        // JWT errors
        appError = new AuthError('Invalid token', ErrorCode.TOKEN_INVALID, context);
    } else if (err.name === 'TokenExpiredError') {
        // JWT expiration
        appError = new AuthError('Token expired', ErrorCode.TOKEN_EXPIRED, context);
    } else {
        // Unknown errors
        appError = new AppError(
            'Internal server error',
            ErrorCode.INTERNAL_ERROR,
            500,
            ErrorSeverity.CRITICAL,
            false,
            context,
            { originalError: err.message, stack: err.stack }
        );
    }

    // Log the error
    logger.error(appError.message, {
        ...context,
        action: 'ERROR_HANDLER',
        metadata: {
            ...context.metadata,
            errorCode: appError.code,
            statusCode: appError.statusCode,
            severity: appError.severity,
            isOperational: appError.isOperational,
            stack: appError.stack,
            details: appError.details
        }
    }, appError);

    // Log security events for authorization errors
    if (appError.statusCode === 401) {
        logger.security(SecurityEventType.UNAUTHORIZED_ACCESS, appError.message, context);
    } else if (appError.statusCode === 403) {
        logger.security(SecurityEventType.PRIVILEGE_ESCALATION, appError.message, context);
    }

    // Format and send error response
    const errorResponse = formatErrorResponse(appError, requestId);

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && !appError.isOperational) {
        errorResponse.error.message = 'Internal server error';
        delete errorResponse.error.details;
    }

    res.status(appError.statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const context = logger.extractRequestContext(req);
    const error = new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        ErrorCode.NOT_AUTHENTICATED, // Using NOT_AUTHENTICATED as we don't have a NOT_FOUND code
        404,
        ErrorSeverity.LOW,
        true,
        context
    );

    next(error);
};

/**
 * Error factories for common scenarios
 */
export const ErrorFactory = {
    /**
     * Authentication errors
     */
    auth: {
        invalidCredentials: (context?: LogContext) =>
            new AuthError('Invalid username or password', ErrorCode.INVALID_CREDENTIALS, context),

        tokenInvalid: (context?: LogContext) =>
            new AuthError('Invalid or malformed token', ErrorCode.TOKEN_INVALID, context),

        tokenExpired: (context?: LogContext) =>
            new AuthError('Token has expired', ErrorCode.TOKEN_EXPIRED, context),

        userInactive: (context?: LogContext) =>
            new AuthError('User account is inactive', ErrorCode.USER_INACTIVE, context),

        notAuthenticated: (context?: LogContext) =>
            new AuthError('Authentication required', ErrorCode.NOT_AUTHENTICATED, context)
    },

    /**
     * Authorization errors
     */
    authz: {
        insufficientPrivileges: (required: string, actual?: string, context?: LogContext) =>
            new AuthorizationError(
                `Insufficient privileges. Required: ${required}`,
                ErrorCode.INSUFFICIENT_PRIVILEGES,
                context,
                { required, actual }
            ),

        cannotManageUser: (context?: LogContext) =>
            new AuthorizationError(
                'Cannot manage this user',
                ErrorCode.CANNOT_MANAGE_USER,
                context
            ),

        cannotManageOrder: (context?: LogContext) =>
            new AuthorizationError(
                'Cannot manage this order',
                ErrorCode.CANNOT_MANAGE_ORDER,
                context
            )
    },

    /**
     * Validation errors
     */
    validation: {
        missingFields: (fields: string[], context?: LogContext) =>
            new ValidationError(
                `Missing required fields: ${fields.join(', ')}`,
                { missingFields: fields },
                context
            ),

        invalidInput: (field: string, reason: string, context?: LogContext) =>
            new ValidationError(
                `Invalid ${field}: ${reason}`,
                { field, reason },
                context
            ),

        invalidVPA: (vpa: string, context?: LogContext) =>
            new ValidationError(
                'Invalid VPA format',
                { vpa, expectedFormat: 'username@bank' },
                context
            ),

        invalidUTR: (utr: string, context?: LogContext) =>
            new ValidationError(
                'Invalid UTR format',
                { utr, expectedFormat: '6-32 alphanumeric characters' },
                context
            )
    },

    /**
     * Resource errors
     */
    resource: {
        userNotFound: (identifier: string, context?: LogContext) =>
            new BusinessError(
                'User not found',
                ErrorCode.USER_NOT_FOUND,
                { identifier },
                context
            ),

        orderNotFound: (orderId: string, context?: LogContext) =>
            new BusinessError(
                'Order not found',
                ErrorCode.ORDER_NOT_FOUND,
                { orderId },
                context
            ),

        usernameExists: (username: string, context?: LogContext) =>
            new BusinessError(
                'Username already exists',
                ErrorCode.USERNAME_EXISTS,
                { username },
                context
            )
    },

    /**
     * Business logic errors
     */
    business: {
        merchantParentRequired: (context?: LogContext) =>
            new BusinessError(
                'Users must have a merchant parent',
                ErrorCode.MERCHANT_PARENT_REQUIRED,
                {},
                context
            ),

        invalidOrderStatus: (currentStatus: string, requiredStatus: string, context?: LogContext) =>
            new BusinessError(
                `Invalid order status. Current: ${currentStatus}, Required: ${requiredStatus}`,
                ErrorCode.INVALID_ORDER_STATUS,
                { currentStatus, requiredStatus },
                context
            ),

        orderExpired: (orderId: string, expiresAt: Date, context?: LogContext) =>
            new BusinessError(
                'Order has expired',
                ErrorCode.ORDER_EXPIRED,
                { orderId, expiresAt },
                context
            )
    },

    /**
     * System errors
     */
    system: {
        database: (operation: string, originalError?: Error, context?: LogContext) =>
            new DatabaseError(`Database ${operation} failed`, originalError, context),

        internal: (message: string = 'Internal server error', context?: LogContext) =>
            new AppError(message, ErrorCode.INTERNAL_ERROR, 500, ErrorSeverity.CRITICAL, false, context),

        rateLimit: (context?: LogContext) =>
            new RateLimitError('Too many requests, please try again later', context)
    }
};

/**
 * Debugging helper to log error context
 */
export const debugError = (error: Error, context?: LogContext): void => {
    logger.debug('Error debug information', {
        ...context,
        action: 'ERROR_DEBUG',
        metadata: {
            ...context?.metadata,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            errorConstructor: error.constructor.name
        }
    });
};

/**
 * Error monitoring helper for production
 */
export const monitorError = (error: AppError, req: Request): void => {
    // This could integrate with external monitoring services
    // like Sentry, Datadog, or custom monitoring solutions

    const context = logger.extractRequestContext(req);

    // Log critical errors for immediate attention
    if (error.severity === ErrorSeverity.CRITICAL) {
        logger.security(SecurityEventType.SUSPICIOUS_ACTIVITY,
            `Critical error detected: ${error.message}`,
            context
        );
    }

    // Track error patterns for analysis
    const errorPattern = {
        code: error.code,
        statusCode: error.statusCode,
        severity: error.severity,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        endpoint: `${req.method} ${req.originalUrl}`
    };

    // This could be sent to analytics services
    logger.info('Error pattern logged', {
        ...context,
        action: 'ERROR_MONITORING',
        metadata: errorPattern
    });
};

export default {
    AppError,
    AuthError,
    AuthorizationError,
    ValidationError,
    BusinessError,
    DatabaseError,
    RateLimitError,
    ErrorFactory,
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    formatErrorResponse,
    debugError,
    monitorError
};