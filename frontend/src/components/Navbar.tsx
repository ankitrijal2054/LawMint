/**
 * Navbar Component
 * Top navigation bar with firm info and user menu
 * Admin profile icon links to Admin Dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, LogOut, User, Menu, X, Settings } from 'lucide-react';

interface NavbarProps {
  firmName?: string;
}

export function Navbar({ firmName }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <div className="p-2 bg-gradient-to-br from-blue-600 to-amber-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 font-playfair hidden sm:inline">
              LawMint
            </span>
          </div>

          {/* Center: Firm Info (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {firmName && (
              <div className="text-center">
                <p className="text-xs text-slate-500">Firm</p>
                <p className="text-sm font-semibold text-slate-900">{firmName}</p>
              </div>
            )}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {/* User Info (Desktop) */}
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              {/* Admin: Clickable profile icon to Admin Dashboard */}
              {user?.role === 'admin' ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer"
                  title="Admin Dashboard"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
          {/* User Info (Mobile) */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Firm Info (Mobile) */}
          {firmName && (
            <div className="py-2">
              <p className="text-xs text-slate-500">Firm</p>
              <p className="text-sm font-semibold text-slate-900">{firmName}</p>
            </div>
          )}

          {/* Admin Settings Button (Mobile) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                navigate('/admin');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Dashboard</span>
            </button>
          )}

          {/* Logout Button (Mobile) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

