/**
 * Main Export Service
 * Unified interface for all export functionality
 */

import { PDFExportService } from './PDFExportService';
import { ExcelExportService } from './ExcelExportService';
import { BatchExportService } from './BatchExportService';
import { TemplateManager } from './templates/TemplateManager';
import { ChartExporter } from './utils/ChartExporter';
import { BrandingManager } from './utils/BrandingManager';
import { ExportFormat } from './types';

export class ExportService {
  constructor(options = {}) {
    // Initialize services
    this.pdfService = new PDFExportService(options);
    this.excelService = new ExcelExportService(options);
    this.batchService = new BatchExportService(options);
    this.templateManager = new TemplateManager();
    this.chartExporter = new ChartExporter(options);
    this.brandingManager = new BrandingManager(options.branding);
    
    // Store options
    this.options = {
      autoDownload: true,
      includeTimestamp: true,
      ...options
    };
  }

  /**
   * Export report with specified format and options
   * @param {Object} data - Report data
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async export(data, options = {}) {
    try {
      const exportOptions = { ...this.options, ...options };
      
      // Apply template if specified
      if (exportOptions.templateId) {
        data = await this.applyTemplate(data, exportOptions.templateId);
        exportOptions = {
          ...exportOptions,
          ...data.exportOptions
        };
      }
      
      // Apply branding
      const branding = this.brandingManager.getBranding(exportOptions.branding);
      exportOptions.branding = branding;
      
      // Determine format
      const format = exportOptions.format || ExportFormat.PDF;
      
      // Export based on format
      let result;
      switch (format) {
        case ExportFormat.PDF:
          result = await this.pdfService.export(data, exportOptions);
          break;
          
        case ExportFormat.EXCEL:
          result = await this.excelService.export(data, exportOptions);
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Auto download if enabled
      if (result.success && exportOptions.autoDownload) {
        this.download(result.data, result.fileName);
      }
      
      return result;
      
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export multiple reports in batch
   * @param {Array} reports - Array of report configurations
   * @param {Object} options - Batch export options
   * @returns {Promise<Object>} Batch export result
   */
  async exportBatch(reports, options = {}) {
    const batchOptions = {
      ...this.options,
      ...options,
      branding: this.brandingManager.getBranding(options.branding)
    };
    
    return await this.batchService.exportBatch(reports, batchOptions);
  }

  /**
   * Export chart as image
   * @param {HTMLElement} chartElement - Chart element
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportChart(chartElement, options = {}) {
    const result = await this.chartExporter.exportChart(chartElement, options);
    
    if (result.success && options.autoDownload !== false) {
      this.download(result.blob, result.fileName);
    }
    
    return result;
  }

  /**
   * Export multiple charts
   * @param {Array} charts - Array of chart configurations
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export results
   */
  async exportCharts(charts, options = {}) {
    if (options.asPDF) {
      return await this.chartExporter.exportChartsAsPDF(charts, options);
    } else {
      return await this.chartExporter.exportMultipleCharts(charts, options);
    }
  }

  /**
   * Apply template to data
   * @param {Object} data - Report data
   * @param {string} templateId - Template ID
   * @returns {Object} Processed data
   */
  applyTemplate(data, templateId) {
    return this.templateManager.applyTemplate(templateId, data);
  }

  /**
   * Get available templates
   * @param {string} category - Optional category filter
   * @returns {Array} Available templates
   */
  getTemplates(category) {
    if (category) {
      return this.templateManager.getTemplatesByCategory(category);
    }
    return this.templateManager.getAllTemplates();
  }

