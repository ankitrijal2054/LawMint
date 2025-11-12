import React, { useState, useEffect } from 'react';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useFirmMembers } from '../hooks/useFirmMembers';
import { useShareDocument, useDocument } from '../hooks/useDocuments';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentVisibility: 'private' | 'shared' | 'firm-wide';
  currentSharedWith: string[];
  onShareSuccess?: () => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  currentVisibility,
  currentSharedWith,
  onShareSuccess,
}) => {
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'firm-wide'>(
    currentVisibility
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(currentSharedWith);
  const [showMembersList, setShowMembersList] = useState(false);

  const { user } = useAuth();
  const { data: document } = useDocument(documentId);
  const { data: firmMembers = [], isLoading: membersLoading, error: membersError } = useFirmMembers();
  const shareDocMutation = useShareDocument(documentId);

  // Debug logging
  console.log('[ShareDocumentModal] User:', user?.uid);
  console.log('[ShareDocumentModal] Firm members data:', { count: firmMembers.length, members: firmMembers, loading: membersLoading, error: membersError });

  // Only owner can share documents
  const isOwner = document?.ownerId === user?.uid;
  const isDisabled = !isOwner || shareDocMutation.isPending;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setVisibility(currentVisibility);
      setSelectedMembers(currentSharedWith);
    }
  }, [isOpen, currentVisibility, currentSharedWith]);

  const handleVisibilityChange = (newVisibility: 'private' | 'shared' | 'firm-wide') => {
    setVisibility(newVisibility);
    if (newVisibility !== 'shared') {
      setSelectedMembers([]);
    }
  };

  const handleMemberToggle = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSave = async () => {
    try {
      await shareDocMutation.mutateAsync({
        visibility,
        sharedWith: visibility === 'shared' ? selectedMembers : [],
      });

      toast.success('Document sharing updated successfully');
      onShareSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to update document sharing');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={shareDocMutation.isPending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Ownership Warning */}
          {!isOwner && (
            <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Only the document owner can change sharing settings. You can view and edit this document.
              </p>
            </div>
          )}

          {/* Private Option */}
          <label className={`flex items-start space-x-3 p-3 border border-gray-200 rounded-lg ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
          } transition`}>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={(e) => handleVisibilityChange(e.target.value as 'private')}
              disabled={isDisabled}
              className="mt-1 w-4 h-4"
            />
            <div>
              <p className="font-medium text-gray-900">Private</p>
              <p className="text-sm text-gray-600">Only you can access this document</p>
            </div>
          </label>

          {/* Shared with Specific Users Option */}
          <label className={`flex items-start space-x-3 p-3 border border-gray-200 rounded-lg ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
          } transition`}>
            <input
              type="radio"
              name="visibility"
              value="shared"
              checked={visibility === 'shared'}
              onChange={(e) => handleVisibilityChange(e.target.value as 'shared')}
              disabled={isDisabled}
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Share with specific people</p>
              <p className="text-sm text-gray-600">Choose which firm members can access</p>

              {visibility === 'shared' && (
                <div className="mt-3">
                  {/* Dropdown Toggle */}
                  <button
                    onClick={() => setShowMembersList(!showMembersList)}
                    disabled={membersLoading || shareDocMutation.isPending}
                    className="w-full flex items-center justify-between p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-left"
                  >
                    <span className="text-sm text-gray-700">
                      {selectedMembers.length === 0
                        ? 'Select members...'
                        : `${selectedMembers.length} selected`}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transform transition ${
                        showMembersList ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>

                  {/* Members List */}
                  {showMembersList && (
                    <div className="mt-2 border border-gray-300 rounded bg-white max-h-48 overflow-y-auto">
                      {membersLoading ? (
                        <div className="p-3 text-center text-gray-500">Loading members...</div>
                      ) : membersError ? (
                        <div className="p-3 text-center text-red-600 text-sm">
                          Error loading members: {membersError instanceof Error ? membersError.message : 'Unknown error'}
                        </div>
                      ) : firmMembers.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          No other members in your firm
                        </div>
                      ) : (
                        firmMembers.map((member: any) => (
                          <label
                            key={member.uid}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.uid)}
                              onChange={() => handleMemberToggle(member.uid)}
                              disabled={shareDocMutation.isPending}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded inline-block mt-1">
                                {member.role}
                              </span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Members Display */}
                  {selectedMembers.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {firmMembers
                        .filter((m: any) => selectedMembers.includes(m.uid))
                        .map((member: any) => (
                          <div
                            key={member.uid}
                            className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
                          >
                            <span className="text-sm text-blue-900 font-medium">{member.name}</span>
                            <button
                              onClick={() => handleMemberToggle(member.uid)}
                              disabled={shareDocMutation.isPending}
                              className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </label>

          {/* Firm-Wide Option */}
          <label className={`flex items-start space-x-3 p-3 border border-gray-200 rounded-lg ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
          } transition`}>
            <input
              type="radio"
              name="visibility"
              value="firm-wide"
              checked={visibility === 'firm-wide'}
              onChange={(e) => handleVisibilityChange(e.target.value as 'firm-wide')}
              disabled={isDisabled}
              className="mt-1 w-4 h-4"
            />
            <div>
              <p className="font-medium text-gray-900">Firm-wide</p>
              <p className="text-sm text-gray-600">All members of your firm can access this</p>
            </div>
          </label>

          {/* Status Messages */}
          {shareDocMutation.error && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                {shareDocMutation.error instanceof Error
                  ? shareDocMutation.error.message
                  : 'Failed to update sharing'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={shareDocMutation.isPending}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={shareDocMutation.isPending}
            className="px-4 py-2 bg-[#1E2A78] text-white rounded hover:bg-[#2A2F65] font-medium transition disabled:opacity-50 flex items-center space-x-2"
          >
            {shareDocMutation.isPending ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

