# EnterpriseCashFlow - Phase 1 Implementation Guide

## 1. Executive Summary

**Document Purpose:** Detailed implementation guide for Phase 1 UX improvements  
**Version:** 1.0  
**Implementation Period:** Weeks 1-4 (Foundation Phase)  
**Target Completion:** February 2025  

### 1.1 Phase 1 Objectives
- **Foundation:** Establish design system and core component architecture
- **Layout:** Implement responsive layout and navigation improvements
- **Accessibility:** Build WCAG 2.1 AA compliance into foundation
- **Performance:** Set up code splitting and optimization infrastructure

### 1.2 Phase 1 Deliverables
- Atomic design system with 20+ reusable components
- Responsive layout system with mobile-first approach
- Accessibility framework with automated testing
- Performance monitoring and optimization setup
- Component documentation and testing suite

## 2. Week 1-2: Design System and Core Components

### 2.1 Design System Foundation

#### 2.1.1 Design Tokens Implementation
```typescript
// src/design-system/tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      500: '#64748b',
      700: '#334155',
      900: '#0f172a'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }]
    }
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
};
```

#### 2.1.2 Atomic Components Implementation

**Button Component**
```typescript
// src/components/ui/Button/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      },
      size: {
        sm: 'h-9 px-3 rounded-md',
        md: 'h-10 py-2 px-4',
        lg: 'h-11 px-8 rounded-md'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

**FormField Component**
```typescript
// src/components/ui/FormField/FormField.tsx
import React, { useId } from 'react';
import { cn } from '../../../utils/cn';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactElement;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  children,
  className
}) => {
  const fieldId = useId();
  const errorId = useId();
  const hintId = useId();

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          required && 'after:content-["*"] after:ml-0.5 after:text-destructive'
        )}
      >
        {label}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : 'false',
        className: cn(
          children.props.className,
          error && 'border-destructive focus-visible:ring-destructive'
        )
      })}
      
      {error && (
        <p
          id={errorId}
          className="text-sm font-medium text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};
```

**Input Component**
```typescript
// src/components/ui/Input/Input.tsx
import React from 'react';
import { cn } from '../../../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

### 2.2 Component Testing Setup

#### 2.2.1 Testing Utilities
```typescript
// src/test-utils/render.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../components/providers/ThemeProvider';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light">
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

#### 2.2.2 Component Tests
```typescript
// src/components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '../../../test-utils/render';
import { Button } from './Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  test('supports keyboard navigation', () => {
    render(<Button>Keyboard test</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
  });
});
```

### 2.3 Accessibility Framework

#### 2.3.1 Accessibility Testing Setup
```typescript
// src/test-utils/accessibility.ts
import { configureAxe } from 'jest-axe';

export const axe = configureAxe({
  rules: {
    // Disable color-contrast rule for testing (we'll test this separately)
    'color-contrast': { enabled: false }
  }
});

export const toHaveNoViolations = expect.extend({
  async toHaveNoViolations(received) {
    const results = await axe(received);
    const pass = results.violations.length === 0;
    
    if (pass) {
      return {
        message: () => 'Expected element to have accessibility violations',
        pass: true
      };
    } else {
      return {
        message: () => 
          `Expected element to have no accessibility violations, but found:\n${
            results.violations.map(v => `- ${v.description}`).join('\n')
          }`,
        pass: false
      };
    }
  }
});
```

#### 2.3.2 Accessibility Hooks
```typescript
// src/hooks/useAccessibility.ts
import { useEffect, useRef } from 'react';

export const useFocusManagement = (isOpen: boolean) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in container
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  return containerRef;
};

export const useKeyboardNavigation = (
  items: any[],
  onSelect: (item: any) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        // Handle escape
        break;
    }
  }, [items, focusedIndex, onSelect]);

  return { focusedIndex, handleKeyDown };
};
```

## 3. Week 3-4: Layout and Navigation

### 3.1 Responsive Layout System

#### 3.1.1 Layout Components
```typescript
// src/components/layout/Container/Container.tsx
import React from 'react';
import { cn } from '../../../utils/cn';

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full'
};

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className
}) => {
  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      containerSizes[size],
      className
    )}>
      {children}
    </div>
  );
};
```

**Grid System**
```typescript
// src/components/layout/Grid/Grid.tsx
import React from 'react';
import { cn } from '../../../utils/cn';

export interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12'
};

const gridGaps = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className
}) => {
  return (
    <div className={cn(
      'grid',
      gridCols[cols],
      gridGaps[gap],
      className
    )}>
      {children}
    </div>
  );
};
```

### 3.2 Navigation Components

#### 3.2.1 Navigation Stepper
```typescript
// src/components/navigation/NavigationStepper/NavigationStepper.tsx
import React from 'react';
import { cn } from '../../../utils/cn';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface NavigationStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  optional?: boolean;
}

export interface NavigationStepperProps {
  steps: NavigationStep[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  allowSkipping?: boolean;
  className?: string;
}

export const NavigationStepper: React.FC<NavigationStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowSkipping = false,
  className
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress" className={cn('', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isClickable = onStepClick && (
            allowSkipping || 
            step.status === 'completed' || 
            index <= currentIndex
          );

          return (
            <li key={step.id} className={cn(
              'relative',
              index !== steps.length - 1 && 'pr-8 sm:pr-20'
            )}>
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className={cn(
                    'h-0.5 w-full',
                    step.status === 'completed' 
                      ? 'bg-primary' 
                      : 'bg-gray-200'
                  )} />
                </div>
              )}

              {/* Step Button/Indicator */}
              <button
                type="button"
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  step.status === 'completed' && 'border-primary bg-primary text-white',
                  step.status === 'current' && 'border-primary bg-white text-primary',
                  step.status === 'error' && 'border-red-500 bg-red-500 text-white',
                  step.status === 'pending' && 'border-gray-300 bg-white text-gray-500',
                  isClickable && 'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  !isClickable && 'cursor-default'
                )}
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {step.status === 'completed' ? (
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                ) : step.status === 'error' ? (
                  <span className="text-sm font-medium">!</span>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              {/* Step Label */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    step.status === 'current' && 'text-primary',
                    step.status === 'completed' && 'text-gray-900',
                    step.status === 'error' && 'text-red-600',
                    step.status === 'pending' && 'text-gray-500'
                  )}>
                    {step.title}
                    {step.optional && (
                      <span className="text-xs text-gray-400 ml-1">(optional)</span>
                    )}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
```

### 3.3 Mobile-First Responsive Design

#### 3.3.1 Responsive Utilities
```typescript
// src/utils/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, breakpoint]);

  return matches;
};

export const useIsMobile = () => useBreakpoint('md');
```

#### 3.3.2 Mobile Navigation
```typescript
// src/components/navigation/MobileNavigation/MobileNavigation.tsx
import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/Button/Button';
import { useFocusManagement } from '../../../hooks/useAccessibility';

