/**
 * NewDocument Page
 * 4-step wizard for creating AI-powered demand letters:
 * Step 1: Select template
 * Step 2: Upload source documents
 * Step 3: Add custom instructions (optional)
 * Step 4: Generate document
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TemplateSelector } from '@/components/TemplateSelector';
import { SourceDocumentUploader, UploadedFile } from '@/components/SourceDocumentUploader';
import { useGenerateDocument } from '@/hooks/useAI';
import { useUploadSources } from '@/hooks/useDocuments';
import { useCreateDocument } from '@/hooks/useDocuments';

type Step = 1 | 2 | 3 | 4;

interface StepData {
  templateId: string | null;
  templateContent: string | null;
  sourceFiles: UploadedFile[];
  customInstructions: string;
}

export const NewDocument: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [stepData, setStepData] = useState<StepData>({
    templateId: null,
    templateContent: null,
    sourceFiles: [],
    customInstructions: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Mutations
  const generateMutation = useGenerateDocument();
  const uploadSourcesMutation = useUploadSources();
  const createDocumentMutation = useCreateDocument();

  // Validation
  const isStep1Valid = stepData.templateId !== null || stepData.templateContent !== null;
  const isStep2Valid = stepData.sourceFiles.length > 0;
  const isStep3Valid = true; // Instructions are optional

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      default:
        return false;
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleTemplateSelect = (template: any) => {
    setStepData((prev) => ({
      ...prev,
      templateId: template.id || template.templateId,
      templateContent: template.content,
    }));
  };

  const handleFilesSelected = (files: UploadedFile[]) => {
    setStepData((prev) => ({
      ...prev,
      sourceFiles: files,
    }));
  };

  const handleInstructionsChange = (text: string) => {
    setStepData((prev) => ({
      ...prev,
      customInstructions: text,
    }));
  };

  const handleNextStep = () => {
    if (canProceed(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const handleGenerate = async () => {
    try {
      if (!user || !user.firmId) {
        throw new Error('User not authenticated or firm not selected');
      }

      setIsGenerating(true);

      // Step 1: Upload source documents to get extracted text
      toast.loading('Uploading source documents...');
      console.log('Step 1: Uploading sources...');
      const uploadResponse = await uploadSourcesMutation.mutateAsync({
        files: stepData.sourceFiles.map((f) => ({
          filename: f.filename,
          data: f.data,
        })),
      });

      console.log('Upload response:', uploadResponse);
      const extractedTexts = uploadResponse.extractedTexts || [];
      const sourceDocuments = uploadResponse.sourceDocuments || [];

      toast.dismiss();
      toast.loading('Generating document with AI...');

      // Step 2: Generate document using AI service
      console.log('Step 2: Generating with AI...');
      console.log('Generation inputs:', {
        templateId: stepData.templateId,
        templateContent: stepData.templateContent ? 'present' : 'missing',
        sourceTexts: extractedTexts.length,
        customInstructions: stepData.customInstructions,
      });
      
      const generateResponse = await generateMutation.mutateAsync({
        templateId: stepData.templateId || undefined,
        templateContent: stepData.templateContent || undefined,
        sourceTexts: extractedTexts,
        customInstructions: stepData.customInstructions,
      });

      console.log('Generate response:', generateResponse);
      
      // Check if content is empty - indicates backend issue
      if (!generateResponse.content || generateResponse.content.trim().length === 0) {
        console.error('AI returned empty content!');
        toast.error('AI service returned empty content. Check if ai-service is running with OPENAI_API_KEY set.');
        setIsGenerating(false);
        return;
      }
      
      toast.dismiss();
      toast.loading('Creating document...');

      // Step 3: Create document in Firestore
      console.log('Step 3: Creating document...');
      const createResponse = await createDocumentMutation.mutateAsync({
        title: `Demand Letter - ${new Date().toLocaleDateString()}`,
        firmId: user.firmId,
        templateId: stepData.templateId || undefined,
        sourceDocuments,
        visibility: 'private',
        content: generateResponse.content || '',
      });

      console.log('Create response:', createResponse);
      console.log('Document ID to navigate to:', createResponse);

      toast.dismiss();
      toast.success('Document generated successfully!');

      // Redirect to document editor
      if (createResponse && typeof createResponse === 'string') {
        console.log('Navigating to:', `/documents/${createResponse}`);
        navigate(`/documents/${createResponse}`, {
          state: { newDocument: true },
        });
      } else {
        console.error('Invalid createResponse:', createResponse);
        toast.error('Created document but could not open editor');
        setIsGenerating(false);
      }
    } catch (error) {
      setIsGenerating(false);
      toast.dismiss();
      console.error('Generation error:', error);
      toast.error((error as Error).message || 'Failed to generate document');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Create New Document
          </h1>
          <p className="mt-2 text-slate-600">
            Generate a professional demand letter using AI
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-colors ${
                      step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-sm">
            <span
              className={`font-medium ${
                currentStep === 1 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Template
            </span>
            <span
              className={`font-medium ${
                currentStep === 2 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Documents
            </span>
            <span
              className={`font-medium ${
                currentStep === 3 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Instructions
            </span>
            <span
              className={`font-medium ${
                currentStep === 4 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Generate
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          {/* Step 1: Select Template */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Select a Template
                </h2>
                <p className="text-slate-600">
                  Choose a template to structure your demand letter. You can
                  select from global templates or your firm's custom templates.
                </p>
              </div>

              <TemplateSelector
                onSelect={handleTemplateSelect}
              />
            </div>
          )}

          {/* Step 2: Upload Source Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Upload Source Documents
                </h2>
                <p className="text-slate-600">
                  Upload the source documents (contracts, complaints, evidence,
                  etc.) that the AI will use to generate the demand letter.
                </p>
              </div>

              <SourceDocumentUploader
                onFilesSelected={handleFilesSelected}
                maxFiles={10}
                maxFileSize={50}
              />

              {stepData.sourceFiles.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✓ {stepData.sourceFiles.length} file(s) ready to process.
                    The AI will extract text from these documents to generate
                    your demand letter.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Custom Instructions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Custom Instructions (Optional)
                </h2>
                <p className="text-slate-600">
                  Add specific instructions to guide the AI in generating your
                  demand letter. For example: "Make the tone more formal" or
                  "Emphasize the breach of contract."
                </p>
              </div>

              <textarea
                value={stepData.customInstructions}
                onChange={(e) => handleInstructionsChange(e.target.value)}
                placeholder="e.g., Make the language more formal and emphasize the company's liability..."
                className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              {stepData.customInstructions && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Custom instructions will be included in the generation
                    prompt.
                  </p>
                </div>
              )}

              {!stepData.customInstructions && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Custom instructions are optional. The AI will generate a
                    professional demand letter using the template and source
                    documents.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Generate */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Review & Generate
                </h2>
                <p className="text-slate-600">
                  Review your selections and click "Generate" to create your
                  demand letter using AI.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Template:</span>
                      <span className="font-medium text-slate-900">
                        {stepData.templateId ? 'Selected ✓' : 'Custom'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Source Documents:</span>
                      <span className="font-medium text-slate-900">
                        {stepData.sourceFiles.length} file(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Custom Instructions:
                      </span>
                      <span className="font-medium text-slate-900">
                        {stepData.customInstructions ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    The AI will generate a professional demand letter based on
                    your template and source documents. You'll be able to review
                    and edit the result in the document editor.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isGenerating}
            className="flex items-center gap-2 px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceed(currentStep) || isGenerating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Document'
              )}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
          <p>
            <strong>Need help?</strong> Start with a template, upload your source
            documents, and let the AI generate a professional draft. You can
            refine it afterward in the document editor.
          </p>
        </div>
      </div>
    </div>
  );
};

