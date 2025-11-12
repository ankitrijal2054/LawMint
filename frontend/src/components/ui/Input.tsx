import React from 'react';

type InputVariant = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  inputSize?: InputSize;
}

const getVariantClasses = (variant: InputVariant): string => {
  switch (variant) {
    case 'error':
      return 'border-error bg-white text-text-DEFAULT placeholder-text-lighter focus:border-error focus:ring-error';
    case 'success':
      return 'border-success bg-white text-text-DEFAULT placeholder-text-lighter focus:border-success focus:ring-success';
    case 'default':
    default:
      return 'border-text-lighter bg-white text-text-DEFAULT placeholder-text-lighter focus:border-primary focus:ring-primary';
  }
};

const getSizeClasses = (size: InputSize): string => {
  switch (size) {
    case 'sm':
      return 'h-8 px-3 text-sm';
    case 'lg':
      return 'h-12 px-4 text-base';
    case 'md':
    default:
      return 'h-10 px-4 text-base';
  }
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = 'default', 
    inputSize = 'md', 
    label, 
    error, 
    helperText, 
    type = 'text', 
    ...props 
  }, ref) => {
    const baseClasses = 'w-full px-4 py-2 rounded-lg border-2 transition-all duration-200 font-body text-base focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variantClasses = getVariantClasses(error ? 'error' : variant);
    const sizeClasses = getSizeClasses(inputSize);
    const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className || ''}`;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-DEFAULT mb-2">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={allClasses}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-text-light">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

