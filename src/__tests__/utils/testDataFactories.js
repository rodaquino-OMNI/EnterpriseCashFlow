/**
 * Test Data Factories for EnterpriseCashFlow Application
 * Provides factory functions for creating consistent mock data for testing
 */

/**
 * Creates mock financial data with realistic values
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock financial data object
 */
export const createMockFinancialData = (overrides = {}) => {
  const defaults = {
    revenue: 100000,
    expenses: 75000,
    profit: 25000,
    margin: 0.25,
    period: 'Q1 2024',
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates mock cash flow data
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock cash flow data object
 */
export const createMockCashFlowData = (overrides = {}) => {
  const defaults = {
    operatingCashFlow: 50000,
    investingCashFlow: -20000,
    financingCashFlow: -10000,
    netCashFlow: 20000,
    beginningCash: 100000,
    endingCash: 120000,
    period: 'Q1 2024',
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates mock user data for testing
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock user data object
 */
export const createMockUser = (overrides = {}) => {
  const defaults = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'analyst',
    permissions: ['read', 'write'],
    createdAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates mock company data
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock company data object
 */
export const createMockCompany = (overrides = {}) => {
  const defaults = {
    id: 'company-123',
    name: 'Test Company Inc.',
    industry: 'Technology',
    size: 'Medium',
    currency: 'USD',
    fiscalYearEnd: '12-31',
  };

  return { ...defaults, ...overrides };
};

/**
 * Creates an array of mock financial data entries
 * @param {number} count - Number of entries to create
 * @param {Object} baseOverrides - Base overrides applied to all entries
 * @returns {Array} Array of mock financial data objects
 */
export const createMockFinancialDataArray = (count = 3, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockFinancialData({
      ...baseOverrides,
      id: `financial-${index + 1}`,
      period: `Q${index + 1} 2024`,
    }),
  );
};

/**
 * Creates mock API response structure
 * @param {*} data - The data to wrap in API response format
 * @param {Object} options - Options for the response
 * @returns {Object} Mock API response object
 */
export const createMockApiResponse = (data, options = {}) => {
  const defaults = {
    success: true,
    data,
    message: 'Success',
    timestamp: new Date().toISOString(),
    ...options,
  };

  return defaults;
};

/**
 * Creates mock error response
 * @param {string} message - Error message
 * @param {number} code - Error code
 * @returns {Object} Mock error response object
 */
export const createMockErrorResponse = (message = 'Test error', code = 400) => {
  return {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  };
};

// Make createMockFinancialData available globally for the test infrastructure validation
if (typeof window !== 'undefined') {
  window.createMockFinancialData = createMockFinancialData;
}