/**
 * API Client Service
 * Centralized HTTP client for calling all microservices
 * Handles authentication, error handling, and request/response formatting
 */

import { auth } from '@/config/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  /**
   * Get authorization token from Firebase Auth
   */
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  /**
   * Make HTTP request with authentication
   */
  private async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error (${method} ${url}):`, error);
      throw error;
    }
  }

  /**
   * Make unauthenticated HTTP request
   */
  private async requestUnauthenticated<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error (${method} ${url}):`, error);
      throw error;
    }
  }

  // =========================================================================
  // AUTH ENDPOINTS
  // =========================================================================

  /**
   * POST /auth/signup
   * Record user signup in backend
   */
  async signup(payload: {
    uid: string;
    email: string;
    name: string;
  }): Promise<ApiResponse<{ uid: string; email: string; name: string }>> {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/signup`;
    return this.requestUnauthenticated(url, 'POST', payload);
  }

  /**
   * POST /auth/login
   * Validate login and retrieve user data
   */
  async login(payload: { uid: string }): Promise<
    ApiResponse<{
      uid: string;
      email: string;
      name: string;
      firmId: string;
      role: string;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/login`;
    return this.requestUnauthenticated(url, 'POST', payload);
  }

  /**
   * POST /auth/createFirm
   * Create a new firm (requires authentication)
   */
  async createFirm(payload: {
    name: string;
    userFullName: string;
  }): Promise<
    ApiResponse<{
      firmId: string;
      firmCode: string;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/createFirm`;
    return this.request(url, 'POST', payload);
  }

  /**
   * POST /auth/joinFirm
   * Join an existing firm (requires authentication)
   */
  async joinFirm(payload: {
    firmCode: string;
    role: 'lawyer' | 'paralegal';
    userFullName: string;
  }): Promise<
    ApiResponse<{
      firmId: string;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/joinFirm`;
    return this.request(url, 'POST', payload);
  }

  /**
   * GET /auth/user/:uid
   * Get user profile information
   */
  async getUser(uid: string): Promise<
    ApiResponse<{
      uid: string;
      email: string;
      name: string;
      firmId: string;
      role: string;
      createdAt: number;
      updatedAt: number;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/user/${uid}`;
    return this.request(url, 'GET');
  }

  /**
   * GET /auth/firm/:firmId
   * Get firm details
   */
  async getFirm(firmId: string): Promise<
    ApiResponse<{
      id: string;
      name: string;
      firmCode: string;
      createdBy: string;
      createdAt: number;
      updatedAt: number;
      memberCount: number;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/firm/${firmId}`;
    return this.request(url, 'GET');
  }

  /**
   * GET /auth/firm/:firmId/members
   * Get all members of a firm
   */
  async getFirmMembers(firmId: string): Promise<
    ApiResponse<{
      members: Record<
        string,
        {
          name: string;
          role: string;
          joinedAt: number;
        }
      >;
    }>
  > {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/auth/firm/${firmId}/members`;
    return this.request(url, 'GET');
  }

  /**
   * GET /health
   * Check if auth service is running
   */
  async healthCheck(): Promise<ApiResponse<{ message: string }>> {
    const url = `${import.meta.env.VITE_AUTH_SERVICE_URL}/health`;
    return this.requestUnauthenticated(url, 'GET');
  }

  // =========================================================================
  // TEMPLATE ENDPOINTS
  // =========================================================================

  /**
   * POST /templates/upload
   * Upload a new template file (PDF/DOCX)
   */
  async uploadTemplate(payload: {
    templateName: string;
    fileName: string;
    fileData: string; // base64 encoded file data
  }): Promise<
    ApiResponse<{
      id: string;
      name: string;
      type: 'firm-specific';
      content: string;
      metadata: {
        originalFileName: string;
        fileType: 'pdf' | 'docx';
        uploadedBy: string;
        size: number;
      };
      createdAt: number;
      updatedAt: number;
    }>
  > {
    const url = `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/upload`;
    return this.request(url, 'POST', payload);
  }

  /**
   * GET /templates/global
   * Get all global templates (accessible to all authenticated users)
   */
  async getGlobalTemplates(): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        type: 'global';
        content: string;
        metadata: {
          originalFileName: string;
          fileType: 'pdf' | 'docx';
          uploadedBy: string;
          size: number;
        };
        createdAt: number;
        updatedAt: number;
      }>
    >
  > {
    const url = `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/global`;
    return this.request(url, 'GET');
  }

  /**
   * GET /templates/firm/:firmId
   * Get all templates for a specific firm
   */
  async getFirmTemplates(firmId: string): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        type: 'firm-specific';
        content: string;
        metadata: {
          originalFileName: string;
          fileType: 'pdf' | 'docx';
          uploadedBy: string;
          size: number;
        };
        createdAt: number;
        updatedAt: number;
      }>
    >
  > {
    const url = `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/firm/${firmId}`;
    return this.request(url, 'GET');
  }

  /**
   * GET /templates/:templateId
   * Get a single template by ID
   */
  async getTemplate(templateId: string): Promise<
    ApiResponse<{
      id: string;
      name: string;
      type: 'global' | 'firm-specific';
      firmId?: string;
      content: string;
      metadata: {
        originalFileName: string;
        fileType: 'pdf' | 'docx';
        uploadedBy: string;
        size: number;
      };
      createdAt: number;
      updatedAt: number;
    }>
  > {
    const url = `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/${templateId}`;
    return this.request(url, 'GET');
  }

  /**
   * DELETE /templates/:templateId
   * Delete a firm template (Admin/Lawyer only)
   */
  async deleteTemplate(templateId: string): Promise<
    ApiResponse<{
      message: string;
    }>
  > {
    const url = `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/${templateId}`;
    return this.request(url, 'DELETE');
  }

  /**
   * GET /templates/:templateId/download
   * Get a signed download URL for a template file
   */
  async downloadTemplate(
    templateId: string,
    firmId?: string
  ): Promise<
    ApiResponse<{
      downloadUrl: string;
      fileName: string;
    }>
  > {
    const url = new URL(
      `${import.meta.env.VITE_TEMPLATE_SERVICE_URL}/templates/${templateId}/download`
    );
    if (firmId) {
      url.searchParams.append('firmId', firmId);
    }
    return this.request(url.toString(), 'GET');
  }

  // ============================================================================
  // DOCUMENT SERVICE ENDPOINTS
  // ============================================================================

  /**
   * POST /documents
   * Create a new document
   */
  async createDocument(data: {
    title: string;
    firmId: string;
    templateId?: string;
    sourceDocuments?: unknown[];
    visibility?: 'private' | 'shared' | 'firm-wide';
    content?: string;
  }): Promise<
    ApiResponse<{
      documentId: string;
      document: unknown;
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents`;
    return this.request(url, 'POST', data);
  }

  /**
   * GET /documents/:documentId
   * Get a specific document
   */
  async getDocument(documentId: string): Promise<
    ApiResponse<{
      document: unknown;
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/${documentId}`;
    return this.request(url, 'GET');
  }

  /**
   * PUT /documents/:documentId
   * Update a document's content
   */
  async updateDocument(
    documentId: string,
    data: {
      content?: string;
      status?: 'draft' | 'final' | 'approved';
    }
  ): Promise<
    ApiResponse<{
      message: string;
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/${documentId}`;
    return this.request(url, 'PUT', data);
  }

  /**
   * DELETE /documents/:documentId
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<
    ApiResponse<{
      message: string;
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/${documentId}`;
    return this.request(url, 'DELETE');
  }

  /**
   * GET /documents/user/:uid
   * List user's documents
   */
  async getUserDocuments(uid: string): Promise<
    ApiResponse<{
      count: number;
      documents: unknown[];
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/user/${uid}`;
    return this.request(url, 'GET');
  }

  /**
   * GET /documents/firm/:firmId
   * List firm-wide documents
   */
  async getFirmDocuments(firmId: string): Promise<
    ApiResponse<{
      count: number;
      documents: unknown[];
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/firm/${firmId}`;
    return this.request(url, 'GET');
  }

  /**
   * GET /documents/shared/:uid
   * List documents shared with user
   */
  async getSharedDocuments(uid: string): Promise<
    ApiResponse<{
      count: number;
      documents: unknown[];
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/shared/${uid}`;
    return this.request(url, 'GET');
  }

  /**
   * POST /documents/:documentId/share
   * Update document sharing settings
   */
  async shareDocument(
    documentId: string,
    data: {
      visibility: 'private' | 'shared' | 'firm-wide';
      sharedWith?: string[];
    }
  ): Promise<
    ApiResponse<{
      message: string;
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/${documentId}/share`;
    return this.request(url, 'POST', data);
  }

  /**
   * POST /documents/upload-sources
   * Upload and extract source documents
   */
  async uploadSources(data: {
    documentId?: string;
    files: {
      filename: string;
      data: string; // base64 encoded
    }[];
  }): Promise<
    ApiResponse<{
      extractedTexts: string[];
      sourceDocuments: {
        fileName: string;
        fileType: 'pdf' | 'docx';
        storagePath: string;
        extractedText: string;
        uploadedAt: unknown;
        uploadedBy: string;
      }[];
    }>
  > {
    const url = `${import.meta.env.VITE_DOCUMENT_SERVICE_URL}/documents/upload-sources`;
    return this.request(url, 'POST', data);
  }

  // ============================================================================
  // AI SERVICE ENDPOINTS
  // ============================================================================

  /**
   * POST /ai/generate
   * Generate a demand letter draft
   */
  async generateDocument(data: {
    templateId?: string;
    templateContent?: string;
    sourceTexts: string[];
    customInstructions?: string;
  }): Promise<
    ApiResponse<{
      content: string;
      model: string;
    }>
  > {
    const url = `${import.meta.env.VITE_AI_SERVICE_URL}/ai/generate`;
    return this.request(url, 'POST', data);
  }

  /**
   * POST /ai/refine
   * Refine an existing document
   */
  async refineDocument(data: {
    content: string;
    refinementInstructions: string;
  }): Promise<
    ApiResponse<{
      content: string;
      model: string;
    }>
  > {
    const url = `${import.meta.env.VITE_AI_SERVICE_URL}/ai/refine`;
    return this.request(url, 'POST', data);
  }

  // ========================================================================
  // EXPORT SERVICE
  // ========================================================================

  /**
   * POST /export/docx
   * Export document to DOCX format
   * Returns binary DOCX file directly
   */
  async exportDocumentToDOCX(data: {
    documentId: string;
    content: string;
    title?: string;
  }): Promise<Blob> {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${import.meta.env.VITE_EXPORT_SERVICE_URL}/export/docx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error: any) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const apiClient = new ApiClient();

