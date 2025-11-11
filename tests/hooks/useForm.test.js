/**
 * useForm Hook Tests
 * @version 1.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from '../../src/hooks/useForm.js';

describe('useForm Hook', () => {
  describe('Initialization', () => {
    it('initializes with default values', () => {
      const initialValues = { name: '', email: '' };
      const { result } = renderHook(() => useForm({ initialValues }));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('initializes with provided values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useForm({ initialValues }));

      expect(result.current.values).toEqual(initialValues);
    });
  });

  describe('Field Value Management', () => {
    it('updates field value', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      act(() => {
        result.current.setFieldValue('name', 'John Doe');
      });

      expect(result.current.values.name).toBe('John Doe');
    });

    it('updates multiple field values', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '', email: '' },
      }));

      act(() => {
        result.current.setFieldValues({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.values).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('marks form as dirty after value change', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.setFieldValue('name', 'John');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('Validation', () => {
    it('runs validation on blur', async () => {
      const validate = jest.fn((values) => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Email is required';
        }
        return errors;
      });

      const { result } = renderHook(() => useForm({
        initialValues: { email: '' },
        validate,
        validateOnBlur: true,
      }));

      await act(async () => {
        await result.current.setFieldTouched('email');
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBe('Email is required');
      });
    });

    it('runs validation on change when enabled', async () => {
      const validate = jest.fn((values) => {
        const errors = {};
        if (values.name && values.name.length < 3) {
          errors.name = 'Name must be at least 3 characters';
        }
        return errors;
      });

      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
        validate,
        validateOnChange: true,
      }));

      await act(async () => {
        await result.current.setFieldValue('name', 'Jo');
      });

      await waitFor(() => {
        expect(result.current.errors.name).toBe('Name must be at least 3 characters');
      });
    });

    it('clears error when field becomes valid', async () => {
      const validate = jest.fn((values) => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Email is required';
        }
        return errors;
      });

      const { result } = renderHook(() => useForm({
        initialValues: { email: '' },
        validate,
        validateOnChange: true,
      }));

      // Set invalid value
      await act(async () => {
        await result.current.setFieldValue('email', '');
      });

      // Set valid value
      await act(async () => {
        await result.current.setFieldValue('email', 'test@example.com');
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeUndefined();
      });
    });

    it('validates entire form', async () => {
      const validate = jest.fn((values) => {
        const errors = {};
        if (!values.name) errors.name = 'Name is required';
        if (!values.email) errors.email = 'Email is required';
        return errors;
      });

      const { result } = renderHook(() => useForm({
        initialValues: { name: '', email: '' },
        validate,
      }));

      const errors = await act(async () => {
        return await result.current.validateForm();
      });

      expect(errors).toEqual({
        name: 'Name is required',
        email: 'Email is required',
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with values', async () => {
      const onSubmit = jest.fn();

      const { result } = renderHook(() => useForm({
        initialValues: { name: 'John' },
        onSubmit,
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
    });

    it('validates before submission', async () => {
      const onSubmit = jest.fn();
      const validate = jest.fn((values) => {
        const errors = {};
        if (!values.email) {
          errors.email = 'Email is required';
        }
        return errors;
      });

      const { result } = renderHook(() => useForm({
        initialValues: { email: '' },
        onSubmit,
        validate,
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(validate).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBe('Email is required');
    });

    it('sets all fields as touched on submission', async () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '', email: '' },
      }));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.touched).toEqual({
        name: true,
        email: true,
      });
    });

    it('sets submitting state during submission', async () => {
      const onSubmit = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useForm({
        initialValues: { name: 'John' },
        onSubmit,
      }));

      const submitPromise = act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await submitPromise;

      expect(result.current.isSubmitting).toBe(false);
    });

    it('increments submit count', async () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: 'John' },
      }));

      expect(result.current.submitCount).toBe(0);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitCount).toBe(1);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitCount).toBe(2);
    });
  });

  describe('Form Reset', () => {
    it('resets to initial values', () => {
      const initialValues = { name: 'John', email: 'john@example.com' };
      const { result } = renderHook(() => useForm({ initialValues }));

      act(() => {
        result.current.setFieldValue('name', 'Jane');
        result.current.setFieldValue('email', 'jane@example.com');
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isDirty).toBe(false);
    });

    it('resets to provided values', () => {
      const initialValues = { name: 'John' };
      const newValues = { name: 'Jane' };

      const { result } = renderHook(() => useForm({ initialValues }));

      act(() => {
        result.current.resetForm(newValues);
      });

      expect(result.current.values).toEqual(newValues);
    });
  });

  describe('Field Helpers', () => {
    it('provides getFieldProps helper', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: 'John' },
      }));

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps).toHaveProperty('name', 'name');
      expect(fieldProps).toHaveProperty('value', 'John');
      expect(fieldProps).toHaveProperty('onChange');
      expect(fieldProps).toHaveProperty('onBlur');
    });

    it('provides getFieldMeta helper', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: 'John' },
      }));

      act(() => {
        result.current.setFieldError('name', 'Invalid name');
        result.current.setFieldTouched('name');
      });

      const fieldMeta = result.current.getFieldMeta('name');

      expect(fieldMeta).toHaveProperty('value', 'John');
      expect(fieldMeta).toHaveProperty('error', 'Invalid name');
      expect(fieldMeta).toHaveProperty('touched', true);
    });

    it('provides getFieldHelpers helper', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      const helpers = result.current.getFieldHelpers('name');

      expect(helpers).toHaveProperty('setValue');
      expect(helpers).toHaveProperty('setTouched');
      expect(helpers).toHaveProperty('setError');

      act(() => {
        helpers.setValue('John');
      });

      expect(result.current.values.name).toBe('John');
    });
  });

  describe('handleChange and handleBlur', () => {
    it('handleChange updates field value', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      act(() => {
        result.current.handleChange('name')({ target: { value: 'John' } });
      });

      expect(result.current.values.name).toBe('John');
    });

    it('handleBlur marks field as touched', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      act(() => {
        result.current.handleBlur('name')();
      });

      expect(result.current.touched.name).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('calculates isValid correctly', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      expect(result.current.isValid).toBe(true);

      act(() => {
        result.current.setFieldError('name', 'Name is required');
      });

      expect(result.current.isValid).toBe(false);
    });

    it('calculates hasErrors correctly', () => {
      const { result } = renderHook(() => useForm({
        initialValues: { name: '' },
      }));

      expect(result.current.hasErrors).toBe(false);

      act(() => {
        result.current.setFieldError('name', 'Invalid');
      });

      expect(result.current.hasErrors).toBe(true);
    });
  });
});
