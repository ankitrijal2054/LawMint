/**
 * DashboardLayout Component
 * Professional layout for dashboard and main app pages
 * Features:
 * - Sticky top navbar with branding and user menu
 * - Responsive sidebar (hidden on mobile, visible on desktop)
 * - Main content area with consistent padding
 * - Mobile-first responsive design
 */

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navbar,
  sidebar,
  showSidebar = true,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-primary-50">
      {/* Sidebar */}
      {showSidebar && sidebar && (
        <>
          {/* Desktop Sidebar - Always visible */}
          <aside className="hidden lg:flex lg:w-64 bg-white border-r border-text-lighter/10 flex-col">
            <div className="overflow-y-auto flex-1">
              {sidebar}
            </div>
          </aside>

          {/* Mobile Sidebar - Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              {/* Sidebar Content */}
              <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-text-lighter/10 z-50 overflow-y-auto">
                {sidebar}
              </aside>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="relative z-30">
          {navbar}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-start gap-4 p-4 md:p-6 lg:p-8">
            {/* Mobile Menu Button (for sidebar) */}
            {showSidebar && sidebar && (
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/80 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {isMobileSidebarOpen ? (
                  <X size={24} className="text-text-DEFAULT" />
                ) : (
                  <Menu size={24} className="text-text-DEFAULT" />
                )}
              </button>
            )}

            {/* Main Content */}
            <div className="flex-1 w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

DashboardLayout.displayName = 'DashboardLayout';

// Sidebar Component
interface DashboardSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  children,
  className,
}) => (
  <nav className={`p-6 space-y-8 ${className || ''}`}>
    {children}
  </nav>
);

DashboardSidebar.displayName = 'DashboardSidebar';

// Sidebar Section
interface DashboardSidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSidebarSection: React.FC<DashboardSidebarSectionProps> = ({
  title,
  children,
  className,
}) => (
  <div className={`space-y-3 ${className || ''}`}>
    {title && (
      <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">
        {title}
      </h3>
    )}
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

DashboardSidebarSection.displayName = 'DashboardSidebarSection';

// Sidebar Link
interface DashboardSidebarLinkProps {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

export const DashboardSidebarLink: React.FC<DashboardSidebarLinkProps> = ({
  icon,
  label,
  href,
  onClick,
  isActive = false,
  badge,
  className,
}) => {
  const baseStyles =
    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium';
  const activeStyles = isActive
    ? 'bg-primary-50 text-primary border-l-4 border-primary'
    : 'text-text-light hover:bg-secondary-50 hover:text-text-DEFAULT';

  const content = (
    <>
      {icon && <span className="flex-shrink-0 w-5 h-5">{icon}</span>}
      <span className="flex-1">{label}</span>
      {badge && <span className="ml-auto">{badge}</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`${baseStyles} ${activeStyles} ${className || ''}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left ${baseStyles} ${activeStyles} ${className || ''}`}
    >
      {content}
    </button>
  );
};

DashboardSidebarLink.displayName = 'DashboardSidebarLink';

