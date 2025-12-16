/**
 * Shared Constants for LawMint
 * Used across frontend and all backend services
 */

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const ROLES = {
  ADMIN: 'admin',
  LAWYER: 'lawyer',
  PARALEGAL: 'paralegal',
} as const;

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Administrator',
  lawyer: 'Lawyer',
  paralegal: 'Paralegal',
};

// Permissions per role
export const ROLE_PERMISSIONS = {
  admin: {
    canManageFirm: true,
    canUploadTemplates: true,
    canCreateDocuments: true,
    canDeleteDocuments: true,
    canManageUsers: true,
    canExport: true,
    canCollaborate: true,
  },
  lawyer: {
    canManageFirm: false,
    canUploadTemplates: true,
    canCreateDocuments: true,
    canDeleteDocuments: true, // Own documents only
    canManageUsers: false,
    canExport: true,
    canCollaborate: true,
  },
  paralegal: {
    canManageFirm: false,
    canUploadTemplates: false,
    canCreateDocuments: true,
    canDeleteDocuments: false,
    canManageUsers: false,
    canExport: false,
    canCollaborate: true,
  },
};

// ============================================================================
// FIRM CODES
// ============================================================================

// Firm code format: LAWMINT-XXXXX (where XXXXX is 5 random alphanumeric characters)
export const FIRM_CODE_PREFIX = 'LAWMINT';
export const FIRM_CODE_LENGTH = 5;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRES_UPPERCASE: true,
  PASSWORD_REQUIRES_LOWERCASE: true,
  PASSWORD_REQUIRES_NUMBERS: true,
  PASSWORD_REQUIRES_SPECIAL: false,

  // Name requirements
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,

  // Email validation (standard RFC 5322 simplified)
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Firm name requirements
  FIRM_NAME_MIN_LENGTH: 2,
  FIRM_NAME_MAX_LENGTH: 100,
};

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

export const COLLECTIONS = {
  USERS: 'users',
  FIRMS: 'firms',
  TEMPLATES: 'templates',
  DOCUMENTS: 'documents',
  DOCUMENT_SHARES: 'documentShares',
};

// ============================================================================
// DOCUMENT VISIBILITY & STATUS
// ============================================================================

export const DOCUMENT_VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
  FIRM_WIDE: 'firm-wide',
} as const;

export const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  ARCHIVED: 'archived',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  WEAK_PASSWORD: 'Password does not meet requirements',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized - please login',

  // Firm errors
  FIRM_NOT_FOUND: 'Firm not found',
  INVALID_FIRM_CODE: 'Invalid firm code',
  FIRM_CODE_ALREADY_EXISTS: 'Firm code already in use',
  INVALID_ROLE: 'Invalid role',
  ALREADY_MEMBER: 'User is already a member of this firm',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',

  // Document/Template errors
  DOCUMENT_NOT_FOUND: 'Document not found',
  TEMPLATE_NOT_FOUND: 'Template not found',
  ACCESS_DENIED: 'Access denied',

  // Validation errors
  INVALID_REQUEST: 'Invalid request data',
  MISSING_REQUIRED_FIELD: (field: string) => `Missing required field: ${field}`,
  INVALID_EMAIL: 'Invalid email format',
  INVALID_NAME: 'Name must be between 2 and 100 characters',
  INVALID_FIRM_NAME: 'Firm name must be between 2 and 100 characters',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

// ============================================================================
// ENVIRONMENT DEFAULTS
// ============================================================================

export const ENVIRONMENT = {
  FIREBASE_EMULATOR_AUTH_PORT: 9099,
  FIREBASE_EMULATOR_FIRESTORE_PORT: 8080,
  FIREBASE_EMULATOR_FUNCTIONS_PORT: 5001,
  FIREBASE_EMULATOR_UI_PORT: 4000,
};

// ============================================================================
// FEATURE FLAGS (for future use)
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_TEMPLATES: true,
  ENABLE_COLLABORATION: true,
  ENABLE_AI_GENERATION: true,
  ENABLE_EXPORT: true,
  ENABLE_SHARING: true,
};

