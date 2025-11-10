// src/services/ai/DocumentExtractor.js
import { AIService } from './AIService';
import { ExtractionSource } from './types';
import { fieldDefinitions } from '../../utils/fieldDefinitions';

/**
 * Document extraction service using AI
 */
export class DocumentExtractor {
  constructor(aiService) {
    this.aiService = aiService || new AIService();
    this.extractionCache = new Map();
  }

  /**
   * Extract financial data from Excel content
   * @param {string} excelContent - Parsed Excel content as text
   * @param {Object} options - Extraction options
   * @returns {Promise<import('./types').ExtractionResult>}
   */
  async extractFromExcel(excelContent, options = {}) {
    const schema = this.buildFinancialSchema(options.periods || 1);
    
    return this.aiService.extractData(
      excelContent,
      ExtractionSource.EXCEL,
      schema,
      {
        ...options,
        instructions: [
          'Look for table structures with financial data',
          'Headers may be in Portuguese or English',
          'Numbers may use Brazilian format (1.234,56) or US format (1,234.56)',
          'Identify period columns (months, quarters, years)',
        ],
      },
    );
  }

  /**
   * Extract financial data from PDF text
   * @param {string} pdfText - Extracted PDF text
   * @param {Object} options - Extraction options
   * @returns {Promise<import('./types').ExtractionResult>}
   */
  async extractFromPDF(pdfText, options = {}) {
    const schema = this.buildFinancialSchema(options.periods || 1);
    
    return this.aiService.extractData(
      pdfText,
      ExtractionSource.PDF,
      schema,
      {
        ...options,
        instructions: [
          'Financial statements may be in table format or narrative',
          'Look for income statement, balance sheet, and cash flow sections',
          'Numbers may include currency symbols and formatting',
          'Period information may be in headers or footers',
        ],
      },
    );
  }

  /**
   * Extract from image (OCR text)
   * @param {string} ocrText - OCR extracted text
   * @param {Object} options - Extraction options
   * @returns {Promise<import('./types').ExtractionResult>}
   */
  async extractFromImage(ocrText, options = {}) {
    const schema = this.buildFinancialSchema(options.periods || 1);
    
    return this.aiService.extractData(
      ocrText,
      ExtractionSource.IMAGE,
      schema,
      {
        ...options,
        instructions: [
          'OCR text may have recognition errors',
          'Numbers might be misread (0/O, 1/l confusion)',
          'Table structure might be broken',
          'Be conservative with uncertain values',
        ],
      },
    );
  }

  /**
   * Smart extraction with format detection
   * @param {string} content - Document content
   * @param {Object} options - Extraction options
   * @returns {Promise<import('./types').ExtractionResult>}
   */
  async smartExtract(content, options = {}) {
    // Detect content type
    const contentType = this.detectContentType(content);
    
    switch (contentType) {
      case 'excel':
        return this.extractFromExcel(content, options);
      case 'pdf':
        return this.extractFromPDF(content, options);
      default:
        // Try generic extraction
        return this.genericExtract(content, options);
    }
  }

  /**
   * Generic extraction for unknown formats
   * @private
   */
  async genericExtract(content, options = {}) {
    const schema = this.buildFinancialSchema(options.periods || 1);
    
    return this.aiService.extractData(
      content,
      ExtractionSource.TEXT,
      schema,
      {
        ...options,
        instructions: [
          'Identify any financial data present',
          'Use context clues to determine data types',
          'Be flexible with formats and structures',
        ],
      },
    );
  }

  /**
   * Validate extracted data
   * @param {Array} extractedData - Extracted financial data
   * @returns {Object} Validation result
   */
  validateExtractedData(extractedData) {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      dataQuality: 0,
    };

    if (!Array.isArray(extractedData) || extractedData.length === 0) {
      validationResult.isValid = false;
      validationResult.errors.push('No data extracted');
      return validationResult;
    }

    let totalFields = 0;
    let filledFields = 0;
    let validFields = 0;

    extractedData.forEach((period, index) => {
      // Check required fields
      const requiredFields = ['revenue', 'netProfit'];
      requiredFields.forEach(field => {
        totalFields++;
        if (period.data && period.data[field] != null) {
          filledFields++;
          
          // Validate field value
          const value = period.data[field];
          if (typeof value === 'number' && !isNaN(value)) {
            validFields++;
          } else {
            validationResult.warnings.push(
              `Period ${index + 1}: Invalid value for ${field}`,
            );
          }
        } else {
          validationResult.errors.push(
            `Period ${index + 1}: Missing required field ${field}`,
          );
        }
      });

      // Check data consistency
      if (period.data) {
        this.validateDataConsistency(period.data, validationResult, index);
      }
    });

    // Calculate data quality score
    validationResult.dataQuality = validFields / totalFields;
    validationResult.completeness = filledFields / totalFields;

    // Set overall validity
    validationResult.isValid = validationResult.errors.length === 0 && 
                               validationResult.dataQuality > 0.5;

