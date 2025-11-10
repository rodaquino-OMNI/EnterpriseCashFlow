/**
 * Export service types and interfaces
 */

/**
 * Supported export formats
 */
export const ExportFormat = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
};

/**
 * Page orientations for PDF export
 */
export const PageOrientation = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

/**
 * Page sizes for PDF export
 */
export const PageSize = {
  A4: 'a4',
  LETTER: 'letter',
  LEGAL: 'legal',
  A3: 'a3',
};

/**
 * Export options configuration
 * @typedef {Object} ExportOptions
 * @property {string} format - Export format (pdf, excel, csv)
 * @property {string} fileName - Output filename
 * @property {Object} metadata - Document metadata
 * @property {string} metadata.title - Document title
 * @property {string} metadata.author - Document author
 * @property {string} metadata.subject - Document subject
 * @property {string} metadata.keywords - Document keywords
 * @property {Date} metadata.creationDate - Creation date
 * @property {Object} branding - Branding options
 * @property {string} branding.logo - Logo URL or base64
 * @property {string} branding.watermark - Watermark text or image
 * @property {Object} branding.colors - Custom color scheme
 * @property {boolean} includeCharts - Include charts in export
 * @property {boolean} includeTimestamp - Add timestamp to export
 * @property {string} template - Template name to use
 */

/**
 * PDF specific export options
 * @typedef {Object} PDFExportOptions
 * @extends ExportOptions
 * @property {string} orientation - Page orientation
 * @property {string} pageSize - Page size
 * @property {Object} margins - Page margins
 * @property {number} margins.top
 * @property {number} margins.bottom
 * @property {number} margins.left
 * @property {number} margins.right
 * @property {boolean} compress - Enable compression
 * @property {Object} header - Header configuration
 * @property {Object} footer - Footer configuration
 * @property {boolean} tableOfContents - Include TOC
 */

/**
 * Excel specific export options
 * @typedef {Object} ExcelExportOptions
 * @extends ExportOptions
 * @property {boolean} includeFormulas - Include Excel formulas
 * @property {boolean} autoFilter - Add auto-filter to tables
 * @property {boolean} freezePanes - Freeze header rows/columns
 * @property {Object} formatting - Cell formatting options
 * @property {boolean} formatting.currency - Format currency cells
 * @property {boolean} formatting.percentage - Format percentage cells
 * @property {boolean} formatting.dates - Format date cells
 * @property {boolean} multipleSheets - Split data into multiple sheets
 * @property {Array} sheetNames - Custom sheet names
 */

/**
 * Report template configuration
 * @typedef {Object} ReportTemplate
 * @property {string} id - Template ID
 * @property {string} name - Template name
 * @property {string} description - Template description
 * @property {string} category - Template category
 * @property {Object} layout - Layout configuration
 * @property {Array} sections - Report sections
 * @property {Object} styling - Custom styling
 * @property {Object} defaultOptions - Default export options
 */

/**
 * Export result
 * @typedef {Object} ExportResult
 * @property {boolean} success - Export success status
 * @property {string} fileName - Generated filename
 * @property {Blob} data - File data blob
 * @property {string} mimeType - File MIME type
 * @property {number} size - File size in bytes
 * @property {Object} metadata - Export metadata
 * @property {Error} error - Error if export failed
 */

/**
 * Batch export configuration
 * @typedef {Object} BatchExportConfig
 * @property {Array} reports - Reports to export
 * @property {string} format - Export format
 * @property {boolean} combineFiles - Combine into single file
 * @property {boolean} createArchive - Create ZIP archive
 * @property {Object} namingPattern - File naming pattern
 * @property {Function} onProgress - Progress callback
 */

/**
 * Chart export options
 * @typedef {Object} ChartExportOptions
 * @property {string} format - Image format (png, jpeg, svg)
 * @property {number} quality - Image quality (0-1)
 * @property {number} scale - Export scale factor
 * @property {Object} dimensions - Custom dimensions
 * @property {number} dimensions.width
 * @property {number} dimensions.height
 * @property {string} backgroundColor - Background color
 * @property {boolean} transparent - Transparent background
 */