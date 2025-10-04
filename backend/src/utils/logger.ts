/**
 * Enhanced Logging Utility for UPI Mini Gateway v2.0
 *
 * Provides structured logging with role-based context tracking,
 * performance monitoring, and security event logging.
 *
 * Author: Sayem Abdullah Rihan (@code-craka)
 * Created: 2024-12-23
 */

import { Request } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { UserRole } from "../models/User.js";

/**
 * Sanitize user input for safe logging
 * Prevents log injection, format string attacks, and other log-based exploits
 */
function sanitizeLogInput(input: string): string {
    if (typeof input !== 'string') {
        return String(input);
    }
    
    return input
        // Remove newlines and carriage returns to prevent log injection
        .replace(/[\n\r]/g, ' ')
        // Escape format string specifiers
        .replace(/%/g, '%%')
        // Remove null bytes
        .replace(/\0/g, '')
        // Limit length to prevent log flooding
        .slice(0, 1000)
        // Trim whitespace
        .trim();
}

/**
 * Log levels in order of severity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SECURITY = 4
}

/**
 * Log context interface for structured logging
 */
export interface LogContext {
    userId?: string;
    role?: UserRole;
    action?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
    timestamp?: Date;
    duration?: number;
    metadata?: Record<string, any>;
}

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
    DATA_ACCESS_VIOLATION = 'DATA_ACCESS_VIOLATION',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    TOKEN_VALIDATION_FAILED = 'TOKEN_VALIDATION_FAILED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Performance monitoring interface
 */
export interface PerformanceMetrics {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    memoryUsage?: NodeJS.MemoryUsage;
    dbQueries?: number;
    cacheHits?: number;
    cacheMisses?: number;
}

/**
 * Enhanced Logger class with role-based context
 */
class Logger {
    private logLevel: LogLevel;
    private enableConsole: boolean;
    private enableFile: boolean;
    private enableSentry: boolean;

    constructor() {
        this.logLevel = this.getLogLevel();
        this.enableConsole = process.env.NODE_ENV !== 'production';
        this.enableFile = process.env.ENABLE_FILE_LOGGING === 'true';
        this.enableSentry = process.env.NODE_ENV === 'production';
    }

    /**
     * Get log level from environment
     */
    private getLogLevel(): LogLevel {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        switch (level) {
            case 'DEBUG': return LogLevel.DEBUG;
            case 'INFO': return LogLevel.INFO;
            case 'WARN': return LogLevel.WARN;
            case 'ERROR': return LogLevel.ERROR;
            case 'SECURITY': return LogLevel.SECURITY;
            default: return LogLevel.INFO;
        }
    }

    /**
     * Extract context from Express request
     */
    public extractRequestContext(req: Request | AuthRequest): LogContext {
        const authReq = req as AuthRequest;

        return {
            userId: authReq.user?.userId,
            role: authReq.user?.role,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestId: req.headers['x-request-id'] as string,
            timestamp: new Date(),
            metadata: {
                method: req.method,
                url: req.originalUrl || req.url,
                headers: this.sanitizeHeaders(req.headers),
                body: this.sanitizeBody(req.body),
                params: req.params,
                query: req.query
            }
        };
    }

    /**
     * Sanitize headers to remove sensitive information
     */
    private sanitizeHeaders(headers: any): any {
        const sanitized = { ...headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        return sanitized;
    }

    /**
     * Sanitize request body to remove sensitive information
     */
    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') return body;

        const sanitized = { ...body };
        delete sanitized.password;
        delete sanitized.currentPassword;
        delete sanitized.newPassword;
        delete sanitized.token;
        return sanitized;
    }

    /**
     * Format log message with context
     */
    private formatMessage(level: string, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const userId = context?.userId ? `[User:${context.userId}]` : '';
        const role = context?.role ? `[Role:${context.role}]` : '';
        const action = context?.action ? `[Action:${context.action}]` : '';
        const duration = context?.duration ? `[Duration:${context.duration}ms]` : '';

        return `${timestamp} [${level}] ${userId}${role}${action}${duration} ${message}`;
    }

    /**
     * Log with context
     */
    private log(level: LogLevel, levelName: string, message: string, context?: LogContext, error?: Error): void {
        if (level < this.logLevel) return;

        const formattedMessage = this.formatMessage(levelName, message, context);
        const logData = {
            level: levelName,
            message,
            context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined,
            timestamp: new Date().toISOString()
        };

        // Console logging (development)
        if (this.enableConsole) {
            const safeMessage = String(formattedMessage).replace(/%/g, '%%'); // Escape format specifiers
            const metadataStr = context?.metadata ? JSON.stringify(context.metadata, null, 2) : '';
            
            switch (level) {
                case LogLevel.DEBUG:
                    console.debug('%s', safeMessage, metadataStr);
                    break;
                case LogLevel.INFO:
                    console.info('%s', safeMessage);
                    break;
                case LogLevel.WARN:
                    console.warn('%s', safeMessage);
                    break;
                case LogLevel.ERROR:
                case LogLevel.SECURITY:
                    console.error('%s', safeMessage, error?.stack || '');
                    break;
            }
        }

        // File logging (if enabled)
        if (this.enableFile) {
            this.writeToFile(logData);
        }

        // Sentry logging (production errors)
        if (this.enableSentry && (level >= LogLevel.ERROR || level === LogLevel.SECURITY)) {
            this.sendToSentry(logData);
        }
    }

    /**
     * Write log to file (implement if needed)
     */
    private writeToFile(logData: any): void {
        // TODO: Implement file logging if required
        // This could write to rotating log files
    }

    /**
     * Send to Sentry (implement if needed)
     */
    private sendToSentry(logData: any): void {
        // TODO: Implement Sentry integration if required
        // This would send errors and security events to Sentry
    }

