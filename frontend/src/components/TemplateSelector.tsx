/**
 * TemplateSelector Component
 * Dropdown/Modal for selecting templates from global and firm templates
 */

import { useState } from 'react';
import { useAllTemplates, Template } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, Eye, X } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  isDisabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  isDisabled = false,
}) => {
  const { user } = useAuth();
  const { templates, isLoading, error } = useAllTemplates(user?.firmId || null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    onSelect(template);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled || isLoading}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="text-gray-700">
          {selectedTemplate ? selectedTemplate.name : 'Select a template...'}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Loading templates...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-red-500 text-sm">
              Failed to load templates
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredTemplates.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'No templates found' : 'No templates available'}
            </div>
          )}

          {/* Template List */}
          {!isLoading && !error && (
            <div className="max-h-80 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => handleSelectTemplate(template)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <p className="font-medium text-gray-900 truncate">
                        {template.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <span className={`px-2 py-1 rounded ${
                          template.type === 'global'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {template.type === 'global' ? 'Global' : 'Firm'}
                        </span>
                        <span>{template.metadata.fileType.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="bg-white p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono text-xs">
                  {previewTemplate.content.substring(0, 2000)}
                  {previewTemplate.content.length > 2000 ? '\n\n[... content truncated ...]' : ''}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

