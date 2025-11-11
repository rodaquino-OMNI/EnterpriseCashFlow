/**
 * Grid Container Component
 * Responsive 12-column grid container with breakpoint management
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';
import { SPACING_MAP } from './hooks/useGridLayout.js';

/**
 * GridContainer Component
 *
 * 12-column grid container with responsive spacing and breakpoints.
 * Provides the foundational grid structure for child items.
 *
 * @param {Object} props - Component props
 * @param {number|string} props.spacing - Grid gap/spacing (0-10)
 * @param {React.ReactNode} props.children - Grid items
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const GridContainer = forwardRef(({
  spacing = 0,
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  // Container styles
  const containerStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: SPACING_MAP[spacing] || SPACING_MAP[0],
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${designTokens.spacing[4]}`,
    ...style,
  };

  // CSS classes
  const cssClasses = ['grid-container', className].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={ref}
        className={cssClasses}
        style={containerStyles}
        {...props}
      >
        {children}
      </div>

      {/* Responsive container styles */}
      <style>
        {`
          .grid-container {
            box-sizing: border-box;
          }

          @media (max-width: ${designTokens.breakpoints.sm}) {
            .grid-container {
              padding: 0 ${designTokens.spacing[3]};
            }
          }

          @media (min-width: ${designTokens.breakpoints.lg}) {
            .grid-container {
              max-width: 1400px;
            }
          }

          @media (min-width: ${designTokens.breakpoints.xl}) {
            .grid-container {
              max-width: 1600px;
            }
          }
        `}
      </style>
    </>
  );
});

GridContainer.displayName = 'GridContainer';

GridContainer.propTypes = {
  spacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default GridContainer;
