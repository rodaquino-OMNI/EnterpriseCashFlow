/**
 * FormSection Component - Composite Form Component
 * Collapsible form sections for organizing complex forms
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * FormSection Component
 *
 * Creates collapsible sections for organizing related form fields.
 * Supports accessibility, animations, and nested sections.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title (required)
 * @param {string} props.description - Section description
 * @param {React.ReactNode} props.children - Section content
 * @param {boolean} props.collapsible - Whether section can be collapsed
 * @param {boolean} props.defaultOpen - Initial open/closed state
 * @param {boolean} props.required - Whether section contains required fields
 * @param {string} props.error - Section-level error message
 * @param {Function} props.onToggle - Callback when section is toggled
 * @param {string} props.icon - Icon to display next to title
 * @param {boolean} props.disabled - Whether section is disabled
 * @param {number} props.level - Nesting level for styling (1-3)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
const FormSection = ({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  required = false,
  error,
  onToggle,
  icon,
  disabled = false,
  level = 1,
  className = '',
  style = {},
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = useCallback(() => {
    if (!collapsible || disabled) return;

    const newState = !isOpen;
    setIsOpen(newState);

    if (onToggle) {
      onToggle(newState);
    }
  }, [collapsible, disabled, isOpen, onToggle]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  // Dynamic spacing based on nesting level
  const levelSpacing = {
    1: designTokens.spacing[8],
    2: designTokens.spacing[6],
    3: designTokens.spacing[4],
  };

  const containerStyles = {
    marginBottom: levelSpacing[level] || designTokens.spacing[6],
    border: `1px solid ${designTokens.colors.secondary[200]}`,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: designTokens.colors.white,
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    boxShadow: designTokens.shadows.sm,
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    overflow: 'hidden',
    ...style,
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: level === 1
      ? `${designTokens.spacing[4]} ${designTokens.spacing[5]}`
      : `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
    backgroundColor: error
      ? designTokens.colors.semantic.error[50]
      : level === 1
        ? designTokens.colors.secondary[50]
        : designTokens.colors.white,
    borderBottom: isOpen ? `1px solid ${designTokens.colors.secondary[200]}` : 'none',
    cursor: collapsible ? 'pointer' : 'default',
    userSelect: 'none',
    transition: `all ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
  };

  const titleContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[2],
    flex: 1,
  };

  const titleStyles = {
    fontSize: level === 1
      ? designTokens.typography.fontSize.lg[0]
      : designTokens.typography.fontSize.base[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.secondary[800],
    lineHeight: designTokens.typography.lineHeight.tight,
    margin: 0,
  };

  const descriptionStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.secondary[600],
    marginTop: designTokens.spacing[1],
    lineHeight: designTokens.typography.lineHeight.normal,
  };

  const contentStyles = {
    padding: level === 1
      ? `${designTokens.spacing[5]} ${designTokens.spacing[5]}`
      : `${designTokens.spacing[4]} ${designTokens.spacing[4]}`,
    backgroundColor: designTokens.colors.white,
  };

  const errorStyles = {
    fontSize: designTokens.typography.fontSize.sm[0],
    color: designTokens.colors.semantic.error[600],
    padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
    backgroundColor: designTokens.colors.semantic.error[50],
    borderTop: `1px solid ${designTokens.colors.semantic.error[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[2],
  };

  // Chevron icon for collapsible sections
  const ChevronIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: `transform ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
        color: designTokens.colors.secondary[600],
      }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Error icon
  const ErrorIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
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
    <section
      className={`form-section form-section-level-${level} ${className}`}
      style={containerStyles}
      aria-labelledby="section-title"
      aria-expanded={isOpen}
      aria-disabled={disabled}
      {...props}
    >
      {/* Section Header */}
      <div
        className="form-section-header"
        style={headerStyles}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible && !disabled ? 0 : -1}
        aria-label={collapsible ? `${isOpen ? 'Collapse' : 'Expand'} ${title}` : undefined}
      >
        <div style={titleContainerStyles}>
          {icon && (
            <span style={{ display: 'flex', color: designTokens.colors.primary[500] }}>
              {icon}
            </span>
          )}

          <div style={{ flex: 1 }}>
            <h3 id="section-title" style={titleStyles}>
              {title}
              {required && (
                <span
                  style={{
                    color: designTokens.colors.semantic.error[500],
                    marginLeft: designTokens.spacing[1],
                  }}
                  aria-label="required"
                  title="This section contains required fields"
                >
                  *
                </span>
              )}
            </h3>

            {description && !isOpen && (
              <p style={descriptionStyles}>
                {description}
              </p>
            )}
          </div>
        </div>

        {collapsible && <ChevronIcon />}
      </div>

      {/* Section Content */}
      {isOpen && (
        <>
          {description && isOpen && (
            <div style={{ padding: `${designTokens.spacing[3]} ${designTokens.spacing[5]} 0` }}>
              <p style={descriptionStyles}>
                {description}
              </p>
            </div>
          )}

          <div
            className="form-section-content"
            style={contentStyles}
            role="region"
            aria-labelledby="section-title"
          >
            {children}
          </div>
        </>
      )}

      {/* Section Error */}
      {error && isOpen && (
        <div
          className="form-section-error"
          style={errorStyles}
          role="alert"
          aria-live="polite"
        >
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      {/* Animations and hover effects */}
      <style>
        {`
          .form-section-header:hover {
            background-color: ${
    error
      ? designTokens.colors.semantic.error[100]
      : level === 1
        ? designTokens.colors.secondary[100]
        : designTokens.colors.secondary[50]
    };
          }

          .form-section-header:focus-visible {
            outline: 2px solid ${designTokens.colors.primary[500]};
            outline-offset: -2px;
          }

          .form-section-content {
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

          .form-section-error {
            animation: slideUp 200ms ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 640px) {
            .form-section-header {
              flex-direction: column;
              align-items: flex-start !important;
            }
          }
        `}
      </style>
    </section>
  );
};

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  collapsible: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  onToggle: PropTypes.func,
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  level: PropTypes.oneOf([1, 2, 3]),
  className: PropTypes.string,
  style: PropTypes.object,
};

export default FormSection;
