/**
 * Query sanitization utilities for secure database operations
 * Provides additional layer of protection against NoSQL injection
 */

import { Types } from 'mongoose';

export interface SanitizedFilter {
    [key: string]: any;
}

/**
 * Sanitizes and validates query filters to prevent NoSQL injection
 */
export class QuerySanitizer {
    /**
     * Sanitizes a database filter object by removing dangerous operators
     * and validating data types
     */
    static sanitizeFilter(filter: any): SanitizedFilter {
        if (!filter || typeof filter !== 'object') {
            return {};
        }

        const sanitized: SanitizedFilter = {};

        for (const [key, value] of Object.entries(filter)) {
            // Skip potentially dangerous keys
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }

            // Sanitize the value
            sanitized[key] = this.sanitizeValue(value);
        }

        return sanitized;
    }

    /**
     * Safely builds a query filter for orders with proper validation
     */
    static buildOrderFilter(baseFilter: any, queryParams: any): SanitizedFilter {
        const filter = { ...baseFilter };
        
        // Validate and add status filter
        if (queryParams.status) {
            const validStatuses = ['PENDING', 'SUBMITTED', 'VERIFIED', 'EXPIRED', 'INVALIDATED'];
            if (validStatuses.includes(queryParams.status)) {
                filter.status = queryParams.status;
            }
        }

        // Validate and add merchant filter
        if (queryParams.merchantId && Types.ObjectId.isValid(queryParams.merchantId)) {
            filter.merchant = new Types.ObjectId(queryParams.merchantId);
        }

        // Validate and add date filters
        if (queryParams.startDate) {
            const startDate = this.validateDate(queryParams.startDate);
            if (startDate) {
                filter.createdAt = { ...filter.createdAt, $gte: startDate };
            }
        }

        if (queryParams.endDate) {
            const endDate = this.validateDate(queryParams.endDate);
            if (endDate) {
                filter.createdAt = { ...filter.createdAt, $lte: endDate };
            }
        }

        // Validate and add amount filters
        if (queryParams.minAmount !== undefined) {
            const minAmount = this.validateNumber(queryParams.minAmount, 0);
            if (minAmount !== null) {
                filter.amount = { ...filter.amount, $gte: minAmount };
            }
        }

        if (queryParams.maxAmount !== undefined) {
            const maxAmount = this.validateNumber(queryParams.maxAmount, 0);
            if (maxAmount !== null) {
                filter.amount = { ...filter.amount, $lte: maxAmount };
            }
        }

        return this.sanitizeFilter(filter);
    }

    /**
     * Sanitizes individual values to prevent injection
     */
    private static sanitizeValue(value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        // Handle objects recursively (but prevent deep nesting)
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            // Only allow safe MongoDB operators
            const safeOperators = ['$gte', '$lte', '$gt', '$lt', '$eq', '$ne', '$in', '$nin'];
            const sanitized: any = {};
            
            for (const [key, val] of Object.entries(value)) {
                if (safeOperators.includes(key)) {
                    sanitized[key] = this.sanitizeValue(val);
                }
            }
            
            return Object.keys(sanitized).length > 0 ? sanitized : value;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.map(item => this.sanitizeValue(item));
        }

        // Handle strings - remove dangerous characters
        if (typeof value === 'string') {
            return value.replace(/[\$\.]/g, '');
        }

        return value;
    }

    /**
     * Validates and parses a date string
     */
    private static validateDate(dateStr: any): Date | null {
        if (typeof dateStr !== 'string') return null;
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        
        // Ensure reasonable date range (not too far in past or future)
        const now = new Date();
        const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
        const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31);
        
        if (date < tenYearsAgo || date > oneYearFromNow) return null;
        
        return date;
    }

    /**
     * Validates and parses a numeric value
     */
    private static validateNumber(value: any, min?: number, max?: number): number | null {
        const num = Number(value);
        if (isNaN(num)) return null;
        
        if (min !== undefined && num < min) return null;
        if (max !== undefined && num > max) return null;
        
        return num;
    }

    /**
     * Validates pagination parameters
     */
    static validatePagination(page: any, limit: any): { page: number; limit: number; skip: number } {
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (validPage - 1) * validLimit;
        
        return { page: validPage, limit: validLimit, skip };
    }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
    /**
     * Sanitizes string input by removing dangerous characters
     */
    static sanitizeString(input: any, maxLength: number = 1000): string | undefined {
        if (typeof input !== 'string') return undefined;
        
        return input
            .trim()
            .replace(/[<>\"'&\$\.]/g, '') // Remove dangerous characters
            .substring(0, maxLength); // Limit length
    }

    /**
     * Validates and sanitizes UTR input
     */
    static sanitizeUTR(utr: any): string | null {
        if (typeof utr !== 'string') return null;
        
        const sanitized = utr.trim().replace(/[^0-9A-Za-z]/g, '');
        return /^[0-9A-Za-z]{6,32}$/.test(sanitized) ? sanitized : null;
    }

    /**
     * Validates and sanitizes order ID
     */
    static sanitizeOrderId(orderId: any): string | null {
        if (typeof orderId !== 'string') return null;
        
        const sanitized = orderId.trim().replace(/[^0-9a-z]/g, '');
        return sanitized.length >= 5 && sanitized.length <= 20 ? sanitized : null;
    }
}