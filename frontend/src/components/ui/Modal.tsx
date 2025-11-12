import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeButton = true,
  size = 'md',
  className,
  overlayClassName,
  contentClassName,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClassName || 'bg-black/50'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full mx-4 ${sizeClasses[size]} ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-text-lighter/10">
            {title && <h2 className="text-h3 sm:text-h2 font-display text-primary">{title}</h2>}
            {title && !closeButton && <div className="flex-1" />}
            {closeButton && (
              <button
                onClick={onClose}
                className="ml-auto p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-text-DEFAULT" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`p-4 sm:p-6 overflow-y-auto max-h-[70vh] ${contentClassName || ''}`}>{children}</div>
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

// Modal Footer
interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      className={`flex flex-col-reverse sm:flex-row gap-3 justify-end p-4 sm:p-6 border-t border-text-lighter/10 ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

ModalFooter.displayName = 'ModalFooter';

