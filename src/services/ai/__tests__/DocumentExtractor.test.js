// src/services/ai/__tests__/DocumentExtractor.test.js
import { DocumentExtractor } from '../DocumentExtractor';
import { AIService } from '../AIService';
import { ExtractionSource } from '../types';

// Mock AIService
jest.mock('../AIService');

describe('DocumentExtractor', () => {
  let mockAIService;
  let extractor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AIService instance
    mockAIService = {
      extractData: jest.fn(),
    };

    AIService.mockImplementation(() => mockAIService);

    extractor = new DocumentExtractor();
  });

  describe('Initialization', () => {
    it('should initialize with default AIService', () => {
      expect(extractor.aiService).toBeDefined();
      expect(extractor.extractionCache).toBeInstanceOf(Map);
    });

    it('should accept custom AIService', () => {
      const customService = { extractData: jest.fn() };
      const customExtractor = new DocumentExtractor(customService);

      expect(customExtractor.aiService).toBe(customService);
    });
  });

  describe('extractFromExcel', () => {
    it('should extract data from Excel content', async () => {
      const excelContent = 'Revenue\tCOGS\tProfit\n1000000\t600000\t400000';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{ revenue: 1000000, cogs: 600000, profit: 400000 }],
        confidence: 0.95,
      });

      const result = await extractor.extractFromExcel(excelContent);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        excelContent,
        ExtractionSource.EXCEL,
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('table structures'),
          ]),
        }),
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle multiple periods', async () => {
      const excelContent = 'Period 1\tPeriod 2\n1000\t2000';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [
          { revenue: 1000 },
          { revenue: 2000 },
        ],
        confidence: 0.9,
      });

      const result = await extractor.extractFromExcel(excelContent, { periods: 2 });

      expect(result.data).toHaveLength(2);
    });

    it('should include Brazilian format instructions', async () => {
      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [],
        confidence: 0,
      });

      await extractor.extractFromExcel('Content');

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('Brazilian format'),
          ]),
        }),
      );
    });
  });

  describe('extractFromPDF', () => {
    it('should extract data from PDF text', async () => {
      const pdfText = `
        FINANCIAL STATEMENT
        Revenue: R$ 1.000.000,00
        Net Profit: R$ 200.000,00
      `;

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{
          revenue: 1000000,
          netProfit: 200000,
        }],
        confidence: 0.88,
      });

      const result = await extractor.extractFromPDF(pdfText);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        pdfText,
        ExtractionSource.PDF,
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('income statement'),
          ]),
        }),
      );

      expect(result.success).toBe(true);
    });

    it('should handle narrative format PDFs', async () => {
      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{ revenue: 500000 }],
        confidence: 0.75,
      });

      await extractor.extractFromPDF('Narrative text format');

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        ExtractionSource.PDF,
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('narrative'),
          ]),
        }),
      );
    });
  });

  describe('extractFromImage', () => {
    it('should extract data from OCR text', async () => {
      const ocrText = 'Revenue 1000000 Profit 200000';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{ revenue: 1000000, profit: 200000 }],
        confidence: 0.70,
      });

      const result = await extractor.extractFromImage(ocrText);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        ocrText,
        ExtractionSource.IMAGE,
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('OCR text'),
          ]),
        }),
      );

      expect(result.success).toBe(true);
    });

    it('should include OCR error handling instructions', async () => {
      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [],
        confidence: 0,
      });

      await extractor.extractFromImage('OCR content');

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          instructions: expect.arrayContaining([
            expect.stringContaining('recognition errors'),
            expect.stringContaining('conservative'),
          ]),
        }),
      );
    });
  });

  describe('smartExtract', () => {
    it('should detect and extract from Excel format', async () => {
      const excelContent = 'Col1\tCol2\tCol3\n100\t200\t300\n400\t500\t600';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{ value: 100 }],
        confidence: 0.9,
      });

      const result = await extractor.smartExtract(excelContent);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        ExtractionSource.EXCEL,
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should detect and extract from PDF format', async () => {
      const pdfContent = 'Page 1\n\nFinancial Data\n\nPage 2';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{ value: 100 }],
        confidence: 0.8,
      });

      await extractor.smartExtract(pdfContent);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        ExtractionSource.PDF,
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should fallback to generic extraction for unknown formats', async () => {
      const unknownContent = 'Plain text without clear format';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [],
        confidence: 0.5,
      });

      await extractor.smartExtract(unknownContent);

      expect(mockAIService.extractData).toHaveBeenCalledWith(
        expect.any(String),
        ExtractionSource.TEXT,
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('detectContentType', () => {
    it('should detect Excel format with tabs', () => {
      const excelContent = 'Header1\tHeader2\tHeader3\n100\t200\t300\n400\t500\t600';

      const type = extractor.detectContentType(excelContent);

      expect(type).toBe('excel');
    });

    it('should detect PDF format with page indicators', () => {
      const pdfContent = 'Page 1\n\nContent\n\nPage 2';

      const type = extractor.detectContentType(pdfContent);

      expect(type).toBe('pdf');
    });

    it('should default to text for unknown formats', () => {
      const plainText = 'Just some plain text';

      const type = extractor.detectContentType(plainText);

      expect(type).toBe('text');
    });
  });

  describe('validateExtractedData', () => {
    it('should validate complete and correct data', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          revenue: 1000000,
          netProfit: 200000,
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.dataQuality).toBeGreaterThan(0.5);
    });

    it('should detect missing required fields', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          // missing revenue and netProfit
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Missing required field'),
        ]),
      );
    });

    it('should warn about invalid field values', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          revenue: 'not a number',
          netProfit: 200000,
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Invalid value'),
        ]),
      );
    });

    it('should detect data inconsistencies', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          revenue: 1000000,
          netProfit: 200000,
          cogs: 600000,
          grossProfit: 500000, // Should be 400000
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Gross profit inconsistency'),
        ]),
      );
    });

    it('should validate balance sheet equation', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          revenue: 1000000,
          netProfit: 200000,
          totalAssets: 500000,
          totalLiabilities: 300000,
          equity: 150000, // Should balance to 500000
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Balance sheet doesn't balance"),
        ]),
      );
    });

    it('should return error for empty data', () => {
      const validation = extractor.validateExtractedData([]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No data extracted');
    });

    it('should calculate data quality score', () => {
      const extractedData = [{
        data: {
          revenue: 1000000,
          netProfit: 200000,
        },
      }];

      const validation = extractor.validateExtractedData(extractedData);

      expect(validation).toHaveProperty('dataQuality');
      expect(validation.dataQuality).toBeGreaterThan(0);
      expect(validation.dataQuality).toBeLessThanOrEqual(1);
    });
  });

  describe('enhanceExtractedData', () => {
    it('should calculate derived fields', () => {
      const extractedData = [{
        periodLabel: 'Q1 2024',
        data: {
          revenue: 1000000,
          cogs: 600000,
        },
      }];

      const enhanced = extractor.enhanceExtractedData(extractedData);

      expect(enhanced[0].data.grossProfit).toBe(400000);
      expect(enhanced[0].data.grossMargin).toBe(0.4);
    });

    it('should calculate EBIT margin', () => {
      const extractedData = [{
        data: {
          revenue: 1000000,
          ebit: 200000,
        },
      }];

      const enhanced = extractor.enhanceExtractedData(extractedData);

      expect(enhanced[0].data.ebitMargin).toBe(0.2);
    });

    it('should calculate net profit margin', () => {
      const extractedData = [{
        data: {
          revenue: 1000000,
          netProfit: 150000,
        },
      }];

      const enhanced = extractor.enhanceExtractedData(extractedData);

      expect(enhanced[0].data.netMargin).toBe(0.15);
    });

    it('should calculate working capital', () => {
      const extractedData = [{
        data: {
          currentAssets: 500000,
          currentLiabilities: 300000,
        },
      }];

      const enhanced = extractor.enhanceExtractedData(extractedData);

      expect(enhanced[0].data.workingCapital).toBe(200000);
    });

    it('should handle missing data gracefully', () => {
      const extractedData = [{
        data: {
          revenue: 1000000,
          // Missing other fields
        },
      }];

      const enhanced = extractor.enhanceExtractedData(extractedData);

      expect(enhanced[0].data.revenue).toBe(1000000);
      expect(enhanced[0].data.grossProfit).toBeUndefined();
    });
  });

  describe('buildFinancialSchema', () => {
    it('should build schema for single period', () => {
      const schema = extractor.buildFinancialSchema(1);

      expect(schema).toHaveProperty('revenue');
      expect(schema).toHaveProperty('override_netProfit');
      expect(schema).toHaveProperty('netFixedAssets');
    });

    it('should build schema for multiple periods', () => {
      const schema = extractor.buildFinancialSchema(3);

      expect(schema).toHaveProperty('periods');
      expect(schema.periods).toHaveLength(3);
    });

    it('should include all financial field categories', () => {
      const schema = extractor.buildFinancialSchema(1);

      const schemaKeys = Object.keys(schema);

      // Should include income statement fields
      expect(schemaKeys.some(key => key.toLowerCase().includes('revenue'))).toBe(true);

      // Schema should be properly typed
      Object.values(schema).forEach(value => {
        expect(value).toBe('number');
      });
    });
  });

  describe('mergeExtractionResults', () => {
    it('should merge multiple extraction results', () => {
      const results = [
        {
          success: true,
          data: [{ data: { revenue: 1000000, profit: null } }],
          confidence: 0.8,
        },
        {
          success: true,
          data: [{ data: { revenue: 1100000, profit: 200000 } }],
          confidence: 0.9,
        },
      ];

      const merged = extractor.mergeExtractionResults(results);

      expect(merged.success).toBe(true);
      expect(merged.data).toHaveLength(1);
      expect(merged.data[0].data.profit).toBe(200000);
      expect(merged.confidence).toBeGreaterThan(0);
      expect(merged.metadata.sourceCount).toBe(2);
    });

    it('should return single result when only one provided', () => {
      const results = [{
        success: true,
        data: [{ data: { revenue: 1000000 } }],
        confidence: 0.9,
      }];

      const merged = extractor.mergeExtractionResults(results);

      expect(merged).toEqual(results[0]);
    });

    it('should handle empty results array', () => {
      const merged = extractor.mergeExtractionResults([]);

      expect(merged.success).toBe(false);
      expect(merged.error).toBe('No results to merge');
    });

    it('should average numeric values from multiple sources', () => {
      const results = [
        {
          success: true,
          data: [{ data: { revenue: 1000 } }],
          confidence: 0.8,
        },
        {
          success: true,
          data: [{ data: { revenue: 2000 } }],
          confidence: 0.9,
        },
      ];

      const merged = extractor.mergeExtractionResults(results);

      // Average of 1000 and 2000
      expect(merged.data[0].data.revenue).toBe(1500);
    });

    it('should handle results with different period counts', () => {
      const results = [
        {
          success: true,
          data: [
            { data: { revenue: 1000 } },
            { data: { revenue: 2000 } },
          ],
          confidence: 0.8,
        },
        {
          success: true,
          data: [
            { data: { revenue: 1100 } },
          ],
          confidence: 0.9,
        },
      ];

      const merged = extractor.mergeExtractionResults(results);

      // Should have 2 periods (maximum)
      expect(merged.data).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete extraction and enhancement workflow', async () => {
      const excelContent = 'Revenue\t1000000\nCOGS\t600000';

      mockAIService.extractData.mockResolvedValue({
        success: true,
        data: [{
          periodLabel: 'Q1 2024',
          data: {
            revenue: 1000000,
            cogs: 600000,
            netProfit: 250000,
          },
        }],
        confidence: 0.9,
      });

      // Extract
      const extracted = await extractor.extractFromExcel(excelContent);

      // Validate
      const validation = extractor.validateExtractedData(extracted.data);

      // Enhance
      const enhanced = extractor.enhanceExtractedData(extracted.data);

      expect(extracted.success).toBe(true);
      expect(validation.isValid).toBe(true);
      expect(enhanced[0].data.grossProfit).toBe(400000);
      expect(enhanced[0].data.grossMargin).toBe(0.4);
    });

    it('should handle extraction failures gracefully', async () => {
      mockAIService.extractData.mockResolvedValue({
        success: false,
        data: [],
        confidence: 0,
        error: 'Extraction failed',
      });

      const result = await extractor.extractFromPDF('Bad content');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
