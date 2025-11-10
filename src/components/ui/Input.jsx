/**
 * Input Component - Atomic Design System
 * Accessible input component with validation and real-time feedback
 * @version 1.0.0
 */

import React, { useState, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';

/**
 * Input Component
 * 
 * Accessible input component with validation, real-time feedback, and multiple variants.
 * Follows WCAG 2.1 AA guidelines and supports various input types.
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, number, etc.)
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {function} props.onBlur - Blur handler
 * @param {function} props.onFocus - Focus handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.readOnly - Whether input is read-only
 * @param {boolean} props.required - Whether input is required
 * @param {string} props.size - Input size (sm, md, lg)
 * @param {string} props.variant - Input variant (default, filled, outline)
 * @param {boolean} props.error - Whether input has error state
 * @param {function} props.validator - Validation function
 * @param {boolean} props.validateOnChange - Whether to validate on change
 * @param {boolean} props.validateOnBlur - Whether to validate on blur
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.inputProps - Additional input props
 */
const Input = forwardRef(({
  type = 'text',
  value = '',
  onChange,
  onBlur,
  onFocus,
  placeholder = '',
  disabled = false,
  readOnly = false,
  required = false,
  size = 'md',
  variant = 'default',
  error = false,
  validator = null,
  validateOnChange = false,
  validateOnBlur = true,
  className = '',
  inputProps = {},
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Validation function
  const validateInput = useCallback((inputValue) => {
    if (!validator) return null;
    
    try {
      const result = validator(inputValue);
      return result === true ? null : result;
    } catch (err) {
      return 'Validation error occurred';
    }
  }, [validator]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(e);
    }

    // Validate on change if enabled
    if (validateOnChange && validator) {
      const validationResult = validateInput(newValue);
      setValidationError(validationResult);
    }
  }, [onChange, validateOnChange, validateInput, validator]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    if (onBlur) {
      onBlur(e);
    }

    // Validate on blur if enabled
    if (validateOnBlur && validator) {
      const validationResult = validateInput(e.target.value);
      setValidationError(validationResult);
    }
  }, [onBlur, validateOnBlur, validateInput, validator]);

  // Handle input focus
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  // Size configurations
  const sizeConfig = {
    sm: {
      height: '32px',
      padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
      fontSize: designTokens.typography.fontSize.sm[0],
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    md: {
      height: '40px',
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
      fontSize: designTokens.typography.fontSize.base[0],
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    lg: {
      height: '48px',
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: designTokens.typography.fontSize.lg[0],
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  };

  // Variant configurations
  const variantConfig = {
    default: {
      backgroundColor: designTokens.colors.white,
      border: `1px solid ${designTokens.colors.secondary[300]}`,
      focusBorderColor: designTokens.colors.primary[500],
      focusBoxShadow: `0 0 0 2px ${designTokens.colors.primary[200]}`,
    },
    filled: {
      backgroundColor: designTokens.colors.secondary[50],
      border: `1px solid ${designTokens.colors.secondary[200]}`,
      focusBorderColor: designTokens.colors.primary[500],
      focusBoxShadow: `0 0 0 2px ${designTokens.colors.primary[200]}`,
    },
    outline: {
      backgroundColor: 'transparent',
      border: `2px solid ${designTokens.colors.secondary[300]}`,
      focusBorderColor: designTokens.colors.primary[500],
      focusBoxShadow: 'none',
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  const hasError = error || validationError;

  // Base input styles
  const inputStyles = {
    width: '100%',
    height: currentSize.height,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    lineHeight: currentSize.lineHeight,
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    fontWeight: designTokens.typography.fontWeight.normal,
    color: disabled ? designTokens.colors.secondary[400] : designTokens.colors.secondary[900],
    backgroundColor: disabled ? designTokens.colors.secondary[100] : currentVariant.backgroundColor,
    border: hasError 
      ? `${variant === 'outline' ? '2px' : '1px'} solid ${designTokens.colors.semantic.error[500]}`
      : currentVariant.border,
    borderRadius: designTokens.borderRadius.md,
    outline: 'none',
    transition: `all ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
    cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
    
    // Focus styles
    ...(isFocused && !disabled && !hasError && {
      borderColor: currentVariant.focusBorderColor,
      boxShadow: currentVariant.focusBoxShadow,
    }),
    
    // Error focus styles
    ...(isFocused && !disabled && hasError && {
      borderColor: designTokens.colors.semantic.error[600],
      boxShadow: `0 0 0 2px ${designTokens.colors.semantic.error[200]}`,
    }),
    
    // Placeholder styles
    '::placeholder': {
      color: designTokens.colors.secondary[400],
      opacity: 1,
    },
  };

  // Container styles for additional elements
  const containerStyles = {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
  };

  return (
    <div style={containerStyles} className={`input-container ${className}`}>
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        style={inputStyles}
        className="input-field"
        {...inputProps}
        {...props}
      />
      
      {/* CSS for pseudo-classes and additional styling */}
      <style>
        {`
          .input-field::placeholder {
            color: ${designTokens.colors.secondary[400]};
            opacity: 1;
          }
          
          .input-field:hover:not(:disabled):not(:focus) {
            border-color: ${hasError 
      ? designTokens.colors.semantic.error[600] 
      : designTokens.colors.secondary[400]
    };
          }
          
          .input-field:disabled {
            background-color: ${designTokens.colors.secondary[100]};
            color: ${designTokens.colors.secondary[400]};
            cursor: not-allowed;
          }
          
          .input-field:read-only {
            background-color: ${designTokens.colors.secondary[50]};
            cursor: default;
          }
          
          .input-field:invalid {
            border-color: ${designTokens.colors.semantic.error[500]};
          }
          
          /* Number input spinner styles */
          .input-field[type="number"]::-webkit-outer-spin-button,
          .input-field[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          .input-field[type="number"] {
            -moz-appearance: textfield;
          }
          
          /* Password input styles */
          .input-field[type="password"] {
            font-family: text-security-disc, -webkit-small-control, sans-serif;
          }
          
          /* Search input styles */
          .input-field[type="search"]::-webkit-search-decoration,
          .input-field[type="search"]::-webkit-search-cancel-button,
          .input-field[type="search"]::-webkit-search-results-button,
          .input-field[type="search"]::-webkit-search-results-decoration {
            -webkit-appearance: none;
          }
        `}
      </style>
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.oneOf([
    'text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 
    'datetime-local', 'month', 'time', 'week', 'color',
  ]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['default', 'filled', 'outline']),
  error: PropTypes.bool,
  validator: PropTypes.func,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  className: PropTypes.string,
  inputProps: PropTypes.object,
};

/**
 * Common validation functions
 */
export const validators = {
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? true : 'Please enter a valid email address';
  },
  
  required: (value) => {
    return value && value.trim() ? true : 'This field is required';
  },
  
  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length >= min ? true : `Must be at least ${min} characters`;
  },
  
  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length <= max ? true : `Must be no more than ${max} characters`;
  },
  
  number: (value) => {
    if (!value) return null;
    return !isNaN(value) && !isNaN(parseFloat(value)) ? true : 'Please enter a valid number';
  },
  
  positiveNumber: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 ? true : 'Please enter a positive number';
  },
  
  currency: (value) => {
    if (!value) return null;
    const currencyRegex = /^\d+(\.\d{1,2})?$/;
    return currencyRegex.test(value) ? true : 'Please enter a valid amount (e.g., 123.45)';
  },
  
  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? true : 'Please enter a valid phone number';
  },
};

/**
 * Validation composer for combining multiple validators
 */
export const composeValidators = (...validators) => (value) => {
  for (const validator of validators) {
    const result = validator(value);
    if (result !== true && result !== null) {
      return result;
    }
  }
  return true;
};

export default Input;