/**
 * PDF Export Service
 * Handles PDF generation and export functionality
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { BaseExportService } from './BaseExportService';
import { ExportFormat, PageOrientation, PageSize } from './types';

export class PDFExportService extends BaseExportService {
  constructor(options = {}) {
    super(options);
    
    this.defaultOptions = {
      orientation: PageOrientation.PORTRAIT,
      pageSize: PageSize.A4,
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      },
      compress: true,
      tableOfContents: false,
      header: {
        enabled: true,
        height: 30
      },
      footer: {
        enabled: true,
        height: 20
      },
      ...options
    };
  }

  /**
   * Export data to PDF
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
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: exportOptions.orientation,
        unit: 'mm',
        format: exportOptions.pageSize,
        compress: exportOptions.compress
      });

      // Set document properties
      const metadata = this.createMetadata(exportOptions);
      pdf.setProperties({
        title: metadata.title,
        subject: metadata.subject,
        author: metadata.author,
        keywords: metadata.keywords,
        creator: metadata.creator
      });

      // Add branding
      if (this.branding.logo) {
        await this.addLogo(pdf, this.branding.logo);
      }

      // Generate content
      let currentY = exportOptions.margins.top;
      
      // Add title
      currentY = this.addTitle(pdf, data.title || metadata.title, currentY);
      
      // Add executive summary
      if (data.summary) {
        currentY = this.addSummary(pdf, data.summary, currentY);
      }

      // Add KPIs
      if (data.kpis) {
        currentY = this.addKPISection(pdf, data.kpis, currentY);
      }

      // Add financial tables
      if (data.tables) {
        for (const table of data.tables) {
          currentY = await this.addTable(pdf, table, currentY);
        }
      }

      // Add charts
      if (exportOptions.includeCharts && data.charts) {
        for (const chart of data.charts) {
          currentY = await this.addChart(pdf, chart, currentY);
        }
      }

      // Add watermark
      if (this.branding.watermark) {
        this.addWatermark(pdf, this.branding.watermark);
      }

      // Add page numbers
      if (exportOptions.footer.enabled) {
        this.addPageNumbers(pdf);
      }

      // Generate filename
      const fileName = this.generateFileName(
        exportOptions.fileName || 'financial-report',
        'pdf'
      );

      // Convert to blob
      const blob = pdf.output('blob');

      return {
        success: true,
        fileName,
        data: blob,
        mimeType: this.getMimeType(ExportFormat.PDF),
        size: blob.size,
        metadata
      };

    } catch (error) {
      return this.handleError(error, 'PDF Export');
    }
  }

  /**
   * Add logo to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {string} logo - Logo URL or base64
   */
  async addLogo(pdf, logo) {
    try {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const logoWidth = 40;
      const logoHeight = 20;
      const x = pageWidth - logoWidth - this.defaultOptions.margins.right;
      const y = this.defaultOptions.margins.top;

      if (logo.startsWith('data:image')) {
        // Base64 image
        pdf.addImage(logo, 'PNG', x, y, logoWidth, logoHeight);
      } else {
        // URL - need to load first
        const img = await this.loadImage(logo);
        pdf.addImage(img, 'PNG', x, y, logoWidth, logoHeight);
      }
    } catch (error) {
      console.warn('Failed to add logo:', error);
    }
  }

  /**
   * Add title to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {string} title - Document title
   * @param {number} y - Y position
   * @returns {number} New Y position
   */
  addTitle(pdf, title, y) {
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(this.branding.colors.primary);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const textWidth = pdf.getStringUnitWidth(title) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
    const x = (pageWidth - textWidth) / 2;
    
    pdf.text(title, x, y + 10);
    
    // Add underline
    pdf.setDrawColor(this.branding.colors.primary);
    pdf.setLineWidth(0.5);
    pdf.line(x, y + 12, x + textWidth, y + 12);
    
    return y + 25;
  }

  /**
   * Add summary section
   * @param {jsPDF} pdf - PDF document
   * @param {Object} summary - Summary data
   * @param {number} y - Y position
   * @returns {number} New Y position
   */
  addSummary(pdf, summary, y) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Executive Summary', this.defaultOptions.margins.left, y);
    
    y += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Split text into lines
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - this.defaultOptions.margins.left - this.defaultOptions.margins.right;
    const lines = pdf.splitTextToSize(summary.text || summary, maxWidth);
    
    lines.forEach(line => {
      pdf.text(line, this.defaultOptions.margins.left, y);
      y += 6;
    });
    
    return y + 10;
  }

  /**
   * Add KPI section
   * @param {jsPDF} pdf - PDF document
   * @param {Array} kpis - KPI data
   * @param {number} y - Y position
   * @returns {number} New Y position
   */
  addKPISection(pdf, kpis, y) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Performance Indicators', this.defaultOptions.margins.left, y);
    
    y += 10;
    
    // Create KPI grid
    const pageWidth = pdf.internal.pageSize.getWidth();
    const cardWidth = (pageWidth - this.defaultOptions.margins.left - this.defaultOptions.margins.right - 30) / 3;
    const cardHeight = 30;
    let x = this.defaultOptions.margins.left;
    let row = 0;
    
    kpis.forEach((kpi, index) => {
      if (index > 0 && index % 3 === 0) {
        row++;
        x = this.defaultOptions.margins.left;
        y += cardHeight + 10;
      }
      
      // Draw card
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, cardWidth, cardHeight, 'F');
      
      // Add KPI content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(kpi.label, x + 5, y + 8);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const value = this.formatKPIValue(kpi);
      pdf.text(value, x + 5, y + 18);
      
      // Add trend if available
      if (kpi.trend) {
        const trendColor = kpi.trend > 0 ? this.branding.colors.success : this.branding.colors.danger;
        pdf.setTextColor(trendColor);
        pdf.setFontSize(10);
        const trendText = `${kpi.trend > 0 ? '↑' : '↓'} ${Math.abs(kpi.trend)}%`;
        pdf.text(trendText, x + 5, y + 25);
      }
      
      x += cardWidth + 10;
    });
    
    return y + cardHeight + 20;
  }

  /**
   * Add table to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {Object} tableData - Table data
   * @param {number} y - Y position
   * @returns {Promise<number>} New Y position
   */
  async addTable(pdf, tableData, y) {
    // Check if we need a new page
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + 50 > pageHeight - this.defaultOptions.margins.bottom) {
      pdf.addPage();
      y = this.defaultOptions.margins.top;
    }

    // Add table title
    if (tableData.title) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(tableData.title, this.defaultOptions.margins.left, y);
      y += 10;
    }

    // Prepare table data
    const headers = tableData.headers || Object.keys(tableData.data[0] || {});
    const rows = tableData.data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return this.formatTableValue(value, tableData.formatting?.[header]);
      });
    });

    // Generate table
    pdf.autoTable({
      head: [headers],
      body: rows,
      startY: y,
      margin: {
        left: this.defaultOptions.margins.left,
        right: this.defaultOptions.margins.right
      },
      theme: 'striped',
      headStyles: {
        fillColor: this.branding.colors.primary,
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: this.getColumnStyles(tableData),
      didDrawPage: (data) => {
        // Add header/footer to new pages
        if (data.pageNumber > 1) {
          this.addPageHeader(pdf, data.pageNumber);
        }
      }
    });

    return pdf.lastAutoTable.finalY + 15;
  }

  /**
   * Add chart to PDF
   * @param {jsPDF} pdf - PDF document
   * @param {Object} chartData - Chart data
   * @param {number} y - Y position
   * @returns {Promise<number>} New Y position
   */
  async addChart(pdf, chartData, y) {
    try {
      // Check if we need a new page
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (y + 100 > pageHeight - this.defaultOptions.margins.bottom) {
        pdf.addPage();
        y = this.defaultOptions.margins.top;
      }

      // Add chart title
      if (chartData.title) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(chartData.title, this.defaultOptions.margins.left, y);
        y += 10;
      }

      // Convert chart element to image
      if (chartData.element) {
        const canvas = await html2canvas(chartData.element, {
          scale: 2,
          backgroundColor: 'white'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth() - this.defaultOptions.margins.left - this.defaultOptions.margins.right;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', this.defaultOptions.margins.left, y, imgWidth, imgHeight);
        y += imgHeight + 15;
      }

      return y;
    } catch (error) {
      console.warn('Failed to add chart:', error);
      return y;
    }
  }

  /**
   * Add watermark to all pages
   * @param {jsPDF} pdf - PDF document
   * @param {string} watermark - Watermark text
   */
  addWatermark(pdf, watermark) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      pdf.saveGraphicsState();
      pdf.setGState(new pdf.GState({ opacity: 0.1 }));
      pdf.setFontSize(50);
      pdf.setTextColor(150, 150, 150);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Rotate and center watermark
      pdf.text(watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: -45
      });
      
      pdf.restoreGraphicsState();
    }
  }

  /**
   * Add page numbers
   * @param {jsPDF} pdf - PDF document
   */
  addPageNumbers(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const text = `Page ${i} of ${pageCount}`;
      const textWidth = pdf.getStringUnitWidth(text) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
      
      pdf.text(
        text,
        pageWidth - this.defaultOptions.margins.right - textWidth,
        pageHeight - this.defaultOptions.margins.bottom + 10
      );
    }
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
   * Format table value
   * @param {*} value - Value to format
   * @param {string} format - Format type
   * @returns {string} Formatted value
   */
  formatTableValue(value, format) {
    if (format === 'currency') {
      return this.formatCurrency(value);
    } else if (format === 'percentage') {
      return this.formatPercentage(value);
    } else if (format === 'number') {
      return this.formatNumber(value);
    } else if (format === 'date') {
      return this.formatDate(value);
    }
    return String(value || '-');
  }

  /**
   * Get column styles for table
   * @param {Object} tableData - Table data
   * @returns {Object} Column styles
   */
  getColumnStyles(tableData) {
    const styles = {};
    
    if (tableData.columnStyles) {
      Object.entries(tableData.columnStyles).forEach(([col, style]) => {
        styles[col] = {
          halign: style.align || 'left',
          cellWidth: style.width || 'auto'
        };
      });
    }
    
    return styles;
  }

  /**
   * Load image from URL
   * @param {string} url - Image URL
   * @returns {Promise<string>} Base64 image data
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Add page header
   * @param {jsPDF} pdf - PDF document
   * @param {number} pageNumber - Page number
   */
  addPageHeader(pdf, pageNumber) {
    if (this.defaultOptions.header.enabled && pageNumber > 1) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        'Financial Report - Continued',
        this.defaultOptions.margins.left,
        this.defaultOptions.margins.top - 5
      );
    }
  }
}