export interface MobileNavigationProps {
  children: React.ReactNode;
  title?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  children,
  title = 'Navigation'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useFocusManagement(isOpen);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            ref={containerRef}
            className="fixed inset-y-0 right-0 flex max-w-xs w-full"
          >
            <div className="flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  {title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

## 4. Performance Infrastructure

### 4.1 Code Splitting Setup

#### 4.1.1 Lazy Loading Components
```typescript
// src/components/lazy/LazyComponents.ts
import { lazy } from 'react';

// Lazy load major feature components
export const ManualDataEntry = lazy(() => 
  import('../InputPanel/ManualDataEntry').then(module => ({
    default: module.default
  }))
);

export const ExcelUploader = lazy(() => 
  import('../InputPanel/ExcelUploader').then(module => ({
    default: module.default
  }))
);

export const PdfUploader = lazy(() => 
  import('../InputPanel/PdfUploader').then(module => ({
    default: module.default
  }))
);

export const ReportRenderer = lazy(() => 
  import('../ReportPanel/ReportRenderer').then(module => ({
    default: module.default
  }))
);

export const AIPanel = lazy(() => 
  import('../AIPanel/AIPanel').then(module => ({
    default: module.default
  }))
);
```

#### 4.1.2 Suspense Wrapper
```typescript
// src/components/common/SuspenseWrapper/SuspenseWrapper.tsx
import React, { Suspense } from 'react';
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner';

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorBoundary = true
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-sm text-gray-600">Loading...</span>
    </div>
  );

  const content = (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    );
  }

  return content;
};
```

### 4.2 Performance Monitoring

#### 4.2.1 Performance Metrics Hook
```typescript
// src/hooks/usePerformanceMetrics.ts
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export const usePerformanceMetrics = () => {
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    // Observe Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.firstContentfulPaint = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            metricsRef.current.largestContentfulPaint = entry.startTime;
            break;
          case 'first-input':
            metricsRef.current.firstInputDelay = entry.processingStart - entry.startTime;
            break;
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              metricsRef.current.cumulativeLayoutShift = 
                (metricsRef.current.cumulativeLayoutShift || 0) + entry.value;
            }
            break;
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

    return () => observer.disconnect();
  }, []);

  const reportMetrics = () => {
    // Report metrics to analytics service
    console.log('Performance Metrics:', metricsRef.current);
  };

  return { metrics: metricsRef.current, reportMetrics };
};
```

## 5. Testing and Quality Assurance

### 5.1 Testing Strategy

#### 5.1.1 Component Testing
```typescript
// src/components/ui/FormField/FormField.test.tsx
import { render, screen } from '../../../test-utils/render';
import { axe, toHaveNoViolations } from '../../../test-utils/accessibility';
import { FormField } from './FormField';
import { Input } from '../Input/Input';

expect.extend(toHaveNoViolations);

describe('FormField', () => {
  test('renders with label and input', () => {
    render(
      <FormField label="Email">
        <Input type="email" />
      </FormField>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('shows required indicator', () => {
    render(
      <FormField label="Email" required>
        <Input type="email" />
      </FormField>
    );

    expect(screen.getByText(/email/i)).toHaveTextContent('*');
  });

  test('displays error message', () => {
    render(
      <FormField label="Email" error="Email is required">
        <Input type="email" />
      </FormField>
    );

expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('has no accessibility violations', async () => {
    const { container } = render(
      <FormField label="Email" error="Email is required">
        <Input type="email" />
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('supports keyboard navigation', () => {
    render(<FormField label="Test Field"><Input /></FormField>);
    
    const input = screen.getByRole('textbox');
    input.focus();
    
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-describedby');
  });
});
```

### 5.2 End-to-End Testing

#### 5.2.1 E2E Test Setup
```typescript
// e2e/setup.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Custom fixtures for common test patterns
  designSystemPage: async ({ page }, use) => {
    await page.goto('/design-system');
    await use(page);
  }
});

export { expect };
```

#### 5.2.2 Component E2E Tests
```typescript
// e2e/components/button.spec.ts
import { test, expect } from '../setup';

test.describe('Button Component', () => {
  test('should render all variants', async ({ page }) => {
    await page.goto('/design-system/button');
    
    // Test primary button
    const primaryButton = page.getByRole('button', { name: 'Primary' });
    await expect(primaryButton).toBeVisible();
    await expect(primaryButton).toHaveClass(/bg-primary/);
    
    // Test secondary button
    const secondaryButton = page.getByRole('button', { name: 'Secondary' });
    await expect(secondaryButton).toBeVisible();
    await expect(secondaryButton).toHaveClass(/bg-secondary/);
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/design-system/button');
    
    const loadingButton = page.getByRole('button', { name: 'Loading' });
    await expect(loadingButton).toBeDisabled();
    await expect(loadingButton).toContainText('Loading');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/design-system/button');
    
    const button = page.getByRole('button', { name: 'Primary' });
    await button.focus();
    await expect(button).toBeFocused();
    
    await page.keyboard.press('Enter');
    // Verify button action was triggered
  });
});
```

### 5.3 Performance Testing

#### 5.3.1 Bundle Size Testing
```typescript
// scripts/bundle-size-test.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMITS = {
  'main': 250 * 1024, // 250KB
  'design-system': 100 * 1024, // 100KB
  'vendor': 500 * 1024 // 500KB
};

function checkBundleSize() {
  // Build the project
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check bundle sizes
  const buildDir = path.join(__dirname, '../build/static/js');
  const files = fs.readdirSync(buildDir);
  
  let hasErrors = false;
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(buildDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      
      // Determine bundle type from filename
      let bundleType = 'main';
      if (file.includes('vendor')) bundleType = 'vendor';
      if (file.includes('design-system')) bundleType = 'design-system';
      
      const limit = BUNDLE_SIZE_LIMITS[bundleType];
      
      if (size > limit) {
        console.error(`❌ ${file}: ${size} bytes (limit: ${limit} bytes)`);
        hasErrors = true;
      } else {
        console.log(`✅ ${file}: ${size} bytes (limit: ${limit} bytes)`);
      }
    }
  });
  
  if (hasErrors) {
    process.exit(1);
  }
}

checkBundleSize();
```

## 6. Documentation and Storybook

### 6.1 Component Documentation

#### 6.1.1 Storybook Setup
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-controls'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript'
  }
};

