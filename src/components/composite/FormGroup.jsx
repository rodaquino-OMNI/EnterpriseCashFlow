/**
 * FormGroup Component - Composite Form Component
 * Groups related form fields with consistent spacing and layout
 * @version 1.0.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * FormGroup Component
 *
 * Groups multiple form fields together with consistent spacing, optional title,
 * description, and validation state. Supports both vertical and horizontal layouts.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Group title
 * @param {string} props.description - Group description/hint
 * @param {React.ReactNode} props.children - Form fields to group
 * @param {string} props.error - Group-level error message
 * @param {boolean} props.required - Whether all fields in group are required
 * @param {string} props.layout - Layout direction (vertical, horizontal, grid)
 * @param {number} props.columns - Number of columns for grid layout (2, 3, 4)
 * @param {string} props.spacing - Space between fields (sm, md, lg)
 * @param {boolean} props.disabled - Whether group is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
const FormGroup = ({
  title,
  description,
  children,
  error,
  required = false,
  layout = 'vertical',
  columns = 2,
  spacing = 'md',
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  const spacingMap = {
    sm: designTokens.spacing[2],
    md: designTokens.spacing[4],
    lg: designTokens.spacing[6],
  };

  const containerStyles = {
    marginBottom: designTokens.spacing[6],
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    ...style,
  };

  const titleStyles = {
    fontSize: designTokens.typography.fontSize.base[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.secondary[800],
    marginBottom: designTokens.spacing[1],
    lineHeight: designTokens.typography.lineHeight.tight,
  };

  const descriptionStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.secondary[600],
    marginBottom: designTokens.spacing[3],
    lineHeight: designTokens.typography.lineHeight.normal,
  };

  const errorStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.semantic.error[600],
    marginTop: designTokens.spacing[2],
    padding: designTokens.spacing[2],
    backgroundColor: designTokens.colors.semantic.error[50],
    border: `1px solid ${designTokens.colors.semantic.error[200]}`,
    borderRadius: designTokens.borderRadius.md,
    display: 'flex',
    alignItems: 'flex-start',
    gap: designTokens.spacing[2],
    lineHeight: designTokens.typography.lineHeight.normal,
  };

  const fieldsContainerStyles = {
    display: layout === 'grid' ? 'grid' : 'flex',
    flexDirection: layout === 'horizontal' ? 'row' : 'column',
    gap: spacingMap[spacing],
    gridTemplateColumns: layout === 'grid' ? `repeat(${columns}, 1fr)` : undefined,
    alignItems: layout === 'horizontal' ? 'flex-start' : 'stretch',
    flexWrap: layout === 'horizontal' ? 'wrap' : 'nowrap',
  };

  // Error icon for group-level errors
  const ErrorIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: '2px' }}
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

  return (
    <div
      className={`form-group form-group-${layout} ${className}`}
      style={containerStyles}
      role="group"
      aria-labelledby={title ? 'group-title' : undefined}
      aria-describedby={description ? 'group-description' : undefined}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    >
      {/* Group Header */}
      {(title || description) && (
        <div className="form-group-header" style={{ marginBottom: designTokens.spacing[3] }}>
          {title && (
            <div id="group-title" style={titleStyles}>
              {title}
              {required && (
                <span
                  style={{
                    color: designTokens.colors.semantic.error[500],
                    marginLeft: designTokens.spacing[1],
                  }}
                  aria-label="required"
                  title="All fields in this group are required"
                >
                  *
                </span>
              )}
            </div>
          )}

          {description && (
            <div id="group-description" style={descriptionStyles}>
              {description}
            </div>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="form-group-fields" style={fieldsContainerStyles}>
        {children}
      </div>

      {/* Group-level Error Message */}
      {error && (
        <div
          className="form-group-error"
          style={errorStyles}
          role="alert"
          aria-live="polite"
        >
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      {/* Responsive styles */}
      <style>
        {`
          .form-group-grid {
            container-type: inline-size;
          }

          @container (max-width: 768px) {
            .form-group-grid .form-group-fields {
              grid-template-columns: 1fr !important;
            }
          }

          @container (max-width: 640px) {
            .form-group-horizontal .form-group-fields {
              flex-direction: column !important;
            }
          }

          .form-group[aria-invalid="true"] {
            border-left: 3px solid ${designTokens.colors.semantic.error[500]};
            padding-left: ${designTokens.spacing[3]};
          }

          .form-group-error {
            animation: slideIn 200ms ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
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

FormGroup.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  layout: PropTypes.oneOf(['vertical', 'horizontal', 'grid']),
  columns: PropTypes.oneOf([2, 3, 4]),
  spacing: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

/**
 * FormRow Component
 * Simple wrapper for horizontal field layouts
 */
export const FormRow = ({ children, spacing = 'md', className = '', ...props }) => {
  const spacingMap = {
    sm: designTokens.spacing[2],
    md: designTokens.spacing[4],
    lg: designTokens.spacing[6],
  };

  const rowStyles = {
    display: 'flex',
    flexDirection: 'row',
    gap: spacingMap[spacing],
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  };

  return (
    <div className={`form-row ${className}`} style={rowStyles} {...props}>
      {children}
      <style>
        {`
          @media (max-width: 640px) {
            .form-row {
              flex-direction: column !important;
            }
          }
        `}
      </style>
    </div>
  );
};

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

/**
 * FormColumn Component
 * Wrapper for creating flex columns in forms
 */
export const FormColumn = ({
  children,
  span = 1,
  className = '',
  style = {},
  ...props
}) => {
  const columnStyles = {
    flex: `${span} 1 0%`,
    minWidth: 0, // Prevent flex item overflow
    ...style,
  };

  return (
    <div className={`form-column ${className}`} style={columnStyles} {...props}>
      {children}
    </div>
  );
};

FormColumn.propTypes = {
  children: PropTypes.node.isRequired,
  span: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default FormGroup;
