/**
 * AdminDashboard Page
 * Admin-only settings page for firm management, member roles, and API configuration
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirm } from '@/hooks/useFirm';
import { FirmCodeCard } from '@/components/admin/FirmCodeCard';
import { MembersListCard } from '@/components/admin/MembersListCard';
import { ApiKeyConfigCard } from '@/components/admin/ApiKeyConfigCard';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: firm } = useFirm();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>

            {/* Firm Name */}
            <div className="text-right hidden sm:block">
              <p className="text-sm text-slate-500">Firm</p>
              <p className="font-medium text-slate-900">{firm?.name || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 font-playfair">
            Firm Settings
          </h2>
          <p className="text-lg text-slate-600 mt-2">
            Manage your firm settings, team members, and AI configuration
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Firm Code Card */}
          <FirmCodeCard firmCode={firm?.firmCode} />

          {/* API Key Configuration Card */}
          <ApiKeyConfigCard />

          {/* Members List Card - Full Width */}
          <div className="lg:col-span-2">
            <MembersListCard />
          </div>
        </div>

        {/* Admin Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Logged in as:</strong> {user?.name} ({user?.email}) - Admin
          </p>
        </div>
      </main>
    </div>
  );
}
