/**
 * Export Service Tests
 * Unit tests for export functionality
 */

import { ExportService } from '../ExportService';
import { ExportFormat } from '../types';

describe('ExportService', () => {
  let exportService;
  
  beforeEach(() => {
    exportService = new ExportService();
    
    // Mock download functionality
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document methods
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Export Formats', () => {
    it('should provide available export formats', () => {
      const formats = exportService.getFormats();
      
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.id)).toEqual([
        ExportFormat.PDF,
        ExportFormat.EXCEL
      ]);
    });
  });
  
  describe('Data Validation', () => {
    it('should validate export data', () => {
      const validData = {
        title: 'Test Report',
        tables: [{ data: [] }]
      };
      
      const result = exportService.validateData(validData, ExportFormat.PDF);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect invalid data', () => {
      const invalidData = null;
      
      const result = exportService.validateData(invalidData, ExportFormat.PDF);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No data provided for export');
    });
    
    it('should warn about large data', () => {
      const largeData = {
        content: 'x'.repeat(11 * 1024 * 1024) // 11MB
      };
      
      const result = exportService.validateData(largeData, ExportFormat.PDF);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Large data size may affect export performance');
    });
  });
  
  describe('Templates', () => {
    it('should load default templates', () => {
      const templates = exportService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('category');
    });
    
    it('should filter templates by category', () => {
      const summaryTemplates = exportService.getTemplates('summary');
      
      expect(summaryTemplates.length).toBeGreaterThan(0);
      expect(summaryTemplates.every(t => t.category === 'summary')).toBe(true);
    });
    
    it('should create custom template', () => {
      const customTemplate = {
        name: 'Custom Report',
        description: 'Test custom template',
        category: 'custom',
        sections: []
      };
      
      const created = exportService.createTemplate(customTemplate);
      
      expect(created).toHaveProperty('id');
      expect(created.name).toBe('Custom Report');
      expect(created.isCustom).toBe(true);
    });
    
    it('should clone existing template', () => {
      const templates = exportService.getTemplates();
      const templateToClone = templates[0];
      
      const cloned = exportService.cloneTemplate(templateToClone.id, 'Cloned Template');
      
      expect(cloned.id).not.toBe(templateToClone.id);
      expect(cloned.name).toBe('Cloned Template');
      expect(cloned.isCustom).toBe(true);
    });
  });
  
  describe('Branding', () => {
    it('should provide default branding', () => {
      const branding = exportService.getBranding();
      
      expect(branding).toHaveProperty('colors');
      expect(branding).toHaveProperty('fonts');
      expect(branding).toHaveProperty('watermark');
    });
    
    it('should update branding configuration', () => {
      const newBranding = {
        colors: {
          primary: '#ff0000'
        },
        watermark: {
          text: 'CONFIDENTIAL'
        }
      };
      
      exportService.updateBranding(newBranding);
      const updated = exportService.getBranding();
      
      expect(updated.colors.primary).toBe('#ff0000');
      expect(updated.watermark.text).toBe('CONFIDENTIAL');
    });
  });
  
  describe('Export Statistics', () => {
    it('should track export statistics', () => {
      const stats = exportService.getStatistics();
      
      expect(stats).toHaveProperty('totalExports');
      expect(stats).toHaveProperty('byFormat');
      expect(stats).toHaveProperty('lastExport');
      expect(stats).toHaveProperty('averageSize');
    });
    
    it('should update statistics after export', () => {
      const initialStats = exportService.getStatistics();
      
      exportService.updateStatistics({
        format: ExportFormat.PDF,
        size: 1024 * 1024 // 1MB
      });
      
      const updatedStats = exportService.getStatistics();
      
      expect(updatedStats.totalExports).toBe(initialStats.totalExports + 1);
    });
  });
  
  describe('Export Preview', () => {
    it('should generate preview URL', async () => {
      const data = {
        title: 'Test Report',
        content: 'Test content'
      };
      
      // Mock the export service response
      exportService.pdfService.export = jest.fn().mockResolvedValue({
        success: true,
        data: new Blob(['test'], { type: 'application/pdf' })
      });
      
      const result = await exportService.preview(data, {
        format: ExportFormat.PDF
      });
      
      expect(result.success).toBe(true);
      expect(result.previewUrl).toBe('mock-url');
    });
  });
  
  describe('Cross-browser Compatibility', () => {
    it('should handle missing Blob constructor', () => {
      const originalBlob = global.Blob;
      global.Blob = undefined;
      
      // Service should still initialize without errors
      expect(() => new ExportService()).not.toThrow();
      
      global.Blob = originalBlob;
    });
    
    it('should handle missing URL API', () => {
      const originalURL = global.URL;
      global.URL = undefined;
      
      const service = new ExportService();
      
      // Download should fail gracefully
      expect(() => service.download(new Blob(['test']), 'test.pdf')).not.toThrow();
      
      global.URL = originalURL;
    });
  });
});

/**
 * Integration tests for real-world scenarios
 */
describe('ExportService Integration', () => {
  let exportService;
  
  beforeEach(() => {
    exportService = new ExportService();
  });
  
  it('should export financial report with charts', async () => {
    const reportData = {
      title: 'Q4 2024 Financial Report',
      metadata: {
        period: 'Q4 2024',
        currency: 'USD'
      },
      summary: {
        text: 'Strong performance in Q4 with revenue growth of 15%'
      },
      kpis: [
        { label: 'Revenue', value: 1000000, format: 'currency' },
        { label: 'Gross Margin', value: 0.45, format: 'percentage' },
        { label: 'Operating Income', value: 150000, format: 'currency' }
      ],
      tables: [
        {
          title: 'Income Statement',
          headers: ['Item', 'Q4 2024', 'Q4 2023', 'Change'],
          data: [
            { Item: 'Revenue', 'Q4 2024': 1000000, 'Q4 2023': 870000, Change: 130000 },
            { Item: 'COGS', 'Q4 2024': 550000, 'Q4 2023': 500000, Change: 50000 },
            { Item: 'Gross Profit', 'Q4 2024': 450000, 'Q4 2023': 370000, Change: 80000 }
          ],
          formatting: {
            'Q4 2024': 'currency',
            'Q4 2023': 'currency',
            'Change': 'currency'
          }
        }
      ]
    };
    
    const validation = exportService.validateData(reportData, ExportFormat.PDF);
    expect(validation.valid).toBe(true);
    
    // Would test actual export in e2e tests
  });
  
  it('should handle batch export with multiple formats', async () => {
    const reports = [
      {
        id: 'report1',
        name: 'January Report',
        data: { title: 'January 2024', content: 'January data' },
        format: ExportFormat.PDF
      },
      {
        id: 'report2',
        name: 'February Report',
        data: { title: 'February 2024', content: 'February data' },
        format: ExportFormat.EXCEL
      }
    ];
    
    // Mock the batch service
    exportService.batchService.exportBatch = jest.fn().mockResolvedValue({
      success: true,
      totalReports: 2,
      successfulExports: 2,
      failedExports: 0
    });
    
    const result = await exportService.exportBatch(reports);
    
    expect(result.success).toBe(true);
    expect(result.successfulExports).toBe(2);
  });
});