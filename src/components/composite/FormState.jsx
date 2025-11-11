/**
 * FormState Component - Composite Form Component
 * Form state management and persistence
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Form State Context
 */
const FormStateContext = createContext(null);

/**
 * Form state action types
 */
const FormStateActionTypes = {
  SET_FIELD: 'SET_FIELD',
  SET_FIELDS: 'SET_FIELDS',
  SET_ERROR: 'SET_ERROR',
  SET_ERRORS: 'SET_ERRORS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_TOUCHED: 'SET_TOUCHED',
  SET_TOUCHED_FIELDS: 'SET_TOUCHED_FIELDS',
  RESET_FORM: 'RESET_FORM',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SET_VALIDATING: 'SET_VALIDATING',
  RESTORE_STATE: 'RESTORE_STATE',
};

/**
 * Form state reducer
 */
const formStateReducer = (state, action) => {
  switch (action.type) {
    case FormStateActionTypes.SET_FIELD:
      return {
        ...state,
        values: {
          ...state.values,
          [action.field]: action.value,
        },
        isDirty: true,
      };

    case FormStateActionTypes.SET_FIELDS:
      return {
        ...state,
        values: {
          ...state.values,
          ...action.values,
        },
        isDirty: true,
      };

    case FormStateActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error,
        },
      };

    case FormStateActionTypes.SET_ERRORS:
      return {
        ...state,
        errors: action.errors,
      };

    case FormStateActionTypes.CLEAR_ERROR:
      const { [action.field]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };

    case FormStateActionTypes.CLEAR_ERRORS:
      return {
        ...state,
        errors: {},
      };

    case FormStateActionTypes.SET_TOUCHED:
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.field]: true,
        },
      };

    case FormStateActionTypes.SET_TOUCHED_FIELDS:
      return {
        ...state,
        touched: action.touched,
      };

    case FormStateActionTypes.RESET_FORM:
      return {
        ...state,
        values: action.values || state.initialValues,
        errors: {},
        touched: {},
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
      };

    case FormStateActionTypes.SET_SUBMITTING:
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case FormStateActionTypes.SET_VALIDATING:
      return {
        ...state,
        isValidating: action.isValidating,
      };

    case FormStateActionTypes.RESTORE_STATE:
      return {
        ...state,
        ...action.state,
      };

    default:
      return state;
  }
};

/**
 * FormState Component
 *
 * Manages form state including values, errors, touched fields, and submission state.
 * Supports persistence to localStorage and automatic validation.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form components
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Form submission handler
 * @param {Function} props.validate - Form validation function
 * @param {boolean} props.validateOnChange - Validate on field change
 * @param {boolean} props.validateOnBlur - Validate on field blur
 * @param {boolean} props.enablePersistence - Enable state persistence
 * @param {string} props.persistenceKey - LocalStorage key for persistence
 * @param {number} props.persistenceExpiry - Persistence expiry in milliseconds
 * @param {Function} props.onStateChange - Callback when state changes
 */
