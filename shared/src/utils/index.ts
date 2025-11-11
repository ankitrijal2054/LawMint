/**
 * Shared Utility Functions for LawMint
 */

import { VALIDATION, FIRM_CODE_PREFIX, FIRM_CODE_LENGTH } from '../constants/index.js';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL_PATTERN.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
  }

  if (VALIDATION.PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (VALIDATION.PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (VALIDATION.PASSWORD_REQUIRES_NUMBERS && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user name
 */
export function validateName(name: string): boolean {
  return name.length >= VALIDATION.NAME_MIN_LENGTH && name.length <= VALIDATION.NAME_MAX_LENGTH;
}

/**
 * Validate firm name
 */
export function validateFirmName(firmName: string): boolean {
  return (
    firmName.length >= VALIDATION.FIRM_NAME_MIN_LENGTH &&
    firmName.length <= VALIDATION.FIRM_NAME_MAX_LENGTH
  );
}

// ============================================================================
// FIRM CODE UTILITIES
// ============================================================================

/**
 * Generate a unique firm code in format: STENO-XXXXX
 * XXXXX = 5 random alphanumeric characters (uppercase)
 */
export function generateFirmCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < FIRM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${FIRM_CODE_PREFIX}-${code}`;
}

/**
 * Validate firm code format
 */
export function isValidFirmCode(code: string): boolean {
  const pattern = new RegExp(`^${FIRM_CODE_PREFIX}-[A-Z0-9]{${FIRM_CODE_LENGTH}}$`);
  return pattern.test(code);
}

// ============================================================================
// TIMESTAMP UTILITIES
// ============================================================================

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Format timestamp to readable date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp to readable datetime string
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Trim and normalize whitespace in a string
 */
export function normalizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: message,
    code,
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid role
 */
export function isValidRole(value: unknown): value is 'admin' | 'lawyer' | 'paralegal' {
  return value === 'admin' || value === 'lawyer' || value === 'paralegal';
}

/**
 * Check if an object is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone an object (simple version for serializable objects)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  return result;
}

