/**
 * FormWizard Component - Composite Form Component
 * Multi-step form wizard with navigation and validation
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { designTokens } from '../../design-system/tokens.js';
import Button from '../ui/Button.jsx';

/**
 * FormWizard Component
 *
 * Multi-step form wizard with step navigation, validation, and progress tracking.
 * Supports linear and non-linear navigation, step validation, and custom actions.
 *
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step configurations
 * @param {Function} props.onSubmit - Called when wizard is completed
 * @param {Function} props.onStepChange - Called when step changes
 * @param {Function} props.onValidateStep - Validates current step before navigation
 * @param {Object} props.initialValues - Initial form values
 * @param {boolean} props.linear - Whether navigation must be sequential
 * @param {boolean} props.showProgress - Show progress indicator
 * @param {boolean} props.persistData - Persist data across steps
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
const FormWizard = ({
  steps = [],
  onSubmit,
  onStepChange,
  onValidateStep,
  initialValues = {},
  linear = true,
  showProgress = true,
  persistData = true,
  className = '',
  style = {},
  ...props
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(initialValues);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Calculate progress percentage
  const progress = useMemo(() => {
    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
  }, [currentStepIndex, steps.length]);

  // Update form data
  const updateFormData = useCallback((stepData) => {
    if (persistData) {
      setFormData(prev => ({ ...prev, ...stepData }));
    }
  }, [persistData]);

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    if (!onValidateStep) return { valid: true };

    try {
      const result = await onValidateStep(currentStepIndex, formData);

      if (result.valid) {
        setStepErrors(prev => {
          const next = { ...prev };
          delete next[currentStepIndex];
          return next;
        });
        return { valid: true };
      } else {
        setStepErrors(prev => ({ ...prev, [currentStepIndex]: result.error }));
        return { valid: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error.message || 'Validation failed';
      setStepErrors(prev => ({ ...prev, [currentStepIndex]: errorMsg }));
      return { valid: false, error: errorMsg };
    }
  }, [currentStepIndex, formData, onValidateStep]);

  // Navigate to specific step
  const goToStep = useCallback(async (stepIndex) => {
    if (stepIndex === currentStepIndex) return;

    // Check if navigation is allowed
    if (linear && stepIndex > currentStepIndex + 1) {
      return; // Can't skip steps in linear mode
    }

    // Validate current step before moving forward
    if (stepIndex > currentStepIndex) {
      const validation = await validateCurrentStep();
      if (!validation.valid) return;

      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
    }

    setCurrentStepIndex(stepIndex);

    if (onStepChange) {
      onStepChange(stepIndex, steps[stepIndex]);
    }
  }, [currentStepIndex, linear, steps, validateCurrentStep, onStepChange]);

  // Go to next step
  const handleNext = useCallback(async () => {
    const validation = await validateCurrentStep();
    if (!validation.valid) return;

    setCompletedSteps(prev => new Set([...prev, currentStepIndex]));

    if (isLastStep) {
      // Submit form
      setIsSubmitting(true);
      try {
        if (onSubmit) {
          await onSubmit(formData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      goToStep(currentStepIndex + 1);
    }
  }, [currentStepIndex, formData, isLastStep, onSubmit, validateCurrentStep, goToStep]);

  // Go to previous step
  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    ...style,
  };

  const stepperStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${designTokens.spacing[4]} 0`,
    marginBottom: designTokens.spacing[6],
  };

  const progressBarContainerStyles = {
    width: '100%',
    height: '8px',
    backgroundColor: designTokens.colors.secondary[200],
    borderRadius: designTokens.borderRadius.full,
    overflow: 'hidden',
    marginBottom: designTokens.spacing[6],
  };

  const progressBarStyles = {
    height: '100%',
    backgroundColor: designTokens.colors.primary[500],
    transition: `width ${designTokens.animation.duration[300]} ${designTokens.animation.easing['in-out']}`,
    width: `${progress}%`,
  };

  const contentStyles = {
    flex: 1,
    marginBottom: designTokens.spacing[6],
    minHeight: '300px',
  };

  const navigationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: designTokens.spacing[3],
    paddingTop: designTokens.spacing[4],
    borderTop: `1px solid ${designTokens.colors.secondary[200]}`,
  };

  const errorStyles = {
    padding: designTokens.spacing[3],
    backgroundColor: designTokens.colors.semantic.error[50],
    border: `1px solid ${designTokens.colors.semantic.error[200]}`,
    borderRadius: designTokens.borderRadius.md,
    color: designTokens.colors.semantic.error[600],
    fontSize: designTokens.typography.fontSize.sm[0],
    marginBottom: designTokens.spacing[4],
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[2],
  };

  // Step indicator component
  const StepIndicator = ({ step, index, isActive, isCompleted }) => {
    const canNavigate = !linear || isCompleted || index <= currentStepIndex;

    const stepStyles = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      position: 'relative',
      cursor: canNavigate ? 'pointer' : 'default',
    };

    const circleStyles = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: designTokens.typography.fontSize.sm[0],
      fontWeight: designTokens.typography.fontWeight.semibold,
      backgroundColor: isCompleted
        ? designTokens.colors.primary[500]
        : isActive
          ? designTokens.colors.primary[100]
          : designTokens.colors.secondary[200],
      color: isCompleted
        ? designTokens.colors.white
        : isActive
          ? designTokens.colors.primary[700]
          : designTokens.colors.secondary[600],
      border: isActive ? `2px solid ${designTokens.colors.primary[500]}` : 'none',
      transition: `all ${designTokens.animation.duration[200]} ${designTokens.animation.easing['in-out']}`,
    };

    const labelStyles = {
      marginTop: designTokens.spacing[2],
      fontSize: designTokens.typography.fontSize.xs[0],
      color: isActive ? designTokens.colors.secondary[800] : designTokens.colors.secondary[600],
      textAlign: 'center',
      fontWeight: isActive ? designTokens.typography.fontWeight.medium : designTokens.typography.fontWeight.normal,
    };

    const lineStyles = {
      position: 'absolute',
      top: '20px',
      left: '50%',
      width: '100%',
      height: '2px',
      backgroundColor: isCompleted
        ? designTokens.colors.primary[500]
        : designTokens.colors.secondary[200],
      zIndex: -1,
    };

    return (
      <div
        style={stepStyles}
        onClick={() => canNavigate && goToStep(index)}
        role="button"
        tabIndex={canNavigate ? 0 : -1}
        aria-label={`Step ${index + 1}: ${step.label}`}
        aria-current={isActive ? 'step' : undefined}
      >
        <div style={circleStyles}>
          {isCompleted ? '✓' : index + 1}
        </div>
        <div style={labelStyles}>{step.label}</div>
        {index < steps.length - 1 && <div style={lineStyles} />}
      </div>
    );
  };

  const ErrorIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1"/>
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className={`form-wizard ${className}`} style={containerStyles} {...props}>
      {/* Progress Bar */}
      {showProgress && (
        <div style={progressBarContainerStyles}>
          <div style={progressBarStyles} role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100" />
        </div>
      )}

      {/* Step Indicators */}
      <div style={stepperStyles} role="navigation" aria-label="Form wizard steps">
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id || index}
            step={step}
            index={index}
            isActive={index === currentStepIndex}
            isCompleted={completedSteps.has(index)}
          />
        ))}
      </div>

      {/* Step Error */}
      {stepErrors[currentStepIndex] && (
        <div style={errorStyles} role="alert" aria-live="polite">
          <ErrorIcon />
          <span>{stepErrors[currentStepIndex]}</span>
        </div>
      )}

      {/* Step Content */}
      <div style={contentStyles}>
        {currentStep?.component ? (
          React.cloneElement(currentStep.component, {
            data: formData,
            onUpdate: updateFormData,
          })
        ) : (
          currentStep?.render?.(formData, updateFormData)
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={navigationStyles}>
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isSubmitting}
          aria-label="Previous step"
        >
          Previous
        </Button>

        <div style={{ display: 'flex', gap: designTokens.spacing[2] }}>
          {currentStep?.actions}

          <Button
            variant="primary"
            onClick={handleNext}
            loading={isSubmitting}
            disabled={isSubmitting}
            aria-label={isLastStep ? 'Submit form' : 'Next step'}
          >
            {isLastStep ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>

      <style>
        {`
          .form-wizard {
            animation: fadeIn 300ms ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @media (max-width: 640px) {
            .form-wizard [role="navigation"] {
              overflow-x: auto;
              padding-bottom: ${designTokens.spacing[2]};
            }
          }
        `}
      </style>
    </div>
  );
};

FormWizard.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      component: PropTypes.element,
      render: PropTypes.func,
      actions: PropTypes.node,
    }),
  ).isRequired,
  onSubmit: PropTypes.func,
  onStepChange: PropTypes.func,
  onValidateStep: PropTypes.func,
  initialValues: PropTypes.object,
  linear: PropTypes.bool,
  showProgress: PropTypes.bool,
  persistData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default FormWizard;
