/**
 * Document Card Component
 * Displays document with title, date, owner, status, and action dropdown
 * Used in Dashboard and document list views
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteDocument, useShareDocument, Document } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  MoreVertical,
  Edit,
  Share2,
  Download,
  Trash2,
  Eye,
  Lock,
  Users,
  Building,
} from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  showOwner?: boolean;
}

export function DocumentCard({ document, showOwner = false }: DocumentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const deleteDocument = useDeleteDocument();
  const shareDocument = useShareDocument(document.id || document.documentId);

  const isOwner = document.ownerId === user?.uid;
  const isShared = document.visibility !== 'private' || document.sharedWith?.length > 0;

  // Format date
  const formatDate = (date: unknown) => {
    if (!date) return 'Recently';
    if (typeof date === 'number') {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return 'Recently';
  };

  // Get status badge color and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { bg: 'bg-amber-50', text: 'text-amber-700', label: '📝 Draft' };
      case 'final':
        return { bg: 'bg-green-50', text: 'text-green-700', label: '✓ Final' };
      case 'approved':
        return { bg: 'bg-blue-50', text: 'text-blue-700', label: '🎉 Approved' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', label: 'Unknown' };
    }
  };

  // Get visibility icon and label
  const getVisibilityInfo = () => {
    switch (document.visibility) {
      case 'private':
        return { icon: Lock, label: 'Private', color: 'text-slate-500' };
      case 'shared':
        return { icon: Users, label: 'Shared', color: 'text-blue-600' };
      case 'firm-wide':
        return { icon: Building, label: 'Firm-wide', color: 'text-green-600' };
      default:
        return { icon: Eye, label: 'Unknown', color: 'text-slate-500' };
    }
  };

  const statusBadge = getStatusBadge(document.status || 'draft');
  const visibilityInfo = getVisibilityInfo();
  const VisibilityIcon = visibilityInfo.icon;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    await deleteDocument.mutateAsync(document.id || document.documentId);
    setShowMenu(false);
  };

  const handleEdit = () => {
    navigate(`/documents/${document.id || document.documentId}`);
    setShowMenu(false);
  };

  const handleShare = () => {
    // This would trigger the share modal in the editor page
    navigate(`/documents/${document.id || document.documentId}?share=true`);
    setShowMenu(false);
  };

  const handleExport = () => {
    // Navigate to editor with export flag
    navigate(`/documents/${document.id || document.documentId}?export=true`);
    setShowMenu(false);
  };

  return (
    <div
      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
      onClick={handleEdit}
    >
      {/* Header with document info */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          {/* Document icon and title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 cursor-pointer">
                {document.title || 'Untitled Document'}
              </h3>
              {showOwner && document.ownerId && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Created by <span className="font-medium">{document.ownerId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action menu button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
            >
              <MoreVertical size={18} />
            </button>

            {/* Action menu dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                {isOwner && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                  </>
                )}
                {(isOwner || isShared) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                  >
                    <Download size={16} />
                    Export to Word
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    disabled={deleteDocument.isPending}
                  >
                    <Trash2 size={16} />
                    {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status badge */}
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </div>

          {/* Visibility badge */}
          <div className={`inline-flex items-center gap-1 text-xs ${visibilityInfo.color}`}>
            <VisibilityIcon size={14} />
            <span className="font-medium">{visibilityInfo.label}</span>
          </div>

          {/* Word count */}
          {document.metadata?.wordCount && (
            <div className="text-xs text-slate-500">
              {document.metadata.wordCount.toLocaleString()} words
            </div>
          )}
        </div>

        {/* Updated date */}
        <div className="text-xs text-slate-500 flex-shrink-0 ml-2">
          {formatDate(document.updatedAt)}
        </div>
      </div>
    </div>
  );
}

