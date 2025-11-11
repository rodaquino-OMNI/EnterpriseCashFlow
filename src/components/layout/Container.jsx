/**
 * Container Component
 * Responsive container with consistent max-widths and padding
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';
import { CONTAINER_SIZES } from './hooks/useGridLayout.js';

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
  const containerStyles = {
    width: '100%',
    maxWidth: CONTAINER_SIZES[size],
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
          .container {
            box-sizing: border-box;
          }

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

export default Container;
