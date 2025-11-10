/**
 * Branding Manager
 * Handles watermarking and branding options for exports
 */

export class BrandingManager {
  constructor(options = {}) {
    this.defaultBranding = {
      logo: null,
      watermark: {
        text: null,
        image: null,
        type: 'text',
        position: 'center',
        opacity: 0.1,
        angle: -45,
        font: '50px Arial',
        color: 'rgba(0, 0, 0, 0.1)',
      },
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
      },
      fonts: {
        heading: 'Arial, sans-serif',
        body: 'Arial, sans-serif',
        mono: 'Courier New, monospace',
      },
      header: {
        enabled: true,
        height: 60,
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
      },
      footer: {
        enabled: true,
        height: 40,
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        content: {
          left: '',
          center: '',
          right: 'Page {page} of {total}',
        },
      },
      ...options,
    };
  }

  /**
   * Apply branding to PDF
   * @param {Object} pdf - jsPDF instance
   * @param {Object} options - Branding options
   */
  applyPDFBranding(pdf, options = {}) {
    const branding = { ...this.defaultBranding, ...options };
    
    // Apply logo
    if (branding.logo) {
      this.addPDFLogo(pdf, branding.logo);
    }
    
    // Apply watermark
    if (branding.watermark && (branding.watermark.text || branding.watermark.image)) {
      this.addPDFWatermark(pdf, branding.watermark);
    }
    
    // Apply header/footer
    if (branding.header.enabled || branding.footer.enabled) {
      this.addPDFHeaderFooter(pdf, branding);
    }
  }

  /**
   * Add logo to PDF
   * @param {Object} pdf - jsPDF instance
   * @param {Object} logo - Logo configuration
   */
  addPDFLogo(pdf, logo) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Default logo settings
    const config = {
      width: 40,
      height: 20,
      x: pageWidth - 50,
      y: 10,
      ...logo,
    };
    
    // Position calculations
    switch (config.position) {
      case 'top-left':
        config.x = 10;
        config.y = 10;
        break;
      case 'top-center':
        config.x = (pageWidth - config.width) / 2;
        config.y = 10;
        break;
      case 'top-right':
        config.x = pageWidth - config.width - 10;
        config.y = 10;
        break;
      case 'bottom-left':
        config.x = 10;
        config.y = pageHeight - config.height - 10;
        break;
      case 'bottom-center':
        config.x = (pageWidth - config.width) / 2;
        config.y = pageHeight - config.height - 10;
        break;
      case 'bottom-right':
        config.x = pageWidth - config.width - 10;
        config.y = pageHeight - config.height - 10;
        break;
    }
    
    // Add logo to all pages
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      if (config.url || config.base64) {
        pdf.addImage(
          config.url || config.base64,
          config.format || 'PNG',
          config.x,
          config.y,
          config.width,
          config.height,
        );
      }
    }
  }

  /**
   * Add watermark to PDF
   * @param {Object} pdf - jsPDF instance
   * @param {Object} watermark - Watermark configuration
   */
  addPDFWatermark(pdf, watermark) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      if (watermark.type === 'text' && watermark.text) {
        this.addPDFTextWatermark(pdf, watermark, pageWidth, pageHeight);
      } else if (watermark.type === 'image' && watermark.image) {
        this.addPDFImageWatermark(pdf, watermark, pageWidth, pageHeight);
      }
    }
  }

  /**
   * Add text watermark to PDF page
   * @param {Object} pdf - jsPDF instance
   * @param {Object} watermark - Watermark configuration
   * @param {number} pageWidth - Page width
   * @param {number} pageHeight - Page height
   */
  addPDFTextWatermark(pdf, watermark, pageWidth, pageHeight) {
    pdf.saveGraphicsState();
    
    // Set transparency
    pdf.setGState(new pdf.GState({ opacity: watermark.opacity || 0.1 }));
    
    // Set font
    const fontSize = parseInt(watermark.font) || 50;
    pdf.setFontSize(fontSize);
    pdf.setTextColor(150, 150, 150);
    
    // Calculate position
    let x = pageWidth / 2;
    let y = pageHeight / 2;
    
    switch (watermark.position) {
      case 'top-left':
        x = pageWidth * 0.25;
        y = pageHeight * 0.25;
        break;
      case 'top-right':
        x = pageWidth * 0.75;
        y = pageHeight * 0.25;
        break;
      case 'bottom-left':
        x = pageWidth * 0.25;
        y = pageHeight * 0.75;
        break;
      case 'bottom-right':
        x = pageWidth * 0.75;
        y = pageHeight * 0.75;
        break;
      case 'diagonal':
        // Multiple diagonal watermarks
        const step = 150;
        for (let dx = -pageWidth; dx < pageWidth * 2; dx += step) {
          for (let dy = -pageHeight; dy < pageHeight * 2; dy += step) {
            pdf.text(watermark.text, dx, dy, {
              angle: watermark.angle || -45,
              align: 'center',
            });
          }
        }
        pdf.restoreGraphicsState();
        return;
    }
    
    // Add watermark text
    pdf.text(watermark.text, x, y, {
      angle: watermark.angle || 0,
      align: 'center',
      baseline: 'middle',
    });
    
    pdf.restoreGraphicsState();
  }

  /**
   * Add image watermark to PDF page
   * @param {Object} pdf - jsPDF instance
   * @param {Object} watermark - Watermark configuration
   * @param {number} pageWidth - Page width
   * @param {number} pageHeight - Page height
   */
  addPDFImageWatermark(pdf, watermark, pageWidth, pageHeight) {
    pdf.saveGraphicsState();
    
    // Set transparency
    pdf.setGState(new pdf.GState({ opacity: watermark.opacity || 0.1 }));
    
    const width = watermark.width || 100;
    const height = watermark.height || 100;
    let x = (pageWidth - width) / 2;
    let y = (pageHeight - height) / 2;
    
    // Position adjustments
    switch (watermark.position) {
      case 'top-left':
        x = 20;
        y = 20;
        break;
      case 'top-right':
        x = pageWidth - width - 20;
        y = 20;
        break;
      case 'bottom-left':
        x = 20;
        y = pageHeight - height - 20;
        break;
      case 'bottom-right':
        x = pageWidth - width - 20;
        y = pageHeight - height - 20;
        break;
    }
    
    pdf.addImage(
      watermark.image,
      watermark.format || 'PNG',
      x,
      y,
      width,
      height,
    );
    
    pdf.restoreGraphicsState();
  }

  /**
   * Add header and footer to PDF
   * @param {Object} pdf - jsPDF instance
   * @param {Object} branding - Branding configuration
   */
  addPDFHeaderFooter(pdf, branding) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Add header
      if (branding.header.enabled) {
        this.addPDFHeader(pdf, branding.header, pageWidth, i);
      }
      
      // Add footer
      if (branding.footer.enabled) {
        this.addPDFFooter(pdf, branding.footer, pageWidth, pageHeight, i, pageCount);
      }
    }
  }

  /**
   * Add header to PDF page
   * @param {Object} pdf - jsPDF instance
   * @param {Object} header - Header configuration
   * @param {number} pageWidth - Page width
   * @param {number} pageNumber - Current page number
   */
  addPDFHeader(pdf, header, pageWidth, pageNumber) {
    // Skip header on first page if specified
    if (header.skipFirstPage && pageNumber === 1) {
      return;
    }
    
    // Draw header background
    if (header.backgroundColor) {
      pdf.setFillColor(header.backgroundColor);
      pdf.rect(0, 0, pageWidth, header.height, 'F');
    }
    
    // Draw header border
    if (header.borderColor) {
      pdf.setDrawColor(header.borderColor);
      pdf.setLineWidth(0.5);
      pdf.line(0, header.height, pageWidth, header.height);
    }
    
    // Add header content
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    if (header.content) {
      // Left content
      if (header.content.left) {
        pdf.text(header.content.left, 10, header.height / 2);
      }
      
      // Center content
      if (header.content.center) {
        const centerText = header.content.center;
        const textWidth = pdf.getStringUnitWidth(centerText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        pdf.text(centerText, (pageWidth - textWidth) / 2, header.height / 2);
      }
      
      // Right content
      if (header.content.right) {
        const rightText = header.content.right;
        const textWidth = pdf.getStringUnitWidth(rightText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        pdf.text(rightText, pageWidth - textWidth - 10, header.height / 2);
      }
    }
  }

  /**
   * Add footer to PDF page
   * @param {Object} pdf - jsPDF instance
   * @param {Object} footer - Footer configuration
   * @param {number} pageWidth - Page width
   * @param {number} pageHeight - Page height
   * @param {number} pageNumber - Current page number
   * @param {number} totalPages - Total page count
   */
  addPDFFooter(pdf, footer, pageWidth, pageHeight, pageNumber, totalPages) {
    const footerY = pageHeight - footer.height;
    
    // Draw footer background
    if (footer.backgroundColor) {
      pdf.setFillColor(footer.backgroundColor);
      pdf.rect(0, footerY, pageWidth, footer.height, 'F');
    }
    
    // Draw footer border
    if (footer.borderColor) {
      pdf.setDrawColor(footer.borderColor);
      pdf.setLineWidth(0.5);
      pdf.line(0, footerY, pageWidth, footerY);
    }
    
    // Add footer content
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    
    const textY = footerY + footer.height / 2;
    
    if (footer.content) {
      // Process content with replacements
      const processContent = (content) => {
        return content
          .replace('{page}', pageNumber)
          .replace('{total}', totalPages)
          .replace('{date}', new Date().toLocaleDateString())
          .replace('{time}', new Date().toLocaleTimeString());
      };
      
      // Left content
      if (footer.content.left) {
        pdf.text(processContent(footer.content.left), 10, textY);
      }
      
      // Center content
      if (footer.content.center) {
        const centerText = processContent(footer.content.center);
        const textWidth = pdf.getStringUnitWidth(centerText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        pdf.text(centerText, (pageWidth - textWidth) / 2, textY);
      }
      
      // Right content
      if (footer.content.right) {
        const rightText = processContent(footer.content.right);
        const textWidth = pdf.getStringUnitWidth(rightText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        pdf.text(rightText, pageWidth - textWidth - 10, textY);
      }
    }
  }

  /**
   * Apply branding to Excel
   * @param {Object} workbook - Excel workbook
   * @param {Object} options - Branding options
   */
  applyExcelBranding(workbook, options = {}) {
    const branding = { ...this.defaultBranding, ...options };
    
    // Apply to each worksheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Add header rows
      if (branding.header.enabled) {
        this.addExcelHeader(worksheet, branding);
      }
      
      // Apply color scheme
      if (branding.colors) {
        this.applyExcelColors(worksheet, branding.colors);
      }
    });
  }

  /**
   * Add header to Excel worksheet
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} branding - Branding configuration
   */
  addExcelHeader(worksheet, branding) {
    // Shift existing data down
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Insert header rows
    const headerRows = 3;
    for (let r = range.e.r; r >= range.s.r; r--) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const oldCell = XLSX.utils.encode_cell({ r, c });
        const newCell = XLSX.utils.encode_cell({ r: r + headerRows, c });
        
        if (worksheet[oldCell]) {
          worksheet[newCell] = worksheet[oldCell];
          delete worksheet[oldCell];
        }
      }
    }
    
    // Add company name
    worksheet['A1'] = {
      v: branding.companyName || 'Company Name',
      t: 's',
      s: {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center' },
      },
    };
    
    // Merge cells for company name
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: range.e.c },
    });
    
    // Add report title
    worksheet['A2'] = {
      v: branding.reportTitle || 'Financial Report',
      t: 's',
      s: {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' },
      },
    };
    
    // Merge cells for title
    worksheet['!merges'].push({
      s: { r: 1, c: 0 },
      e: { r: 1, c: range.e.c },
    });
    
    // Update range
    range.e.r += headerRows;
    worksheet['!ref'] = XLSX.utils.encode_range(range);
  }

  /**
   * Apply color scheme to Excel
   * @param {Object} worksheet - Excel worksheet
   * @param {Object} colors - Color configuration
   */
  applyExcelColors(worksheet, colors) {
    // This would require more complex Excel manipulation
    // For now, we'll apply basic header styling
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style header row
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: range.s.r, c });
      if (worksheet[cell]) {
        if (!worksheet[cell].s) worksheet[cell].s = {};
        worksheet[cell].s.fill = { fgColor: { rgb: colors.primary.replace('#', '') } };
        worksheet[cell].s.font = { color: { rgb: 'FFFFFF' }, bold: true };
      }
    }
  }

  /**
   * Create watermarked canvas
   * @param {HTMLCanvasElement} originalCanvas - Original canvas
   * @param {Object} watermark - Watermark configuration
   * @returns {HTMLCanvasElement} Watermarked canvas
   */
  createWatermarkedCanvas(originalCanvas, watermark) {
    const canvas = document.createElement('canvas');
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw original content
    ctx.drawImage(originalCanvas, 0, 0);
    
    // Apply watermark
    if (watermark.type === 'text' && watermark.text) {
      this.drawCanvasTextWatermark(ctx, watermark, canvas.width, canvas.height);
    } else if (watermark.type === 'image' && watermark.image) {
      this.drawCanvasImageWatermark(ctx, watermark, canvas.width, canvas.height);
    }
    
    return canvas;
  }

  /**
   * Draw text watermark on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} watermark - Watermark configuration
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawCanvasTextWatermark(ctx, watermark, width, height) {
    ctx.save();
    
    ctx.globalAlpha = watermark.opacity || 0.5;
    ctx.font = watermark.font || '50px Arial';
    ctx.fillStyle = watermark.color || 'rgba(0, 0, 0, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position and rotation
    ctx.translate(width / 2, height / 2);
    if (watermark.angle) {
      ctx.rotate((watermark.angle * Math.PI) / 180);
    }
    
    ctx.fillText(watermark.text, 0, 0);
    
    ctx.restore();
  }

  /**
   * Draw image watermark on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} watermark - Watermark configuration
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  async drawCanvasImageWatermark(ctx, watermark, width, height) {
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = watermark.opacity || 0.5;
        
        const imgWidth = watermark.width || img.width;
        const imgHeight = watermark.height || img.height;
        const x = (width - imgWidth) / 2;
        const y = (height - imgHeight) / 2;
        
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
        ctx.restore();
        
        resolve();
      };
      
      img.src = watermark.image;
    });
  }

  /**
   * Get branding configuration
   * @param {Object} customBranding - Custom branding options
   * @returns {Object} Complete branding configuration
   */
  getBranding(customBranding = {}) {
    return {
      ...this.defaultBranding,
      ...customBranding,
    };
  }

  /**
   * Load branding from storage
   * @returns {Object} Stored branding configuration
   */
  loadBranding() {
    try {
      const stored = localStorage.getItem('exportBranding');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load branding:', error);
    }
    
    return this.defaultBranding;
  }

  /**
   * Save branding to storage
   * @param {Object} branding - Branding configuration
   */
  saveBranding(branding) {
    try {
      localStorage.setItem('exportBranding', JSON.stringify(branding));
    } catch (error) {
      console.error('Failed to save branding:', error);
    }
  }
}