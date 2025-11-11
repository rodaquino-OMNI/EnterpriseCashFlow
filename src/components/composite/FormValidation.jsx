/**
 * FormValidation Component - Composite Form Component
 * Validation feedback and error handling for forms
 * @version 1.0.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * FormValidation Component
 *
 * Displays validation messages, errors, and feedback for form fields and forms.
 * Supports different severity levels and accessibility features.
 *
 * @param {Object} props - Component props
 * @param {Array|Object|string} props.errors - Error messages to display
 * @param {Array|Object|string} props.warnings - Warning messages to display
 * @param {string} props.type - Display type (inline, summary, toast)
 * @param {string} props.severity - Message severity (error, warning, info, success)
 * @param {boolean} props.showIcon - Show status icon
 * @param {Function} props.onDismiss - Callback when message is dismissed
 * @param {boolean} props.dismissible - Whether message can be dismissed
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
const FormValidation = ({
  errors,
  warnings,
  type = 'summary',
  severity = 'error',
  showIcon = true,
  onDismiss,
  dismissible = false,
  className = '',
  style = {},
  ...props
}) => {
  // Convert errors to array format
  const errorArray = React.useMemo(() => {
    if (!errors) return [];
    if (typeof errors === 'string') return [errors];
    if (Array.isArray(errors)) return errors;
    if (typeof errors === 'object') return Object.values(errors).filter(Boolean);
    return [];
  }, [errors]);

  const warningArray = React.useMemo(() => {
    if (!warnings) return [];
    if (typeof warnings === 'string') return [warnings];
    if (Array.isArray(warnings)) return warnings;
    if (typeof warnings === 'object') return Object.values(warnings).filter(Boolean);
    return [];
  }, [warnings]);

  const hasErrors = errorArray.length > 0;
  const hasWarnings = warningArray.length > 0;

  if (!hasErrors && !hasWarnings) return null;

  const severityConfig = {
    error: {
      backgroundColor: designTokens.colors.semantic.error[50],
      borderColor: designTokens.colors.semantic.error[200],
      textColor: designTokens.colors.semantic.error[700],
      iconColor: designTokens.colors.semantic.error[500],
    },
    warning: {
      backgroundColor: designTokens.colors.semantic.warning[50],
      borderColor: designTokens.colors.semantic.warning[200],
      textColor: designTokens.colors.semantic.warning[700],
      iconColor: designTokens.colors.semantic.warning[500],
    },
    info: {
      backgroundColor: designTokens.colors.semantic.info[50],
      borderColor: designTokens.colors.semantic.info[200],
      textColor: designTokens.colors.semantic.info[700],
      iconColor: designTokens.colors.semantic.info[500],
    },
    success: {
      backgroundColor: designTokens.colors.semantic.success[50],
      borderColor: designTokens.colors.semantic.success[200],
      textColor: designTokens.colors.semantic.success[700],
      iconColor: designTokens.colors.semantic.success[500],
    },
  };

  const config = severityConfig[hasErrors ? 'error' : hasWarnings ? 'warning' : severity];

  const baseStyles = {
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
  };

  const summaryStyles = {
    ...baseStyles,
    padding: designTokens.spacing[4],
    backgroundColor: config.backgroundColor,
    border: `1px solid ${config.borderColor}`,
    borderRadius: designTokens.borderRadius.md,
    marginBottom: designTokens.spacing[4],
    ...style,
  };

  const inlineStyles = {
    ...baseStyles,
    display: 'flex',
    alignItems: 'flex-start',
    gap: designTokens.spacing[2],
    fontSize: designTokens.typography.fontSize.sm[0],
    color: config.textColor,
    marginTop: designTokens.spacing[1],
    ...style,
  };

  const toastStyles = {
    ...baseStyles,
    position: 'fixed',
    top: designTokens.spacing[4],
    right: designTokens.spacing[4],
    maxWidth: '400px',
    padding: designTokens.spacing[4],
    backgroundColor: config.backgroundColor,
    border: `1px solid ${config.borderColor}`,
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.shadows.lg,
    zIndex: 9999,
    ...style,
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing[2],
  };

  const titleStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[2],
    fontSize: designTokens.typography.fontSize.base[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: config.textColor,
  };

  const listStyles = {
    margin: 0,
    paddingLeft: showIcon ? designTokens.spacing[6] : designTokens.spacing[4],
    listStyleType: 'disc',
  };

  const listItemStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    lineHeight: designTokens.typography.lineHeight.normal,
    color: config.textColor,
    marginBottom: designTokens.spacing[1],
  };

  // Icons
  const ErrorIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: config.iconColor, flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const WarningIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: config.iconColor, flexShrink: 0 }}
    >
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const InfoIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: config.iconColor, flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const SuccessIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: config.iconColor, flexShrink: 0 }}
    >
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const CloseIcon = () => (
    <button
      onClick={onDismiss}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: designTokens.spacing[1],
        color: config.textColor,
        opacity: 0.7,
        transition: `opacity ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
      }}
      aria-label="Dismiss message"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );

  const getIcon = () => {
    if (hasErrors) return <ErrorIcon />;
    if (hasWarnings) return <WarningIcon />;
    if (severity === 'success') return <SuccessIcon />;
    return <InfoIcon />;
  };

  // Inline type - single line message
  if (type === 'inline') {
    return (
      <div
        className={`form-validation form-validation-inline ${className}`}
        style={inlineStyles}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {showIcon && getIcon()}
        <span>{errorArray[0] || warningArray[0]}</span>
      </div>
    );
  }

  // Toast type - floating notification
  if (type === 'toast') {
    return (
      <div
        className={`form-validation form-validation-toast ${className}`}
        style={toastStyles}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div style={headerStyles}>
          <div style={titleStyles}>
            {showIcon && getIcon()}
            <span>{hasErrors ? 'Validation Error' : hasWarnings ? 'Warning' : 'Notification'}</span>
          </div>
          {dismissible && <CloseIcon />}
        </div>
        <ul style={listStyles}>
          {errorArray.map((error, index) => (
            <li key={`error-${index}`} style={listItemStyles}>{error}</li>
          ))}
          {warningArray.map((warning, index) => (
            <li key={`warning-${index}`} style={listItemStyles}>{warning}</li>
          ))}
        </ul>

        <style>
          {`
            .form-validation-toast {
              animation: slideInRight 300ms ease-out;
            }

            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  }

  // Summary type - full validation summary
  return (
    <div
      className={`form-validation form-validation-summary ${className}`}
      style={summaryStyles}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div style={headerStyles}>
        <div style={titleStyles}>
          {showIcon && getIcon()}
          <span>
            {hasErrors
              ? `${errorArray.length} ${errorArray.length === 1 ? 'error' : 'errors'} found`
              : hasWarnings
                ? `${warningArray.length} ${warningArray.length === 1 ? 'warning' : 'warnings'}`
                : 'Validation message'}
          </span>
        </div>
        {dismissible && <CloseIcon />}
      </div>

      {hasErrors && (
        <ul style={listStyles}>
          {errorArray.map((error, index) => (
            <li key={`error-${index}`} style={listItemStyles}>{error}</li>
          ))}
        </ul>
      )}

      {hasWarnings && (
        <ul style={listStyles}>
          {warningArray.map((warning, index) => (
            <li key={`warning-${index}`} style={listItemStyles}>{warning}</li>
          ))}
        </ul>
      )}

      <style>
        {`
          .form-validation-summary {
            animation: slideDown 250ms ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .form-validation button:hover {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

FormValidation.propTypes = {
  errors: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
  warnings: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
  type: PropTypes.oneOf(['inline', 'summary', 'toast']),
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  showIcon: PropTypes.bool,
  onDismiss: PropTypes.func,
  dismissible: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value, message = 'This field is required') => {
    return value && value.toString().trim() ? null : message;
  },

  email: (value, message = 'Please enter a valid email address') => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },

  minLength: (min, message) => (value) => {
    if (!value) return null;
    return value.length >= min ? null : message || `Must be at least ${min} characters`;
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    return value.length <= max ? null : message || `Must be no more than ${max} characters`;
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  number: (value, message = 'Please enter a valid number') => {
    if (!value) return null;
    return !isNaN(value) && !isNaN(parseFloat(value)) ? null : message;
  },

  positiveNumber: (value, message = 'Please enter a positive number') => {
    if (!value) return null;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 ? null : message;
  },

  range: (min, max, message) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Invalid number';
    return num >= min && num <= max ? null : message || `Must be between ${min} and ${max}`;
  },

  custom: (validator, message) => (value) => {
    try {
      return validator(value) ? null : message;
    } catch (error) {
      return message || 'Validation failed';
    }
  },
};

/**
 * Compose multiple validation rules
 */
export const composeValidations = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

export default FormValidation;