    // Public logging methods
    public debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, 'DEBUG', message, context);
    }

    public info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, 'INFO', message, context);
    }

    public warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARN, 'WARN', message, context);
    }

    public error(message: string, context?: LogContext, error?: Error): void {
        this.log(LogLevel.ERROR, 'ERROR', message, context, error);
    }

    public security(event: SecurityEventType, message: string, context?: LogContext): void {
        const securityContext = {
            ...context,
            action: event,
            metadata: {
                ...context?.metadata,
                securityEvent: true,
                eventType: event
            }
        };
        this.log(LogLevel.SECURITY, 'SECURITY', message, securityContext);
    }

    /**
     * Log authentication events
     */
    public logAuth(success: boolean, username: string, reason?: string, context?: LogContext): void {
        const event = success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE;
        const message = success
            ? `Successful login for user: ${username}`
            : `Failed login attempt for user: ${username}. Reason: ${reason}`;

        this.security(event, message, {
            ...context,
            metadata: {
                ...context?.metadata,
                username,
                success,
                reason
            }
        });
    }

    /**
     * Log authorization failures
     */
    public logUnauthorized(action: string, requiredRole: string, actualRole?: string, context?: LogContext): void {
        const message = `Unauthorized access attempt. Action: ${action}, Required: ${requiredRole}, Actual: ${actualRole || 'none'}`;

        this.security(SecurityEventType.UNAUTHORIZED_ACCESS, message, {
            ...context,
            action,
            metadata: {
                ...context?.metadata,
                requiredRole,
                actualRole,
                action
            }
        });
    }

    /**
     * Log role-based access control events
     */
    public logRBAC(action: string, resource: string, granted: boolean, context?: LogContext): void {
        const level = granted ? LogLevel.INFO : LogLevel.WARN;
        const message = `RBAC ${granted ? 'granted' : 'denied'}: ${action} on ${resource}`;

        this.log(level, granted ? 'INFO' : 'WARN', message, {
            ...context,
            action,
            resource,
            metadata: {
                ...context?.metadata,
                rbacDecision: granted,
                action,
                resource
            }
        });
    }

    /**
     * Log data access with filtering information
     */
    public logDataAccess(resource: string, filter: any, resultCount: number, context?: LogContext): void {
        const message = `Data access: ${resource}, Results: ${resultCount}`;

        this.info(message, {
            ...context,
            resource,
            metadata: {
                ...context?.metadata,
                resource,
                filter: this.sanitizeFilter(filter),
                resultCount
            }
        });
    }

    /**
     * Sanitize database filter to remove sensitive information
     */
    private sanitizeFilter(filter: any): any {
        if (!filter || typeof filter !== 'object') return filter;

        const sanitized = { ...filter };
        // Remove sensitive fields from filter logging
        delete sanitized.password;
        delete sanitized.token;
        return sanitized;
    }

    /**
     * Performance monitoring
     */
    public startPerformanceTimer(operation: string): () => PerformanceMetrics {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();

        return (): PerformanceMetrics => {
            const endTime = Date.now();
            const endMemory = process.memoryUsage();

            const metrics: PerformanceMetrics = {
                operation,
                startTime,
                endTime,
                duration: endTime - startTime,
                memoryUsage: {
                    rss: endMemory.rss - startMemory.rss,
                    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                    external: endMemory.external - startMemory.external,
                    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
                }
            };

            // Log performance metrics
            if (metrics.duration > 1000) { // Log slow operations
                this.warn(`Slow operation detected: ${sanitizeLogInput(operation)}`, {
                    action: sanitizeLogInput(operation),
                    duration: metrics.duration,
                    metadata: metrics
                });
            } else {
                this.debug(`Performance: ${sanitizeLogInput(operation)}`, {
                    action: sanitizeLogInput(operation),
                    duration: metrics.duration,
                    metadata: metrics
                });
            }

            return metrics;
        };
    }

    /**
     * Create child logger with context
     */
    public child(context: LogContext): Logger {
        const childLogger = new Logger();

        // Override log method to include parent context
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level: LogLevel, levelName: string, message: string, childContext?: LogContext, error?: Error) => {
            const mergedContext = {
                ...context,
                ...childContext,
                metadata: {
                    ...context.metadata,
                    ...childContext?.metadata
                }
            };
            return originalLog(level, levelName, message, mergedContext, error);
        };

        return childLogger;
    }
}

// Create singleton logger instance
export const logger = new Logger();

/**
 * Middleware to add request logging
 */
export const requestLogger = (req: Request, res: any, next: any): void => {
    const context = logger.extractRequestContext(req);
    const stopTimer = logger.startPerformanceTimer(`${req.method} ${req.originalUrl || req.url}`);

    // Add logger to request for use in route handlers
    (req as any).logger = logger.child(context);

    // Log request start (sanitize user-controlled URL)
    const safeMethod = sanitizeLogInput(req.method);
    const safeUrl = sanitizeLogInput(req.originalUrl || req.url || '');
    logger.info(`Request started: ${safeMethod} ${safeUrl}`, context);

    // Log response when finished
    res.on('finish', () => {
        const metrics = stopTimer();
        const responseContext = {
            ...context,
            metadata: {
                ...context.metadata,
                statusCode: res.statusCode,
                responseTime: metrics.duration
            }
        };

        if (res.statusCode >= 400) {
            logger.warn(`Request completed with error: ${safeMethod} ${safeUrl}`, responseContext);
        } else {
            logger.info(`Request completed: ${safeMethod} ${safeUrl}`, responseContext);
        }
    });

    next();
};

/**
 * Error logging helper
 */
export const logError = (error: Error, context?: LogContext): void => {
    logger.error(error.message, context, error);
};

/**
 * Security event logging helper
 */
export const logSecurityEvent = (event: SecurityEventType, message: string, context?: LogContext): void => {
    logger.security(event, message, context);
};

export default logger;