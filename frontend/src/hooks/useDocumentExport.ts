/**
 * useDocumentExport Hook
 * Handles document export to DOCX format
 * Manages loading states, error handling, and automatic download
 */

import { useState } from 'react';
import { apiClient } from '@/services/api';
import toast from 'react-hot-toast';

export interface ExportParams {
  documentId: string;
  content: string;
  title?: string;
}

export interface UseDocumentExportReturn {
  isLoading: boolean;
  error: string | null;
  exportDocument: (params: ExportParams) => Promise<boolean>;
  reset: () => void;
}

export function useDocumentExport(): UseDocumentExportReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportDocument = async (params: ExportParams): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate input
      if (!params.documentId || !params.content) {
        throw new Error('Missing required fields: documentId and content');
      }

      // Call export service - returns Blob
      const fileBlob = await apiClient.exportDocumentToDOCX({
        documentId: params.documentId,
        content: params.content,
        title: params.title,
      });

      // Create download link and trigger download
      const fileName = `${params.title || 'document'}_${Date.now()}.docx`;
      const url = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success toast
      toast.success(`Document exported: ${fileName}`, {
        duration: 4000,
        icon: '📥',
      });

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export document';
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });

      console.error('Export error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return {
    isLoading,
    error,
    exportDocument,
    reset,
  };
}

