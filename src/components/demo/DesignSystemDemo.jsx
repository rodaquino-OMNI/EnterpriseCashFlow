/**
 * Design System Demo Component
 * Demonstrates the Phase 1 foundation components and accessibility features
 * @version 1.0.0
 */

import React, { useState } from 'react';
import Button from '../ui/Button.jsx';
import FormField, { FormFieldGroup, FormSection } from '../ui/FormField.jsx';
import Input, { validators, composeValidators } from '../ui/Input.jsx';
import { useFocusManagement, useAnnouncement } from '../../hooks/useAccessibility.js';
import { designTokens } from '../../design-system/tokens.js';

/**
 * DesignSystemDemo Component
 * 
 * Interactive demonstration of the design system foundation components.
 * Shows proper usage patterns and accessibility features.
 */
const DesignSystemDemo = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    amount: '',
    description: '',
    category: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accessibility hooks
  const { containerRef, activate, deactivate } = useFocusManagement({
    trapFocus: false,
    restoreOnUnmount: true,
  });

  const { announce } = useAnnouncement({
    politeness: 'polite',
    timeout: 3000,
  });

  // Handle input changes
  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Email validation
    const emailResult = composeValidators(
      validators.required,
      validators.email,
    )(formData.email);
    if (emailResult !== true) {
      errors.email = emailResult;
    }

    // Amount validation
    const amountResult = composeValidators(
      validators.required,
      validators.currency,
    )(formData.amount);
    if (amountResult !== true) {
      errors.amount = amountResult;
    }

    // Description validation
    const descriptionResult = composeValidators(
      validators.required,
      validators.minLength(10),
    )(formData.description);
    if (descriptionResult !== true) {
      errors.description = descriptionResult;
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      announce('Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);
    announce('Submitting form...');

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      announce('Form submitted successfully!');
      
      // Reset form
      setFormData({
        email: '',
        amount: '',
        description: '',
        category: '',
      });
    } catch (error) {
      announce('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      email: '',
      amount: '',
      description: '',
      category: '',
    });
    setFormErrors({});
    announce('Form has been reset');
  };

  // Demo styles
  const demoStyles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: designTokens.spacing[6],
      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
      backgroundColor: designTokens.colors.white,
      minHeight: '100vh',
    },
    header: {
      marginBottom: designTokens.spacing[8],
      textAlign: 'center',
    },
    title: {
      fontSize: designTokens.typography.fontSize['3xl'][0],
      fontWeight: designTokens.typography.fontWeight.bold,
      color: designTokens.colors.secondary[900],
      marginBottom: designTokens.spacing[4],
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    subtitle: {
      fontSize: designTokens.typography.fontSize.lg[0],
      color: designTokens.colors.secondary[600],
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    buttonGroup: {
      display: 'flex',
      gap: designTokens.spacing[3],
      justifyContent: 'center',
      marginTop: designTokens.spacing[6],
      flexWrap: 'wrap',
    },
    demoSection: {
      marginBottom: designTokens.spacing[8],
      padding: designTokens.spacing[6],
      border: `1px solid ${designTokens.colors.secondary[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      backgroundColor: designTokens.colors.secondary[50],
    },
    sectionTitle: {
      fontSize: designTokens.typography.fontSize.xl[0],
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: designTokens.colors.secondary[800],
      marginBottom: designTokens.spacing[4],
    },
  };

  return (
    <div ref={containerRef} style={demoStyles.container}>
      {/* Header */}
      <header style={demoStyles.header}>
        <h1 style={demoStyles.title}>
          EnterpriseCashFlow Design System
        </h1>
        <p style={demoStyles.subtitle}>
          Phase 1 Foundation Components Demo
        </p>
      </header>

      {/* Button Variants Demo */}
      <section style={demoStyles.demoSection}>
        <h2 style={demoStyles.sectionTitle}>Button Components</h2>
        <p style={{ marginBottom: designTokens.spacing[4], color: designTokens.colors.secondary[600] }}>
          Accessible button components with multiple variants and states.
        </p>
        
        <div style={demoStyles.buttonGroup}>
          <Button variant="primary" size="sm">
            Primary Small
          </Button>
          <Button variant="secondary" size="md">
            Secondary Medium
          </Button>
          <Button variant="outline" size="lg">
            Outline Large
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
          <Button variant="danger" disabled>
            Disabled Danger
          </Button>
          <Button variant="primary" loading>
            Loading State
          </Button>
        </div>
      </section>

      {/* Form Components Demo */}
      <section style={demoStyles.demoSection}>
        <h2 style={demoStyles.sectionTitle}>Form Components</h2>
        <p style={{ marginBottom: designTokens.spacing[4], color: designTokens.colors.secondary[600] }}>
          Accessible form components with validation and real-time feedback.
        </p>

        <form onSubmit={handleSubmit}>
          <FormSection
            title="Transaction Details"
            description="Enter the details for your cash flow transaction."
          >
            <FormFieldGroup spacing="md">
              <FormField
                label="Email Address"
                required
                error={formErrors.email}
                hint="We'll use this to send you transaction confirmations"
              >
                <Input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="Enter your email address"
                  validator={composeValidators(validators.required, validators.email)}
                  validateOnBlur
                  error={!!formErrors.email}
                />
              </FormField>

              <FormField
                label="Transaction Amount"
                required
                error={formErrors.amount}
                hint="Enter amount in USD (e.g., 123.45)"
              >
                <Input
                  type="text"
                  value={formData.amount}
                  onChange={handleInputChange('amount')}
                  placeholder="0.00"
                  validator={composeValidators(validators.required, validators.currency)}
                  validateOnBlur
                  error={!!formErrors.amount}
                />
              </FormField>

              <FormField
                label="Description"
                required
                error={formErrors.description}
                hint="Provide a detailed description (minimum 10 characters)"
              >
                <Input
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  placeholder="Enter transaction description"
                  validator={composeValidators(
                    validators.required,
                    validators.minLength(10),
                  )}
                  validateOnBlur
                  error={!!formErrors.description}
                />
              </FormField>

              <FormField
                label="Category"
                hint="Optional categorization for reporting"
              >
                <Input
                  type="text"
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  placeholder="e.g., Office Supplies, Travel, etc."
                />
              </FormField>
            </FormFieldGroup>
          </FormSection>

          <div style={demoStyles.buttonGroup}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Transaction'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset Form
            </Button>
          </div>
        </form>
      </section>

      {/* Input Variants Demo */}
      <section style={demoStyles.demoSection}>
        <h2 style={demoStyles.sectionTitle}>Input Variants</h2>
        <p style={{ marginBottom: designTokens.spacing[4], color: designTokens.colors.secondary[600] }}>
          Different input variants and sizes for various use cases.
        </p>

        <FormFieldGroup spacing="md">
          <FormField label="Default Input" inline>
            <Input
              placeholder="Default variant"
              variant="default"
              size="md"
            />
          </FormField>

          <FormField label="Filled Input" inline>
            <Input
              placeholder="Filled variant"
              variant="filled"
              size="md"
            />
          </FormField>

          <FormField label="Outline Input" inline>
            <Input
              placeholder="Outline variant"
              variant="outline"
              size="md"
            />
          </FormField>

          <FormField label="Small Size" inline>
            <Input
              placeholder="Small input"
              size="sm"
            />
          </FormField>

          <FormField label="Large Size" inline>
            <Input
              placeholder="Large input"
              size="lg"
            />
          </FormField>

          <FormField label="Disabled State" inline>
            <Input
              placeholder="Disabled input"
              disabled
              value="Cannot edit this"
            />
          </FormField>

          <FormField label="Read-only State" inline>
            <Input
              placeholder="Read-only input"
              readOnly
              value="Read-only value"
            />
          </FormField>
        </FormFieldGroup>
      </section>

      {/* Accessibility Features */}
      <section style={demoStyles.demoSection}>
        <h2 style={demoStyles.sectionTitle}>Accessibility Features</h2>
        <p style={{ marginBottom: designTokens.spacing[4], color: designTokens.colors.secondary[600] }}>
          All components follow WCAG 2.1 AA guidelines and include:
        </p>
        
        <ul style={{ 
          marginLeft: designTokens.spacing[6], 
          color: designTokens.colors.secondary[700],
          lineHeight: designTokens.typography.lineHeight.relaxed,
        }}>
          <li>Proper ARIA attributes and labels</li>
          <li>Keyboard navigation support</li>
          <li>Focus management and visual indicators</li>
          <li>Screen reader announcements</li>
          <li>High contrast color ratios</li>
          <li>Reduced motion preferences</li>
          <li>Semantic HTML structure</li>
        </ul>

        <div style={{ marginTop: designTokens.spacing[4] }}>
          <Button
            variant="secondary"
            onClick={() => announce('Accessibility announcement test - this message was announced to screen readers')}
          >
            Test Screen Reader Announcement
          </Button>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemDemo;