import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Share2,
  Download,
  ChevronLeft,
  Users,
  MoreVertical,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as Y from 'yjs';

import DocumentEditor from '@/components/DocumentEditor';
import AIRefinementSidebar from '@/components/AIRefinementSidebar';
import { ShareDocumentModal } from '@/components/ShareDocumentModal';
import { ExportModal } from '@/components/ExportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { useCollaboration } from '@/hooks/useCollaboration';

/**
 * Full-screen document editor page
 * Features:
 * - Real-time collaborative editing
 * - AI refinement sidebar
 * - Document sharing and export
 * - Presence awareness
 * - Auto-save with debouncing
 */
const DocumentEditorPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [ydoc] = useState(() => new Y.Doc());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data hooks
  const { data: document, isLoading } = useDocument(documentId || '');
  const { mutate: updateDocument } = useUpdateDocument(documentId || '');
  const { activeUsers, getActivityStatus } = useCollaboration({
    documentId: documentId || '',
    enabled: !!documentId,
  });

  // Load document on mount
  useEffect(() => {
    if (document) {
      setTitle(document.title || 'Untitled Document');
      setContent(document.content || '');
    }
  }, [document]);

  // Handle title change with debounced auto-save
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    // Debounce title save
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }

    titleTimeoutRef.current = setTimeout(() => {
      if (documentId && user && newTitle.trim()) {
        setIsSaving(true);
        const now = new Date();

        updateDocument(
          {
            // @ts-ignore
            title: newTitle.trim(),
          },
          {
            onSuccess: () => {
              setLastSaved(now);
              setIsSaving(false);
              toast.success('Title saved');
            },
            onError: (error: any) => {
              setIsSaving(false);
              console.error('Save error:', error);
            },
          }
        );
      }
    }, 2000); // Save after 2 seconds of inactivity
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Debounce auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 3000); // Save after 3 seconds of inactivity
  };

  // Save document
  const handleSave = useCallback(
    (contentToSave?: string) => {
      if (!documentId || !user) return;

      setIsSaving(true);
      const now = new Date();

      updateDocument(
        {
          content: contentToSave || content,
        },
        {
          onSuccess: () => {
            setLastSaved(now);
            setIsSaving(false);
            toast.success('Document saved');
          },
          onError: (error: any) => {
            setIsSaving(false);
            toast.error('Failed to save document');
            console.error('Save error:', error);
          },
        }
      );
    },
    [documentId, user, content, title, updateDocument]
  );

  // Handle refine
  const handleRefine = (refinedContent: string) => {
    setContent(refinedContent);
    handleSave(refinedContent);
  };

  // Handle export
  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  // Handle share
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Handle go back
  const handleGoBack = () => {
    navigate('/dashboard');
  };

  // Permission checks - allow editing for owner and shared users
  const canEdit =
    !document ||
    document.ownerId === user?.uid || // Owner can always edit
    (document.visibility === 'firm-wide') || // Anyone in firm-wide can edit
    (document.visibility === 'shared' && document.sharedWith?.includes(user?.uid || '')); // Shared members can edit

  // Owner is the document creator
  const isOwner = document?.ownerId === user?.uid;

  // Only admins and lawyers can share/export
  const canShare = isOwner;
  const canExport = isOwner;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Document not found</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-2xl font-bold text-gray-900 bg-transparent focus:outline-none focus:bg-gray-50 focus:px-2 focus:rounded transition"
                placeholder="Untitled Document"
              />
              <p className="text-sm text-gray-500">
                {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
              </p>
            </div>
          </div>

          {/* Right: Actions + Status */}
          <div className="flex items-center gap-3">
            {/* Active users indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Users size={18} className="text-gray-600" />
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.uid}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">{getActivityStatus()}</span>
            </div>

            {/* Save status */}
            {isSaving && (
              <div className="flex items-center gap-2 text-indigo-600">
                <Loader size={18} className="animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
            )}

            {/* Action buttons */}
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Save (Cmd/Ctrl + S)"
            >
              <Save size={20} className="text-gray-600" />
            </button>

            {canShare && (
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Share (Owner only)"
            >
              <Share2 size={20} className="text-gray-600" />
            </button>
            )}

            {canExport && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                title="Export to Word (Owner only)"
            >
              <Download size={18} />
              Export
            </button>
            )}

            {/* More menu */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Permissions banner */}
        {!canEdit && (
          <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2">
            <span className="text-sm text-yellow-800">
              🔒 You have read-only access to this document.
            </span>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor - 70% */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <DocumentEditor
            documentId={documentId || ''}
            initialContent={content}
            ydoc={ydoc}
            onContentChange={handleContentChange}
            readOnly={!canEdit}
          />
        </div>

        {/* AI Sidebar - 30% */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <AIRefinementSidebar
            documentId={documentId || ''}
            currentContent={content}
            onRefine={handleRefine}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Share Document Modal */}
      {document && (
        <ShareDocumentModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          documentId={documentId || ''}
          currentVisibility={document.visibility || 'private'}
          currentSharedWith={document.sharedWith || []}
          onShareSuccess={() => {
            // Optionally refresh document data here
            toast.success('Sharing settings updated');
          }}
        />
      )}

      {/* Export Document Modal */}
      {document && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          documentId={documentId || ''}
          content={content}
          documentTitle={title}
        />
      )}
    </div>
  );
};

export default DocumentEditorPage;

