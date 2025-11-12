import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'draft' | 'final' | 'approved';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  outline?: boolean;
  icon?: React.ReactNode;
}

const getVariantClasses = (variant: BadgeVariant, outline: boolean): string => {
  if (outline) {
    switch (variant) {
      case 'primary':
        return 'border-2 border-primary bg-transparent text-primary';
      case 'secondary':
        return 'border-2 border-secondary bg-transparent text-secondary';
      case 'accent':
        return 'border-2 border-accent bg-transparent text-accent';
      default:
        return 'border-2 border-primary bg-transparent text-primary';
    }
  }

  switch (variant) {
    case 'secondary':
      return 'bg-secondary-50 text-primary';
    case 'accent':
      return 'bg-accent-50 text-accent-dark';
    case 'success':
      return 'bg-green-50 text-green-700';
    case 'warning':
      return 'bg-yellow-50 text-yellow-700';
    case 'error':
      return 'bg-red-50 text-error';
    case 'info':
      return 'bg-blue-50 text-blue-700';
    case 'draft':
      return 'bg-amber-50 text-amber-700';
    case 'final':
      return 'bg-green-50 text-green-700';
    case 'approved':
      return 'bg-blue-50 text-blue-700';
    case 'primary':
    default:
      return 'bg-primary-50 text-primary';
  }
};

const getSizeClasses = (size: BadgeSize): string => {
  switch (size) {
    case 'sm':
      return 'px-2 py-1 text-xs';
    case 'lg':
      return 'px-4 py-2 text-base';
    case 'md':
    default:
      return 'px-3 py-1 text-sm';
  }
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    outline = false, 
    icon, 
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1 rounded-full font-medium text-sm transition-colors duration-200';
    const variantClasses = getVariantClasses(variant, outline);
    const sizeClasses = getSizeClasses(size);
    const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className || ''}`;

    return (
      <div
        className={allClasses}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

