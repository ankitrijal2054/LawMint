/**
 * useDocumentGeneration Hook
 * Orchestrates the complete 3-step document generation flow:
 * 1. Upload and extract source documents
 * 2. Generate AI-powered demand letter draft
 * 3. Create and save document to Firestore
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useUploadSources } from './useDocuments';
import { useGenerateDocument } from './useAI';
import { useCreateDocument } from './useDocuments';
import { UploadedFile } from '@/components/SourceDocumentUploader';

export interface DocumentGenerationProgress {
  step: 1 | 2 | 3;
  message: string;
  status: 'pending' | 'loading' | 'success' | 'error';
}

export interface DocumentGenerationParams {
  title: string;
  firmId: string;
  templateId?: string;
  templateContent?: string;
  sourceFiles: UploadedFile[];
  customInstructions?: string;
}

export interface DocumentGenerationResult {
  documentId: string;
  content: string;
  model: string;
}

/**
 * Orchestrates multi-step document generation
 * Handles error recovery and progress tracking
 */
export function useDocumentGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DocumentGenerationProgress>({
    step: 1,
    message: 'Ready to generate',
    status: 'pending',
  });

  // Mutations
  const uploadSourcesMutation = useUploadSources();
  const generateMutation = useGenerateDocument();
  const createDocumentMutation = useCreateDocument();

  // ============================================================================
  // HELPERS
  // ============================================================================

  const updateProgress = (
    step: 1 | 2 | 3,
    message: string,
    status: 'pending' | 'loading' | 'success' | 'error'
  ) => {
    setProgress({ step, message, status });
  };

  const resetState = () => {
    setError(null);
    setProgress({
      step: 1,
      message: 'Ready to generate',
      status: 'pending',
    });
  };

  // ============================================================================
  // MAIN GENERATION FLOW
  // ============================================================================

  const generate = useCallback(
    async (params: DocumentGenerationParams): Promise<DocumentGenerationResult> => {
      try {
        setIsLoading(true);
        setError(null);
        resetState();

        // ==============================================================
        // STEP 1: Upload and extract source documents
        // ==============================================================
        updateProgress(1, 'Uploading source documents...', 'loading');

        const uploadResponse = await uploadSourcesMutation.mutateAsync({
          files: params.sourceFiles.map((f) => ({
            filename: f.filename,
            data: f.data,
          })),
        });

        const extractedTexts = uploadResponse.extractedTexts;
        const sourceDocuments = uploadResponse.sourceDocuments;

        if (!extractedTexts || extractedTexts.length === 0) {
          throw new Error('Failed to extract text from source documents');
        }

        updateProgress(1, `Extracted text from ${extractedTexts.length} document(s)`, 'success');

        // ==============================================================
        // STEP 2: Generate AI-powered document draft
        // ==============================================================
        updateProgress(2, 'Generating demand letter with AI...', 'loading');

        const generateResponse = await generateMutation.mutateAsync({
          templateId: params.templateId,
          templateContent: params.templateContent,
          sourceTexts: extractedTexts,
          customInstructions: params.customInstructions,
        });

        if (!generateResponse.content) {
          throw new Error('AI generation failed - empty response');
        }

        updateProgress(
          2,
          `Generated draft using ${generateResponse.model}`,
          'success'
        );

        // ==============================================================
        // STEP 3: Create and save document to Firestore
        // ==============================================================
        updateProgress(3, 'Saving document to database...', 'loading');

        const createResponse = await createDocumentMutation.mutateAsync({
          title: params.title,
          firmId: params.firmId,
          templateId: params.templateId,
          sourceDocuments,
          visibility: 'private',
          content: generateResponse.content,
        });

        if (!createResponse.documentId) {
          throw new Error('Failed to create document - no ID returned');
        }

        updateProgress(3, 'Document saved successfully', 'success');

        // ==============================================================
        // SUCCESS
        // ==============================================================
        setIsLoading(false);

        return {
          documentId: createResponse.documentId,
          content: generateResponse.content,
          model: generateResponse.model,
        };
      } catch (err) {
        const errorMessage = (err as Error).message || 'Document generation failed';
        setError(errorMessage);
        updateProgress(progress.step, errorMessage, 'error');
        setIsLoading(false);

        // Re-throw for caller to handle
        throw err;
      }
    },
    [uploadSourcesMutation, generateMutation, createDocumentMutation, progress.step]
  );

  // ============================================================================
  // RETURN STATE AND HANDLERS
  // ============================================================================

  return {
    // State
    isLoading,
    error,
    progress,

    // Actions
    generate,
    reset: resetState,

    // Helpers
    canGenerate: !isLoading && error === null,
  };
}

