/**
 * Component Testing Utilities for EnterpriseCashFlow Application
 * Provides helper functions for testing React components with proper context and providers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.Component} ui - The component to render
 * @param {Object} options - Render options and provider configurations
 * @returns {Object} Render result with additional utilities
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    route = '/',
    ...renderOptions
  } = options;

  // Create a wrapper component with all necessary providers
  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  // Render the component with providers
  const view = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...view,
    // Add custom utilities here if needed
  };
};

/**
 * Helper function to create mock props for components
 * @param {Object} overrides - Props to override defaults
 * @returns {Object} Mock props object
 */
export const createMockProps = (overrides = {}) => {
  const defaults = {
    onClick: jest.fn(),
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    className: 'test-class',
    'data-testid': 'test-component',
  };

  return { ...defaults, ...overrides };
};

/**
 * Helper function to wait for async operations in tests
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export const waitFor = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Helper function to simulate user interactions
 * @param {HTMLElement} element - The element to interact with
 * @param {string} eventType - Type of event to simulate
 * @param {Object} eventData - Additional event data
 */
export const simulateUserEvent = (element, eventType, eventData = {}) => {
  const event = new Event(eventType, { bubbles: true, ...eventData });
  element.dispatchEvent(event);
};

/**
 * Helper function to find elements by test ID with better error messages
 * @param {Object} container - The container to search in
 * @param {string} testId - The test ID to find
 * @returns {HTMLElement} The found element
 */
export const findByTestId = (container, testId) => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Element with test ID "${testId}" not found`);
  }
  return element;
};

/**
 * Helper function to create mock financial context
 * @param {Object} overrides - Context values to override
 * @returns {Object} Mock financial context
 */
export const createMockFinancialContext = (overrides = {}) => {
  const defaults = {
    financialData: [],
    loading: false,
    error: null,
    updateFinancialData: jest.fn(),
    refreshData: jest.fn(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Helper function to create mock user context
 * @param {Object} overrides - Context values to override
 * @returns {Object} Mock user context
 */
export const createMockUserContext = (overrides = {}) => {
  const defaults = {
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      role: 'analyst',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Helper function to mock API responses
 * @param {*} data - The data to return
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves with the data
 */
export const mockApiResponse = (data, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Helper function to mock API errors
 * @param {string} message - Error message
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that rejects with the error
 */
export const mockApiError = (message = 'API Error', delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Make renderWithProviders available globally for the test infrastructure validation
if (typeof window !== 'undefined') {
  window.renderWithProviders = renderWithProviders;
}