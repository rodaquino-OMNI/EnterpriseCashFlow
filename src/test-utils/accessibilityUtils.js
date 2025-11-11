/**
 * Accessibility Testing Utilities for EnterpriseCashFlow Application
 * Provides helper functions for testing accessibility compliance with jest-axe
 */

import { axe, configureAxe, toHaveNoViolations } from 'jest-axe';

// Configure axe for consistent testing
configureAxe({
  rules: {
    // Disable color-contrast rule for testing as it can be flaky in jsdom
    'color-contrast': { enabled: false },
  },
});

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Tests a component for accessibility violations
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Additional axe configuration options
 * @returns {Promise} Promise that resolves with accessibility test results
 */
export const testAccessibility = async (container, options = {}) => {
  const results = await axe(container, {
    rules: {
      // Common rules for financial applications
      'aria-label': { enabled: true },
      'aria-labelledby': { enabled: true },
      'aria-describedby': { enabled: true },
      'button-name': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'input-button-name': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      ...options.rules,
    },
    ...options,
  });

  expect(results).toHaveNoViolations();
  return results;
};

/**
 * Tests keyboard navigation for a component
 * @param {HTMLElement} element - The element to test keyboard navigation on
 * @param {Array} expectedFocusableElements - Array of expected focusable elements
 * @returns {Object} Test results with focusable elements and navigation success
 */
export const testKeyboardNavigation = (element, expectedFocusableElements = []) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  const results = {
    focusableElements: Array.from(focusableElements),
    expectedCount: expectedFocusableElements.length,
    actualCount: focusableElements.length,
    navigationSuccess: true,
  };

  // Test tab navigation
  focusableElements.forEach((el, index) => {
    try {
      el.focus();
      if (document.activeElement !== el) {
        results.navigationSuccess = false;
      }
    } catch (error) {
      results.navigationSuccess = false;
    }
  });

  return results;
};

/**
 * Tests ARIA attributes for proper implementation
 * @param {HTMLElement} element - The element to test
 * @param {Object} expectedAttributes - Expected ARIA attributes
 * @returns {Object} Test results with attribute validation
 */
export const testAriaAttributes = (element, expectedAttributes = {}) => {
  const results = {
    element,
    expectedAttributes,
    actualAttributes: {},
    missingAttributes: [],
    incorrectAttributes: [],
    valid: true,
  };

  // Get all ARIA attributes from the element
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-')) {
      results.actualAttributes[attr.name] = attr.value;
    }
  });

  // Check expected attributes
  Object.entries(expectedAttributes).forEach(([attr, expectedValue]) => {
    const actualValue = element.getAttribute(attr);
    
    if (actualValue === null) {
      results.missingAttributes.push(attr);
      results.valid = false;
    } else if (actualValue !== expectedValue) {
      results.incorrectAttributes.push({
        attribute: attr,
        expected: expectedValue,
        actual: actualValue,
      });
      results.valid = false;
    }
  });

  return results;
};

/**
 * Tests screen reader compatibility
 * @param {HTMLElement} element - The element to test
 * @returns {Object} Test results for screen reader compatibility
 */
export const testScreenReaderCompatibility = (element) => {
  const results = {
    hasAccessibleName: false,
    hasAccessibleDescription: false,
    hasProperRole: false,
    hasKeyboardSupport: false,
    issues: [],
  };

  // Check for accessible name
  const accessibleName = element.getAttribute('aria-label') ||
                        element.getAttribute('aria-labelledby') ||
                        element.textContent?.trim();
  
  if (accessibleName) {
    results.hasAccessibleName = true;
  } else {
    results.issues.push('Missing accessible name (aria-label, aria-labelledby, or text content)');
  }

  // Check for accessible description
  if (element.getAttribute('aria-describedby') || element.getAttribute('title')) {
    results.hasAccessibleDescription = true;
  }

  // Check for proper role
  const role = element.getAttribute('role') || element.tagName.toLowerCase();
  if (role) {
    results.hasProperRole = true;
  } else {
    results.issues.push('Missing or invalid role');
  }

  // Check for keyboard support
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
    element.tagName.toLowerCase(),
  );
  
  if (isInteractive || tabIndex !== null) {
    results.hasKeyboardSupport = true;
  } else if (element.getAttribute('role') === 'button') {
    results.issues.push('Interactive element missing keyboard support');
  }

  return results;
};

/**
 * Tests color contrast (placeholder for future implementation)
 * @param {HTMLElement} element - The element to test
 * @returns {Object} Test results for color contrast
 */
export const testColorContrast = (element) => {
  // This is a placeholder implementation
  // In a real application, you would use a library like color-contrast-checker
  return {
    element,
    contrastRatio: null,
    meetsWCAG: null,
    note: 'Color contrast testing requires additional setup with color analysis tools',
  };
};

/**
 * Comprehensive accessibility test suite
 * @param {HTMLElement} container - The container to test
 * @param {Object} options - Test configuration options
 * @returns {Promise<Object>} Complete accessibility test results
 */
export const runAccessibilityTestSuite = async (container, options = {}) => {
  const results = {
    axeResults: null,
    keyboardNavigation: null,
    ariaAttributes: null,
    screenReaderCompatibility: null,
    overallScore: 0,
    issues: [],
  };

  try {
    // Run axe accessibility tests
    results.axeResults = await testAccessibility(container, options.axe);
    
    // Test keyboard navigation
    if (options.testKeyboard !== false) {
      results.keyboardNavigation = testKeyboardNavigation(container);
    }

    // Test ARIA attributes if specified
    if (options.expectedAria) {
      results.ariaAttributes = testAriaAttributes(container, options.expectedAria);
    }

    // Test screen reader compatibility
    if (options.testScreenReader !== false) {
      results.screenReaderCompatibility = testScreenReaderCompatibility(container);
    }

    // Calculate overall score (simplified scoring system)
    let score = 100;
    if (results.axeResults?.violations?.length > 0) score -= 30;
    if (results.keyboardNavigation && !results.keyboardNavigation.navigationSuccess) score -= 20;
    if (results.ariaAttributes && !results.ariaAttributes.valid) score -= 20;
    if (results.screenReaderCompatibility?.issues?.length > 0) score -= 10;

    results.overallScore = Math.max(0, score);

  } catch (error) {
    results.issues.push(`Test suite error: ${error.message}`);
  }

  return results;
};

// Make testAccessibility available globally for the test infrastructure validation
if (typeof window !== 'undefined') {
  window.testAccessibility = testAccessibility;
}