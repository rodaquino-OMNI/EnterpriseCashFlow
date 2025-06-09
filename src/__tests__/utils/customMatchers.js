/**
 * Custom Jest matchers for financial calculations and data validation
 * These matchers provide domain-specific assertions for the EnterpriseCashFlow application
 */

// Custom matcher for validating currency values
expect.extend({
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 Number.isFinite(received) &&
                 Number((received).toFixed(2)) === received;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency value`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid currency value (positive number with max 2 decimal places)`,
        pass: false,
      };
    }
  },

  toBeValidPercentage(received) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 received <= 1 &&
                 Number.isFinite(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid percentage`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid percentage (number between 0 and 1)`,
        pass: false,
      };
    }
  },

  toHaveValidFinancialStructure(received) {
    const pass = typeof received === 'object' &&
                 received !== null &&
                 typeof received.revenue === 'number' &&
                 typeof received.expenses === 'number' &&
                 received.revenue >= 0 &&
                 received.expenses >= 0;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid financial structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid financial structure (object with revenue and expenses as positive numbers)`,
        pass: false,
      };
    }
  },

  toBeWithinRange(received, min, max) {
    const pass = typeof received === 'number' &&
                 received >= min &&
                 received <= max;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} to ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} to ${max}`,
        pass: false,
      };
    }
  },

  toHaveValidFinancialFormat(received) {
    const pass = typeof received === 'string' &&
                 /^\$[\d,]+\.\d{2}$/.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid financial format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid financial format (e.g., $1,234.56)`,
        pass: false,
      };
    }
  }
});