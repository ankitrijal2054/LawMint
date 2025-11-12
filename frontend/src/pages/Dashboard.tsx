/**
 * Dashboard Page - Phase 7
 * Main authenticated view with 3 tabs for document management
 * - My Documents: Documents owned by user
 * - Shared With Me: Documents shared with user
 * - Firm Documents: All firm-wide documents
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { DocumentCard } from '@/components/DocumentCard';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDocuments, useSharedDocuments, useFirmDocuments } from '@/hooks/useDocuments';
import { FileText, Users, Plus, Settings, Loader, Search } from 'lucide-react';

type TabType = 'my-documents' | 'shared' | 'firm-wide';
type SortType = 'recent' | 'oldest' | 'alphabetical';
type StatusFilter = 'all' | 'draft' | 'final' | 'approved';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('my-documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Fetch documents for all tabs
  const { data: myDocuments = [], isLoading: myDocsLoading } = useUserDocuments(user?.uid || null);
  const { data: sharedDocuments = [], isLoading: sharedDocsLoading } = useSharedDocuments(
    user?.uid || null
  );
  const { data: firmDocuments = [], isLoading: firmDocsLoading } = useFirmDocuments(
    user?.firmId || null
  );

  // Get documents for active tab
  const getTabDocuments = () => {
    switch (activeTab) {
      case 'my-documents':
        return myDocuments;
      case 'shared':
        return sharedDocuments;
      case 'firm-wide':
        return firmDocuments;
      default:
        return [];
    }
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let docs = getTabDocuments();

    // Apply status filter
    if (statusFilter !== 'all') {
      docs = docs.filter((doc) => doc.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          (doc.metadata?.notes && doc.metadata.notes.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    const sorted = [...docs].sort((a, b) => {
      switch (sortBy) {
        case 'recent': {
          const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
          const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
          return timeB - timeA;
        }
        case 'oldest': {
          const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : 0;
          const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : 0;
          return timeA - timeB;
        }
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [activeTab, myDocuments, sharedDocuments, firmDocuments, searchQuery, sortBy, statusFilter]);

  // Get loading state for active tab
  const isLoading = () => {
    switch (activeTab) {
      case 'my-documents':
        return myDocsLoading;
      case 'shared':
        return sharedDocsLoading;
      case 'firm-wide':
        return firmDocsLoading;
      default:
        return false;
    }
  };

  // Get tab counts
  const myDocsCounts = {
    'my-documents': myDocuments.length,
    shared: sharedDocuments.length,
    'firm-wide': firmDocuments.length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* @ts-ignore */}
      <Navbar firmName={user?.firmId || 'Firm'} firmCode={user?.firmCode || ''} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-playfair">
            Welcome, {user?.name}!
          </h1>
          <p className="text-lg text-slate-600">
            Manage your demand letters and collaborate with your team.
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

          {/* Team Members 
          {user?.role === 'admin' && (
            <div className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Team Members</h3>
              <p className="text-sm text-slate-600">Manage your team</p>
            </div>
          )}*/}

          {/* Settings 
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Settings</h3>
            <p className="text-sm text-slate-600">Manage your account</p>
          </div>*/}
        </div>

        {/* Document Management Section */}
        <div className="bg-white rounded-xl shadow border border-slate-200">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('my-documents')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'my-documents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                My Documents ({myDocsCounts['my-documents']})
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'shared'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Shared With Me ({myDocsCounts.shared})
              </button>
              <button
                onClick={() => setActiveTab('firm-wide')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'firm-wide'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Firm Documents ({myDocsCounts['firm-wide']})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Will add back in later */}
              {/* Status Filter 
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="approved">Approved</option>
              </select>*/}

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="recent">Recent First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            {/* Documents List */}
            {isLoading() ? (
              <div className="flex items-center justify-center h-40">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id || doc.documentId}
                    document={doc}
                    showOwner={activeTab === 'shared' || activeTab === 'firm-wide'}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                {searchQuery || statusFilter !== 'all' ? (
                  <>
                    <p className="mb-2">No documents match your filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-2">No documents yet.</p>
                    <button
                      onClick={() => navigate('/documents/new')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Create your first document
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

