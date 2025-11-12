import React, { useState, useEffect } from 'react';
import { Wand2, Send, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRefineDocument } from '@/hooks/useAI';

interface RefinementRequest {
  id: string;
  instructions: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  originalContent?: string;
  refinedContent?: string;
}

interface AIRefinementSidebarProps {
  documentId: string;
  currentContent: string;
  onRefine?: (refinedContent: string) => void;
  disabled?: boolean;
}

/**
 * Sidebar component for AI-powered document refinement
 * Users can provide custom instructions to improve document content
 * Features: Real-time refinement, history tracking, error handling
 */
export const AIRefinementSidebar: React.FC<AIRefinementSidebarProps> = ({
  documentId,
  currentContent,
  onRefine,
  disabled = false,
}) => {
  const [instructions, setInstructions] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<RefinementRequest[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RefinementRequest | null>(null);

  const { mutate: refineDocument, isPending } = useRefineDocument();

  // Handle refinement request
  const handleRefine = async () => {
    if (!instructions.trim()) {
      toast.error('Please enter refinement instructions');
      return;
    }

    const requestId = Date.now().toString();
    const newRequest: RefinementRequest = {
      id: requestId,
      instructions: instructions.trim(),
      timestamp: new Date(),
      status: 'pending',
      originalContent: currentContent,
    };

    // Add to history immediately
    setRefinementHistory((prev) => [newRequest, ...prev]);
    setInstructions('');

    // Call API with correct parameter names
    refineDocument(
      {
        content: currentContent,
        refinementInstructions: newRequest.instructions,
      },
      {
        onSuccess: (response) => {
          const refinedContent = response.content || '';

          setRefinementHistory((prev) =>
            prev.map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    status: 'success',
                    refinedContent,
                  }
                : req
            )
          );

          if (onRefine) {
            onRefine(refinedContent);
          }

          toast.success('Document refined successfully');
        },
        onError: (error: any) => {
          const errorMessage = error.message || 'Failed to refine document';

          setRefinementHistory((prev) =>
            prev.map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    status: 'error',
                    errorMessage,
                  }
                : req
            )
          );

          toast.error(errorMessage);
        },
      }
    );
  };

  // Handle accepting refinement (silent - no toast needed)
  const handleAcceptRefinement = (request: RefinementRequest) => {
    if (request.refinedContent && onRefine) {
      onRefine(request.refinedContent);
      // Silent action - already shows in refinement history UI
    }
  };

  // Handle rejecting refinement (silent - no toast needed)
  const handleRejectRefinement = (requestId: string) => {
    setRefinementHistory((prev) => prev.filter((req) => req.id !== requestId));
    // Silent action - already shows in refinement history UI
  };

  // Clear history
  const handleClearHistory = () => {
    setRefinementHistory([]);
  };

  const pendingCount = refinementHistory.filter((r) => r.status === 'pending').length;
  const successCount = refinementHistory.filter((r) => r.status === 'success').length;

  return (
    <div className="h-full bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <Wand2 size={18} className="text-white" />
            </div>
            <h2 className="font-display text-lg font-semibold text-gray-900">AI Refine</h2>
          </div>
          {/* <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            {isExpanded ? (
              <X size={20} className="transform rotate-90" />
            ) : (
              <Wand2 size={20} />
            )}
          </button>*/}
        </div>
      </div>

      {isExpanded ? (
        <>
          {/* Input area */}
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                Refinement Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Make this more formal, add more detail about liability, use simpler language..."
                disabled={disabled || isPending}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRefine}
                disabled={disabled || isPending || !instructions.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition transform hover:scale-105 disabled:hover:scale-100"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Refine
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setInstructions('');
                  setSelectedRequest(null);
                }}
                disabled={!instructions.trim()}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold text-indigo-600">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-semibold text-green-600">{successCount}</span>
                </div>
              </div>
            </div>

            {/* Refinement history */}
            {refinementHistory.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    History
                  </h3>
                  {refinementHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-gray-500 hover:text-gray-700 transition"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {refinementHistory.map((request) => (
                    <div
                      key={request.id}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedRequest?.id === request.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setSelectedRequest(
                          selectedRequest?.id === request.id ? null : request
                        )
                      }
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {request.status === 'pending' && (
                            <Clock size={14} className="text-yellow-500 animate-spin" />
                          )}
                          {request.status === 'success' && (
                            <CheckCircle2 size={14} className="text-green-500" />
                          )}
                          {request.status === 'error' && (
                            <AlertCircle size={14} className="text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 line-clamp-2">
                            {request.instructions}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {request.timestamp.toLocaleTimeString()}
                          </p>
                          {request.status === 'error' && request.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{request.errorMessage}</p>
                          )}
                        </div>
                      </div>

                      {/* Details when expanded */}
                      {selectedRequest?.id === request.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {request.status === 'success' && request.refinedContent && (
                            <>
                              <p className="text-xs font-semibold text-gray-700">Result:</p>
                              <div className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded p-2">
                                <p className="text-xs text-gray-600 line-clamp-6">
                                  {request.refinedContent}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptRefinement(request)}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-2 rounded transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectRefinement(request.id)}
                                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs font-semibold py-1 px-2 rounded transition"
                                >
                                  Reject
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer tip */}
          <div className="p-4 bg-white border-t border-gray-200 text-xs text-gray-600">
            💡 <strong>Tip:</strong> Be specific with your instructions for better results.
          </div>
        </>
      ) : (
        /* Collapsed state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-2">{refinementHistory.length}</div>
            <p className="text-xs text-gray-600">refinements</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRefinementSidebar;

