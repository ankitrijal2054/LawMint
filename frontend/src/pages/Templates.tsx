/**
 * Templates Page
 * Central hub for viewing, uploading, and managing templates
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useGlobalTemplates,
  useFirmTemplates,
  useDownloadTemplate,
  useDeleteTemplate,
  Template,
} from '@/hooks/useTemplates';
import { TemplateCard } from '@/components/TemplateCard';
import { UploadTemplateModal } from '@/components/UploadTemplateModal';
import { Upload, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'global' | 'firm';

export const Templates = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Queries
  const globalTemplatesQuery = useGlobalTemplates();
  const firmTemplatesQuery = useFirmTemplates(user?.firmId || null);
  const downloadMutation = useDownloadTemplate();
  const deleteMutation = useDeleteTemplate();

  // Determine if user is admin or lawyer (can upload/delete)
  const canUploadTemplate = user?.role === 'admin' || user?.role === 'lawyer';

  // Get current tab data
  const isGlobalTab = activeTab === 'global';
  const currentQuery = isGlobalTab ? globalTemplatesQuery : firmTemplatesQuery;
  const templates = currentQuery.data || [];

  const handleDownload = (templateId: string, firmId?: string) => {
    downloadMutation.mutate({ templateId, firmId });
  };

  const handleDelete = (templateId: string) => {
    deleteMutation.mutate(templateId);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  // Render preview modal
  const renderPreviewModal = () => {
    if (!previewTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-screen overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{previewTemplate.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {previewTemplate.metadata.fileType.toUpperCase()} •{' '}
                {new Date(previewTemplate.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setPreviewTemplate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="bg-white p-6 rounded-lg border border-gray-200 font-mono text-sm">
              <p className="text-gray-700 whitespace-pre-wrap">{previewTemplate.content}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleDownload(previewTemplate.id, previewTemplate.firmId);
                setPreviewTemplate(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-600 mt-2">
                Manage your demand letter templates
              </p>
            </div>
            {canUploadTemplate && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Upload size={20} />
                Upload Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[104px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'global'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Global Templates ({globalTemplatesQuery.data?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('firm')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'firm'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Firm Templates ({firmTemplatesQuery.data?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {currentQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-600 mr-2" size={24} />
            <p className="text-gray-600">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {currentQuery.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">Failed to load templates</p>
            <p className="text-red-600 text-sm mt-1">
              {currentQuery.error?.message || 'Please try again later'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!currentQuery.isLoading &&
          !currentQuery.isError &&
          templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900">
                No {isGlobalTab ? 'global' : 'firm'} templates yet
              </h3>
              <p className="text-gray-600 mt-2">
                {isGlobalTab
                  ? 'System templates will appear here'
                  : 'Upload your first template to get started'}
              </p>
              {!isGlobalTab && canUploadTemplate && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Upload Template
                </button>
              )}
            </div>
          )}

        {/* Template Grid */}
        {!currentQuery.isLoading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onPreview={handlePreview}
                isDeleting={deleteMutation.isPending}
                canDelete={
                  canUploadTemplate && template.type === 'firm-specific'
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadTemplateModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
};

