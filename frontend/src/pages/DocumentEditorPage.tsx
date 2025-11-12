import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Share2,
  Download,
  ChevronLeft,
  Users,
  Trash2,
  AlertCircle,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as Y from 'yjs';

import DocumentEditor from '@/components/DocumentEditor';
import AIRefinementSidebar from '@/components/AIRefinementSidebar';
import { ShareDocumentModal } from '@/components/ShareDocumentModal';
import { ExportModal } from '@/components/ExportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocument, useUpdateDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useCollaborativeEditor } from '@/hooks/useCollaborativeEditor';

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldInitializeContent, setShouldInitializeContent] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentIdRef = useRef<string>('');

  // Data hooks
  const { data: document, isLoading } = useDocument(documentId || '');
  const { mutate: updateDocument } = useUpdateDocument(documentId || '');
  const { mutate: deleteDocument } = useDeleteDocument();
  
  // Collaborative editing hooks
  const { ydoc, isConnected, isSyncing } = useCollaborativeEditor({
    documentId: documentId || '',
    enabled: !!documentId,
  });
  const { activeUsers, getActivityStatus, getUserColor } = useCollaboration({
    documentId: documentId || '',
    enabled: !!documentId,
  });

  // When documentId changes, mark that we should initialize content
  useEffect(() => {
    if (documentId && documentId !== documentIdRef.current) {
      console.log('📄 Document ID changed, enabling initialization');
      documentIdRef.current = documentId;
      setShouldInitializeContent(true);
    }
  }, [documentId]);

  // Load document data and set it for initialization
  // IMPORTANT: Only set content state on first document load, not on every fetch
  useEffect(() => {
    if (document && shouldInitializeContent) {
      console.log('📋 Document fetched, setting initial state:', {
        id: document.id,
        title: document.title,
        contentLength: document.content?.length || 0,
      });
      
      setTitle(document.title || 'Untitled Document');
      setContent(document.content || '');
      
      // After setting initial content, disable further initializations
      // User edits should not trigger re-initialization
      setShouldInitializeContent(false);
    }
  }, [document?.id]);

  // Handle title change with debounced auto-save (silent)
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
              // Silent save - no toast needed for auto-saves
            },
            onError: (error: any) => {
              setIsSaving(false);
              // Only show error toast
              toast.error('Failed to save title');
              console.error('Save error:', error);
            },
          }
        );
      }
    }, 2000); // Save after 2 seconds of inactivity
  };

  // Handle content change (memoized to prevent editor re-renders)
  // Auto-save is silent to avoid cluttering the UI with toasts
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);

    // Debounce auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      // Call save directly instead of via handleSave to avoid dependency issues
      if (documentId && user) {
        setIsSaving(true);
        const now = new Date();

        updateDocument(
          { content: newContent },
          {
            onSuccess: () => {
              setLastSaved(now);
              setIsSaving(false);
              // Silent auto-save - only show "Saving..." indicator
            },
            onError: (error: any) => {
              setIsSaving(false);
              // Only show error toast on failure
              toast.error('Failed to save document');
              console.error('Save error:', error);
            },
          }
        );
      }
    }, 3000); // Save after 3 seconds of inactivity
  }, [documentId, user, updateDocument]);

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

  // Handle delete with confirmation
  const handleDeleteConfirm = async () => {
    if (!documentId) return;

    try {
      setIsDeleting(true);
      deleteDocument(documentId, {
        onSuccess: () => {
          toast.success('Document deleted successfully');
          navigate('/dashboard');
        },
        onError: (error: any) => {
          toast.error('Failed to delete document');
          console.error('Delete error:', error);
        },
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
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

            {/* TODO: Uncomment this after refining the UI/UX of the document editor page */}
            {/* Collaborative sync status 
            {isConnected && (
              <div className="flex items-center gap-2 text-green-600" title="Real-time collaboration active">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {isSyncing ? 'Syncing...' : 'Live'}
                </span>
              </div>
            )}*/}

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

            {/* Delete button - Owner only */}
            {isOwner && (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="p-2 hover:bg-red-100 rounded-lg transition"
              title="Delete document (Owner only)"
              disabled={isDeleting}
            >
              <Trash2 size={20} className="text-red-600" />
            </button>
            )}
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
            userName={user?.name || 'Anonymous'}
            userColor={getUserColor(user?.uid || '')}
            shouldInitializeContent={shouldInitializeContent}
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

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 bg-red-50">
              <AlertCircle size={24} className="text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Delete Document</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>"{title}"</strong>? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-500">
                This will permanently remove the document and all its data.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50 justify-end">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditorPage;