export default config;
```

#### 6.1.2 Component Stories
```typescript
// src/components/ui/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and accessibility features.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    loading: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Loading...'
  }
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: '📊',
    children: 'With Icon'
  }
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  )
};
```

### 6.2 Design System Documentation

#### 6.2.1 Design Tokens Documentation
```mdx
<!-- src/design-system/tokens.stories.mdx -->
import { Meta } from '@storybook/blocks';
import { designTokens } from './tokens';

<Meta title="Design System/Tokens" />

# Design Tokens

Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes.

## Colors

### Primary Colors
<div className="grid grid-cols-5 gap-4 mb-8">
  {Object.entries(designTokens.colors.primary).map(([key, value]) => (
    <div key={key} className="text-center">
      <div 
        className="w-16 h-16 rounded-lg border border-gray-200 mb-2"
        style={{ backgroundColor: value }}
      />
      <div className="text-sm font-medium">{key}</div>
      <div className="text-xs text-gray-500">{value}</div>
    </div>
  ))}
</div>

### Semantic Colors
<div className="grid grid-cols-4 gap-4 mb-8">
  {Object.entries(designTokens.colors.semantic).map(([key, value]) => (
    <div key={key} className="text-center">
      <div 
        className="w-16 h-16 rounded-lg border border-gray-200 mb-2"
        style={{ backgroundColor: value }}
      />
      <div className="text-sm font-medium capitalize">{key}</div>
      <div className="text-xs text-gray-500">{value}</div>
    </div>
  ))}
</div>

## Typography

### Font Sizes
<div className="space-y-4">
  {Object.entries(designTokens.typography.fontSize).map(([key, [size, { lineHeight }]]) => (
    <div key={key} className="flex items-center gap-4">
      <div className="w-12 text-sm text-gray-500">{key}</div>
      <div style={{ fontSize: size, lineHeight }}>
        The quick brown fox jumps over the lazy dog
      </div>
      <div className="text-xs text-gray-400">{size} / {lineHeight}</div>
    </div>
  ))}
</div>

## Spacing

<div className="grid grid-cols-6 gap-4">
  {Object.entries(designTokens.spacing).map(([key, value]) => (
    <div key={key} className="text-center">
      <div 
        className="bg-blue-200 mb-2"
        style={{ height: value, width: '100%' }}
      />
      <div className="text-sm font-medium">{key}</div>
      <div className="text-xs text-gray-500">{value}</div>
    </div>
  ))}
</div>
```

## 7. Deployment and CI/CD

### 7.1 Build Configuration

#### 7.1.1 Vite Configuration Updates
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          'design-system': ['./src/components/ui'],
          'financial-engine': ['./src/hooks/useFinancialCalculator', './src/utils/calculations']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
```

