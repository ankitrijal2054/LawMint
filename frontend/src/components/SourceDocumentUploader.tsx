/**
 * SourceDocumentUploader Component
 * Drag-and-drop file upload for source documents (PDF/DOCX)
 * Handles file validation, preview, and base64 encoding
 */

import { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

export interface UploadedFile {
  filename: string;
  data: string; // base64 encoded
  size: number;
  type: 'pdf' | 'docx';
}

interface SourceDocumentUploaderProps {
  onFilesSelected?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

export const SourceDocumentUploader: React.FC<SourceDocumentUploaderProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getFileType = (filename: string): 'pdf' | 'docx' | null => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const type = getFileType(file.name);
    if (!type) {
      return {
        valid: false,
        error: 'Only PDF and DOCX files are supported',
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return {
        valid: false,
        error: `File exceeds ${maxFileSize}MB limit`,
      };
    }

    // Check for duplicates
    if (files.some((f) => f.filename === file.name)) {
      return {
        valid: false,
        error: 'This file is already uploaded',
      };
    }

    return { valid: true };
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 from data URL
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);

      // Check total file count
      if (files.length + fileList.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(`${file.name}: ${validation.error}`);
          continue;
        }

        try {
          // Encode file as base64
          const base64Data = await encodeFileAsBase64(file);
          const type = getFileType(file.name);

          newFiles.push({
            filename: file.name,
            data: base64Data,
            size: file.size,
            type: type!,
          });
        } catch (err) {
          setError(`Failed to process ${file.name}`);
          console.error('File encoding error:', err);
        }
      }

      // Update files list
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);

      // Call callback
      if (onFilesSelected) {
        onFilesSelected(updatedFiles);
      }
    },
    [files, maxFiles, onFilesSelected]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveFile = (filename: string) => {
    const updatedFiles = files.filter((f) => f.filename !== filename);
    setFiles(updatedFiles);
    if (onFilesSelected) {
      onFilesSelected(updatedFiles);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          onChange={handleInputChange}
          className="hidden"
          id="file-input"
        />

        <label htmlFor="file-input" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Upload
              className={`w-10 h-10 transition-colors ${
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            <div className="text-center">
              <p className="font-medium text-gray-700">
                Drag and drop files here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse your computer
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported: PDF, DOCX (Max {maxFileSize}MB each, up to {maxFiles} files)
            </p>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.filename}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} •{' '}
                      {file.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.filename)}
                  className="flex-shrink-0 p-1 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && !error && (
        <p className="text-sm text-gray-500 text-center py-2">
          No files uploaded yet
        </p>
      )}
    </div>
  );
};