const FormState = ({
  children,
  initialValues = {},
  onSubmit,
  validate,
  validateOnChange = false,
  validateOnBlur = true,
  enablePersistence = false,
  persistenceKey = 'form-state',
  persistenceExpiry = 3600000, // 1 hour default
  onStateChange,
  ...props
}) => {
  // Initialize form state
  const [state, dispatch] = useReducer(formStateReducer, {
    initialValues,
    values: initialValues,
    errors: {},
    touched: {},
    isDirty: false,
    isSubmitting: false,
    isValidating: false,
  });

  // Load persisted state on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const persistedData = localStorage.getItem(persistenceKey);
      if (persistedData) {
        const { state: savedState, timestamp } = JSON.parse(persistedData);
        const isExpired = Date.now() - timestamp > persistenceExpiry;

        if (!isExpired && savedState) {
          dispatch({
            type: FormStateActionTypes.RESTORE_STATE,
            state: savedState,
          });
        } else {
          localStorage.removeItem(persistenceKey);
        }
      }
    } catch (error) {
      console.error('Failed to restore form state:', error);
    }
  }, [enablePersistence, persistenceKey, persistenceExpiry]);

  // Persist state changes
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const dataToStore = {
        state: {
          values: state.values,
          errors: state.errors,
          touched: state.touched,
          isDirty: state.isDirty,
        },
        timestamp: Date.now(),
      };
      localStorage.setItem(persistenceKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to persist form state:', error);
    }
  }, [enablePersistence, persistenceKey, state.values, state.errors, state.touched, state.isDirty]);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Validation function
  const runValidation = useCallback(
    async (values) => {
      if (!validate) return {};

      dispatch({ type: FormStateActionTypes.SET_VALIDATING, isValidating: true });

      try {
        const errors = await validate(values);
        return errors || {};
      } catch (error) {
        console.error('Validation error:', error);
        return { _form: 'Validation failed' };
      } finally {
        dispatch({ type: FormStateActionTypes.SET_VALIDATING, isValidating: false });
      }
    },
    [validate],
  );

  // Field change handler
  const handleFieldChange = useCallback(
    async (field, value) => {
      dispatch({ type: FormStateActionTypes.SET_FIELD, field, value });

      if (validateOnChange && validate) {
        const newValues = { ...state.values, [field]: value };
        const errors = await runValidation(newValues);

        if (errors[field]) {
          dispatch({ type: FormStateActionTypes.SET_ERROR, field, error: errors[field] });
        } else {
          dispatch({ type: FormStateActionTypes.CLEAR_ERROR, field });
        }
      }
    },
    [state.values, validate, validateOnChange, runValidation],
  );

  // Field blur handler
  const handleFieldBlur = useCallback(
    async (field) => {
      dispatch({ type: FormStateActionTypes.SET_TOUCHED, field });

      if (validateOnBlur && validate) {
        const errors = await runValidation(state.values);

        if (errors[field]) {
          dispatch({ type: FormStateActionTypes.SET_ERROR, field, error: errors[field] });
        }
      }
    },
    [state.values, validate, validateOnBlur, runValidation],
  );

  // Form submission handler
  const handleSubmit = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(state.values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      dispatch({ type: FormStateActionTypes.SET_TOUCHED_FIELDS, touched: allTouched });

      // Run validation
      const errors = await runValidation(state.values);

      if (Object.keys(errors).length > 0) {
        dispatch({ type: FormStateActionTypes.SET_ERRORS, errors });
        return;
      }

      // Submit form
      dispatch({ type: FormStateActionTypes.SET_SUBMITTING, isSubmitting: true });

      try {
        if (onSubmit) {
          await onSubmit(state.values);
        }

        // Clear persistence on successful submit
        if (enablePersistence) {
          localStorage.removeItem(persistenceKey);
        }
      } catch (error) {
        console.error('Form submission error:', error);
        dispatch({
          type: FormStateActionTypes.SET_ERROR,
          field: '_form',
          error: error.message || 'Submission failed',
        });
      } finally {
        dispatch({ type: FormStateActionTypes.SET_SUBMITTING, isSubmitting: false });
      }
    },
    [state.values, onSubmit, runValidation, enablePersistence, persistenceKey],
  );

  // Reset form handler
  const handleReset = useCallback(
    (newValues) => {
      dispatch({ type: FormStateActionTypes.RESET_FORM, values: newValues });

      if (enablePersistence) {
        localStorage.removeItem(persistenceKey);
      }
    },
    [enablePersistence, persistenceKey],
  );

  // Set multiple fields at once
  const setFields = useCallback((fields) => {
    dispatch({ type: FormStateActionTypes.SET_FIELDS, values: fields });
  }, []);

  // Set multiple errors at once
  const setErrors = useCallback((errors) => {
    dispatch({ type: FormStateActionTypes.SET_ERRORS, errors });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    dispatch({ type: FormStateActionTypes.CLEAR_ERRORS });
  }, []);

  // Get field props for easy integration
  const getFieldProps = useCallback(
    (field) => ({
      name: field,
      value: state.values[field] || '',
      error: state.touched[field] && state.errors[field],
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        handleFieldChange(field, value);
      },
      onBlur: () => handleFieldBlur(field),
    }),
    [state.values, state.errors, state.touched, handleFieldChange, handleFieldBlur],
  );

  // Get field state
  const getFieldState = useCallback(
    (field) => ({
      value: state.values[field],
      error: state.errors[field],
      touched: state.touched[field],
      isDirty: state.values[field] !== initialValues[field],
    }),
    [state.values, state.errors, state.touched, initialValues],
  );

  // Context value
  const contextValue = {
    ...state,
    getFieldProps,
    getFieldState,
    setField: handleFieldChange,
    setFields,
    setErrors,
    clearErrors,
    handleSubmit,
    handleReset,
    isValid: Object.keys(state.errors).length === 0,
  };

  return (
    <FormStateContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </FormStateContext.Provider>
  );
};

FormState.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
  validate: PropTypes.func,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  enablePersistence: PropTypes.bool,
  persistenceKey: PropTypes.string,
  persistenceExpiry: PropTypes.number,
  onStateChange: PropTypes.func,
};

/**
 * Hook to access form state context
 */
export const useFormState = () => {
  const context = useContext(FormStateContext);

  if (!context) {
    throw new Error('useFormState must be used within a FormState component');
  }

  return context;
};

/**
 * HOC to inject form state props
 */
export const withFormState = (Component) => {
  return function FormStateComponent(props) {
    const formState = useFormState();
    return <Component {...props} formState={formState} />;
  };
};

export default FormState;
