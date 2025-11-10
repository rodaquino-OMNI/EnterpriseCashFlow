/**
 * Grid System - Phase 2 Composite Architecture
 * Responsive 12-column grid system with breakpoint management
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * Grid Component
 * 
 * Unified grid component that can act as both container and item
 * based on the props provided. Supports responsive breakpoints
 * and maintains compatibility with existing interfaces.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.container - Whether this is a grid container
 * @param {boolean} props.item - Whether this is a grid item
 * @param {number|string} props.spacing - Grid gap/spacing (0-10)
 * @param {number} props.xs - Column span for xs breakpoint (1-12)
 * @param {number} props.sm - Column span for sm breakpoint (1-12)
 * @param {number} props.md - Column span for md breakpoint (1-12)
 * @param {number} props.lg - Column span for lg breakpoint (1-12)
 * @param {number} props.xl - Column span for xl breakpoint (1-12)
 * @param {React.ReactNode} props.children - Grid content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const Grid = forwardRef(({
  container = false,
  item = false,
  spacing = 0,
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
  // Spacing size mapping (0-10 scale)
  const spacingMap = {
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

  // Generate responsive classes
  const generateResponsiveClasses = () => {
    const classes = [];
    
    if (xs) classes.push(`xs-${xs}`);
    if (sm) classes.push(`sm-${sm}`);
    if (md) classes.push(`md-${md}`);
    if (lg) classes.push(`lg-${lg}`);
    if (xl) classes.push(`xl-${xl}`);
    
    return classes.join(' ');
  };

  // Base styles for container
  const containerStyles = container ? {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: spacingMap[spacing] || spacingMap[0],
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${designTokens.spacing[4]}`,
    ...style,
  } : style;

  // Base styles for item
  const itemStyles = item ? {
    gridColumn: xs ? `span ${xs}` : 'span 12',
    ...style,
  } : style;

  // Determine final styles
  const finalStyles = container ? containerStyles : itemStyles;

  // Determine CSS classes
  const cssClasses = [
    container ? 'grid-container' : '',
    item ? 'grid-item' : '',
    generateResponsiveClasses(),
    className,
  ].filter(Boolean).join(' ');

  // Filter out custom props from DOM props
  const { 
    container: _container, 
    item: _item, 
    spacing: _spacing,
    xs: _xs,
    sm: _sm,
    md: _md,
    lg: _lg,
    xl: _xl,
    ...domProps 
  } = props;

  return (
    <>
      <div
        ref={ref}
        className={cssClasses}
        style={finalStyles}
        {...domProps}
      >
        {children}
      </div>
      
      {/* Responsive breakpoint styles */}
      <style>
        {`
          /* Container responsive styles */
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

          /* Item responsive styles */
          .grid-item {
            min-width: 0;
          }

          /* Responsive breakpoint classes */
          ${Array.from({length: 12}, (_, i) => i + 1).map(span => `
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
          `).join('')}
        `}
      </style>
    </>
  );
});

Grid.displayName = 'Grid';

Grid.propTypes = {
  container: PropTypes.bool,
  item: PropTypes.bool,
  spacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  xl: PropTypes.number,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

/**
 * Grid Column Component (Legacy Support)
 * 
 * Responsive grid column with breakpoint-specific sizing.
 * Supports span, offset, and responsive behavior across all breakpoints.
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
  // Generate responsive styles
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

/**
 * Flex Container Component
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
  // Gap size mapping
  const gapSizes = {
    xs: designTokens.spacing[2],
    sm: designTokens.spacing[3],
    md: designTokens.spacing[4],
    lg: designTokens.spacing[6],
    xl: designTokens.spacing[8],
  };

  // Base flex styles
  const flexStyles = {
    display: 'flex',
    flexDirection: typeof direction === 'string' ? direction : direction.xs || 'row',
    justifyContent: typeof justify === 'string' ? justify : justify.xs || 'flex-start',
    alignItems: typeof align === 'string' ? align : align.xs || 'stretch',
    flexWrap: typeof wrap === 'string' ? wrap : wrap.xs || 'nowrap',
    gap: gapSizes[gap],
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

/**
 * Container Component
 * 
 * Responsive container with consistent max-widths and padding.
 * Provides consistent content boundaries across the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Container size (sm, md, lg, xl, fluid)
 * @param {React.ReactNode} props.children - Container content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export const Container = forwardRef(({
  size = 'lg',
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  // Container size mapping
  const containerSizes = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    fluid: '100%',
  };

  const containerStyles = {
    width: '100%',
    maxWidth: containerSizes[size],
    margin: '0 auto',
    padding: `0 ${designTokens.spacing[4]}`,
    ...style,
  };

  return (
    <>
      <div
        ref={ref}
        className={`container ${className}`}
        style={containerStyles}
        {...props}
      >
        {children}
      </div>
      
      <style>
        {`
          @media (max-width: ${designTokens.breakpoints.sm}) {
            .container {
              padding: 0 ${designTokens.spacing[3]};
            }
          }
        `}
      </style>
    </>
  );
});

Container.displayName = 'Container';

Container.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'fluid']),
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Grid;