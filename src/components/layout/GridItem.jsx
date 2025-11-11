/**
 * Grid Item Component
 * Responsive grid item with breakpoint-specific column spans
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { generateResponsiveClasses, generateBreakpointStyles } from './hooks/useGridLayout.js';

/**
 * GridItem Component
 *
 * Responsive grid item that spans columns based on breakpoint props.
 * Works within a GridContainer to create flexible grid layouts.
 *
 * @param {Object} props - Component props
 * @param {number} props.xs - Column span for xs breakpoint (1-12)
 * @param {number} props.sm - Column span for sm breakpoint (1-12)
 * @param {number} props.md - Column span for md breakpoint (1-12)
 * @param {number} props.lg - Column span for lg breakpoint (1-12)
 * @param {number} props.xl - Column span for xl breakpoint (1-12)
 * @param {React.ReactNode} props.children - Item content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const GridItem = forwardRef(({
  xs,
  sm,
  md,
  lg,
  xl,
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  // Base item styles
  const itemStyles = {
    gridColumn: xs ? `span ${xs}` : 'span 12',
    ...style,
  };

  // Generate responsive classes
  const responsiveClasses = generateResponsiveClasses({ xs, sm, md, lg, xl });

  // CSS classes
  const cssClasses = [
    'grid-item',
    responsiveClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={ref}
        className={cssClasses}
        style={itemStyles}
        {...props}
      >
        {children}
      </div>

      {/* Responsive breakpoint styles */}
      <style>
        {`
          .grid-item {
            min-width: 0;
            box-sizing: border-box;
          }

          /* Responsive breakpoint classes */
          ${generateBreakpointStyles()}
        `}
      </style>
    </>
  );
});

GridItem.displayName = 'GridItem';

GridItem.propTypes = {
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  xl: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default GridItem;
