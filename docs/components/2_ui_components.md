# UI Components Documentation

This document provides comprehensive documentation for the base UI components in the EnterpriseCashFlow design system.

## Table of Contents

- [Overview](#overview)
- [Button Component](#button-component)
- [Input Component](#input-component)
- [FormField Component](#formfield-component)
- [Design System Integration](#design-system-integration)
- [Accessibility Features](#accessibility-features)
- [Testing Guidelines](#testing-guidelines)

---

## Overview

The UI components form the foundation of the EnterpriseCashFlow design system. These atomic components are designed for maximum reusability, accessibility, and consistency across the application.

### Design Principles

- **Accessibility First**: All components follow WCAG 2.1 AA guidelines
- **Design Token Integration**: Consistent styling using centralized design tokens
- **TypeScript Support**: Full type safety with comprehensive PropTypes
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Performance Optimized**: Minimal re-renders and efficient styling

---

## Button Component

The Button component is a versatile, accessible button with multiple variants and states.

### Import

```jsx
import Button, { 
  PrimaryButton, 
  SecondaryButton, 
  OutlineButton, 
  GhostButton, 
  DangerButton 
} from '../components/ui/Button';
```

### Basic Usage

```jsx
function MyComponent() {
  return (
    <div>
      <Button variant="primary" onClick={() => console.log('Clicked!')}>
        Primary Action
      </Button>
      
      <Button variant="secondary" size="sm">
        Secondary Action
      </Button>
      
      <Button variant="outline" loading>
        Loading...
      </Button>
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Button visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows loading spinner and disables interaction |
| `disabled` | `boolean` | `false` | Disables the button |
| `icon` | `ReactNode` | `null` | Icon element to display |
| `children` | `ReactNode` | - | Button content |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `function` | - | Click event handler |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `style` | `object` | `{}` | Inline styles |
| `ariaLabel` | `string` | - | Accessibility label |
| `ariaDescribedBy` | `string` | - | Accessibility description reference |

### Variants

#### Primary Button
```jsx
<Button variant="primary">Primary Action</Button>
// or
<PrimaryButton>Primary Action</PrimaryButton>
```

#### Secondary Button
```jsx
<Button variant="secondary">Secondary Action</Button>
// or
<SecondaryButton>Secondary Action</SecondaryButton>
```

#### Outline Button
```jsx
<Button variant="outline">Outline Action</Button>
// or
<OutlineButton>Outline Action</OutlineButton>
```

#### Ghost Button
```jsx
<Button variant="ghost">Ghost Action</Button>
// or
<GhostButton>Ghost Action</GhostButton>
```

#### Danger Button
```jsx
<Button variant="danger">Delete Item</Button>
// or
<DangerButton>Delete Item</DangerButton>
```

### Sizes

```jsx
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>
```

### States

#### Loading State
```jsx
<Button loading>
  Processing...
</Button>
```

#### Disabled State
```jsx
<Button disabled>
  Disabled Button
</Button>
```

#### With Icon
```jsx
<Button icon={<SaveIcon />}>
  Save Document
</Button>
```

### Advanced Examples

#### Form Submit Button
```jsx
<form onSubmit={handleSubmit}>
  <Button 
    type="submit" 
    variant="primary" 
    loading={isSubmitting}
    disabled={!isValid}
  >
    {isSubmitting ? 'Saving...' : 'Save Changes'}
  </Button>
</form>
```

#### Button with Custom Styling
```jsx
<Button 
  variant="primary"
  style={{ minWidth: '120px' }}
  className="custom-button"
>
  Custom Button
</Button>
```

---

## Input Component

*Note: Input component documentation will be added after examining the implementation.*

### Import

```jsx
import Input from '../components/ui/Input';
```

### Basic Usage

```jsx
<Input 
  type="text"
  placeholder="Enter your name"
  value={value}
  onChange={handleChange}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | HTML input type |
| `value` | `string` | - | Input value |
| `onChange` | `function` | - | Change event handler |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disables the input |
| `error` | `boolean` | `false` | Error state styling |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |

---

## FormField Component

*Note: FormField component documentation will be added after examining the implementation.*

### Import

```jsx
import FormField from '../components/ui/FormField';
```

### Basic Usage

```jsx
<FormField 
  label="Email Address"
  error={errors.email}
  required
>
  <Input 
    type="email"
    value={email}
    onChange={handleEmailChange}
    error={!!errors.email}
  />
</FormField>
```

---

## Design System Integration

All UI components integrate seamlessly with the design system tokens:

### Color Usage

```jsx
// Components automatically use design tokens
import { designTokens } from '../../design-system/tokens';

// Primary colors for main actions
designTokens.colors.primary[500]  // Main primary color
designTokens.colors.primary[600]  // Hover state
designTokens.colors.primary[700]  // Active state

// Semantic colors for states
designTokens.colors.semantic.error[500]    // Error states
designTokens.colors.semantic.success[500]  // Success states
designTokens.colors.semantic.warning[500]  // Warning states
```

### Spacing and Sizing

```jsx
// Component sizes use design tokens
designTokens.components.button.height.sm   // 36px
designTokens.components.button.height.md   // 40px
designTokens.components.button.height.lg   // 44px

// Padding follows design system
designTokens.components.button.padding.sm  // 0.5rem 0.75rem
designTokens.components.button.padding.md  // 0.5rem 1rem
designTokens.components.button.padding.lg  // 0.75rem 1.5rem
```

### Typography

```jsx
// Font families from design tokens
designTokens.typography.fontFamily.sans    // Primary font stack
designTokens.typography.fontWeight.medium  // Button font weight
designTokens.typography.fontSize.base      // Base font size
```

---

## Accessibility Features

### Button Accessibility

- **Keyboard Navigation**: Full keyboard support with Enter and Space keys
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators and logical tab order
- **State Communication**: Loading and disabled states communicated to assistive technology

```jsx
// Accessibility example
<Button 
  ariaLabel="Save document to cloud storage"
  ariaDescribedBy="save-help-text"
  loading={isSaving}
>
  Save
</Button>
<div id="save-help-text">
  This will save your document to the cloud and make it available across devices.
</div>
```

### Input Accessibility

- **Label Association**: Proper label-input relationships
- **Error Communication**: Clear error messaging for screen readers
- **Required Field Indication**: Visual and programmatic required field indicators

### FormField Accessibility

- **Fieldset Grouping**: Related fields grouped appropriately
- **Error Handling**: Accessible error message display
- **Help Text**: Descriptive help text properly associated

---

## Testing Guidelines

### Unit Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Accessibility Testing

```jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Accessible Button</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Testing

```jsx
// Storybook stories for visual testing
export default {
  title: 'UI/Button',
  component: Button,
};

export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '1rem' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </div>
);

export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);
```

---

## Best Practices

### Component Usage

1. **Use Semantic Variants**: Choose button variants based on their semantic meaning
   - `primary` for main actions
   - `secondary` for supporting actions
   - `danger` for destructive actions
   - `ghost` for subtle actions

2. **Consistent Sizing**: Use consistent button sizes within the same context

3. **Loading States**: Always provide loading feedback for async operations

4. **Accessibility**: Include proper ARIA labels for icon-only buttons

### Performance Considerations

1. **Avoid Inline Styles**: Use className prop for custom styling when possible
2. **Memoization**: Use React.memo for frequently re-rendered buttons
3. **Event Handler Optimization**: Use useCallback for event handlers in parent components

### Common Patterns

```jsx
// Form actions
<div className="form-actions">
  <Button variant="ghost" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="primary" type="submit" loading={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save'}
  </Button>
</div>

// Confirmation dialogs
<div className="dialog-actions">
  <Button variant="secondary" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="danger" onClick={onConfirm}>
    Delete
  </Button>
</div>
```

---

## Related Documentation

- **[Design System Tokens](7_design_system.md)** - Complete design token reference
- **[Component Overview](1_overview_components.md)** - Architecture and patterns
- **[Integration Guides](../guides/)** - Component integration patterns
- **[Accessibility Guidelines](../guides/accessibility.md)** - WCAG compliance patterns

---

*Last updated: January 2025*
*Version: 1.0.0*