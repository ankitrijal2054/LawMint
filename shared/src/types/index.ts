/**
 * Shared TypeScript Types for LawMint Microservices
 * Used across frontend and all backend services
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserRole = 'admin' | 'lawyer' | 'paralegal';

export interface User {
  uid: string;
  email: string;
  name: string;
  firmId: string;
  role: UserRole;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export interface AuthSignupPayload {
  email: string;
  password: string;
  name: string;
}

export interface AuthLoginPayload {
  email: string;
  password: string;
}

export interface AuthSignupResponse {
  uid: string;
  email: string;
  name: string;
  message: string;
}

// ============================================================================
// FIRM MANAGEMENT
// ============================================================================

export interface Firm {
  id: string;
  name: string;
  firmCode: string; // Format: STENO-XXXXX
  createdBy: string; // uid of admin who created the firm
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  memberCount: number;
  members?: Record<string, FirmMember>; // { uid: { name, role, joinedAt } }
}

export interface FirmMember {
  name: string;
  role: UserRole;
  joinedAt: number; // Timestamp
}

export interface CreateFirmPayload {
  name: string;
}

export interface CreateFirmResponse {
  firmId: string;
  firmCode: string;
  message: string;
}

export interface JoinFirmPayload {
  firmCode: string;
  role: UserRole; // lawyer or paralegal (not admin)
}

export interface JoinFirmResponse {
  firmId: string;
  message: string;
}

export interface FirmMembersResponse {
  members: Record<string, FirmMember>;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// TEMPLATES (for future phases)
// ============================================================================

export interface Template {
  id: string;
  name: string;
  type: 'global' | 'firm-specific';
  firmId?: string; // Only for firm-specific templates
  content: string; // Extracted text from PDF/DOCX
  metadata: TemplateMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateMetadata {
  originalFileName: string;
  fileType: 'pdf' | 'docx';
  uploadedBy: string; // uid or 'system' for global templates
  size: number; // bytes
}

// ============================================================================
// DOCUMENTS (for future phases)
// ============================================================================

export interface Document {
  id: string;
  firmId: string;
  title: string;
  content: string; // Rich text or markdown
  templateId?: string;
  sourceDocumentId?: string;
  createdBy: string; // uid
  createdAt: number;
  updatedAt: number;
  lastEditedBy: string; // uid
  lastEditedAt: number;
  status: 'draft' | 'reviewed' | 'archived';
  visibility: 'private' | 'shared' | 'firm-wide';
  sharedWith?: Record<string, DocumentPermission>; // { uid: { canView, canEdit } }
}

export interface DocumentPermission {
  canView: boolean;
  canEdit: boolean;
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Firm errors
  FIRM_NOT_FOUND = 'FIRM_NOT_FOUND',
  INVALID_FIRM_CODE = 'INVALID_FIRM_CODE',
  FIRM_CODE_ALREADY_EXISTS = 'FIRM_CODE_ALREADY_EXISTS',
  INVALID_ROLE = 'INVALID_ROLE',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Document/Template errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

