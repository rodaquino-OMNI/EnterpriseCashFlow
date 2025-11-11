/**
 * FormWizard Component Tests
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormWizard from '../../../src/components/composite/FormWizard.jsx';

const mockSteps = [
  {
    id: 'step1',
    label: 'Personal Info',
    render: (data, onUpdate) => (
      <div>
        <h3>Step 1 Content</h3>
        <input
          data-testid="name-input"
          value={data.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>
    ),
  },
  {
    id: 'step2',
    label: 'Address',
    render: (data, onUpdate) => (
      <div>
        <h3>Step 2 Content</h3>
        <input
          data-testid="address-input"
          value={data.address || ''}
          onChange={(e) => onUpdate({ address: e.target.value })}
        />
      </div>
    ),
  },
  {
    id: 'step3',
    label: 'Review',
    render: (data) => (
      <div>
        <h3>Step 3 Content</h3>
        <p>Name: {data.name}</p>
        <p>Address: {data.address}</p>
      </div>
    ),
  },
];

describe('FormWizard Component', () => {
  describe('Basic Rendering', () => {
    it('renders first step by default', () => {
      render(<FormWizard steps={mockSteps} />);

      expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
      expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument();
    });

    it('renders all step labels', () => {
      render(<FormWizard steps={mockSteps} />);

      expect(screen.getByText('Personal Info')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('shows progress bar when enabled', () => {
      const { container } = render(
        <FormWizard steps={mockSteps} showProgress={true} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('hides progress bar when disabled', () => {
      const { container } = render(
        <FormWizard steps={mockSteps} showProgress={false} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('shows Next button on first step', () => {
      render(<FormWizard steps={mockSteps} />);

      expect(screen.getByLabelText('Next step')).toBeInTheDocument();
    });

    it('disables Previous button on first step', () => {
      render(<FormWizard steps={mockSteps} />);

      const prevButton = screen.getByLabelText('Previous step');
      expect(prevButton).toBeDisabled();
    });

    it('navigates to next step on Next click', async () => {
      render(<FormWizard steps={mockSteps} />);

      const nextButton = screen.getByLabelText('Next step');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
      });
    });

    it('navigates to previous step on Previous click', async () => {
      render(<FormWizard steps={mockSteps} />);

      // Go to step 2
      fireEvent.click(screen.getByLabelText('Next step'));

      await waitFor(() => {
        expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(screen.getByLabelText('Previous step'));

      await waitFor(() => {
        expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
      });
    });

    it('shows Submit button on last step', async () => {
      render(<FormWizard steps={mockSteps} />);

      // Navigate to last step
      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 2 Content'));

      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 3 Content'));

      expect(screen.getByLabelText('Submit form')).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('persists data across steps when enabled', async () => {
      render(<FormWizard steps={mockSteps} persistData={true} />);

      // Enter data in step 1
      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      // Navigate to step 2
      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 2 Content'));

      // Enter data in step 2
      const addressInput = screen.getByTestId('address-input');
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });

      // Navigate to step 3
      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 3 Content'));

      // Verify data is preserved
      expect(screen.getByText('Name: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Address: 123 Main St')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('calls validation before moving to next step', async () => {
      const mockValidate = jest.fn().mockResolvedValue({ valid: true });

      render(
        <FormWizard
          steps={mockSteps}
          onValidateStep={mockValidate}
        />
      );

      fireEvent.click(screen.getByLabelText('Next step'));

      await waitFor(() => {
        expect(mockValidate).toHaveBeenCalledWith(0, expect.any(Object));
      });
    });

    it('prevents navigation on validation failure', async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: false,
        error: 'Please complete all fields',
      });

      render(
        <FormWizard
          steps={mockSteps}
          onValidateStep={mockValidate}
        />
      );

      fireEvent.click(screen.getByLabelText('Next step'));

      await waitFor(() => {
        expect(screen.getByText('Please complete all fields')).toBeInTheDocument();
      });

      // Should still be on step 1
      expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
    });

    it('shows validation error message', async () => {
      const mockValidate = jest.fn().mockResolvedValue({
        valid: false,
        error: 'Name is required',
      });

      render(
        <FormWizard
          steps={mockSteps}
          onValidateStep={mockValidate}
        />
      );

      fireEvent.click(screen.getByLabelText('Next step'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
      });
    });
  });

  describe('Submission', () => {
    it('calls onSubmit on final step', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);

      render(
        <FormWizard
          steps={mockSteps}
          onSubmit={mockSubmit}
        />
      );

      // Navigate to last step
      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 2 Content'));

      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 3 Content'));

      // Submit
      fireEvent.click(screen.getByLabelText('Submit form'));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(expect.any(Object));
      });
    });

    it('shows loading state during submission', async () => {
      const mockSubmit = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <FormWizard
          steps={mockSteps}
          onSubmit={mockSubmit}
        />
      );

      // Navigate to last step
      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 2 Content'));

      fireEvent.click(screen.getByLabelText('Next step'));
      await waitFor(() => screen.getByText('Step 3 Content'));

      // Submit
      const submitButton = screen.getByLabelText('Submit form');
      fireEvent.click(submitButton);

      // Should show loading state
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Linear Mode', () => {
    it('prevents skipping steps in linear mode', () => {
      render(<FormWizard steps={mockSteps} linear={true} />);

      const step3Indicator = screen.getByLabelText('Step 3: Review');

      // Try to click on step 3
      fireEvent.click(step3Indicator);

      // Should still be on step 1
      expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
    });

    it('allows skipping steps in non-linear mode', async () => {
      render(<FormWizard steps={mockSteps} linear={false} />);

      const step3Indicator = screen.getByLabelText('Step 3: Review');

      // Click on step 3
      fireEvent.click(step3Indicator);

      await waitFor(() => {
        expect(screen.getByText('Step 3 Content')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation role', () => {
      render(<FormWizard steps={mockSteps} />);

      expect(screen.getByRole('navigation', { name: 'Form wizard steps' })).toBeInTheDocument();
    });

    it('marks current step with aria-current', () => {
      render(<FormWizard steps={mockSteps} />);

      const step1Indicator = screen.getByLabelText('Step 1: Personal Info');
      expect(step1Indicator).toHaveAttribute('aria-current', 'step');
    });

    it('progress bar has proper ARIA attributes', () => {
      const { container } = render(
        <FormWizard steps={mockSteps} showProgress={true} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Step Change Callback', () => {
    it('calls onStepChange when step changes', async () => {
      const mockStepChange = jest.fn();

      render(
        <FormWizard
          steps={mockSteps}
          onStepChange={mockStepChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Next step'));

      await waitFor(() => {
        expect(mockStepChange).toHaveBeenCalledWith(1, mockSteps[1]);
      });
    });
  });
});
