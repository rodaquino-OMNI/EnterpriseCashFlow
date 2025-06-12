/**
 * Base Export Service
 * Abstract base class for all export services
 */

import { ExportFormat } from './types';

export class BaseExportService {
  constructor(options = {}) {
    this.options = {
      includeTimestamp: true,
      includeMetadata: true,
      ...options
    };
    
    // Initialize branding
    this.branding = {
      logo: null,
      watermark: null,
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      },
      ...options.branding
    };
  }

  /**
   * Export data to specified format
   * @abstract
   * @param {Object} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<ExportResult>}
   */
  async export(data, options = {}) {
    throw new Error('Export method must be implemented by subclass');
  }

  /**
   * Validate export data
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateData(data) {
    const errors = [];
    
    if (!data) {
      errors.push('No data provided for export');
    }
    
    if (typeof data !== 'object') {
      errors.push('Export data must be an object');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate filename with timestamp
   * @param {string} baseName - Base filename
   * @param {string} extension - File extension
   * @returns {string} Generated filename
   */
  generateFileName(baseName, extension) {
    const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    if (this.options.includeTimestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return `${cleanName}_${timestamp}.${extension}`;
    }
    
    return `${cleanName}.${extension}`;
  }

  /**
   * Create metadata for export
   * @param {Object} options - Export options
   * @returns {Object} Metadata object
   */
  createMetadata(options = {}) {
    const now = new Date();
    
    return {
      title: options.title || 'Financial Report',
      author: options.author || 'Enterprise Cash Flow System',
      subject: options.subject || 'Financial Analysis Report',
      keywords: options.keywords || 'finance, analysis, report',
      creator: 'Enterprise Cash Flow v2.0',
      creationDate: now,
      modificationDate: now,
      ...options.metadata
    };
  }

  /**
   * Apply watermark to content
   * @param {Object} content - Content to watermark
   * @param {Object} watermarkOptions - Watermark options
   * @returns {Object} Watermarked content
   */
  applyWatermark(content, watermarkOptions = {}) {
    if (!this.branding.watermark) {
      return content;
    }
    
    // Implementation depends on content type
    // Override in subclasses
    return content;
  }

  /**
   * Format currency value
   * @param {number} value - Value to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted value
   */
  formatCurrency(value, currency = 'USD') {
    if (value == null || isNaN(value)) {
      return '-';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format percentage value
   * @param {number} value - Value to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted percentage
   */
  formatPercentage(value, decimals = 1) {
    if (value == null || isNaN(value)) {
      return '-';
    }
    
    return `${(value * 100).toFixed(decimals)}%`;
  }

  /**
   * Format date value
   * @param {Date|string} date - Date to format
   * @param {string} format - Date format
   * @returns {string} Formatted date
   */
  formatDate(date, format = 'MM/DD/YYYY') {
    if (!date) {
      return '-';
    }
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '-';
    }
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return format
      .replace('MM', month)
      .replace('DD', day)
      .replace('YYYY', year);
  }

  /**
   * Format number value
   * @param {number} value - Value to format
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted number
   */
  formatNumber(value, decimals = 0) {
    if (value == null || isNaN(value)) {
      return '-';
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Get MIME type for format
   * @param {string} format - Export format
   * @returns {string} MIME type
   */
  getMimeType(format) {
    const mimeTypes = {
      [ExportFormat.PDF]: 'application/pdf',
      [ExportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [ExportFormat.CSV]: 'text/csv'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Download file
   * @param {Blob} blob - File blob
   * @param {string} fileName - File name
   */
  downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Handle export error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {ExportResult} Error result
   */
  handleError(error, context = 'Export') {
    console.error(`${context} error:`, error);
    
    return {
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        context,
        timestamp: new Date().toISOString()
      }
    };
  }
}