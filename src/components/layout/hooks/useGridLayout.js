/**
 * Grid Layout Utilities and Hooks
 * Shared utilities for grid system components
 * @version 2.0.0
 */

import { designTokens } from '../../../design-system/tokens.js';

/**
 * Spacing size mapping (0-10 scale)
 */
export const SPACING_MAP = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
};

/**
 * Gap size mapping for flex containers
 */
export const GAP_SIZES = {
  xs: designTokens.spacing[2],
  sm: designTokens.spacing[3],
  md: designTokens.spacing[4],
  lg: designTokens.spacing[6],
  xl: designTokens.spacing[8],
};

/**
 * Container size mapping
 */
export const CONTAINER_SIZES = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  fluid: '100%',
};

/**
 * Generate responsive CSS classes for grid breakpoints
 * @param {Object} breakpoints - Breakpoint values {xs, sm, md, lg, xl}
 * @returns {string} Space-separated CSS classes
 */
export const generateResponsiveClasses = (breakpoints = {}) => {
  const { xs, sm, md, lg, xl } = breakpoints;
  const classes = [];

  if (xs) classes.push(`xs-${xs}`);
  if (sm) classes.push(`sm-${sm}`);
  if (md) classes.push(`md-${md}`);
  if (lg) classes.push(`lg-${lg}`);
  if (xl) classes.push(`xl-${xl}`);

  return classes.join(' ');
};

/**
 * Generate responsive breakpoint styles for all column spans
 * Used in grid item components
 * @returns {string} CSS string with media queries
 */
export const generateBreakpointStyles = () => {
  return Array.from({length: 12}, (_, i) => i + 1).map(span => `
    .xs-${span} { grid-column: span ${span}; }

    @media (min-width: ${designTokens.breakpoints.sm}) {
      .sm-${span} { grid-column: span ${span}; }
    }

    @media (min-width: ${designTokens.breakpoints.md}) {
      .md-${span} { grid-column: span ${span}; }
    }

    @media (min-width: ${designTokens.breakpoints.lg}) {
      .lg-${span} { grid-column: span ${span}; }
    }

    @media (min-width: ${designTokens.breakpoints.xl}) {
      .xl-${span} { grid-column: span ${span}; }
    }
  `).join('');
};
