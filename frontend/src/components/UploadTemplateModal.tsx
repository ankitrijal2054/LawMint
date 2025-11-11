/**
 * UploadTemplateModal Component
 * Modal for uploading new templates (PDF/DOCX)
 */

import { useState } from 'react';
import { useUploadTemplate } from '@/hooks/useTemplates';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const uploadMutation = useUploadTemplate();
  const [templateName, setTemplateName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];

    const isValidType = validTypes.includes(file.type);
    const isValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValidType && !isValidExtension) {
      toast.error('Only PDF and DOCX files are supported');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1];
        if (!base64) {
          toast.error('Failed to read file');
          return;
        }

        await uploadMutation.mutateAsync({
          templateName: templateName.trim(),
          fileName: selectedFile.name,
          fileData: base64,
        });

        // Reset form on success
        setTemplateName('');
        setSelectedFile(null);
        onClose();
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Upload Template</h2>
          <button
            onClick={onClose}
            disabled={uploadMutation.isPending}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Generic Demand Letter"
              disabled={uploadMutation.isPending}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template File (PDF or DOCX) *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                accept=".pdf,.docx"
                disabled={uploadMutation.isPending}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer block"
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse (max 50MB)
                </p>
              </label>
            </div>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-medium">File selected:</p>
              <p>{selectedFile.name}</p>
              <p className="text-xs mt-1 opacity-75">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {/* Error Message */}
          {uploadMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {uploadMutation.error?.message || 'Failed to upload template'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !templateName.trim() || !selectedFile}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin">⏳</div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

