/**
 * TemplateCard Component
 * Displays template information with actions
 */

import { Template } from '@/hooks/useTemplates';
import { Download, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface TemplateCardProps {
  template: Template;
  onDelete?: (templateId: string) => void;
  onDownload?: (templateId: string, firmId?: string) => void;
  onPreview?: (template: Template) => void;
  isDeleting?: boolean;
  canDelete?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onDelete,
  onDownload,
  onPreview,
  isDeleting = false,
  canDelete = false,
}) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this template?')) {
      onDelete?.(template.id);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    onDownload?.(template.id, template.firmId);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onPreview) {
      onPreview(template);
    } else {
      setShowPreview(!showPreview);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {template.metadata.fileType.toUpperCase()} • {formatFileSize(template.metadata.size)}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            template.type === 'global'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {template.type === 'global' ? 'Global' : 'Firm'}
          </span>
        </div>
      </div>

      {/* Content Preview */}
      {showPreview && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Preview:</p>
          <div className="max-h-32 overflow-y-auto bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-700 line-clamp-6 whitespace-pre-wrap">
              {template.content.substring(0, 500)}
              {template.content.length > 500 ? '...' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="p-4 text-xs text-gray-600 space-y-1">
        <p>📅 Uploaded: {formatDate(template.createdAt)}</p>
        <p>👤 By: {template.metadata.uploadedBy === 'system' ? 'System' : 'Team Member'}</p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
        <button
          onClick={handlePreview}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Preview"
          disabled={isDeleting}
        >
          <Eye size={16} />
        </button>

        <button
          onClick={handleDownload}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          title="Download"
          disabled={isDeleting}
        >
          <Download size={16} />
        </button>

        {canDelete && template.type === 'firm-specific' && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <div className="animate-spin">⏳</div>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

