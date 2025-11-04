/**
 * Integration Tests for PDF Parser Service
 * Tests the complete flow of extracting text from PDF files
 */

import { renderHook, act } from '@testing-library/react';
import { usePdfParser } from '../../hooks/usePdfParser';

// Mock PDF.js library
const mockPdfJs = {
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
};

// Mock PDF document structure
const createMockPdfDocument = (numPages = 3, textContent = {}) => {
  const defaultTextContent = {
    1: 'Financial Statement 2024\nRevenue: $1,000,000\nExpenses: $800,000',
    2: 'Balance Sheet\nTotal Assets: $5,000,000\nTotal Liabilities: $2,000,000',
    3: 'Cash Flow Statement\nOperating Cash Flow: $200,000\nFree Cash Flow: $150,000'
  };

  const content = { ...defaultTextContent, ...textContent };

  return {
    numPages,
    getPage: jest.fn((pageNum) => Promise.resolve({
      getTextContent: jest.fn(() => Promise.resolve({
        items: content[pageNum]
          ? content[pageNum].split(' ').map((str, i) => ({
              str,
              transform: [1, 0, 0, 1, 10 + (i * 50), 100]  // x, y coordinates for text positioning
            }))
          : []
      }))
    }))
  };
};

describe('PDF Parser Integration Tests', () => {
  beforeEach(() => {
    // Setup PDF.js mock
    global.window.pdfjsLib = mockPdfJs;
    mockPdfJs.getDocument.mockClear();
  });

  afterEach(() => {
    delete global.window.pdfjsLib;
  });

  describe('File Validation', () => {
    it('should validate PDF file type', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(invalidFile);
        });
      }).rejects.toThrow('Arquivo inválido');

      expect(result.current.parsingError).toBeTruthy();
      expect(result.current.parsingError.message).toContain('PDF válido');
    });

    it('should handle null or undefined file', async () => {
      const { result } = renderHook(() => usePdfParser());

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(null);
        });
      }).rejects.toThrow('Arquivo inválido');
    });

    it('should accept valid PDF files', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const validPdfFile = new File(['%PDF-1.4'], 'financial-report.pdf', { 
        type: 'application/pdf' 
      });

      const mockDocument = createMockPdfDocument();
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(validPdfFile);
      });

      expect(result.current.parsingError).toBeNull();
      expect(extractedData).toBeDefined();
      expect(extractedData.pageCount).toBe(3);
    });
  });

  describe('PDF.js Library Integration', () => {
    it('should check for PDF.js availability', async () => {
      const { result } = renderHook(() => usePdfParser());

      // Store original and remove PDF.js temporarily
      const originalPdfjsLib = global.window.pdfjsLib;
      delete global.window.pdfjsLib;

      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(pdfFile);
        });
      }).rejects.toThrow('Biblioteca PDF.js não disponível');

      // Restore PDF.js for subsequent tests
      global.window.pdfjsLib = originalPdfjsLib;
    });

    it('should use PDF.js to load document', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      
      const mockDocument = createMockPdfDocument();
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      await act(async () => {
        await result.current.extractTextFromPdf(pdfFile);
      });

      expect(mockPdfJs.getDocument).toHaveBeenCalledWith({
        data: expect.any(ArrayBuffer)
      });
    });
  });

  describe('Text Extraction', () => {
    it('should extract text from all pages', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'financial-report.pdf', { 
        type: 'application/pdf' 
      });

      const mockDocument = createMockPdfDocument(3);
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      expect(extractedData.text).toContain('Financial Statement 2024');
      expect(extractedData.text).toContain('Balance Sheet');
      expect(extractedData.text).toContain('Cash Flow Statement');
      expect(extractedData.pageCount).toBe(3);
    });

    it('should preserve text structure and spacing', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      const mockDocument = createMockPdfDocument(1, {
        1: 'DEMONSTRAÇÃO DE RESULTADOS\n\nReceita Líquida     1.000.000\nCusto dos Produtos  (600.000)\nLucro Bruto         400.000'
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      expect(extractedData.text).toContain('DEMONSTRAÇÃO');
      expect(extractedData.text).toContain('1.000.000');
      expect(extractedData.text).toContain('Lucro Bruto');
    });

    it('should handle PDFs with many pages', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'large-report.pdf', { 
        type: 'application/pdf' 
      });

      // Create a document with 50 pages
      const pageContent = {};
      for (let i = 1; i <= 50; i++) {
        pageContent[i] = `Page ${i} content with financial data`;
      }

      const mockDocument = createMockPdfDocument(50, pageContent);
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      const startTime = Date.now();
      
      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      const endTime = Date.now();

      expect(extractedData.pageCount).toBe(50);
      expect(extractedData.text).toContain('Page 1');
      expect(extractedData.text).toContain('Page 50');
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle empty pages', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      const mockDocument = createMockPdfDocument(3, {
        1: 'Page 1 content',
        2: '', // Empty page
        3: 'Page 3 content'
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      expect(extractedData.text).toContain('Page 1');
      expect(extractedData.text).toContain('Page 3');
      expect(extractedData.pageCount).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF loading errors', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['invalid pdf'], 'corrupted.pdf', { 
        type: 'application/pdf' 
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF structure'))
      });

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(pdfFile);
        });
      }).rejects.toThrow('Invalid PDF structure');

      expect(result.current.parsingError).toBeTruthy();
      expect(result.current.isParsing).toBe(false);
    });

    it('should handle page extraction errors', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      const mockDocument = {
        numPages: 2,
        getPage: jest.fn()
          .mockResolvedValueOnce({
            getTextContent: jest.fn().mockResolvedValue({
              items: [{ str: 'Page 1' }]
            })
          })
          .mockRejectedValueOnce(new Error('Page extraction failed'))
      };

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(pdfFile);
        });
      }).rejects.toThrow('Page extraction failed');
    });

    it('should handle file reading errors', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => ({
        readAsArrayBuffer: function() {
          setTimeout(() => this.onerror(new Error('Read error')), 0);
        }
      }));

      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      await expect(async () => {
        await act(async () => {
          await result.current.extractTextFromPdf(pdfFile);
        });
      }).rejects.toThrow('Erro ao ler o arquivo PDF');

      global.FileReader = originalFileReader;
    });
  });

  describe('Loading State Management', () => {
    it('should manage isParsing state correctly', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });

      const mockDocument = createMockPdfDocument();
      
      let resolveDocument;
      const documentPromise = new Promise(resolve => {
        resolveDocument = resolve;
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: documentPromise
      });

      expect(result.current.isParsing).toBe(false);

      // Start extraction
      const extractionPromise = act(async () => {
        return result.current.extractTextFromPdf(pdfFile);
      });

      // Check loading state immediately
      expect(result.current.isParsing).toBe(true);

      // Resolve the document loading
      resolveDocument(mockDocument);

      await extractionPromise;

      expect(result.current.isParsing).toBe(false);
    });

    it('should reset error state on new extraction', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      // First, create an error
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      try {
        await act(async () => {
          await result.current.extractTextFromPdf(invalidFile);
        });
      } catch (e) {
        // Expected error
      }

      expect(result.current.parsingError).toBeTruthy();

      // Now try with valid file
      const validFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      
      const mockDocument = createMockPdfDocument();
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      await act(async () => {
        await result.current.extractTextFromPdf(validFile);
      });

      expect(result.current.parsingError).toBeNull();
    });
  });

  describe('Financial Data Extraction Scenarios', () => {
    it('should extract Brazilian financial statements', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'demonstracao-financeira.pdf', { 
        type: 'application/pdf' 
      });

      const mockDocument = createMockPdfDocument(2, {
        1: 'DEMONSTRAÇÃO DE RESULTADOS DO EXERCÍCIO\nExercício findo em 31/12/2024\n(Em milhares de reais)\n\nReceita Operacional Líquida R$ 5.678.900\nCusto dos Produtos Vendidos (3.407.340)\nLucro Bruto 2.271.560',
        2: 'BALANÇO PATRIMONIAL\n\nATIVO\nAtivo Circulante R$ 2.345.678\nAtivo Não Circulante R$ 4.567.890\n\nPASSIVO\nPassivo Circulante R$ 1.234.567\nPatrimônio Líquido R$ 5.679.001'
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      expect(extractedData.text).toContain('DEMONSTRAÇÃO DE RESULTADOS');
      expect(extractedData.text).toContain('5.678.900');
      expect(extractedData.text).toContain('BALANÇO PATRIMONIAL');
      expect(extractedData.text).toContain('Patrimônio Líquido');
    });

    it('should extract financial tables and preserve structure', async () => {
      const { result } = renderHook(() => usePdfParser());
      
      const pdfFile = new File(['%PDF-1.4'], 'financial-tables.pdf', { 
        type: 'application/pdf' 
      });

      const mockDocument = createMockPdfDocument(1, {
        1: `
          Período      Q1 2024    Q2 2024    Q3 2024    Q4 2024
          Receita      1.000      1.100      1.200      1.300
          Custos       (600)      (650)      (700)      (750)
          Lucro Bruto  400        450        500        550
          Margem %     40,0%      40,9%      41,7%      42,3%
        `
      });

      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.resolve(mockDocument)
      });

      let extractedData;
      await act(async () => {
        extractedData = await result.current.extractTextFromPdf(pdfFile);
      });

      expect(extractedData.text).toContain('Q1 2024');
      expect(extractedData.text).toContain('Q4 2024');
      expect(extractedData.text).toContain('1.300');
      expect(extractedData.text).toContain('42,3%');
    });
  });
});