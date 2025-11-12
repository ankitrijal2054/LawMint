/**
 * ExportModal Component
 * Modal dialog for exporting documents to DOCX format
 * Displays export confirmation, progress, and handles download
 */

import { useState } from 'react';
import { useDocumentExport } from '@/hooks/useDocumentExport';
import { X } from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  content: string;
  documentTitle: string;
}

export function ExportModal({
  isOpen,
  onClose,
  documentId,
  content,
  documentTitle,
}: ExportModalProps) {
  const { isLoading, error, exportDocument } = useDocumentExport();
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    const success = await exportDocument({
      documentId,
      content,
      title: documentTitle,
    });

    if (success) {
      setShowSuccess(true);
      // Close modal after success animation
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 1500);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setShowSuccess(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Export Document</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {showSuccess ? (
              // Success state
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Export Successful!</h3>
                <p className="text-gray-600 mb-4">Your document has been converted to DOCX format and is ready to download.</p>
              </div>
            ) : (
              // Confirmation state
              <>
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Export <span className="font-semibold">"{documentTitle}"</span> to Word (DOCX) format?
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-medium mb-2">Professional formatting will be applied:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Font: Times New Roman, 11pt</li>
                      <li>Line spacing: 1.5</li>
                      <li>Margins: 1 inch all sides</li>
                    </ul>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">
                    <p className="font-medium mb-1">Export Error</p>
                    <p>{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showSuccess ? 'Close' : 'Cancel'}
            </button>
            {!showSuccess && (
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

