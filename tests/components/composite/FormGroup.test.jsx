/**
 * FormGroup Component Tests
 * @version 1.0.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormGroup, { FormRow, FormColumn } from '../../../src/components/composite/FormGroup.jsx';
import Input from '../../../src/components/ui/Input.jsx';
import FormField from '../../../src/components/ui/FormField.jsx';

describe('FormGroup Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(
        <FormGroup>
          <div data-testid="child">Child content</div>
        </FormGroup>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <FormGroup title="Personal Information">
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <FormGroup
          title="Contact"
          description="Enter your contact details"
        >
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByText('Enter your contact details')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <FormGroup title="Required Group" required>
          <div>Content</div>
        </FormGroup>
      );

      const title = screen.getByText('Required Group');
      expect(title.querySelector('span')).toHaveAttribute('aria-label', 'required');
    });
  });

  describe('Layout Variants', () => {
    it('renders vertical layout by default', () => {
      const { container } = render(
        <FormGroup>
          <Input />
          <Input />
        </FormGroup>
      );

      const fieldsContainer = container.querySelector('.form-group-fields');
      expect(fieldsContainer).toHaveStyle({ flexDirection: 'column' });
    });

    it('renders horizontal layout', () => {
      const { container } = render(
        <FormGroup layout="horizontal">
          <Input />
          <Input />
        </FormGroup>
      );

      const fieldsContainer = container.querySelector('.form-group-fields');
      expect(fieldsContainer).toHaveStyle({ flexDirection: 'row' });
    });

    it('renders grid layout with columns', () => {
      const { container } = render(
        <FormGroup layout="grid" columns={3}>
          <Input />
          <Input />
          <Input />
        </FormGroup>
      );

      const fieldsContainer = container.querySelector('.form-group-fields');
      expect(fieldsContainer).toHaveStyle({ display: 'grid' });
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      render(
        <FormGroup error="Please fix the errors in this section">
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByText('Please fix the errors in this section')).toBeInTheDocument();
    });

    it('has error role for accessibility', () => {
      render(
        <FormGroup error="Error message">
          <div>Content</div>
        </FormGroup>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('sets aria-invalid when error exists', () => {
      const { container } = render(
        <FormGroup error="Error message">
          <div>Content</div>
        </FormGroup>
      );

      const group = container.querySelector('.form-group');
      expect(group).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles', () => {
      const { container } = render(
        <FormGroup disabled>
          <div>Content</div>
        </FormGroup>
      );

      const group = container.querySelector('.form-group');
      expect(group).toHaveStyle({ opacity: 0.6, pointerEvents: 'none' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      const { container } = render(
        <FormGroup title="Test Group">
          <div>Content</div>
        </FormGroup>
      );

      const group = container.querySelector('.form-group');
      expect(group).toHaveAttribute('role', 'group');
    });

    it('connects title with aria-labelledby', () => {
      render(
        <FormGroup title="Account Settings">
          <div>Content</div>
        </FormGroup>
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'group-title');
    });

    it('connects description with aria-describedby', () => {
      render(
        <FormGroup
          title="Settings"
          description="Configure your preferences"
        >
          <div>Content</div>
        </FormGroup>
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-describedby', 'group-description');
    });
  });
});

describe('FormRow Component', () => {
  it('renders children in horizontal layout', () => {
    const { container } = render(
      <FormRow>
        <Input />
        <Input />
      </FormRow>
    );

    const row = container.querySelector('.form-row');
    expect(row).toHaveStyle({ display: 'flex', flexDirection: 'row' });
  });

  it('applies spacing correctly', () => {
    const { container } = render(
      <FormRow spacing="lg">
        <Input />
        <Input />
      </FormRow>
    );

    const row = container.querySelector('.form-row');
    expect(row).toHaveStyle({ gap: expect.any(String) });
  });
});

describe('FormColumn Component', () => {
  it('renders with default span', () => {
    const { container } = render(
      <FormColumn>
        <Input />
      </FormColumn>
    );

    const column = container.querySelector('.form-column');
    expect(column).toHaveStyle({ flex: '1 1 0%' });
  });

  it('renders with custom span', () => {
    const { container } = render(
      <FormColumn span={2}>
        <Input />
      </FormColumn>
    );

    const column = container.querySelector('.form-column');
    expect(column).toHaveStyle({ flex: '2 1 0%' });
  });
});

describe('FormGroup Integration', () => {
  it('works with FormField components', () => {
    render(
      <FormGroup title="User Details">
        <FormField label="Name">
          <Input />
        </FormField>
        <FormField label="Email">
          <Input type="email" />
        </FormField>
      </FormGroup>
    );

    expect(screen.getByText('User Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('maintains proper spacing between fields', () => {
    const { container } = render(
      <FormGroup spacing="lg">
        <FormField label="Field 1">
          <Input />
        </FormField>
        <FormField label="Field 2">
          <Input />
        </FormField>
      </FormGroup>
    );

    const fieldsContainer = container.querySelector('.form-group-fields');
    expect(fieldsContainer).toBeTruthy();
  });
});
