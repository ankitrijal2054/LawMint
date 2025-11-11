/**
 * Navbar Component
 * Top navigation bar with firm info and user menu
 * Shows firm code for admins, firm name for all users
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, LogOut, User, Menu, X, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
  firmName?: string;
  firmCode?: string;
}

export function Navbar({ firmName, firmCode }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCopyFirmCode = () => {
    if (firmCode) {
      navigator.clipboard.writeText(firmCode);
      setCopied(true);
      toast.success('Firm code copied!');
      setTimeout(() => setCopied(false), 2000);
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
            {firmCode && user?.role === 'admin' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-left">
                  <p className="text-xs text-slate-500">Firm Code</p>
                  <p className="text-sm font-mono font-semibold text-blue-600">{firmCode}</p>
                </div>
                <button
                  onClick={handleCopyFirmCode}
                  className="ml-2 p-1 hover:bg-blue-200 rounded transition-colors"
                  title="Copy firm code"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
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

          {firmCode && user?.role === 'admin' && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-xs text-slate-500">Firm Code</p>
                <p className="text-sm font-mono font-semibold text-blue-600">{firmCode}</p>
              </div>
              <button
                onClick={handleCopyFirmCode}
                className="p-1 hover:bg-blue-200 rounded transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
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

