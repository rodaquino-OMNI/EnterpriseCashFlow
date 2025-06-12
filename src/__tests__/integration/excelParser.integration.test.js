/**
 * Integration Tests for Excel Parser Service
 * Tests the complete flow of parsing Excel files and extracting financial data
 */

import { useExcelParser } from '../../hooks/useExcelParser';
import { renderHook, act } from '@testing-library/react';
import { createMockExcelData } from '../utils/testDataFactories.comprehensive';

// Mock ExcelJS library
const createMockExcelJS = () => {
  const mockWorksheet = {
    name: 'Financial Data',
    getRow: jest.fn(),
    getColumn: jest.fn(),
    eachRow: jest.fn(),
    rowCount: 50,
    columnCount: 10
  };

  const mockWorkbook = {
    worksheets: [mockWorksheet],
    getWorksheet: jest.fn(() => mockWorksheet)
  };

  return {
    Workbook: jest.fn(() => mockWorkbook),
    mockWorksheet,
    mockWorkbook
  };
};

describe('Excel Parser Integration Tests', () => {
  let mockExcelJS;

  beforeEach(() => {
    mockExcelJS = createMockExcelJS();
  });

  describe('Worksheet Detection', () => {
    it('should find worksheet with financial headers', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      // Setup mock data
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4', 'Notas']
          };
        }
        return { values: [] };
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(result.current.parsingError).toBeNull();
      expect(parsedData).toBeDefined();
    });

    it('should fallback to sheet with "Dados" in name', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      // Create multiple worksheets
      const instructionSheet = { 
        name: 'Instruções', 
        getRow: jest.fn(() => ({ values: [] })) 
      };
      const dataSheet = { 
        name: 'Dados Financeiros',
        getRow: jest.fn((rowNum) => {
          if (rowNum === 1) {
            return { values: [undefined, 'Descrição', 'P1', 'P2', 'P3', 'P4'] };
          }
          return { values: [] };
        }),
        eachRow: jest.fn()
      };
      
      mockExcelJS.mockWorkbook.worksheets = [instructionSheet, dataSheet];

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(dataSheet.getRow).toHaveBeenCalled();
      expect(instructionSheet.getRow).not.toHaveBeenCalled();
    });

    it('should handle worksheets without proper headers', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockReturnValue({ values: [] });
      mockExcelJS.mockWorksheet.eachRow.mockImplementation(() => {});

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(result.current.parsingError).toBeTruthy();
    });
  });

  describe('Period Detection', () => {
    it('should detect periods with strict "Período X" pattern', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Simulate rows with financial data
        callback({ values: [undefined, 'Receita', 1000000, 1100000, 1200000, 1300000] }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(4);
    });

    it('should detect periods with loose patterns (P1, P2, etc)', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Description', 'P1', 'P2', 'P3', 'P4', 'Notes']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Revenue', 1000000, 1100000, 1200000, 1300000] }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(4);
    });

    it('should detect periods by column position between Description and Notes', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', undefined, undefined, undefined, undefined, 'Notas']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita', 1000000, 1100000, 1200000, 1300000, 'Some note'] }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(4);
    });

    it('should limit detected periods to MAX_PERIODS', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      // Create header with 8 periods
      const headerValues = [undefined, 'Descrição'];
      for (let i = 1; i <= 8; i++) {
        headerValues.push(`Período ${i}`);
      }

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return { values: headerValues };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        const values = [undefined, 'Receita'];
        for (let i = 1; i <= 8; i++) {
          values.push(1000000 * i);
        }
        callback({ values }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(6); // MAX_PERIODS is 6
    });
  });

  describe('Data Extraction', () => {
    it('should extract revenue data correctly', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita Líquida', 1000000, 1100000, 1200000, 1300000] }, 2);
        callback({ values: [undefined, 'Margem Bruta %', 45, 46, 47, 48] }, 3);
        callback({ values: [undefined, 'Despesas Operacionais', 300000, 320000, 340000, 360000] }, 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[1].revenue).toBe(1100000);
      expect(parsedData[0].grossMarginPercent).toBe(45);
      expect(parsedData[0].operatingExpenses).toBe(300000);
    });

    it('should handle working capital days fields', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1', 'P2']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Prazo Médio de Recebimento (dias)', 45, 50] }, 2);
        callback({ values: [undefined, 'Prazo Médio de Estoques (dias)', 30, 35] }, 3);
        callback({ values: [undefined, 'Prazo Médio de Pagamento (dias)', 60, 65] }, 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].accountsReceivableDays).toBe(45);
      expect(parsedData[0].inventoryDays).toBe(30);
      expect(parsedData[0].accountsPayableDays).toBe(60);
    });

    it('should handle percentage values correctly', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Test different percentage formats
        callback({ values: [undefined, 'Margem Bruta %', 0.45] }, 2); // Decimal format
        callback({ values: [undefined, 'Margem EBITDA (%)', 25] }, 3); // Whole number
        callback({ values: [undefined, 'Taxa de Crescimento', '15%'] }, 4); // String with %
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].grossMarginPercent).toBe(45); // Converted from 0.45
    });

    it('should skip grey-filled cells', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1', 'P2']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        const rowWithGreyCell = { 
          values: [undefined, 'Receita', 1000000, 1100000],
          getCell: jest.fn((col) => ({
            fill: col === 3 ? { fgColor: { argb: 'FFD3D3D3' } } : undefined
          }))
        };
        callback(rowWithGreyCell, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBeUndefined(); // Grey cell skipped
      expect(parsedData[1].revenue).toBe(1100000);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted Excel files', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      // Simulate ExcelJS throwing error
      mockExcelJS.Workbook.mockImplementation(() => {
        throw new Error('Invalid file format');
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(result.current.parsingError).toBeTruthy();
      expect(parsedData).toBeNull();
    });

    it('should handle empty worksheets', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.rowCount = 0;
      mockExcelJS.mockWorksheet.eachRow.mockImplementation(() => {});

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(result.current.parsingError).toContain('dados encontrados');
    });

    it('should handle missing required fields', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Missing revenue field
        callback({ values: [undefined, 'Margem Bruta', 45] }, 2);
        callback({ values: [undefined, 'Despesas', 300000] }, 3);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate numeric values', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita', 'invalid'] }, 2);
        callback({ values: [undefined, 'Margem %', 150] }, 3); // Invalid percentage
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBeUndefined(); // Invalid value skipped
    });

    it('should handle formula results', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Simulate formula result
        callback({ 
          values: [undefined, 'Receita', { result: 1000000, formula: '=SUM(A1:A10)' }] 
        }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000); // Extracts result from formula
    });
  });

  describe('Performance Tests', () => {
    it('should handle large Excel files efficiently', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1', 'P2', 'P3', 'P4']
          };
        }
        return { values: [] };
      });

      // Simulate 1000 rows
      mockExcelJS.mockWorksheet.rowCount = 1000;
      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        for (let i = 2; i <= 1000; i++) {
          callback({ 
            values: [undefined, `Field ${i}`, 1000 * i, 1100 * i, 1200 * i, 1300 * i] 
          }, i);
        }
      });

      const startTime = Date.now();
      
      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(parsedData).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle merged cells', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'Período 1', undefined, 'Período 2'] // Merged cell
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita', 1000000, undefined, 1100000] }, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(2);
      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[1].revenue).toBe(1100000);
    });

    it('should handle hidden rows and columns', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        const row = {
          values: rowNum === 1 
            ? [undefined, 'Descrição', 'P1', 'P2']
            : [],
          hidden: rowNum === 3 // Hidden row
        };
        return row;
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita', 1000000, 1100000], hidden: false }, 2);
        callback({ values: [undefined, 'Hidden Field', 999, 999], hidden: true }, 3);
        callback({ values: [undefined, 'Despesas', 300000, 320000], hidden: false }, 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      // Hidden rows should still be processed in this implementation
      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[0].operatingExpenses).toBe(300000);
    });

    it('should handle special characters in field names', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return {
            values: [undefined, 'Descrição', 'P1']
          };
        }
        return { values: [] };
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback({ values: [undefined, 'Receita (R$)', 1000000] }, 2);
        callback({ values: [undefined, 'Margem Bruta (%)', 45] }, 3);
        callback({ values: [undefined, 'D&A - Depreciação', 20000] }, 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[0].grossMarginPercent).toBe(45);
      expect(parsedData[0].depreciation).toBe(20000);
    });
  });
});