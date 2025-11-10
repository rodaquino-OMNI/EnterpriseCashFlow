/**
 * Button Component - Atomic Design System
 * Accessible, customizable button with multiple variants and states
 * @version 1.0.0
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * Button variant styles using design tokens
 */
const buttonVariants = {
  primary: {
    backgroundColor: designTokens.colors.primary[500],
    color: designTokens.colors.neutral[50],
    border: `1px solid ${designTokens.colors.primary[500]}`,
    '&:hover': {
      backgroundColor: designTokens.colors.primary[600],
      borderColor: designTokens.colors.primary[600],
    },
    '&:focus': {
      backgroundColor: designTokens.colors.primary[600],
      borderColor: designTokens.colors.primary[700],
      boxShadow: `0 0 0 2px ${designTokens.colors.primary[200]}`,
    },
    '&:active': {
      backgroundColor: designTokens.colors.primary[700],
    },
  },
  secondary: {
    backgroundColor: designTokens.colors.secondary[100],
    color: designTokens.colors.secondary[700],
    border: `1px solid ${designTokens.colors.secondary[200]}`,
    '&:hover': {
      backgroundColor: designTokens.colors.secondary[200],
      borderColor: designTokens.colors.secondary[300],
    },
    '&:focus': {
      backgroundColor: designTokens.colors.secondary[200],
      borderColor: designTokens.colors.secondary[400],
      boxShadow: `0 0 0 2px ${designTokens.colors.secondary[100]}`,
    },
  },
  outline: {
    backgroundColor: 'transparent',
    color: designTokens.colors.primary[600],
    border: `1px solid ${designTokens.colors.primary[300]}`,
    '&:hover': {
      backgroundColor: designTokens.colors.primary[50],
      borderColor: designTokens.colors.primary[400],
    },
    '&:focus': {
      backgroundColor: designTokens.colors.primary[50],
      borderColor: designTokens.colors.primary[500],
      boxShadow: `0 0 0 2px ${designTokens.colors.primary[200]}`,
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: designTokens.colors.secondary[700],
    border: '1px solid transparent',
    '&:hover': {
      backgroundColor: designTokens.colors.secondary[100],
      color: designTokens.colors.secondary[800],
    },
    '&:focus': {
      backgroundColor: designTokens.colors.secondary[100],
      boxShadow: `0 0 0 2px ${designTokens.colors.secondary[200]}`,
    },
  },
  danger: {
    backgroundColor: designTokens.colors.semantic.error[500],
    color: designTokens.colors.neutral[50],
    border: `1px solid ${designTokens.colors.semantic.error[500]}`,
    '&:hover': {
      backgroundColor: designTokens.colors.semantic.error[600],
      borderColor: designTokens.colors.semantic.error[600],
    },
    '&:focus': {
      backgroundColor: designTokens.colors.semantic.error[600],
      borderColor: designTokens.colors.semantic.error[700],
      boxShadow: `0 0 0 2px ${designTokens.colors.semantic.error[200]}`,
    },
  },
};

/**
 * Button size configurations
 */
const buttonSizes = {
  sm: {
    height: designTokens.components.button.height.sm,
    padding: designTokens.components.button.padding.sm,
    fontSize: designTokens.typography.fontSize.sm[0],
    borderRadius: designTokens.borderRadius.md,
  },
  md: {
    height: designTokens.components.button.height.md,
    padding: designTokens.components.button.padding.md,
    fontSize: designTokens.typography.fontSize.base[0],
    borderRadius: designTokens.borderRadius.md,
  },
  lg: {
    height: designTokens.components.button.height.lg,
    padding: designTokens.components.button.padding.lg,
    fontSize: designTokens.typography.fontSize.lg[0],
    borderRadius: designTokens.borderRadius.lg,
  },
};

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      animation: 'spin 1s linear infinite',
      marginRight: designTokens.spacing[2],
    }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      strokeOpacity="0.25"
    />
    <path
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      strokeOpacity="0.75"
    />
  </svg>
);

/**
 * Button Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, outline, ghost, danger)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {React.ReactNode} props.icon - Icon element
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {Object} props.style - Inline styles
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.ariaDescribedBy - Accessibility description reference
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  children,
  className = '',
  onClick,
  type = 'button',
  style = {},
  ariaLabel,
  ariaDescribedBy,
  ...props
}, ref) => {
  // Combine base styles with variant and size styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    fontWeight: designTokens.typography.fontWeight.medium,
    textDecoration: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
    outline: 'none',
    position: 'relative',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
    ...buttonSizes[size],
    ...buttonVariants[variant],
  };

  // Handle click events
  const handleClick = (event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(event);
    }
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  // Determine ARIA attributes
  const ariaAttributes = {
    'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
    'aria-describedby': ariaDescribedBy,
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
    role: 'button',
    tabIndex: disabled ? -1 : 0,
  };

  return (
    <>
      {/* CSS-in-JS styles for pseudo-classes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .button-component:hover:not(:disabled) {
            background-color: ${buttonVariants[variant]['&:hover']?.backgroundColor};
            border-color: ${buttonVariants[variant]['&:hover']?.borderColor};
          }
          
          .button-component:focus:not(:disabled) {
            background-color: ${buttonVariants[variant]['&:focus']?.backgroundColor};
            border-color: ${buttonVariants[variant]['&:focus']?.borderColor};
            box-shadow: ${buttonVariants[variant]['&:focus']?.boxShadow};
          }
          
          .button-component:active:not(:disabled) {
            background-color: ${buttonVariants[variant]['&:active']?.backgroundColor};
          }
        `}
      </style>
      
      <button
        ref={ref}
        type={type}
        className={`button-component ${className}`}
        style={{ ...baseStyles, ...style }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        {...ariaAttributes}
        {...props}
      >
        {loading && <LoadingSpinner size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
        
        {icon && !loading && (
          <span 
            style={{ 
              marginRight: children ? designTokens.spacing[2] : 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </span>
        )}
        
        {children && (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {children}
          </span>
        )}
      </button>
    </>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  style: PropTypes.object,
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

export default Button;

/**
 * Button component variants for easy import
 */
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;

/**
 * Button size variants
 */
export const SmallButton = (props) => <Button size="sm" {...props} />;
export const MediumButton = (props) => <Button size="md" {...props} />;
export const LargeButton = (props) => <Button size="lg" {...props} />;