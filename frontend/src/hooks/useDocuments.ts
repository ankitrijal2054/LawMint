/**
 * React Query hooks for document operations
 * Handles CRUD, listing, sharing, and source uploads
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  id: string;
  documentId: string;
  firmId: string;
  ownerId: string;
  title: string;
  content: string;
  templateId?: string;
  sourceDocuments: unknown[];
  visibility: 'private' | 'shared' | 'firm-wide';
  sharedWith: string[];
  activeUsers: unknown[];
  status: 'draft' | 'final' | 'approved';
  metadata: {
    lastEditedBy: string;
    wordCount: number;
    version: number;
    notes: string;
  };
  createdAt: unknown;
  updatedAt: unknown;
}

export interface SourceDocument {
  fileName: string;
  fileType: 'pdf' | 'docx';
  storagePath: string;
  extractedText: string;
  uploadedAt: unknown;
  uploadedBy: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single document by ID
 */
export function useDocument(documentId: string | null) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await apiClient.getDocument(documentId);
      if (!response.success) throw new Error(response.error);
      return response.data?.document as Document;
    },
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes - keep document data fresh but avoid excessive refetches
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    retry: 2,
  });
}

/**
 * Get user's documents (owned + shared + firm-wide)
 */
export function useUserDocuments(uid: string | null) {
  return useQuery({
    queryKey: ['documents', 'user', uid],
    queryFn: async () => {
      if (!uid) return [];
      const response = await apiClient.getUserDocuments(uid);
      if (!response.success) throw new Error(response.error);
      return response.data?.documents as Document[];
    },
    enabled: !!uid,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

/**
 * Get firm-wide documents
 */
export function useFirmDocuments(firmId: string | null) {
  return useQuery({
    queryKey: ['documents', 'firm', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const response = await apiClient.getFirmDocuments(firmId);
      if (!response.success) throw new Error(response.error);
      return response.data?.documents as Document[];
    },
    enabled: !!firmId,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

/**
 * Get documents shared with user
 */
export function useSharedDocuments(uid: string | null) {
  return useQuery({
    queryKey: ['documents', 'shared', uid],
    queryFn: async () => {
      if (!uid) return [];
      const response = await apiClient.getSharedDocuments(uid);
      if (!response.success) throw new Error(response.error);
      // Backend returns { success: true, data: { documents } }
      return response.data?.documents as Document[] || [];
    },
    enabled: !!uid,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new document
 */
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      firmId: string;
      templateId?: string;
      sourceDocuments?: unknown[];
      visibility?: 'private' | 'shared' | 'firm-wide';
      content?: string;
    }) => {
      console.log('useCreateDocument: calling API with', data);
      const response = await apiClient.createDocument(data);
      console.log('useCreateDocument: API response', response);
      
      if (!response.success) {
        console.error('useCreateDocument: success is false', response.error);
        throw new Error(response.error);
      }
      
      const documentId = response.data?.documentId;
      console.log('useCreateDocument: extracted documentId', documentId);
      
      if (!documentId) {
        console.error('useCreateDocument: documentId is null/undefined', response.data);
        throw new Error('API did not return documentId');
      }
      
      return documentId;
    },
    onSuccess: (documentId) => {
      console.log('useCreateDocument: onSuccess with', documentId);
      toast.success('Document created successfully');
      // Invalidate document queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      console.error('useCreateDocument: onError', error);
      toast.error((error as Error).message || 'Failed to create document');
    },
  });
}

/**
 * Update document content
 * Note: Toasts are handled by the caller (DocumentEditorPage) to avoid duplicates
 */
export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content?: string;
      status?: 'draft' | 'final' | 'approved';
    }) => {
      const response = await apiClient.updateDocument(documentId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate specific document query
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    // Error handling is done by caller
  });
}

/**
 * Delete a document
 * Note: Toast notifications are handled by the caller component
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.deleteDocument(documentId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate document queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    // Error handling is done by caller
  });
}

/**
 * Share document with users
 * Note: Toasts are shown in ShareDocumentModal component to avoid duplicates
 */
export function useShareDocument(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      visibility: 'private' | 'shared' | 'firm-wide';
      sharedWith?: string[];
    }) => {
      const response = await apiClient.shareDocument(documentId, data);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate document queries
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    // Error handling is done by caller
  });
}

/**
 * Upload source documents for extraction
 */
export function useUploadSources() {
  return useMutation({
    mutationFn: async (data: {
      documentId?: string;
      files: {
        filename: string;
        data: string; // base64
      }[];
    }) => {
      const response = await apiClient.uploadSources(data);
      if (!response.success) throw new Error(response.error);
      return {
        extractedTexts: response.data?.extractedTexts || [],
        sourceDocuments: response.data?.sourceDocuments || [],
      };
    },
    onError: (error) => {
      toast.error((error as Error).message || 'Failed to upload sources');
    },
  });
}

