import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string | number) => void;
  align?: 'left' | 'right';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onSelect,
  align = 'left',
  className,
  triggerClassName,
  menuClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: string | number) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className || ''}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute top-full mt-1 w-48 bg-white border border-text-lighter/20 rounded-lg shadow-lg z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName || ''}`}
        >
          <div className="py-1">
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.divider ? (
                  <div className="h-px bg-text-lighter/10 my-1" />
                ) : (
                  <button
                    onClick={() => handleSelect(item.id)}
                    disabled={item.disabled}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                      item.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : item.variant === 'danger'
                          ? 'text-error hover:bg-red-50'
                          : 'text-text-DEFAULT hover:bg-primary-50'
                    }`}
                  >
                    {item.icon && <span className="flex items-center">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-DEFAULT mb-2">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-4 py-2 rounded-lg border-2 ${
              error
                ? 'border-error focus:border-error'
                : 'border-text-lighter focus:border-primary'
            } bg-white text-text-DEFAULT appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              error ? 'focus:ring-error' : 'focus:ring-primary'
            } ${className || ''}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none"
          />
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

