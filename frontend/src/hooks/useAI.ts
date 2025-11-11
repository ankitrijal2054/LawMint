/**
 * React Query hooks for AI operations
 * Handles document generation and refinement via OpenAI
 */

import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerateDocumentParams {
  templateId?: string;
  templateContent?: string;
  sourceTexts: string[];
  customInstructions?: string;
}

export interface GenerateDocumentResponse {
  content: string;
  model: string;
}

export interface RefineDocumentParams {
  content: string;
  refinementInstructions: string;
}

export interface RefineDocumentResponse {
  content: string;
  model: string;
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Generate a demand letter draft using OpenAI
 * Input: template + source documents + optional custom instructions
 * Output: complete demand letter draft ready for review
 */
export function useGenerateDocument() {
  return useMutation<
    GenerateDocumentResponse,
    Error,
    GenerateDocumentParams
  >({
    mutationFn: async (data) => {
      // Validate required inputs
      if (!data.sourceTexts || data.sourceTexts.length === 0) {
        throw new Error('At least one source text is required');
      }

      if (!data.templateId && !data.templateContent) {
        throw new Error('Either templateId or templateContent is required');
      }

      try {
        const response = await apiClient.generateDocument({
          templateId: data.templateId,
          templateContent: data.templateContent,
          sourceTexts: data.sourceTexts,
          customInstructions: data.customInstructions || '',
        });

        if (!response.success) {
          throw new Error(response.error || 'Generation failed');
        }

        return {
          content: response.data?.content || '',
          model: response.data?.model || 'unknown',
        };
      } catch (error: any) {
        if (error.message?.includes('rate limit')) {
          throw new Error('Rate limited by OpenAI. Please try again in a moment.');
        }
        if (error.message?.includes('token')) {
          throw new Error('Request exceeded token limits. Try reducing content size.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Document generated successfully (using ${data.model})`);
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast.error((error as Error).message || 'Failed to generate document');
    },
  });
}

/**
 * Refine an existing document with custom instructions
 * Input: current document content + refinement instructions
 * Output: refined document with requested improvements
 */
export function useRefineDocument() {
  return useMutation<
    RefineDocumentResponse,
    Error,
    RefineDocumentParams
  >({
    mutationFn: async (data) => {
      // Validate required inputs
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Document content is required');
      }

      if (
        !data.refinementInstructions ||
        data.refinementInstructions.trim().length === 0
      ) {
        throw new Error('Refinement instructions are required');
      }

      try {
        const response = await apiClient.refineDocument({
          content: data.content,
          refinementInstructions: data.refinementInstructions,
        });

        if (!response.success) {
          throw new Error(response.error || 'Refinement failed');
        }

        return {
          content: response.data?.content || '',
          model: response.data?.model || 'unknown',
        };
      } catch (error: any) {
        if (error.message?.includes('rate limit')) {
          throw new Error('Rate limited by OpenAI. Please try again in a moment.');
        }
        if (error.message?.includes('token')) {
          throw new Error('Request exceeded token limits. Try reducing content size.');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Document refined successfully (using ${data.model})`);
    },
    onError: (error) => {
      console.error('Refinement error:', error);
      toast.error((error as Error).message || 'Failed to refine document');
    },
  });
}

