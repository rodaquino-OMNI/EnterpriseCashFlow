// Jest setup file for testing infrastructure
import '@testing-library/jest-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
// Import custom financial matchers
import './__tests__/utils/customMatchers';

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    // Disable color-contrast rule for testing
    'color-contrast': { enabled: false }
  }
});

// Make axe available globally for tests
global.axe = axe;

// Extend Jest matchers with jest-axe
expect.extend({ toHaveNoViolations });

// Setup jsdom environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};