import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-md hover:shadow-lg';
    case 'secondary':
      return 'bg-secondary text-primary hover:bg-secondary-dark focus:ring-primary shadow-sm';
    case 'accent':
      return 'bg-accent text-white hover:bg-accent-dark focus:ring-accent shadow-md hover:shadow-lg';
    case 'outline':
      return 'border-2 border-primary text-primary hover:bg-primary-50 focus:ring-primary';
    case 'ghost':
      return 'text-primary hover:bg-primary-50 focus:ring-primary';
    case 'danger':
      return 'bg-error text-white hover:bg-red-600 focus:ring-error shadow-md hover:shadow-lg';
    default:
      return '';
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-sm';
    case 'md':
      return 'h-10 px-4 text-base';
    case 'lg':
      return 'h-12 px-6 text-base';
    case 'icon':
      return 'h-10 w-10 p-0';
    default:
      return '';
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    isLoading, 
    disabled, 
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);
    const widthClasses = fullWidth ? 'w-full' : 'w-auto';
    
    const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${className || ''}`;

    return (
      <button
        className={allClasses}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

