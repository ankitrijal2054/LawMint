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
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const apiClient = new ApiClient();

