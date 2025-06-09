import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

// Form composite component with validation, field rendering, and submission handling
const Form = ({ 
  children, 
  onSubmit, 
  onValidate,
  initialValues = {}, 
  config,
  className = '',
  style = {},
  ...props 
}) => {
  // Initialize values from config if provided
  const configInitialValues = config?.fields ? 
    config.fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || '';
      return acc;
    }, {}) : {};
  
  const mergedInitialValues = { ...configInitialValues, ...initialValues };

  // Form state
  const [values, setValues] = useState(mergedInitialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle field changes
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Run validation if provided
    if (onValidate) {
      const fieldErrors = onValidate(values, name);
      if (fieldErrors && fieldErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
      }
    }
  }, [values, onValidate]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Run full validation if provided
      if (onValidate) {
        const validationErrors = onValidate(values);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Submit form
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, onValidate, isSubmitting]);

  // Filter out invalid DOM props
  const { onValidate: _, config: __, ...validFormProps } = props;

  // Render fields from config if provided and no children
  const renderConfigFields = () => {
    if (!config?.fields || children) return null;
    
    return config.fields.map((field) => (
      <Field
        key={field.name}
        name={field.name}
        label={field.label}
        type={field.type || 'text'}
        required={field.required}
        value={values[field.name] || ''}
        error={errors[field.name]}
        onChange={handleChange}
        onBlur={handleBlur}
        {...field.props}
      />
    ));
  };

  // Render submit button if no children provided
  const renderSubmitButton = () => {
    if (children) return null;
    
    return (
      <FormSubmit
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Submit
      </FormSubmit>
    );
  };

  return (
    <form
      {...validFormProps}
      className={`form ${className}`}
      onSubmit={handleSubmit}
      noValidate
      style={{ width: '100%', ...style }}
    >
      {children || (
        <>
          {renderConfigFields()}
          {renderSubmitButton()}
        </>
      )}
    </form>
  );
};

// Field component for individual form fields
const Field = ({ 
  name, 
  label, 
  type = 'text', 
  value, 
  error, 
  required = false,
  onChange, 
  onBlur,
  className = '',
  ...props 
}) => {
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    onBlur(name);
  };

  return (
    <div className={`field ${className}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
};

// Form layout component
const FormLayout = ({ children, className = '', ...props }) => (
  <div className={`form-layout ${className}`} {...props}>
    {children}
  </div>
);

// Form actions container
const FormActions = ({ children, className = '', ...props }) => (
  <div className={`form-actions ${className}`} {...props}>
    {children}
  </div>
);

// Submit button component
const FormSubmit = ({ 
  children = 'Submit', 
  disabled = false, 
  loading = false,
  className = '',
  ...props 
}) => (
  <button
    type="submit"
    disabled={disabled || loading}
    className={`form-submit ${className}`}
    {...props}
  >
    {loading ? 'Submitting...' : children}
  </button>
);

// Reset button component
const FormReset = ({ 
  children = 'Reset', 
  onClick,
  className = '',
  ...props 
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`form-reset ${className}`}
    {...props}
  >
    {children}
  </button>
);

// PropTypes
Form.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  onValidate: PropTypes.func,
  initialValues: PropTypes.object,
  config: PropTypes.shape({
    fields: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      required: PropTypes.bool,
      defaultValue: PropTypes.any,
      props: PropTypes.object
    }))
  }),
  className: PropTypes.string,
  style: PropTypes.object
};

Field.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.any,
  error: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  className: PropTypes.string
};

FormLayout.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

FormActions.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

FormSubmit.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string
};

FormReset.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string
};

// Export all components
export default Form;
export { Field, FormLayout, FormActions, FormSubmit, FormReset };