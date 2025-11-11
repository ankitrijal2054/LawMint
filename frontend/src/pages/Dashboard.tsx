/**
 * Dashboard Page
 * Main authenticated view showing user's documents and firm info
 * Placeholder for Phase 2+ features
 */

import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDocuments } from '@/hooks/useDocuments';
import { FileText, Users, Plus, Settings, Loader, ChevronRight } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: documents = [], isLoading: docsLoading } = useUserDocuments(user?.uid || null);

  // Get recent documents (sorted by updatedAt, limit 5)
  const recentDocuments = documents
    .sort((a, b) => {
      const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
      const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar firmName="Your Firm" firmCode="STENO-ABCDE" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-playfair">
            Welcome, {user?.name}!
          </h1>
          <p className="text-lg text-slate-600">
            {user?.role === 'admin'
              ? 'You are the administrator of your firm. Manage templates, documents, and team members below.'
              : 'Start creating and collaborating on demand letters with your team.'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* New Document */}
          <div
            onClick={() => navigate('/documents/new')}
            className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">New Document</h3>
            <p className="text-sm text-slate-600">Create a new demand letter</p>
          </div>

          {/* Browse Templates */}
          <div
            onClick={() => navigate('/templates')}
            className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Templates</h3>
            <p className="text-sm text-slate-600">Browse firm templates</p>
          </div>

          {/* Team Members */}
          {user?.role === 'admin' && (
            <div className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Team Members</h3>
              <p className="text-sm text-slate-600">Manage your team</p>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Settings</h3>
            <p className="text-sm text-slate-600">Manage your account</p>
          </div>
        </div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Documents */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Recent Documents</h2>
              {documents.length > 5 && (
                <button
                  onClick={() => navigate('/dashboard?tab=documents')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View all <ChevronRight size={16} />
                </button>
              )}
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : recentDocuments.length > 0 ? (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id || doc.documentId}
                    onClick={() => navigate(`/documents/${doc.id || doc.documentId}`)}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.status === 'draft' && '📝 Draft'}
                          {doc.status === 'final' && '✅ Final'}
                          {doc.status === 'approved' && '🎉 Approved'}
                          {' • '}
                          {doc.metadata?.wordCount || 0} words
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 ml-4 flex-shrink-0">
                      {doc.updatedAt && typeof doc.updatedAt === 'number'
                        ? new Date(doc.updatedAt).toLocaleDateString()
                        : 'Recently'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500">
                <p>No documents yet. Create your first document to get started!</p>
              </div>
            )}
          </div>

          {/* Firm Stats */}
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Firm Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">Team Members</p>
                <p className="text-2xl font-bold text-blue-600">1</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-600">Documents</p>
                <p className="text-2xl font-bold text-green-600">{documents.length}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-600">Templates</p>
                <p className="text-2xl font-bold text-amber-600">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2+ Notice */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 Coming Soon</h3>
          <p className="text-blue-800">
            Phase 2 will bring full document management, real-time collaboration, AI generation, and more.
            Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}

