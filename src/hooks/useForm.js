/**
 * useForm Hook - Shared Form Logic
 * Custom hook for form state management and validation
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useForm Hook
 *
 * Comprehensive form management hook with validation, submission handling,
 * and state persistence.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.initialValues - Initial form values
 * @param {Function} options.onSubmit - Form submission handler
 * @param {Function} options.validate - Validation function
 * @param {boolean} options.validateOnChange - Validate on field change
 * @param {boolean} options.validateOnBlur - Validate on field blur
 * @param {boolean} options.validateOnMount - Validate on component mount
 * @param {boolean} options.enableReinitialize - Reinitialize when initialValues change
 * @returns {Object} Form state and handlers
 */
export const useForm = ({
  initialValues = {},
  onSubmit,
  validate,
  validateOnChange = false,
  validateOnBlur = true,
  validateOnMount = false,
  enableReinitialize = false,
} = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const initialValuesRef = useRef(initialValues);
  const isMountedRef = useRef(true);

  // Reinitialize form when initialValues change
  useEffect(() => {
    if (enableReinitialize && initialValues !== initialValuesRef.current) {
      setValues(initialValues);
      initialValuesRef.current = initialValues;
    }
  }, [initialValues, enableReinitialize]);

  // Validate on mount if enabled
  useEffect(() => {
    if (validateOnMount && validate) {
      runValidation(initialValues);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Run validation
  const runValidation = useCallback(
    async (valuesToValidate) => {
      if (!validate) return {};

      setIsValidating(true);

      try {
        const validationErrors = await validate(valuesToValidate);
        const safeErrors = validationErrors || {};

        if (isMountedRef.current) {
          setErrors(safeErrors);
        }

        return safeErrors;
      } catch (error) {
        console.error('Validation error:', error);
        const errorObj = { _form: 'Validation failed' };

        if (isMountedRef.current) {
          setErrors(errorObj);
        }

        return errorObj;
      } finally {
        if (isMountedRef.current) {
          setIsValidating(false);
        }
      }
    },
    [validate],
  );

  // Set field value
  const setFieldValue = useCallback(
    async (field, value) => {
      const newValues = { ...values, [field]: value };
      setValues(newValues);

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }

      // Validate on change if enabled
      if (validateOnChange && validate) {
        const validationErrors = await runValidation(newValues);

        if (validationErrors[field]) {
          setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
        }
      }
    },
    [values, errors, validate, validateOnChange, runValidation],
  );

  // Set multiple field values
  const setFieldValues = useCallback((fields) => {
    setValues((prev) => ({ ...prev, ...fields }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback(
    async (field, shouldValidate = validateOnBlur) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      if (shouldValidate && validate) {
        const validationErrors = await runValidation(values);

        if (validationErrors[field]) {
          setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
        }
      }
    },
    [values, validate, validateOnBlur, runValidation],
  );

  // Set field error
  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // Handle field change
  const handleChange = useCallback(
    (field) => (event) => {
      const value = event.target ? event.target.value : event;
      setFieldValue(field, value);
    },
    [setFieldValue],
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field) => () => {
      setFieldTouched(field);
    },
    [setFieldTouched],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
      }

      setSubmitCount((prev) => prev + 1);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Run validation
      const validationErrors = await runValidation(values);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Submit form
      setIsSubmitting(true);

      try {
        if (onSubmit) {
          await onSubmit(values);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors((prev) => ({
          ...prev,
          _form: error.message || 'Submission failed',
        }));
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [values, onSubmit, runValidation],
  );

  // Reset form
  const resetForm = useCallback((newValues) => {
    const resetValues = newValues || initialValuesRef.current;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, []);

  // Get field props for easy integration
  const getFieldProps = useCallback(
    (field) => ({
      name: field,
      value: values[field] !== undefined ? values[field] : '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
    }),
    [values, handleChange, handleBlur],
  );

  // Get field meta information
  const getFieldMeta = useCallback(
    (field) => ({
      value: values[field],
      error: errors[field],
      touched: touched[field],
      isDirty: values[field] !== initialValuesRef.current[field],
    }),
    [values, errors, touched],
  );

  // Get field helpers
  const getFieldHelpers = useCallback(
    (field) => ({
      setValue: (value) => setFieldValue(field, value),
      setTouched: (isTouched = true) => setFieldTouched(field, isTouched),
      setError: (error) => setFieldError(field, error),
    }),
    [setFieldValue, setFieldTouched, setFieldError],
  );

  // Computed properties
  const isDirty = Object.keys(values).some(
    (key) => values[key] !== initialValuesRef.current[key],
  );

  const isValid = Object.keys(errors).length === 0;

  const hasErrors = Object.keys(errors).length > 0;

  return {
    // Values
    values,
    errors,
    touched,

    // State flags
    isSubmitting,
    isValidating,
    isDirty,
    isValid,
    hasErrors,
    submitCount,

    // Field operations
    setFieldValue,
    setFieldValues,
    setFieldTouched,
    setFieldError,
    setErrors,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,

    // Helper functions
    getFieldProps,
    getFieldMeta,
    getFieldHelpers,

    // Validation
    validateForm: () => runValidation(values),
    validateField: (field) => runValidation({ ...values }),
  };
};

/**
 * useFieldArray Hook
 *
 * Hook for managing array fields in forms (dynamic fields)
 *
 * @param {string} name - Field name
 * @param {Object} formContext - Form context from useForm
 * @returns {Object} Field array operations
 */
export const useFieldArray = (name, formContext) => {
  const { values, setFieldValue } = formContext;
  const fieldValue = values[name] || [];

  const push = useCallback(
    (value) => {
      const newArray = [...fieldValue, value];
      setFieldValue(name, newArray);
    },
    [fieldValue, name, setFieldValue],
  );

  const remove = useCallback(
    (index) => {
      const newArray = fieldValue.filter((_, i) => i !== index);
      setFieldValue(name, newArray);
    },
    [fieldValue, name, setFieldValue],
  );

  const insert = useCallback(
    (index, value) => {
      const newArray = [
        ...fieldValue.slice(0, index),
        value,
        ...fieldValue.slice(index),
      ];
      setFieldValue(name, newArray);
    },
    [fieldValue, name, setFieldValue],
  );

  const move = useCallback(
    (from, to) => {
      const newArray = [...fieldValue];
      const [item] = newArray.splice(from, 1);
      newArray.splice(to, 0, item);
      setFieldValue(name, newArray);
    },
    [fieldValue, name, setFieldValue],
  );

  const replace = useCallback(
    (index, value) => {
      const newArray = [...fieldValue];
      newArray[index] = value;
      setFieldValue(name, newArray);
    },
    [fieldValue, name, setFieldValue],
  );

  return {
    fields: fieldValue,
    push,
    remove,
    insert,
    move,
    replace,
    length: fieldValue.length,
  };
};

/**
 * useFormPersist Hook
 *
 * Hook for persisting form state to localStorage
 *
 * @param {string} key - LocalStorage key
 * @param {Object} formContext - Form context from useForm
 * @param {number} expiry - Expiry time in milliseconds
 */
export const useFormPersist = (key, formContext, expiry = 3600000) => {
  const { values, setFieldValues } = formContext;

  // Load persisted data on mount
  useEffect(() => {
    try {
      const persistedData = localStorage.getItem(key);
      if (persistedData) {
        const { state, timestamp } = JSON.parse(persistedData);
        const isExpired = Date.now() - timestamp > expiry;

        if (!isExpired && state) {
          setFieldValues(state);
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to restore form state:', error);
    }
  }, [key, expiry, setFieldValues]);

  // Persist data on change
  useEffect(() => {
    try {
      const dataToStore = {
        state: values,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to persist form state:', error);
    }
  }, [key, values]);

  // Clear persisted data
  const clearPersisted = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { clearPersisted };
};

export default useForm;
