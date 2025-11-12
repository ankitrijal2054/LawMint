/**
 * Responsive Utilities
 * Helper functions and constants for responsive design
 */

/**
 * Breakpoint values (matching Tailwind CSS)
 */
export const breakpoints = {
  xs: 320,      // Mobile phones
  sm: 640,      // Small phones
  md: 768,      // Tablets
  lg: 1024,     // Small laptops
  xl: 1280,     // Laptops
  '2xl': 1536,  // Large screens
} as const;

/**
 * Breakpoint keys for type safety
 */
export type Breakpoint = keyof typeof breakpoints;

/**
 * Media query helpers for CSS-in-JS
 */
export const media = {
  mobile: `@media (max-width: ${breakpoints.md - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg}px)`,
  small: `@media (max-width: ${breakpoints.sm - 1}px)`,
  medium: `@media (min-width: ${breakpoints.md}px)`,
  large: `@media (min-width: ${breakpoints.lg}px)`,
} as const;

/**
 * Check if current window width matches breakpoint
 * Usage: useMediaQuery('md') or useMediaQuery(768)
 */
export const useMediaQuery = (breakpoint: Breakpoint | number): boolean => {
  if (typeof window === 'undefined') return false;

  const breakpointValue = typeof breakpoint === 'number' 
    ? breakpoint 
    : breakpoints[breakpoint];

  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpointValue}px)`);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Handle changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpointValue]);

  return matches;
};

/**
 * Check if mobile device
 */
export const useIsMobile = (): boolean => {
  return !useMediaQuery('md');
};

/**
 * Check if tablet device
 */
export const useIsTablet = (): boolean => {
  const md = useMediaQuery('md');
  const lg = useMediaQuery('lg');
  return md && !lg;
};

/**
 * Check if desktop device
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery('lg');
};

/**
 * Common responsive Tailwind class combinations
 */
export const responsiveClasses = {
  // Padding
  containerPadding: 'px-4 md:px-6 lg:px-8',
  mobilePadding: 'p-4 md:p-6',
  desktopPadding: 'md:p-6 lg:p-8',

  // Grid layouts
  gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  gridTwoCols: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',

  // Text sizing
  textResponsive: 'text-body-sm md:text-body-md lg:text-body-lg',
  headingResponsive: 'text-h3 md:text-h2 lg:text-h1',

  // Display utilities
  hideMobile: 'hidden md:block',
  hideDesktop: 'md:hidden',
  showMobile: 'md:hidden',
  showDesktop: 'hidden md:flex',

  // Flex layouts
  flexStack: 'flex flex-col md:flex-row gap-4 md:gap-6',
  flexCenter: 'flex items-center justify-center',

  // Width utilities
  containerWidth: 'w-full max-w-7xl mx-auto',
  mobileFullWidth: 'w-full md:w-auto',
} as const;

/**
 * Get responsive font size class
 */
export const getResponsiveFontSize = (
  mobile: 'text-xs' | 'text-sm' | 'text-body-sm' | 'text-body-md',
  tablet?: 'text-body-md' | 'text-body-lg' | 'text-h3',
  desktop?: 'text-h2' | 'text-h1',
): string => {
  return `${mobile} ${tablet ? `md:${tablet}` : ''} ${desktop ? `lg:${desktop}` : ''}`.trim();
};

/**
 * Get responsive margin class
 */
export const getResponsiveMargin = (
  mobile: string,
  tablet?: string,
  desktop?: string,
): string => {
  return `${mobile} ${tablet ? `md:${tablet}` : ''} ${desktop ? `lg:${desktop}` : ''}`.trim();
};

/**
 * Get responsive padding class
 */
export const getResponsivePadding = (
  mobile: string,
  tablet?: string,
  desktop?: string,
): string => {
  return `${mobile} ${tablet ? `md:${tablet}` : ''} ${desktop ? `lg:${desktop}` : ''}`.trim();
};

/**
 * Get responsive gap class
 */
export const getResponsiveGap = (
  mobile: string,
  tablet?: string,
  desktop?: string,
): string => {
  return `${mobile} ${tablet ? `md:${tablet}` : ''} ${desktop ? `lg:${desktop}` : ''}`.trim();
};

// Re-export React for useMediaQuery to work
import * as React from 'react';

export default {
  breakpoints,
  media,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  responsiveClasses,
  getResponsiveFontSize,
  getResponsiveMargin,
  getResponsivePadding,
  getResponsiveGap,
};