#### 7.1.2 Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "bundle-size": "node scripts/bundle-size-test.js",
    "accessibility-test": "jest --testPathPattern=accessibility"
  }
}
```

### 7.2 GitHub Actions Workflow

#### 7.2.1 CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
  
  accessibility:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Run accessibility tests
        run: npm run accessibility-test
  
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Check bundle size
        run: npm run bundle-size
      
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

## 8. Success Criteria and Validation

### 8.1 Phase 1 Success Metrics

#### 8.1.1 Technical Metrics
- **Component Library:** 20+ reusable components implemented
- **Test Coverage:** > 85% unit test coverage
- **Bundle Size:** Main bundle < 250KB gzipped
- **Accessibility:** 100% WCAG 2.1 AA compliance
- **Performance:** Core Web Vitals within targets

#### 8.1.2 Quality Metrics
- **Code Quality:** ESLint score > 95%
- **Type Safety:** 100% TypeScript coverage
- **Documentation:** All components documented in Storybook
- **Cross-browser:** 100% functionality in target browsers
- **Mobile Responsive:** All components work on mobile devices

### 8.2 Validation Checklist

#### 8.2.1 Component Validation
- [ ] All atomic components implemented with TypeScript interfaces
- [ ] Component variants and sizes working correctly
- [ ] Accessibility attributes properly implemented
- [ ] Keyboard navigation functional
- [ ] Screen reader compatibility verified
- [ ] Color contrast ratios meet WCAG standards
- [ ] Components responsive on all screen sizes
- [ ] Loading and error states implemented
- [ ] Component tests passing with > 85% coverage
- [ ] Storybook documentation complete

#### 8.2.2 Layout Validation
- [ ] Responsive grid system implemented
- [ ] Container components with size variants
- [ ] Navigation components functional
- [ ] Mobile navigation working correctly
- [ ] Breakpoint utilities implemented
- [ ] Layout shifts minimized (CLS < 0.1)
- [ ] Touch interactions optimized for mobile
- [ ] Focus management working correctly

#### 8.2.3 Performance Validation
- [ ] Code splitting implemented for major features
- [ ] Lazy loading working for heavy components
- [ ] Bundle size within limits
- [ ] Performance monitoring setup
- [ ] Core Web Vitals meeting targets
- [ ] Memory usage optimized
- [ ] Render performance acceptable

### 8.3 User Acceptance Testing

#### 8.3.1 Accessibility Testing
```typescript
// src/test-utils/accessibility-validation.ts
export const accessibilityTestSuite = {
  async validateComponent(component: HTMLElement) {
    const results = await axe(component);
    
    // Check for violations
    expect(results.violations).toHaveLength(0);
    
    // Verify keyboard navigation
    const focusableElements = component.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex');
    });
    
    // Check ARIA labels
    const interactiveElements = component.querySelectorAll('button, input, select');
    interactiveElements.forEach(element => {
      const hasLabel = element.hasAttribute('aria-label') || 
                      element.hasAttribute('aria-labelledby') ||
                      element.closest('label');
      expect(hasLabel).toBeTruthy();
    });
  }
};
```

#### 8.3.2 Cross-browser Testing
```typescript
// e2e/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test';

const browsers = ['chromium', 'firefox', 'webkit'];
const viewports = [
  devices['iPhone 12'],
  devices['iPad'],
  devices['Desktop Chrome']
];

browsers.forEach(browserName => {
  viewports.forEach(device => {
    test(`${browserName} - ${device.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device
      });
      
      const page = await context.newPage();
      await page.goto('/');
      
      // Test core functionality
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
      
      // Test responsive behavior
      if (device.viewport.width < 768) {
        await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
      }
      
      await context.close();
    });
  });
});
```

## 9. Handoff and Next Steps

### 9.1 Phase 1 Deliverables Summary

#### 9.1.1 Component Library
- **Atomic Components:** Button, Input, Label, Icon, Spinner, Badge
- **Molecular Components:** FormField, ProgressBar, StatusCard, ValidationMessage
- **Organism Components:** NavigationStepper, ErrorBoundary
- **Layout Components:** Container, Grid, MobileNavigation

#### 9.1.2 Infrastructure
- **Design System:** Tokens, utilities, and consistent styling
- **Testing Framework:** Unit, integration, E2E, and accessibility tests
- **Performance Monitoring:** Bundle size tracking and Core Web Vitals
- **Documentation:** Storybook with comprehensive component docs
- **CI/CD Pipeline:** Automated testing and deployment

### 9.2 Phase 2 Preparation

#### 9.2.1 Ready for Implementation
- **Onboarding Components:** Wizard, tutorial, and help system components
- **Enhanced Input Methods:** Smart recommendations and data preservation
- **Workflow Management:** Step navigation and state persistence
- **Progress Tracking:** Unified progress system with cancellation

#### 9.2.2 Technical Debt and Improvements
- **Performance Optimization:** Further bundle splitting and caching
- **Accessibility Enhancements:** Advanced screen reader support
- **Mobile Experience:** Progressive Web App features
- **Testing Coverage:** Increase to > 90% coverage

### 9.3 Success Validation

Phase 1 will be considered successful when:

1. **All components pass accessibility audits**
2. **Performance metrics meet defined targets**
3. **Cross-browser compatibility verified**
4. **Mobile responsiveness validated**
5. **Developer experience improved with design system**
6. **Foundation ready for Phase 2 implementation**

---

**Document Status:** Complete  
**Implementation Ready:** Yes  
**Next Phase:** Phase 2 - Enhanced Workflows (Weeks 5-8)  
**Review Date:** End of Week 4
    expect(