/**
 * Chart Exporter Utility
 * Handles exporting charts and graphs to various formats
 */

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export class ChartExporter {
  constructor(options = {}) {
    this.defaultOptions = {
      format: 'png',
      quality: 0.92,
      scale: 2,
      backgroundColor: '#ffffff',
      transparent: false,
      ...options
    };
  }

  /**
   * Export chart element to image
   * @param {HTMLElement} element - Chart element to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportChart(element, options = {}) {
    try {
      if (!element) {
        throw new Error('No chart element provided');
      }

      const exportOptions = { ...this.defaultOptions, ...options };
      
      // Capture the chart
      const canvas = await this.captureElement(element, exportOptions);
      
      // Convert to desired format
      const blob = await this.canvasToBlob(canvas, exportOptions);
      
      // Generate filename
      const fileName = this.generateFileName(
        options.fileName || 'chart',
        exportOptions.format
      );

      return {
        success: true,
        blob,
        dataUrl: canvas.toDataURL(`image/${exportOptions.format}`, exportOptions.quality),
        fileName,
        dimensions: {
          width: canvas.width,
          height: canvas.height
        }
      };

    } catch (error) {
      console.error('Chart export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export multiple charts
   * @param {Array} charts - Array of chart configurations
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export results
   */
  async exportMultipleCharts(charts, options = {}) {
    const results = [];
    
    for (const chart of charts) {
      const result = await this.exportChart(chart.element, {
        ...options,
        fileName: chart.name || options.fileName
      });
      
      results.push({
        ...result,
        chartId: chart.id,
        chartName: chart.name
      });
    }
    
    return results;
  }

  /**
   * Export chart and download
   * @param {HTMLElement} element - Chart element
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportAndDownload(element, options = {}) {
    const result = await this.exportChart(element, options);
    
    if (result.success) {
      saveAs(result.blob, result.fileName);
    }
    
    return result;
  }

  /**
   * Export chart to base64
   * @param {HTMLElement} element - Chart element
   * @param {Object} options - Export options
   * @returns {Promise<string>} Base64 string
   */
  async exportToBase64(element, options = {}) {
    const result = await this.exportChart(element, options);
    
    if (result.success) {
      return result.dataUrl;
    }
    
    throw new Error(result.error || 'Export failed');
  }

  /**
   * Export chart with custom dimensions
   * @param {HTMLElement} element - Chart element
   * @param {Object} dimensions - Custom dimensions
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportWithDimensions(element, dimensions, options = {}) {
    const { width, height } = dimensions;
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    
    // Clone the chart
    const clone = element.cloneNode(true);
    clone.style.width = '100%';
    clone.style.height = '100%';
    
    container.appendChild(clone);
    document.body.appendChild(container);
    
    try {
      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Export the resized chart
      const result = await this.exportChart(container, options);
      
      return result;
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Export chart collection as PDF
   * @param {Array} charts - Array of chart elements
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportChartsAsPDF(charts, options = {}) {
    try {
      const images = [];
      
      // Export each chart as image
      for (const chart of charts) {
        const result = await this.exportChart(chart.element, {
          format: 'png',
          scale: 2
        });
        
        if (result.success) {
          images.push({
            dataUrl: result.dataUrl,
            title: chart.title || '',
            dimensions: result.dimensions
          });
        }
      }
      
      // Create PDF with images
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: options.pageSize || 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margins = options.margins || { top: 20, bottom: 20, left: 20, right: 20 };
      
      images.forEach((image, index) => {
        if (index > 0) {
          pdf.addPage();
        }
        
        // Add title
        if (image.title) {
          pdf.setFontSize(14);
          pdf.text(image.title, margins.left, margins.top);
        }
        
        // Calculate image dimensions
        const maxWidth = pageWidth - margins.left - margins.right;
        const maxHeight = pageHeight - margins.top - margins.bottom - (image.title ? 10 : 0);
        
        const aspectRatio = image.dimensions.width / image.dimensions.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = margins.top + (image.title ? 10 : 0);
        
        // Add image
        pdf.addImage(image.dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      });
      
      // Generate filename
      const fileName = this.generateFileName(
        options.fileName || 'charts',
        'pdf'
      );
      
      const blob = pdf.output('blob');
      
      return {
        success: true,
        blob,
        fileName,
        pageCount: images.length
      };
      
    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Capture element to canvas
   * @param {HTMLElement} element - Element to capture
   * @param {Object} options - Capture options
   * @returns {Promise<HTMLCanvasElement>} Canvas element
   */
  async captureElement(element, options) {
    const config = {
      scale: options.scale,
      backgroundColor: options.transparent ? null : options.backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
      ...options.html2canvasOptions
    };
    
    // Handle custom dimensions
    if (options.dimensions) {
      config.width = options.dimensions.width;
      config.height = options.dimensions.height;
    }
    
    return await html2canvas(element, config);
  }

  /**
   * Convert canvas to blob
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} options - Conversion options
   * @returns {Promise<Blob>} Blob object
   */
  canvasToBlob(canvas, options) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        `image/${options.format}`,
        options.quality
      );
    });
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
   * Export SVG chart
   * @param {SVGElement} svgElement - SVG element
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  exportSVG(svgElement, options = {}) {
    try {
      // Get SVG string
      const svgString = new XMLSerializer().serializeToString(svgElement);
      
      // Create blob
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      
      // Generate filename
      const fileName = this.generateFileName(
        options.fileName || 'chart',
        'svg'
      );
      
      return {
        success: true,
        blob,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
        fileName
      };
      
    } catch (error) {
      console.error('SVG export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply watermark to chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} watermark - Watermark options
   * @returns {HTMLCanvasElement} Watermarked canvas
   */
  applyWatermark(canvas, watermark) {
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    
    // Set watermark style
    ctx.globalAlpha = watermark.opacity || 0.5;
    ctx.font = watermark.font || '20px Arial';
    ctx.fillStyle = watermark.color || '#cccccc';
    
    if (watermark.type === 'text') {
      // Text watermark
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Rotate if needed
      if (watermark.angle) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((watermark.angle * Math.PI) / 180);
        ctx.fillText(watermark.text, 0, 0);
      } else {
        ctx.fillText(watermark.text, canvas.width / 2, canvas.height / 2);
      }
    } else if (watermark.type === 'image' && watermark.image) {
      // Image watermark
      const img = new Image();
      img.onload = () => {
        const width = watermark.width || img.width;
        const height = watermark.height || img.height;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
      };
      img.src = watermark.image;
    }
    
    ctx.restore();
    
    return canvas;
  }

  /**
   * Create chart thumbnail
   * @param {HTMLElement} element - Chart element
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} Thumbnail result
   */
  async createThumbnail(element, options = {}) {
    const thumbnailOptions = {
      ...options,
      scale: 0.5,
      dimensions: {
        width: options.width || 200,
        height: options.height || 150
      }
    };
    
    return await this.exportChart(element, thumbnailOptions);
  }
}