    return validationResult;
  }

  /**
   * Enhance extracted data with calculations
   * @param {Array} extractedData - Raw extracted data
   * @returns {Array} Enhanced data with calculated fields
   */
  enhanceExtractedData(extractedData) {
    return extractedData.map(period => {
      const enhanced = { ...period };
      const data = enhanced.data || {};

      // Calculate derived fields
      if (data.revenue && data.cogs) {
        data.grossProfit = data.revenue - data.cogs;
        data.grossMargin = data.revenue > 0 ? data.grossProfit / data.revenue : 0;
      }

      if (data.ebit && data.revenue) {
        data.ebitMargin = data.revenue > 0 ? data.ebit / data.revenue : 0;
      }

      if (data.netProfit && data.revenue) {
        data.netMargin = data.revenue > 0 ? data.netProfit / data.revenue : 0;
      }

      // Working capital calculations
      if (data.currentAssets && data.currentLiabilities) {
        data.workingCapital = data.currentAssets - data.currentLiabilities;
      }

      enhanced.data = data;
      return enhanced;
    });
  }

  /**
   * Build financial data schema
   * @private
   */
  buildFinancialSchema(periods = 1) {
    const periodSchema = {};
    
    // Add core financial fields
    Object.entries(fieldDefinitions).forEach(([key, def]) => {
      if (def.category === 'income' || def.category === 'balance' || def.category === 'cashflow') {
        periodSchema[key] = 'number';
      }
    });

    // Return schema for multiple periods
    if (periods === 1) {
      return periodSchema;
    }

    return {
      periods: Array(periods).fill(periodSchema),
    };
  }

  /**
   * Detect content type
   * @private
   */
  detectContentType(content) {
    // Check for Excel indicators
    if (content.includes('\t') && content.split('\n').length > 5) {
      const lines = content.split('\n');
      const tabCounts = lines.map(line => (line.match(/\t/g) || []).length);
      const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / tabCounts.length;
      if (avgTabs > 2) return 'excel';
    }

    // Check for PDF indicators
    if (content.includes('Page') && content.includes('\n\n')) {
      return 'pdf';
    }

    return 'text';
  }

  /**
   * Validate data consistency
   * @private
   */
  validateDataConsistency(data, validationResult, periodIndex) {
    // Check P&L consistency
    if (data.revenue && data.cogs && data.grossProfit) {
      const calculatedGrossProfit = data.revenue - data.cogs;
      const difference = Math.abs(calculatedGrossProfit - data.grossProfit);
      if (difference > 1) { // Allow small rounding differences
        validationResult.warnings.push(
          `Period ${periodIndex + 1}: Gross profit inconsistency (calculated: ${calculatedGrossProfit}, provided: ${data.grossProfit})`,
        );
      }
    }

    // Check balance sheet equation
    if (data.totalAssets && data.totalLiabilities && data.equity) {
      const calculatedAssets = data.totalLiabilities + data.equity;
      const difference = Math.abs(calculatedAssets - data.totalAssets);
      const tolerance = data.totalAssets * 0.01; // 1% tolerance
      if (difference > tolerance) {
        validationResult.warnings.push(
          `Period ${periodIndex + 1}: Balance sheet doesn't balance (Assets: ${data.totalAssets}, Liabilities + Equity: ${calculatedAssets})`,
        );
      }
    }
  }

  /**
   * Merge multiple extraction results
   * @param {Array<import('./types').ExtractionResult>} results - Multiple extraction results
   * @returns {import('./types').ExtractionResult} Merged result
   */
  mergeExtractionResults(results) {
    if (!results || results.length === 0) {
      return {
        success: false,
        data: [],
        confidence: 0,
        error: 'No results to merge',
      };
    }

    if (results.length === 1) {
      return results[0];
    }

    // Merge data by period
    const mergedData = [];
    const maxPeriods = Math.max(...results.map(r => r.data?.length || 0));

    for (let i = 0; i < maxPeriods; i++) {
      const periodData = {};
      let confidence = 0;
      let count = 0;

      results.forEach(result => {
        if (result.data && result.data[i]) {
          const data = result.data[i].data || {};
          Object.entries(data).forEach(([key, value]) => {
            if (value != null) {
              if (!periodData[key]) {
                periodData[key] = value;
              } else {
                // Average numeric values
                if (typeof value === 'number' && typeof periodData[key] === 'number') {
                  periodData[key] = (periodData[key] + value) / 2;
                }
              }
            }
          });
          confidence += result.confidence || 0;
          count++;
        }
      });

      mergedData.push({
        periodLabel: `Period ${i + 1}`,
        data: periodData,
      });

      confidence = count > 0 ? confidence / count : 0;
    }

    return {
      success: true,
      data: mergedData,
      confidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length,
      metadata: {
        sourceCount: results.length,
        merged: true,
      },
    };
  }
}