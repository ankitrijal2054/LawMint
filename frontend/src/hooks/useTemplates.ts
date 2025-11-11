/**
 * useTemplates Hook
 * React Query hooks for template management
 * Handles fetching, uploading, and deleting templates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/services/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

export interface Template {
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
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useGlobalTemplates
 * Fetch all global templates
 */
export const useGlobalTemplates = () => {
  const { user } = useAuth();

  return useQuery<Template[], Error>({
    queryKey: ['templates', 'global'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      try {
        const response = await apiClient.getGlobalTemplates();
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch global templates');
        }
        return response.data || [];
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!user, // Only run if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useFirmTemplates
 * Fetch templates for a specific firm
 */
export const useFirmTemplates = (firmId: string | null) => {
  const { user } = useAuth();

  return useQuery<Template[], Error>({
    queryKey: ['templates', 'firm', firmId],
    queryFn: async () => {
      if (!user || !firmId) throw new Error('User not authenticated or firmId not provided');
      try {
        const response = await apiClient.getFirmTemplates(firmId);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch firm templates');
        }
        return response.data || [];
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!user && !!firmId, // Only run if user is authenticated and firmId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useTemplate
 * Fetch a single template by ID
 */
export const useTemplate = (templateId: string | null) => {
  const { user } = useAuth();

  return useQuery<Template, Error>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!user || !templateId) throw new Error('User not authenticated or templateId not provided');
      try {
        const response = await apiClient.getTemplate(templateId);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch template');
        }
        return response.data as Template;
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!user && !!templateId, // Only run if user is authenticated and templateId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useUploadTemplate
 * Upload a new template
 */
export const useUploadTemplate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      templateName: string;
      fileName: string;
      fileData: string; // base64 encoded
    }) => {
      if (!user) throw new Error('User not authenticated');
      return apiClient.uploadTemplate(payload);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Template uploaded successfully');
        // Invalidate firm templates cache to refetch
        queryClient.invalidateQueries({
          queryKey: ['templates', 'firm'],
        });
      } else {
        toast.error(data.error || 'Failed to upload template');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload template');
    },
  });
};

/**
 * useDeleteTemplate
 * Delete a firm template
 */
export const useDeleteTemplate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('User not authenticated');
      return apiClient.deleteTemplate(templateId);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Template deleted successfully');
        // Invalidate firm templates cache to refetch
        queryClient.invalidateQueries({
          queryKey: ['templates', 'firm'],
        });
      } else {
        toast.error(data.error || 'Failed to delete template');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });
};

/**
 * useDownloadTemplate
 * Get signed download URL for a template
 */
export const useDownloadTemplate = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { templateId: string; firmId?: string }) => {
      if (!user) throw new Error('User not authenticated');
      return apiClient.downloadTemplate(payload.templateId, payload.firmId);
    },
    onSuccess: (data) => {
      if (data.success && data.data?.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = data.data.downloadUrl;
        link.download = data.data.fileName || 'template';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Template downloaded successfully');
      } else {
        toast.error(data.error || 'Failed to download template');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to download template');
    },
  });
};

/**
 * useAllTemplates
 * Fetch both global and firm templates combined
 */
export const useAllTemplates = (firmId: string | null) => {
  const globalTemplatesQuery = useGlobalTemplates();
  const firmTemplatesQuery = useFirmTemplates(firmId);

  return {
    templates: [
      ...(globalTemplatesQuery.data || []),
      ...(firmTemplatesQuery.data || []),
    ],
    isLoading: globalTemplatesQuery.isLoading || firmTemplatesQuery.isLoading,
    error: globalTemplatesQuery.error || firmTemplatesQuery.error,
    isError: globalTemplatesQuery.isError || firmTemplatesQuery.isError,
  };
};

