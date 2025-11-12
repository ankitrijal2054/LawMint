import React from 'react';

type CardVariant = 'default' | 'elevated' | 'flat' | 'bordered' | 'ghost';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const getVariantClasses = (variant: CardVariant): string => {
  switch (variant) {
    case 'elevated':
      return 'shadow-lg hover:shadow-xl';
    case 'flat':
      return 'shadow-sm';
    case 'bordered':
      return 'border-2 border-primary';
    case 'ghost':
      return 'border-transparent shadow-none';
    case 'default':
    default:
      return 'shadow-md hover:shadow-lg';
  }
};

const getPaddingClasses = (padding: CardPadding): string => {
  switch (padding) {
    case 'none':
      return 'p-0';
    case 'sm':
      return 'p-4';
    case 'lg':
      return 'p-8';
    case 'md':
    default:
      return 'p-6';
  }
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const baseClasses = 'rounded-lg bg-white border border-text-lighter/20 transition-all duration-200';
    const variantClasses = getVariantClasses(variant);
    const paddingClasses = getPaddingClasses(padding);
    const allClasses = `${baseClasses} ${variantClasses} ${paddingClasses} ${className || ''}`;
    
    return (
      <div
        className={allClasses}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      className={`border-b border-text-lighter/10 pb-4 ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      className={`text-h2 font-display text-primary ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// Card Description
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      className={`text-body-md text-text-light ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      className={`pt-4 ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      className={`border-t border-text-lighter/10 pt-4 mt-4 flex gap-4 ${className || ''}`}
      ref={ref}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

