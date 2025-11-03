// src/services/export/__tests__/ExcelExportService.test.js
import { ExcelExportService } from '../ExcelExportService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Mock dependencies
jest.mock('xlsx');
jest.mock('file-saver');

describe('ExcelExportService', () => {
  let service;
  let mockWorkbook;
  let mockWorksheet;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock workbook and worksheet
    mockWorkbook = {
      Sheets: {},
      SheetNames: [],
      Props: {}
    };

    mockWorksheet = {
      '!ref': 'A1:D10',
      '!cols': []
    };

    XLSX.utils.book_new = jest.fn(() => mockWorkbook);
    XLSX.utils.json_to_sheet = jest.fn(() => mockWorksheet);
    XLSX.utils.book_append_sheet = jest.fn();
    XLSX.write = jest.fn(() => new ArrayBuffer(8));
    XLSX.writeFile = jest.fn();

    service = new ExcelExportService();
  });

  describe('constructor', () => {
    it('should create service with default options', () => {
      const service = new ExcelExportService();

      expect(service.defaultOptions.includeFormulas).toBe(true);
      expect(service.defaultOptions.autoFilter).toBe(true);
      expect(service.defaultOptions.freezePanes).toBe(true);
      expect(service.defaultOptions.formatting.currency).toBe(true);
    });

    it('should create service with custom options', () => {
      const customOptions = {
        includeFormulas: false,
        autoFilter: false,
        multipleSheets: true
      };

      const service = new ExcelExportService(customOptions);

      expect(service.defaultOptions.includeFormulas).toBe(false);
      expect(service.defaultOptions.autoFilter).toBe(false);
      expect(service.defaultOptions.multipleSheets).toBe(true);
    });

    it('should have predefined styles', () => {
      expect(service.styles).toHaveProperty('header');
      expect(service.styles).toHaveProperty('currency');
      expect(service.styles).toHaveProperty('percentage');
      expect(service.styles).toHaveProperty('date');
      expect(service.styles).toHaveProperty('number');
      expect(service.styles).toHaveProperty('decimal');
    });

    it('should have correct currency format', () => {
      expect(service.styles.currency.numFmt).toBe('$#,##0.00');
    });

    it('should have correct percentage format', () => {
      expect(service.styles.percentage.numFmt).toBe('0.0%');
    });
  });

  describe('export', () => {
    const validData = {
      companyInfo: {
        name: 'Test Company',
        reportDate: new Date('2024-01-01')
      },
      financialData: [
        {
          period: '2024-Q1',
          revenue: 1000000,
          expenses: 600000,
          profit: 400000
        }
      ]
    };

    it('should export data successfully with single sheet', async () => {
      // Mock validation
      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => ({
        title: 'Financial Report',
        subject: 'Finance',
        author: 'System',
        creationDate: new Date()
      }));
      service.createSheet = jest.fn();

      await service.export(validData);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(service.createSheet).toHaveBeenCalled();
    });

    it('should export data with multiple sheets', async () => {
      const multiSheetData = {
        ...validData,
        sheets: [
          { name: 'Income Statement', data: [] },
          { name: 'Balance Sheet', data: [] }
        ]
      };

      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => ({
        title: 'Financial Report',
        subject: 'Finance',
        author: 'System',
        creationDate: new Date()
      }));
      service.createSheet = jest.fn();

      const options = {
        multipleSheets: true,
        sheetNames: ['Income Statement', 'Balance Sheet']
      };

      await service.export(multiSheetData, options);

      expect(service.createSheet).toHaveBeenCalledTimes(2);
    });

    it('should throw error on validation failure', async () => {
      service.validateData = jest.fn(() => ({
        isValid: false,
        errors: ['Invalid data format']
      }));

      await expect(service.export(validData)).rejects.toThrow('Invalid data format');
    });

    it('should set workbook properties', async () => {
      const metadata = {
        title: 'Test Report',
        subject: 'Financial Analysis',
        author: 'Test User',
        creationDate: new Date('2024-01-01')
      };

      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => metadata);
      service.createSheet = jest.fn();

      await service.export(validData);

      expect(mockWorkbook.Props.Title).toBe('Test Report');
      expect(mockWorkbook.Props.Subject).toBe('Financial Analysis');
      expect(mockWorkbook.Props.Author).toBe('Test User');
      expect(mockWorkbook.Props.CreatedDate).toEqual(metadata.creationDate);
    });

    it('should use default sheet name when not provided', async () => {
      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => ({
        title: 'Report',
        subject: 'Finance',
        author: 'System',
        creationDate: new Date()
      }));
      service.createSheet = jest.fn();

      await service.export(validData);

      expect(service.createSheet).toHaveBeenCalledWith(
        mockWorkbook,
        expect.anything(),
        'Financial Report',
        expect.anything()
      );
    });

    it('should merge export options with defaults', async () => {
      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => ({
        title: 'Report',
        subject: 'Finance',
        author: 'System',
        creationDate: new Date()
      }));
      service.createSheet = jest.fn();

      const customOptions = {
        includeFormulas: false,
        customField: 'custom value'
      };

      await service.export(validData, customOptions);

      expect(service.createSheet).toHaveBeenCalledWith(
        mockWorkbook,
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          includeFormulas: false,
          customField: 'custom value',
          autoFilter: true // default still present
        })
      );
    });
  });

  describe('style configuration', () => {
    it('should have header style with correct properties', () => {
      expect(service.styles.header.font.bold).toBe(true);
      expect(service.styles.header.font.color.rgb).toBe('FFFFFF');
      expect(service.styles.header.fill.fgColor.rgb).toBe('007bff');
      expect(service.styles.header.alignment.horizontal).toBe('center');
    });

    it('should have border configuration in header style', () => {
      expect(service.styles.header.border.top.style).toBe('thin');
      expect(service.styles.header.border.bottom.style).toBe('thin');
      expect(service.styles.header.border.left.style).toBe('thin');
      expect(service.styles.header.border.right.style).toBe('thin');
    });

    it('should have correct date format', () => {
      expect(service.styles.date.numFmt).toBe('mm/dd/yyyy');
    });

    it('should have correct number formats', () => {
      expect(service.styles.number.numFmt).toBe('#,##0');
      expect(service.styles.decimal.numFmt).toBe('#,##0.00');
    });
  });

  describe('error handling', () => {
    it('should handle workbook creation errors', async () => {
      XLSX.utils.book_new.mockImplementationOnce(() => {
        throw new Error('Failed to create workbook');
      });

      service.validateData = jest.fn(() => ({ isValid: true, errors: [] }));
      service.createMetadata = jest.fn(() => ({
        title: 'Report',
        subject: 'Finance',
        author: 'System',
        creationDate: new Date()
      }));

      const validData = {
        companyInfo: { name: 'Test Company' },
        financialData: []
      };

      await expect(service.export(validData)).rejects.toThrow('Failed to create workbook');
    });

    it('should handle invalid data gracefully', async () => {
      service.validateData = jest.fn(() => ({
        isValid: false,
        errors: ['Missing required fields', 'Invalid data structure']
      }));

      await expect(service.export({})).rejects.toThrow('Missing required fields; Invalid data structure');
    });
  });

  describe('options handling', () => {
    it('should respect includeFormulas option', () => {
      const serviceWithoutFormulas = new ExcelExportService({ includeFormulas: false });
      expect(serviceWithoutFormulas.defaultOptions.includeFormulas).toBe(false);
    });

    it('should respect autoFilter option', () => {
      const serviceWithoutFilter = new ExcelExportService({ autoFilter: false });
      expect(serviceWithoutFilter.defaultOptions.autoFilter).toBe(false);
    });

    it('should respect freezePanes option', () => {
      const serviceWithoutFreeze = new ExcelExportService({ freezePanes: false });
      expect(serviceWithoutFreeze.defaultOptions.freezePanes).toBe(false);
    });

    it('should merge custom formatting options', () => {
      const customFormatting = {
        formatting: {
          currency: false,
          percentage: true,
          custom: 'value'
        }
      };

      const customService = new ExcelExportService(customFormatting);
      expect(customService.defaultOptions.formatting.currency).toBe(false);
      expect(customService.defaultOptions.formatting.percentage).toBe(true);
      expect(customService.defaultOptions.formatting.custom).toBe('value');
    });
  });
});