  /**
   * Create custom template
   * @param {Object} template - Template configuration
   * @returns {Object} Created template
   */
  createTemplate(template) {
    return this.templateManager.createTemplate(template);
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Object} Updated template
   */
  updateTemplate(templateId, updates) {
    return this.templateManager.updateTemplate(templateId, updates);
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {boolean} Success
   */
  deleteTemplate(templateId) {
    return this.templateManager.deleteTemplate(templateId);
  }

  /**
   * Clone template
   * @param {string} templateId - Template ID
   * @param {string} newName - New template name
   * @returns {Object} Cloned template
   */
  cloneTemplate(templateId, newName) {
    return this.templateManager.cloneTemplate(templateId, newName);
  }

  /**
   * Export template
   * @param {string} templateId - Template ID
   * @returns {Object} Template for export
   */
  exportTemplate(templateId) {
    return this.templateManager.exportTemplate(templateId);
  }

  /**
   * Import template
   * @param {Object} template - Template to import
   * @returns {Object} Imported template
   */
  importTemplate(template) {
    return this.templateManager.importTemplate(template);
  }

  /**
   * Get branding configuration
   * @returns {Object} Branding configuration
   */
  getBranding() {
    return this.brandingManager.getBranding();
  }

  /**
   * Update branding configuration
   * @param {Object} branding - Branding updates
   */
  updateBranding(branding) {
    const updated = {
      ...this.brandingManager.getBranding(),
      ...branding
    };
    this.brandingManager.saveBranding(updated);
  }

  /**
   * Preview export
   * @param {Object} data - Report data
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Preview result
   */
  async preview(data, options = {}) {
    const previewOptions = {
      ...options,
      autoDownload: false
    };
    
    const result = await this.export(data, previewOptions);
    
    if (result.success) {
      // Create preview URL
      result.previewUrl = URL.createObjectURL(result.data);
      
      // Clean up after delay
      setTimeout(() => {
        URL.revokeObjectURL(result.previewUrl);
      }, 60000); // 1 minute
    }
    
    return result;
  }

  /**
   * Download file
   * @param {Blob} blob - File blob
   * @param {string} fileName - File name
   */
  download(blob, fileName) {
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
   * Get export formats
   * @returns {Array} Available export formats
   */
  getFormats() {
    return [
      {
        id: ExportFormat.PDF,
        name: 'PDF',
        description: 'Portable Document Format',
        icon: 'file-pdf',
        mimeType: 'application/pdf',
        extension: 'pdf',
        features: ['watermark', 'headers', 'footers', 'charts', 'tables']
      },
      {
        id: ExportFormat.EXCEL,
        name: 'Excel',
        description: 'Microsoft Excel Spreadsheet',
        icon: 'file-excel',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        features: ['formulas', 'multiple-sheets', 'auto-filter', 'conditional-formatting']
      }
    ];
  }

  /**
   * Validate export data
   * @param {Object} data - Data to validate
   * @param {string} format - Export format
   * @returns {Object} Validation result
   */
  validateData(data, format) {
    const errors = [];
    const warnings = [];
    
    // Basic validation
    if (!data) {
      errors.push('No data provided for export');
    }
    
    if (typeof data !== 'object') {
      errors.push('Export data must be an object');
    }
    
    // Format-specific validation
    if (format === ExportFormat.PDF) {
      if (data.charts && !Array.isArray(data.charts)) {
        errors.push('Charts must be an array');
      }
    } else if (format === ExportFormat.EXCEL) {
      if (data.sheets && !Array.isArray(data.sheets)) {
        errors.push('Sheets must be an array');
      }
      
      if (data.formulas) {
        data.formulas.forEach((formula, index) => {
          if (!formula.row || !formula.col || !formula.formula) {
            errors.push(`Formula at index ${index} is missing required fields`);
          }
        });
      }
    }
    
    // Check for large data
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 10 * 1024 * 1024) { // 10MB
      warnings.push('Large data size may affect export performance');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get export statistics
   * @returns {Object} Export statistics
   */
  getStatistics() {
    try {
      const stats = JSON.parse(localStorage.getItem('exportStatistics') || '{}');
      return {
        totalExports: stats.totalExports || 0,
        byFormat: stats.byFormat || {},
        lastExport: stats.lastExport || null,
        averageSize: stats.averageSize || 0
      };
    } catch (error) {
      return {
        totalExports: 0,
        byFormat: {},
        lastExport: null,
        averageSize: 0
      };
    }
  }

  /**
   * Update export statistics
   * @param {Object} exportResult - Export result
   */
  updateStatistics(exportResult) {
    try {
      const stats = this.getStatistics();
      
      stats.totalExports++;
      stats.byFormat[exportResult.format] = (stats.byFormat[exportResult.format] || 0) + 1;
      stats.lastExport = new Date().toISOString();
      
      if (exportResult.size) {
        const totalSize = (stats.averageSize * (stats.totalExports - 1)) + exportResult.size;
        stats.averageSize = totalSize / stats.totalExports;
      }
      
      localStorage.setItem('exportStatistics', JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to update export statistics:', error);
    }
  }
}