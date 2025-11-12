/**
 * EditorLayout Component
 * Full-screen layout for document editing
 * Features:
 * - Distraction-free full-screen editing
 * - Collapsible AI refinement sidebar (desktop)
 * - Bottom toolbar for mobile
 * - Floating action buttons
 * - Responsive design (editor stack on mobile, side-by-side on desktop)
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface EditorLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  onSidebarToggle?: (isOpen: boolean) => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  header,
  sidebar,
  showSidebar = true,
  onSidebarToggle,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    onSidebarToggle?.(newState);
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-white">
      {/* Header */}
      <div className="md:hidden sticky top-0 z-40 border-b border-text-lighter/10 bg-white">
        {header}
      </div>

      {/* Editor Section */}
      <div className="flex-1 flex flex-col overflow-hidden md:border-r md:border-text-lighter/10">
        {/* Header (Desktop) */}
        <div className="hidden md:block sticky top-0 z-40 border-b border-text-lighter/10 bg-white">
          {header}
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto editor-scroll">
          {children}
        </div>
      </div>

      {/* Sidebar - Desktop */}
      {showSidebar && sidebar && (
        <>
          {/* Desktop Sidebar */}
          {isSidebarOpen && (
            <aside className="hidden md:flex md:w-80 lg:w-96 bg-secondary-50 border-l border-text-lighter/10 flex-col overflow-hidden">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-text-lighter/10">
                <h3 className="text-sm font-semibold text-text-DEFAULT">AI Refinement</h3>
                <button
                  onClick={handleToggleSidebar}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <ChevronRight size={20} className="text-text-DEFAULT" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {sidebar}
              </div>
            </aside>
          )}

          {/* Collapsed Sidebar (Desktop) */}
          {!isSidebarOpen && (
            <div className="hidden md:flex md:w-16 bg-white border-l border-text-lighter/10 flex-col items-center justify-start pt-4">
              <button
                onClick={handleToggleSidebar}
                className="p-2 hover:bg-secondary-50 rounded-lg transition-colors"
                aria-label="Open sidebar"
              >
                <ChevronLeft size={20} className="text-text-DEFAULT" />
              </button>
            </div>
          )}

          {/* Mobile Sidebar - Bottom Sheet */}
          {isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex flex-col-reverse pointer-events-none">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50 pointer-events-auto"
                onClick={handleToggleSidebar}
              />

              {/* Bottom Sheet */}
              <div className="relative bg-white max-h-96 rounded-t-2xl shadow-xl overflow-hidden pointer-events-auto">
                {/* Handle Bar */}
                <div className="flex justify-center pt-2 pb-4 border-b border-text-lighter/10">
                  <div className="w-12 h-1 bg-text-lighter rounded-full" />
                </div>

                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-4 pb-4">
                  <h3 className="text-sm font-semibold text-text-DEFAULT">AI Refinement</h3>
                  <button
                    onClick={handleToggleSidebar}
                    className="p-1.5 hover:bg-secondary-50 rounded-lg transition-colors"
                    aria-label="Close sidebar"
                  >
                    <X size={20} className="text-text-DEFAULT" />
                  </button>
                </div>

                {/* Sidebar Content */}
                <div className="overflow-y-auto max-h-80 px-4 pb-4">
                  {sidebar}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile Sidebar Toggle Button */}
      {showSidebar && sidebar && !isSidebarOpen && (
        <button
          onClick={handleToggleSidebar}
          className="md:hidden fixed bottom-6 right-6 z-30 p-3 bg-accent rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Open AI refinement sidebar"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}
    </div>
  );
};

EditorLayout.displayName = 'EditorLayout';

// Editor Header Component
interface EditorHeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  onBack?: () => void;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  editableTitle?: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onTitleChange,
  onBack,
  subtitle,
  actions,
  className,
  editableTitle = true,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== title) {
      onTitleChange?.(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className={`bg-white px-4 md:px-6 py-3 md:py-4 border-b border-text-lighter/10 ${className || ''}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 p-1.5 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} className="text-primary" />
            </button>
          )}

          <div className="min-w-0">
            {isEditingTitle && editableTitle ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="px-3 py-1 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-h2 font-display text-primary"
                />
              </div>
            ) : (
              <button
                onClick={() => editableTitle && setIsEditingTitle(true)}
                className={`text-left text-h2 md:text-h2 font-display text-primary hover:opacity-75 transition-opacity ${
                  editableTitle ? 'cursor-pointer' : ''
                }`}
              >
                {title}
              </button>
            )}
            {subtitle && <p className="text-xs md:text-sm text-text-light mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

EditorHeader.displayName = 'EditorHeader';

// Editor Content Wrapper
interface EditorContentProps {
  children: React.ReactNode;
  className?: string;
}

export const EditorContent: React.FC<EditorContentProps> = ({
  children,
  className,
}) => (
  <div className={`p-4 md:p-8 max-w-5xl mx-auto w-full ${className || ''}`}>
    {children}
  </div>
);

EditorContent.displayName = 'EditorContent';

