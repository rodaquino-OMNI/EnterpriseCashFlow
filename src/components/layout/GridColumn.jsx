/**
 * Grid Column Component (Legacy Support)
 * Responsive grid column with span and offset support
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * GridColumn Component
 *
 * Legacy grid column with breakpoint-specific sizing and offset.
 * Supports both simple and responsive object-based configurations.
 *
 * @param {Object} props - Component props
 * @param {number|Object} props.span - Column span (1-12) or responsive object
 * @param {number|Object} props.offset - Column offset (0-11) or responsive object
 * @param {React.ReactNode} props.children - Column content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const GridColumn = forwardRef(({
  span = 12,
  offset = 0,
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  /**
   * Generate responsive styles for span and offset
   * @returns {Object} Inline styles and media query strings
   */
  const generateResponsiveStyles = () => {
    const styles = {};

    // Handle span
    if (typeof span === 'object') {
      Object.entries(span).forEach(([breakpoint, value]) => {
        if (breakpoint === 'xs') {
          styles.gridColumn = `span ${value}`;
        } else {
          styles[`@media (min-width: ${designTokens.breakpoints[breakpoint]})`] = {
            gridColumn: `span ${value}`,
          };
        }
      });
    } else {
      styles.gridColumn = `span ${span}`;
    }

    // Handle offset
    if (typeof offset === 'object') {
      Object.entries(offset).forEach(([breakpoint, value]) => {
        if (value > 0) {
          const mediaQuery = breakpoint === 'xs' ? '' : `@media (min-width: ${designTokens.breakpoints[breakpoint]})`;
          if (mediaQuery) {
            styles[mediaQuery] = {
              ...styles[mediaQuery],
              gridColumnStart: value + 1,
            };
          } else {
            styles.gridColumnStart = value + 1;
          }
        }
      });
    } else if (offset > 0) {
      styles.gridColumnStart = offset + 1;
    }

    return styles;
  };

  const responsiveStyles = generateResponsiveStyles();

  const columnStyles = {
    ...responsiveStyles,
    ...style,
  };

  return (
    <>
      <div
        ref={ref}
        className={`grid-column ${className}`}
        style={columnStyles}
        {...props}
      >
        {children}
      </div>

      {/* Generate responsive CSS */}
      <style>
        {`
          .grid-column {
            min-width: 0;
            box-sizing: border-box;
          }

          ${Object.entries(responsiveStyles)
      .filter(([key]) => key.startsWith('@media'))
      .map(([mediaQuery, styles]) => `
              ${mediaQuery} {
                .grid-column {
                  ${Object.entries(styles)
      .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
      .join('\n                  ')}
                }
              }
            `).join('\n          ')}
        `}
      </style>
    </>
  );
});

GridColumn.displayName = 'GridColumn';

GridColumn.propTypes = {
  span: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number,
      '2xl': PropTypes.number,
    }),
  ]),
  offset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      xs: PropTypes.number,
      sm: PropTypes.number,
      md: PropTypes.number,
      lg: PropTypes.number,
      xl: PropTypes.number,
      '2xl': PropTypes.number,
    }),
  ]),
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default GridColumn;
