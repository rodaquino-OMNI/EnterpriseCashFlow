/**
 * Excel Export Service
 * Handles Excel generation and export functionality with formatting and formulas
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BaseExportService } from './BaseExportService';
import { ExportFormat } from './types';

export class ExcelExportService extends BaseExportService {
  constructor(options = {}) {
    super(options);
    
    this.defaultOptions = {
      includeFormulas: true,
      autoFilter: true,
      freezePanes: true,
      formatting: {
        currency: true,
        percentage: true,
        dates: true,
        numbers: true,
      },
      multipleSheets: false,
      sheetNames: [],
      columnWidths: {},
      ...options,
    };

    // Excel cell styles
    this.styles = {
      header: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '007bff' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      },
      currency: {
        numFmt: '$#,##0.00',
      },
      percentage: {
        numFmt: '0.0%',
      },
      date: {
        numFmt: 'mm/dd/yyyy',
      },
      number: {
        numFmt: '#,##0',
      },
      decimal: {
        numFmt: '#,##0.00',
      },
    };
  }

  /**
   * Export data to Excel
   * @param {Object} data - Report data
   * @param {Object} options - Export options
   * @returns {Promise<ExportResult>}
   */
  async export(data, options = {}) {
    try {
      // Validate data
      const validation = this.validateData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      // Merge options
      const exportOptions = { ...this.defaultOptions, ...options };
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Set workbook properties
      const metadata = this.createMetadata(exportOptions);
      workbook.Props = {
        Title: metadata.title,
        Subject: metadata.subject,
        Author: metadata.author,
        CreatedDate: metadata.creationDate,
      };

      // Process sheets
      if (exportOptions.multipleSheets && data.sheets) {
        // Multiple sheets
        data.sheets.forEach((sheetData, index) => {
          const sheetName = exportOptions.sheetNames[index] || `Sheet${index + 1}`;
          this.createSheet(workbook, sheetData, sheetName, exportOptions);
        });
      } else {
        // Single sheet
        const sheetName = exportOptions.sheetNames[0] || 'Financial Report';
        this.createSheet(workbook, data, sheetName, exportOptions);
      }

      // Generate filename
      const fileName = this.generateFileName(
        exportOptions.fileName || 'financial-report',
        'xlsx',
      );

      // Write workbook to buffer
      const buffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        compression: true,
      });

      // Create blob
      const blob = new Blob([buffer], {
        type: this.getMimeType(ExportFormat.EXCEL),
      });

      return {
        success: true,
        fileName,
        data: blob,
        mimeType: this.getMimeType(ExportFormat.EXCEL),
        size: blob.size,
        metadata,
      };

    } catch (error) {
      return this.handleError(error, 'Excel Export');
    }
  }

  /**
   * Create sheet with data
   * @param {Object} workbook - Excel workbook
   * @param {Object} data - Sheet data
   * @param {string} sheetName - Sheet name
   * @param {Object} options - Export options
   */
  createSheet(workbook, data, sheetName, options) {
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    let currentRow = 0;

    // Add title
    if (data.title) {
      currentRow = this.addTitle(worksheet, data.title, currentRow);
    }

    // Add metadata
    if (data.metadata) {
      currentRow = this.addMetadata(worksheet, data.metadata, currentRow);
    }

    // Add summary
    if (data.summary) {
      currentRow = this.addSummary(worksheet, data.summary, currentRow);
    }

    // Add KPIs
    if (data.kpis) {
      currentRow = this.addKPIs(worksheet, data.kpis, currentRow, options);
    }

    // Add tables
    if (data.tables) {
      data.tables.forEach(table => {
        currentRow = this.addTable(worksheet, table, currentRow, options);
      });
    }

    // Add formulas
    if (options.includeFormulas && data.formulas) {
      this.addFormulas(worksheet, data.formulas);
    }

    // Apply column widths
    this.setColumnWidths(worksheet, options.columnWidths);

    // Add auto filter
    if (options.autoFilter && data.tables && data.tables.length > 0) {
      this.addAutoFilter(worksheet);
    }

    // Freeze panes
    if (options.freezePanes) {
      this.freezePanes(worksheet, data.freezeRow || 3, data.freezeCol || 0);
    }

    // Add to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  /**
   * Add title to worksheet
   * @param {Object} worksheet - Excel worksheet
   * @param {string} title - Title text
   * @param {number} row - Starting row
   * @returns {number} Next row
   */
  addTitle(worksheet, title, row) {
    const titleCell = { v: title, t: 's', s: {
      font: { bold: true, sz: 18 },
      alignment: { horizontal: 'center' },
    }};
    
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: { r: row, c: 0 } });
    
    // Merge cells for title
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({
      s: { r: row, c: 0 },
      e: { r: row, c: 7 },
    });
    
    return row + 2;
  }

  /**
   * Add metadata section
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} metadata - Metadata object
   * @param {number} row - Starting row
   * @returns {number} Next row
   */
  addMetadata(worksheet, metadata, row) {
    const metadataRows = [];
    
    if (metadata.reportDate) {
      metadataRows.push(['Report Date:', this.formatDate(metadata.reportDate)]);
    }
    if (metadata.period) {
      metadataRows.push(['Period:', metadata.period]);
    }
    if (metadata.currency) {
      metadataRows.push(['Currency:', metadata.currency]);
    }
    
    XLSX.utils.sheet_add_aoa(worksheet, metadataRows, { origin: { r: row, c: 0 } });
    
    return row + metadataRows.length + 1;
  }

  /**
   * Add summary section
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} summary - Summary data
   * @param {number} row - Starting row
   * @returns {number} Next row
   */
  addSummary(worksheet, summary, row) {
    const summaryTitle = [['Executive Summary']];
    XLSX.utils.sheet_add_aoa(worksheet, summaryTitle, { origin: { r: row, c: 0 } });
    
    // Style summary title
    const titleCell = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!worksheet[titleCell].s) worksheet[titleCell].s = {};
    worksheet[titleCell].s.font = { bold: true, sz: 14 };
    
    row += 2;
    
    // Add summary text
    const summaryText = summary.text || summary;
    const lines = summaryText.match(/.{1,100}(\s|$)/g) || [summaryText];
    
    lines.forEach(line => {
      XLSX.utils.sheet_add_aoa(worksheet, [[line.trim()]], { origin: { r: row, c: 0 } });
      
      // Merge cells for text
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      worksheet['!merges'].push({
        s: { r: row, c: 0 },
        e: { r: row, c: 7 },
      });
      
      row++;
    });
    
    return row + 1;
  }

  /**
   * Add KPIs section
   * @param {Object} worksheet - Excel worksheet
   * @param {Array} kpis - KPI data
   * @param {number} row - Starting row
   * @param {Object} options - Export options
   * @returns {number} Next row
   */
  addKPIs(worksheet, kpis, row, options) {
    const kpiTitle = [['Key Performance Indicators']];
    XLSX.utils.sheet_add_aoa(worksheet, kpiTitle, { origin: { r: row, c: 0 } });
    
    // Style KPI title
    const titleCell = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!worksheet[titleCell].s) worksheet[titleCell].s = {};
    worksheet[titleCell].s.font = { bold: true, sz: 14 };
    
    row += 2;
    
    // Create KPI grid
    const kpiHeaders = ['Metric', 'Value', 'Target', 'Variance', 'Trend'];
    const kpiData = [kpiHeaders];
    
    kpis.forEach(kpi => {
      const variance = kpi.target ? ((kpi.value - kpi.target) / kpi.target) : null;
      const row = [
        kpi.label,
        this.formatKPIValue(kpi),
        kpi.target ? this.formatKPIValue({ ...kpi, value: kpi.target }) : '-',
        variance !== null ? this.formatPercentage(variance) : '-',
        kpi.trend ? `${kpi.trend > 0 ? '↑' : '↓'} ${Math.abs(kpi.trend)}%` : '-',
      ];
      kpiData.push(row);
    });
    
    XLSX.utils.sheet_add_aoa(worksheet, kpiData, { origin: { r: row, c: 0 } });
    
    // Apply header styles
    for (let c = 0; c < kpiHeaders.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: row, c });
      if (worksheet[cell]) {
        worksheet[cell].s = this.styles.header;
      }
    }
    
    // Apply conditional formatting for variance
    if (options.formatting.percentage) {
      for (let r = row + 1; r < row + kpiData.length; r++) {
        const varianceCell = XLSX.utils.encode_cell({ r, c: 3 });
        if (worksheet[varianceCell] && worksheet[varianceCell].v !== '-') {
          const value = parseFloat(worksheet[varianceCell].v);
          worksheet[varianceCell].s = {
            ...worksheet[varianceCell].s,
            font: { color: { rgb: value >= 0 ? '28a745' : 'dc3545' } },
          };
        }
      }
    }
    
    return row + kpiData.length + 2;
  }

  /**
   * Add table to worksheet
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} tableData - Table data
   * @param {number} row - Starting row
   * @param {Object} options - Export options
   * @returns {number} Next row
   */
  addTable(worksheet, tableData, row, options) {
    // Add table title
    if (tableData.title) {
      XLSX.utils.sheet_add_aoa(worksheet, [[tableData.title]], { origin: { r: row, c: 0 } });
      
      const titleCell = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (!worksheet[titleCell].s) worksheet[titleCell].s = {};
      worksheet[titleCell].s.font = { bold: true, sz: 12 };
      
      row += 2;
    }
    
    // Prepare headers and data
    const headers = tableData.headers || Object.keys(tableData.data[0] || {});
    const tableArray = [headers];
    
    // Add data rows
    tableData.data.forEach(rowData => {
      const row = headers.map(header => rowData[header]);
      tableArray.push(row);
    });
    
    // Add totals row if available
    if (tableData.totals) {
      const totalsRow = headers.map(header => tableData.totals[header] || '');
      tableArray.push(totalsRow);
    }
    
    // Add to worksheet
    const startRow = row;
    XLSX.utils.sheet_add_aoa(worksheet, tableArray, { origin: { r: row, c: 0 } });
    
    // Apply header styles
    for (let c = 0; c < headers.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: startRow, c });
      if (worksheet[cell]) {
        worksheet[cell].s = this.styles.header;
      }
    }
    
    // Apply data formatting
    if (options.formatting) {
      this.applyTableFormatting(
        worksheet,
        tableData,
        startRow + 1,
        tableArray.length - 1,
        headers,
        options,
      );
    }
    
    // Apply totals row styling
    if (tableData.totals) {
      const totalsRow = startRow + tableArray.length - 1;
      for (let c = 0; c < headers.length; c++) {
        const cell = XLSX.utils.encode_cell({ r: totalsRow, c });
        if (worksheet[cell]) {
          if (!worksheet[cell].s) worksheet[cell].s = {};
          worksheet[cell].s.font = { bold: true };
          worksheet[cell].s.border = {
            top: { style: 'double', color: { rgb: '000000' } },
          };
        }
      }
    }
    
    // Add auto filter
    if (options.autoFilter) {
      const range = {
        s: { r: startRow, c: 0 },
        e: { r: startRow + tableData.data.length, c: headers.length - 1 },
      };
      worksheet['!autofilter'] = range;
    }
    
    return row + tableArray.length + 2;
  }

  /**
   * Apply table formatting
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} tableData - Table data
   * @param {number} startRow - Start row
   * @param {number} numRows - Number of rows
   * @param {Array} headers - Table headers
   * @param {Object} options - Export options
   */
  applyTableFormatting(worksheet, tableData, startRow, numRows, headers, options) {
    const formatting = tableData.formatting || {};
    
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < headers.length; c++) {
        const header = headers[c];
        const cell = XLSX.utils.encode_cell({ r: startRow + r, c });
        
        if (worksheet[cell]) {
          const format = formatting[header] || this.detectFormat(worksheet[cell].v);
          
          if (format && options.formatting[format]) {
            if (!worksheet[cell].s) worksheet[cell].s = {};
            
            switch (format) {
              case 'currency':
                worksheet[cell].s = { ...worksheet[cell].s, ...this.styles.currency };
                worksheet[cell].t = 'n';
                if (typeof worksheet[cell].v === 'string') {
                  worksheet[cell].v = parseFloat(worksheet[cell].v.replace(/[$,]/g, '')) || 0;
                }
                break;
                
              case 'percentage':
                worksheet[cell].s = { ...worksheet[cell].s, ...this.styles.percentage };
                worksheet[cell].t = 'n';
                if (typeof worksheet[cell].v === 'string' && worksheet[cell].v.includes('%')) {
                  worksheet[cell].v = parseFloat(worksheet[cell].v.replace('%', '')) / 100;
                }
                break;
                
              case 'date':
                worksheet[cell].s = { ...worksheet[cell].s, ...this.styles.date };
                worksheet[cell].t = 'd';
                if (typeof worksheet[cell].v === 'string') {
                  worksheet[cell].v = new Date(worksheet[cell].v);
                }
                break;
                
              case 'number':
                worksheet[cell].s = { ...worksheet[cell].s, ...this.styles.number };
                worksheet[cell].t = 'n';
                if (typeof worksheet[cell].v === 'string') {
                  worksheet[cell].v = parseFloat(worksheet[cell].v.replace(/,/g, '')) || 0;
                }
                break;
            }
          }
          
          // Apply conditional formatting
          if (tableData.conditionalFormatting && tableData.conditionalFormatting[header]) {
            this.applyConditionalFormatting(
              worksheet[cell],
              tableData.conditionalFormatting[header],
            );
          }
        }
      }
    }
  }

  /**
   * Add formulas to worksheet
   * @param {Object} worksheet - Excel worksheet
   * @param {Array} formulas - Formula definitions
   */
  addFormulas(worksheet, formulas) {
    formulas.forEach(formula => {
      const cell = XLSX.utils.encode_cell({ r: formula.row, c: formula.col });
      worksheet[cell] = {
        f: formula.formula,
        t: 'n',
      };
      
      if (formula.format) {
        worksheet[cell].s = this.styles[formula.format] || {};
      }
    });
  }

  /**
   * Set column widths
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} widths - Column width definitions
   */
  setColumnWidths(worksheet, widths) {
    const cols = [];
    const maxCol = Math.max(...Object.keys(widths).map(k => parseInt(k)), 10);
    
    for (let i = 0; i <= maxCol; i++) {
      cols.push({
        wch: widths[i] || 15,
      });
    }
    
    worksheet['!cols'] = cols;
  }

  /**
   * Add auto filter
   * @param {Object} worksheet - Excel worksheet
   */
  addAutoFilter(worksheet) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Find the last data row
    let lastDataRow = range.e.r;
    for (let r = range.e.r; r >= range.s.r; r--) {
      let hasData = false;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r, c });
        if (worksheet[cell] && worksheet[cell].v) {
          hasData = true;
          break;
        }
      }
      if (hasData) {
        lastDataRow = r;
        break;
      }
    }
    
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: range.s.r, c: range.s.c },
        e: { r: lastDataRow, c: range.e.c },
      }),
    };
  }

  /**
   * Freeze panes
   * @param {Object} worksheet - Excel worksheet
   * @param {number} row - Freeze row
   * @param {number} col - Freeze column
   */
  freezePanes(worksheet, row, col) {
    worksheet['!freeze'] = {
      xSplit: col,
      ySplit: row,
      topLeftCell: XLSX.utils.encode_cell({ r: row, c: col }),
      activePane: 'bottomRight',
      state: 'frozen',
    };
  }

  /**
   * Format KPI value
   * @param {Object} kpi - KPI object
   * @returns {string} Formatted value
   */
  formatKPIValue(kpi) {
    if (kpi.format === 'currency') {
      return this.formatCurrency(kpi.value);
    } else if (kpi.format === 'percentage') {
      return this.formatPercentage(kpi.value);
    } else if (kpi.format === 'number') {
      return this.formatNumber(kpi.value, kpi.decimals || 0);
    }
    return String(kpi.value);
  }

  /**
   * Detect format from value
   * @param {*} value - Value to check
   * @returns {string} Format type
   */
  detectFormat(value) {
    if (typeof value === 'string') {
      if (value.startsWith('$') || value.match(/^\$?[\d,]+\.?\d*$/)) {
        return 'currency';
      } else if (value.endsWith('%')) {
        return 'percentage';
      } else if (value.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
        return 'date';
      } else if (value.match(/^[\d,]+\.?\d*$/)) {
        return 'number';
      }
    } else if (typeof value === 'number') {
      return 'number';
    } else if (value instanceof Date) {
      return 'date';
    }
    
    return null;
  }

  /**
   * Apply conditional formatting
   * @param {Object} cell - Worksheet cell
   * @param {Object} rules - Formatting rules
   */
  applyConditionalFormatting(cell, rules) {
    if (!cell.s) cell.s = {};
    
    const value = typeof cell.v === 'number' ? cell.v : parseFloat(cell.v);
    
    if (!isNaN(value)) {
      if (rules.positive && value > 0) {
        cell.s.font = { ...cell.s.font, color: { rgb: '28a745' } };
      } else if (rules.negative && value < 0) {
        cell.s.font = { ...cell.s.font, color: { rgb: 'dc3545' } };
      }
      
      if (rules.threshold) {
        if (value >= rules.threshold.high) {
          cell.s.fill = { fgColor: { rgb: 'd4edda' } };
        } else if (value <= rules.threshold.low) {
          cell.s.fill = { fgColor: { rgb: 'f8d7da' } };
        }
      }
    }
  }
}