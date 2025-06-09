/**
 * FormField Component - Atomic Design System
 * Accessible form field wrapper with validation and error handling
 * @version 1.0.0
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * FormField Component
 * 
 * Provides a complete form field with label, input, validation, and accessibility features.
 * Follows WCAG 2.1 AA guidelines for form accessibility.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Field label text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message to display
 * @param {string} props.hint - Helper text to display
 * @param {React.ReactElement} props.children - Input element to wrap
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.labelClassName - Additional CSS classes for label
 * @param {boolean} props.inline - Whether to display label inline
 * @param {string} props.size - Field size (sm, md, lg)
 */
const FormField = ({
  label,
  required = false,
  error = null,
  hint = null,
  children,
  className = '',
  labelClassName = '',
  inline = false,
  size = 'md',
  ...props
}) => {
  // Generate unique IDs for accessibility
  const fieldId = useId();
  const errorId = useId();
  const hintId = useId();

  // Build aria-describedby attribute
  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null
  ].filter(Boolean).join(' ');

  // Base styles for the container
  const containerStyles = {
    display: inline ? 'flex' : 'block',
    alignItems: inline ? 'center' : 'stretch',
    gap: inline ? designTokens.spacing[3] : designTokens.spacing[2],
    marginBottom: inline ? 0 : designTokens.spacing[4],
    fontFamily: designTokens.typography.fontFamily.sans.join(', ')
  };

  // Label styles
  const labelStyles = {
    display: 'block',
    fontSize: size === 'sm' ? designTokens.typography.fontSize.sm[0] : 
              size === 'lg' ? designTokens.typography.fontSize.lg[0] : 
              designTokens.typography.fontSize.base[0],
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.secondary[700],
    marginBottom: inline ? 0 : designTokens.spacing[1],
    lineHeight: designTokens.typography.lineHeight.normal,
    cursor: 'pointer',
    userSelect: 'none',
    minWidth: inline ? 'auto' : 'unset',
    flexShrink: inline ? 0 : 'unset'
  };

  // Required indicator styles
  const requiredStyles = {
    color: designTokens.colors.semantic.error[500],
    marginLeft: designTokens.spacing[1],
    fontSize: 'inherit',
    fontWeight: 'inherit'
  };

  // Hint text styles
  const hintStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.secondary[500],
    marginTop: designTokens.spacing[1],
    lineHeight: designTokens.typography.lineHeight.normal
  };

  // Error message styles
  const errorStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.semantic.error[600],
    marginTop: designTokens.spacing[1],
    lineHeight: designTokens.typography.lineHeight.normal,
    fontWeight: designTokens.typography.fontWeight.medium,
    display: 'flex',
    alignItems: 'flex-start',
    gap: designTokens.spacing[1]
  };

  // Error icon component
  const ErrorIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        flexShrink: 0, 
        marginTop: '1px',
        color: designTokens.colors.semantic.error[500]
      }}
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1"/>
      <path
        d="M12 8v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Clone the child element with accessibility props
  const enhancedChild = React.isValidElement(children) 
    ? React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : 'false',
        'aria-errormessage': error ? errorId : undefined,
        className: `${children.props.className || ''} ${error ? 'field-error' : ''}`.trim()
      })
    : children;

  return (
    <div 
      className={`form-field ${className}`}
      style={containerStyles}
      {...props}
    >
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={`form-field-label ${labelClassName}`}
        style={labelStyles}
      >
        {label}
        {required && (
          <span 
            style={requiredStyles}
            aria-label="required"
            title="This field is required"
          >
            *
          </span>
        )}
      </label>

      {/* Input wrapper for non-inline layout */}
      <div style={{ flex: inline ? 1 : 'unset' }}>
        {/* Hint text (before input) */}
        {hint && (
          <div
            id={hintId}
            style={hintStyles}
            className="form-field-hint"
          >
            {hint}
          </div>
        )}

        {/* Enhanced input element */}
        {enhancedChild}

        {/* Error message */}
        {error && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            style={errorStyles}
            className="form-field-error"
          >
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* CSS for error state styling */}
      <style>
        {`
          .field-error {
            border-color: ${designTokens.colors.semantic.error[500]} !important;
            box-shadow: 0 0 0 1px ${designTokens.colors.semantic.error[500]} !important;
          }
          
          .field-error:focus {
            border-color: ${designTokens.colors.semantic.error[600]} !important;
            box-shadow: 0 0 0 2px ${designTokens.colors.semantic.error[200]} !important;
          }
          
          .form-field-label:hover {
            color: ${designTokens.colors.secondary[800]};
          }
          
          .form-field-hint {
            transition: color ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']};
          }
          
          .form-field-error {
            animation: slideIn ${designTokens.animation.duration[200]} ${designTokens.animation.easing.out};
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.element.isRequired,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  inline: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

/**
 * FormFieldGroup Component
 * Groups multiple form fields with consistent spacing
 */
export const FormFieldGroup = ({ 
  children, 
  className = '', 
  spacing = 'md',
  ...props 
}) => {
  const spacingMap = {
    sm: designTokens.spacing[3],
    md: designTokens.spacing[4],
    lg: designTokens.spacing[6]
  };

  const groupStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacingMap[spacing]
  };

  return (
    <div 
      className={`form-field-group ${className}`}
      style={groupStyles}
      {...props}
    >
      {children}
    </div>
  );
};

FormFieldGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  spacing: PropTypes.oneOf(['sm', 'md', 'lg'])
};

/**
 * FormSection Component
 * Creates a section with title and description for grouping related fields
 */
export const FormSection = ({ 
  title, 
  description, 
  children, 
  className = '',
  ...props 
}) => {
  const sectionStyles = {
    marginBottom: designTokens.spacing[8]
  };

  const titleStyles = {
    fontSize: designTokens.typography.fontSize.lg[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.secondary[800],
    marginBottom: designTokens.spacing[2],
    lineHeight: designTokens.typography.lineHeight.tight
  };

  const descriptionStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.secondary[600],
    marginBottom: designTokens.spacing[4],
    lineHeight: designTokens.typography.lineHeight.normal
  };

  return (
    <section 
      className={`form-section ${className}`}
      style={sectionStyles}
      {...props}
    >
      {title && (
        <h3 style={titleStyles} className="form-section-title">
          {title}
        </h3>
      )}
      
      {description && (
        <p style={descriptionStyles} className="form-section-description">
          {description}
        </p>
      )}
      
      {children}
    </section>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default FormField;