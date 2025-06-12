/**
 * Data validation and sanitization service
 * Provides comprehensive validation for all financial data inputs
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Financial data schemas
const financialSchemas = {
  // Basic financial value schema
  financialValue: z.number()
    .finite()
    .refine(val => !isNaN(val), { message: 'Must be a valid number' })
    .refine(val => Math.abs(val) <= 1e12, { message: 'Value exceeds maximum allowed (1 trillion)' }),

  // Date schema
  financialDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
    .refine(date => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d);
    }, { message: 'Invalid date' }),

  // Period schema
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
    type: z.enum(['monthly', 'quarterly', 'annual']),
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
  }),

  // Company information
  companyInfo: z.object({
    name: z.string().min(1).max(200),
    industry: z.string().min(1).max(100).optional(),
    currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  }),

  // Income statement schema
  incomeStatement: z.object({
    revenue: z.number(),
    costOfGoodsSold: z.number().optional(),
    grossProfit: z.number().optional(),
    operatingExpenses: z.number().optional(),
    operatingIncome: z.number().optional(),
    interestExpense: z.number().optional(),
    taxExpense: z.number().optional(),
    netIncome: z.number(),
  }),

  // Balance sheet schema
  balanceSheet: z.object({
    assets: z.object({
      current: z.object({
        cash: z.number(),
        accountsReceivable: z.number().optional(),
        inventory: z.number().optional(),
        other: z.number().optional(),
        total: z.number(),
      }),
      nonCurrent: z.object({
        propertyPlantEquipment: z.number().optional(),
        intangibles: z.number().optional(),
        other: z.number().optional(),
        total: z.number(),
      }),
      total: z.number(),
    }),
    liabilities: z.object({
      current: z.object({
        accountsPayable: z.number().optional(),
        shortTermDebt: z.number().optional(),
        other: z.number().optional(),
        total: z.number(),
      }),
      nonCurrent: z.object({
        longTermDebt: z.number().optional(),
        other: z.number().optional(),
        total: z.number(),
      }),
      total: z.number(),
    }),
    equity: z.object({
      commonStock: z.number().optional(),
      retainedEarnings: z.number().optional(),
      other: z.number().optional(),
      total: z.number(),
    }),
  }),

  // Cash flow statement schema
  cashFlowStatement: z.object({
    operating: z.object({
      netIncome: z.number(),
      depreciation: z.number().optional(),
      workingCapitalChanges: z.number().optional(),
      other: z.number().optional(),
      total: z.number(),
    }),
    investing: z.object({
      capitalExpenditures: z.number().optional(),
      acquisitions: z.number().optional(),
      other: z.number().optional(),
      total: z.number(),
    }),
    financing: z.object({
      debtIssuance: z.number().optional(),
      debtRepayment: z.number().optional(),
      dividends: z.number().optional(),
      shareRepurchase: z.number().optional(),
      other: z.number().optional(),
      total: z.number(),
    }),
    netChange: z.number(),
    beginningCash: z.number(),
    endingCash: z.number(),
  }),
};

export class DataValidator {
  constructor() {
    this.schemas = financialSchemas;
    this.validationCache = new Map();
    this.sanitizationRules = this.initializeSanitizationRules();
  }

  /**
   * Initialize sanitization rules
   */
  initializeSanitizationRules() {
    return {
      // HTML sanitization config
      html: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
        ALLOWED_ATTR: [],
      },
      // Field-specific rules
      fields: {
        companyName: {
          maxLength: 200,
          pattern: /^[a-zA-Z0-9\s\-.,&()]+$/,
        },
        email: {
          maxLength: 254,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        phone: {
          maxLength: 20,
          pattern: /^[\d\s\-+()]+$/,
        },
        currency: {
          maxLength: 3,
          pattern: /^[A-Z]{3}$/,
        },
      },
    };
  }

  /**
   * Validate financial data
   * @param {string} dataType - Type of data to validate
   * @param {*} data - Data to validate
   * @returns {Object} Validation result
   */
  validate(dataType, data) {
    try {
      // Check cache first
      const cacheKey = `${dataType}:${JSON.stringify(data)}`;
      if (this.validationCache.has(cacheKey)) {
        return this.validationCache.get(cacheKey);
      }

      // Get schema
      const schema = this.schemas[dataType];
      if (!schema) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      // Validate
      const result = schema.safeParse(data);
      
      const validationResult = {
        valid: result.success,
        errors: result.error?.errors || [],
        data: result.data || null,
      };

      // Cache result
      this.validationCache.set(cacheKey, validationResult);
      
      // Clear old cache entries if too large
      if (this.validationCache.size > 1000) {
        const firstKey = this.validationCache.keys().next().value;
        this.validationCache.delete(firstKey);
      }

      return validationResult;
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message }],
        data: null,
      };
    }
  }

  /**
   * Sanitize string input
   * @param {string} input - Input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized input
   */
  sanitizeString(input, options = {}) {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Apply max length
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Apply pattern matching
    if (options.pattern && !options.pattern.test(sanitized)) {
      // Remove invalid characters
      const validChars = options.validChars || 'a-zA-Z0-9\\s';
      const regex = new RegExp(`[^${validChars}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }

    // HTML sanitization if needed
    if (options.sanitizeHtml) {
      sanitized = DOMPurify.sanitize(sanitized, this.sanitizationRules.html);
    }

    return sanitized;
  }

  /**
   * Sanitize numeric input
   * @param {*} input - Input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {number|null} Sanitized number
   */
  sanitizeNumber(input, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      decimals = 2,
      allowNegative = true,
    } = options;

    // Convert to number
    let num = Number(input);

    // Check if valid number
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }

    // Apply constraints
    if (!allowNegative && num < 0) {
      num = 0;
    }

    num = Math.max(min, Math.min(max, num));

    // Round to specified decimals
    num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

    return num;
  }

  /**
   * Sanitize date input
   * @param {*} input - Input to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string|null} Sanitized date
   */
  sanitizeDate(input, options = {}) {
    const {
      format = 'YYYY-MM-DD',
      minDate = '1900-01-01',
      maxDate = '2100-12-31',
    } = options;

    try {
      const date = new Date(input);
      
      if (isNaN(date.getTime())) {
        return null;
      }

      // Check date bounds
      const min = new Date(minDate);
      const max = new Date(maxDate);
      
      if (date < min || date > max) {
        return null;
      }

      // Format date
      if (format === 'YYYY-MM-DD') {
        return date.toISOString().split('T')[0];
      }

      return date.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Sanitize financial data object
   * @param {Object} data - Data to sanitize
   * @param {string} dataType - Type of financial data
   * @returns {Object} Sanitized data
   */
  sanitizeFinancialData(data, dataType) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized = {};

    switch (dataType) {
      case 'incomeStatement':
        return this.sanitizeIncomeStatement(data);
      case 'balanceSheet':
        return this.sanitizeBalanceSheet(data);
      case 'cashFlowStatement':
        return this.sanitizeCashFlowStatement(data);
      default:
        // Generic object sanitization
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (typeof value === 'string') {
            sanitized[key] = this.sanitizeString(value, { maxLength: 1000 });
          } else if (typeof value === 'number') {
            sanitized[key] = this.sanitizeNumber(value);
          } else if (typeof value === 'object') {
            sanitized[key] = this.sanitizeFinancialData(value, 'generic');
          } else {
            sanitized[key] = value;
          }
        });
        return sanitized;
    }
  }

  /**
   * Sanitize income statement data
   * @param {Object} data - Income statement data
   * @returns {Object} Sanitized data
   */
  sanitizeIncomeStatement(data) {
    const fields = [
      'revenue', 'costOfGoodsSold', 'grossProfit', 'operatingExpenses',
      'operatingIncome', 'interestExpense', 'taxExpense', 'netIncome'
    ];

    const sanitized = {};
    fields.forEach(field => {
      if (field in data) {
        sanitized[field] = this.sanitizeNumber(data[field], {
          decimals: 2,
          max: 1e12, // 1 trillion max
        });
      }
    });

    return sanitized;
  }

  /**
   * Sanitize balance sheet data
   * @param {Object} data - Balance sheet data
   * @returns {Object} Sanitized data
   */
  sanitizeBalanceSheet(data) {
    const sanitized = {
      assets: {},
      liabilities: {},
      equity: {},
    };

    // Sanitize each section recursively
    ['assets', 'liabilities', 'equity'].forEach(section => {
      if (data[section]) {
        sanitized[section] = this.sanitizeBalanceSheetSection(data[section]);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize balance sheet section
   * @param {Object} section - Balance sheet section
   * @returns {Object} Sanitized section
   */
  sanitizeBalanceSheetSection(section) {
    const sanitized = {};
    
    Object.keys(section).forEach(key => {
      const value = section[key];
      if (typeof value === 'number') {
        sanitized[key] = this.sanitizeNumber(value, {
          decimals: 2,
          max: 1e12,
        });
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeBalanceSheetSection(value);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize cash flow statement data
   * @param {Object} data - Cash flow statement data
   * @returns {Object} Sanitized data
   */
  sanitizeCashFlowStatement(data) {
    const sanitized = {
      operating: {},
      investing: {},
      financing: {},
    };

    // Sanitize each section
    ['operating', 'investing', 'financing'].forEach(section => {
      if (data[section]) {
        sanitized[section] = this.sanitizeCashFlowSection(data[section]);
      }
    });

    // Sanitize summary fields
    ['netChange', 'beginningCash', 'endingCash'].forEach(field => {
      if (field in data) {
        sanitized[field] = this.sanitizeNumber(data[field], {
          decimals: 2,
          max: 1e12,
        });
      }
    });

    return sanitized;
  }

  /**
   * Sanitize cash flow section
   * @param {Object} section - Cash flow section
   * @returns {Object} Sanitized section
   */
  sanitizeCashFlowSection(section) {
    const sanitized = {};
    
    Object.keys(section).forEach(key => {
      if (typeof section[key] === 'number') {
        sanitized[key] = this.sanitizeNumber(section[key], {
          decimals: 2,
          max: 1e12,
        });
      }
    });

    return sanitized;
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFileUpload(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions = ['.pdf', '.xls', '.xlsx'],
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }

    // Check filename for suspicious patterns
    if (!/^[\w\-. ]+$/.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();