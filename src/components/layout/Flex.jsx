/**
 * Flex Container Component
 * Flexible layout container with responsive properties
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';
import { GAP_SIZES } from './hooks/useGridLayout.js';

/**
 * Flex Component
 *
 * Flexible layout container with responsive direction, alignment, and spacing.
 * Complements the grid system for more complex layouts.
 *
 * @param {Object} props - Component props
 * @param {string|Object} props.direction - Flex direction or responsive object
 * @param {string|Object} props.justify - Justify content or responsive object
 * @param {string|Object} props.align - Align items or responsive object
 * @param {string|Object} props.wrap - Flex wrap or responsive object
 * @param {string} props.gap - Gap size (xs, sm, md, lg, xl)
 * @param {React.ReactNode} props.children - Flex items
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const Flex = forwardRef(({
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap = 'md',
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  // Base flex styles
  const flexStyles = {
    display: 'flex',
    flexDirection: typeof direction === 'string' ? direction : direction.xs || 'row',
    justifyContent: typeof justify === 'string' ? justify : justify.xs || 'flex-start',
    alignItems: typeof align === 'string' ? align : align.xs || 'stretch',
    flexWrap: typeof wrap === 'string' ? wrap : wrap.xs || 'nowrap',
    gap: GAP_SIZES[gap],
    ...style,
  };

  return (
    <>
      <div
        ref={ref}
        className={`flex-container ${className}`}
        style={flexStyles}
        {...props}
      >
        {children}
      </div>

      {/* Responsive flex styles */}
      <style>
        {`
          .flex-container {
            box-sizing: border-box;
          }

          ${typeof direction === 'object' ? Object.entries(direction)
      .filter(([bp]) => bp !== 'xs')
      .map(([bp, value]) => `
              @media (min-width: ${designTokens.breakpoints[bp]}) {
                .flex-container {
                  flex-direction: ${value};
                }
              }
            `).join('') : ''}

          ${typeof justify === 'object' ? Object.entries(justify)
      .filter(([bp]) => bp !== 'xs')
      .map(([bp, value]) => `
              @media (min-width: ${designTokens.breakpoints[bp]}) {
                .flex-container {
                  justify-content: ${value};
                }
              }
            `).join('') : ''}

          ${typeof align === 'object' ? Object.entries(align)
      .filter(([bp]) => bp !== 'xs')
      .map(([bp, value]) => `
              @media (min-width: ${designTokens.breakpoints[bp]}) {
                .flex-container {
                  align-items: ${value};
                }
              }
            `).join('') : ''}

          ${typeof wrap === 'object' ? Object.entries(wrap)
      .filter(([bp]) => bp !== 'xs')
      .map(([bp, value]) => `
              @media (min-width: ${designTokens.breakpoints[bp]}) {
                .flex-container {
                  flex-wrap: ${value};
                }
              }
            `).join('') : ''}
        `}
      </style>
    </>
  );
});

Flex.displayName = 'Flex';

Flex.propTypes = {
  direction: PropTypes.oneOfType([
    PropTypes.oneOf(['row', 'row-reverse', 'column', 'column-reverse']),
    PropTypes.object,
  ]),
  justify: PropTypes.oneOfType([
    PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']),
    PropTypes.object,
  ]),
  align: PropTypes.oneOfType([
    PropTypes.oneOf(['stretch', 'flex-start', 'flex-end', 'center', 'baseline']),
    PropTypes.object,
  ]),
  wrap: PropTypes.oneOfType([
    PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
    PropTypes.object,
  ]),
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Flex;
