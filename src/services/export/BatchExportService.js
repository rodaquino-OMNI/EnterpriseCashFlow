/**
 * Batch Export Service
 * Handles exporting multiple reports in batch operations
 */

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { PDFExportService } from './PDFExportService';
import { ExcelExportService } from './ExcelExportService';
import { ExportFormat } from './types';

export class BatchExportService {
  constructor(options = {}) {
    this.options = {
      createArchive: true,
      archiveFormat: 'zip',
      includeManifest: true,
      parallel: true,
      maxConcurrent: 3,
      ...options
    };
    
    // Initialize export services
    this.exportServices = {
      [ExportFormat.PDF]: new PDFExportService(options),
      [ExportFormat.EXCEL]: new ExcelExportService(options)
    };
    
    // Progress tracking
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: null
    };
  }

  /**
   * Export multiple reports
   * @param {Array} reports - Array of report configurations
   * @param {Object} options - Batch export options
   * @returns {Promise<Object>} Batch export result
   */
  async exportBatch(reports, options = {}) {
    try {
      const batchOptions = { ...this.options, ...options };
      
      // Initialize progress
      this.progress = {
        total: reports.length,
        completed: 0,
        failed: 0,
        current: null
      };
      
      // Notify progress start
      this.notifyProgress('start');
      
      // Export reports
      const results = await this.processReports(reports, batchOptions);
      
      // Handle results based on options
      let finalResult;
      if (batchOptions.combineFiles && batchOptions.format) {
        finalResult = await this.combineReports(results, batchOptions);
      } else if (batchOptions.createArchive) {
        finalResult = await this.createArchive(results, batchOptions);
      } else {
        finalResult = await this.downloadIndividual(results, batchOptions);
      }
      
      // Notify completion
      this.notifyProgress('complete');
      
      return {
        success: true,
        totalReports: reports.length,
        successfulExports: results.filter(r => r.success).length,
        failedExports: results.filter(r => !r.success).length,
        results,
        ...finalResult
      };
      
    } catch (error) {
      this.notifyProgress('error', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Process reports for export
   * @param {Array} reports - Report configurations
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export results
   */
  async processReports(reports, options) {
    if (options.parallel) {
      return await this.processParallel(reports, options);
    } else {
      return await this.processSequential(reports, options);
    }
  }

  /**
   * Process reports in parallel
   * @param {Array} reports - Report configurations
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export results
   */
  async processParallel(reports, options) {
    const results = [];
    const chunks = this.chunkArray(reports, options.maxConcurrent);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(report => this.exportSingleReport(report, options))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Process reports sequentially
   * @param {Array} reports - Report configurations
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export results
   */
  async processSequential(reports, options) {
    const results = [];
    
    for (const report of reports) {
      const result = await this.exportSingleReport(report, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Export single report
   * @param {Object} report - Report configuration
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportSingleReport(report, options) {
    try {
      this.progress.current = report.name || report.id;
      this.notifyProgress('processing', { report: report.name });
      
      // Determine format
      const format = report.format || options.format || ExportFormat.PDF;
      const exportService = this.exportServices[format];
      
      if (!exportService) {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Apply naming pattern
      const fileName = this.applyNamingPattern(
        report.name || 'report',
        report,
        options.namingPattern
      );
      
      // Export with service
      const result = await exportService.export(report.data, {
        ...options,
        ...report.options,
        fileName
      });
      
      // Update progress
      if (result.success) {
        this.progress.completed++;
      } else {
        this.progress.failed++;
      }
      
      this.notifyProgress('progress', {
        completed: this.progress.completed,
        total: this.progress.total
      });
      
      return {
        ...result,
        reportId: report.id,
        reportName: report.name
      };
      
    } catch (error) {
      this.progress.failed++;
      this.notifyProgress('error', { report: report.name, error });
      
      return {
        success: false,
        reportId: report.id,
        reportName: report.name,
        error: error.message
      };
    }
  }

  /**
   * Combine multiple reports into single file
   * @param {Array} results - Export results
   * @param {Object} options - Combine options
   * @returns {Promise<Object>} Combined result
   */
  async combineReports(results, options) {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      throw new Error('No successful exports to combine');
    }
    
    if (options.format === ExportFormat.PDF) {
      return await this.combinePDFs(successfulResults, options);
    } else if (options.format === ExportFormat.EXCEL) {
      return await this.combineExcels(successfulResults, options);
    }
    
    throw new Error(`Cannot combine files of format: ${options.format}`);
  }

  /**
   * Combine PDF files
   * @param {Array} results - PDF export results
   * @param {Object} options - Combine options
   * @returns {Promise<Object>} Combined PDF result
   */
  async combinePDFs(results, options) {
    // This would require a PDF manipulation library like pdf-lib
    // For now, we'll create a simple implementation that downloads separately
    console.warn('PDF combining not yet implemented. Files will be downloaded separately.');
    
    return {
      combined: false,
      message: 'PDF combining not yet implemented'
    };
  }

  /**
   * Combine Excel files
   * @param {Array} results - Excel export results
   * @param {Object} options - Combine options
   * @returns {Promise<Object>} Combined Excel result
   */
  async combineExcels(results, options) {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Add each result as a sheet
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sheetName = result.reportName || `Sheet${i + 1}`;
        
        // Read the workbook from blob
        const arrayBuffer = await result.data.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Copy sheets
        wb.SheetNames.forEach((name, idx) => {
          const sheet = wb.Sheets[name];
          const newName = wb.SheetNames.length > 1 ? `${sheetName}-${name}` : sheetName;
          XLSX.utils.book_append_sheet(workbook, sheet, newName);
        });
      }
      
      // Generate combined file
      const buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });
      
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const fileName = this.generateFileName('combined-reports', 'xlsx');
      
      return {
        combined: true,
        blob,
        fileName
      };
      
    } catch (error) {
      console.error('Excel combining error:', error);
      return {
        combined: false,
        error: error.message
      };
    }
  }

  /**
   * Create archive of exported files
   * @param {Array} results - Export results
   * @param {Object} options - Archive options
   * @returns {Promise<Object>} Archive result
   */
  async createArchive(results, options) {
    try {
      const zip = new JSZip();
      const successfulResults = results.filter(r => r.success);
      
      if (successfulResults.length === 0) {
        throw new Error('No successful exports to archive');
      }
      
      // Add files to archive
      for (const result of successfulResults) {
        if (result.data) {
          zip.file(result.fileName, result.data);
        }
      }
      
      // Add manifest if requested
      if (options.includeManifest) {
        const manifest = this.createManifest(results, options);
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      }
      
      // Generate archive
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      });
      
      const fileName = this.generateFileName('reports-archive', 'zip');
      
      // Download archive
      if (options.autoDownload !== false) {
        saveAs(blob, fileName);
      }
      
      return {
        archived: true,
        blob,
        fileName,
        fileCount: successfulResults.length
      };
      
    } catch (error) {
      console.error('Archive creation error:', error);
      return {
        archived: false,
        error: error.message
      };
    }
  }

  /**
   * Download files individually
   * @param {Array} results - Export results
   * @param {Object} options - Download options
   * @returns {Promise<Object>} Download result
   */
  async downloadIndividual(results, options) {
    const successfulResults = results.filter(r => r.success);
    let downloadCount = 0;
    
    for (const result of successfulResults) {
      if (result.data && options.autoDownload !== false) {
        // Add delay between downloads to avoid browser blocking
        if (downloadCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        saveAs(result.data, result.fileName);
        downloadCount++;
      }
    }
    
    return {
      downloaded: downloadCount,
      total: successfulResults.length
    };
  }

  /**
   * Create manifest for archive
   * @param {Array} results - Export results
   * @param {Object} options - Manifest options
   * @returns {Object} Manifest object
   */
  createManifest(results, options) {
    return {
      created: new Date().toISOString(),
      generator: 'Enterprise Cash Flow Export System',
      version: '2.0.0',
      options: {
        format: options.format,
        template: options.template
      },
      reports: results.map(r => ({
        id: r.reportId,
        name: r.reportName,
        fileName: r.fileName,
        success: r.success,
        size: r.size,
        error: r.error
      })),
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }

  /**
   * Apply naming pattern to filename
   * @param {string} baseName - Base filename
   * @param {Object} report - Report object
   * @param {Object} pattern - Naming pattern
   * @returns {string} Formatted filename
   */
  applyNamingPattern(baseName, report, pattern) {
    if (!pattern) {
      return baseName;
    }
    
    let fileName = pattern.template || '{name}';
    
    // Replace tokens
    fileName = fileName.replace('{name}', baseName);
    fileName = fileName.replace('{id}', report.id || '');
    fileName = fileName.replace('{date}', new Date().toISOString().split('T')[0]);
    fileName = fileName.replace('{time}', new Date().toTimeString().split(' ')[0].replace(/:/g, '-'));
    fileName = fileName.replace('{timestamp}', Date.now());
    
    // Replace custom fields
    if (pattern.customFields) {
      Object.entries(pattern.customFields).forEach(([key, value]) => {
        fileName = fileName.replace(`{${key}}`, report[value] || '');
      });
    }
    
    // Clean filename
    return fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  /**
   * Generate filename with timestamp
   * @param {string} baseName - Base filename
   * @param {string} extension - File extension
   * @returns {string} Generated filename
   */
  generateFileName(baseName, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array} Array of chunks
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Notify progress to callback
   * @param {string} status - Progress status
   * @param {Object} data - Progress data
   */
  notifyProgress(status, data = {}) {
    if (this.options.onProgress) {
      this.options.onProgress({
        status,
        ...this.progress,
        ...data
      });
    }
  }

  /**
   * Cancel batch export
   */
  cancel() {
    this.cancelled = true;
    this.notifyProgress('cancelled');
  }
}