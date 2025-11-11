/**
 * Integration Tests for Excel Parser Service
 * Tests the complete flow of parsing Excel files and extracting financial data
 */

import { useExcelParser } from '../../hooks/useExcelParser';
import { renderHook, act } from '@testing-library/react';
import { createMockExcelData } from '../../test-utils/testDataFactories.comprehensive.utils';

// Mock ExcelJS library
const createMockExcelJS = () => {
  /**
   * Helper to create a mock cell object with proper structure
   */
  const createMockCell = (value, fillColor = null) => {
    const cell = {
      value: value,
      fill: fillColor ? { fgColor: { argb: fillColor } } : undefined,
      style: {},
      formula: undefined,
      result: undefined,
    };

    // Handle formula cells
    if (value && typeof value === 'object' && value.formula) {
      cell.formula = value.formula;
      cell.result = value.result;
      cell.value = value;
    }

    return cell;
  };

  /**
   * Helper to create a mock row object with values array and getCell method
   */
  const createMockRow = (values, options = {}) => {
    const row = {
      values: values,
      hidden: options.hidden || false,
      getCell: jest.fn((colIndex) => {
        const value = values[colIndex];
        const fillColor = options.cellFills ? options.cellFills[colIndex] : null;
        return createMockCell(value, fillColor);
      }),
    };
    return row;
  };

  const mockWorksheet = {
    name: 'Financial Data',
    rowCount: 50,
    columnCount: 10,

    getRow: jest.fn((rowNum) => {
      return createMockRow([]);
    }),

    getColumn: jest.fn(),

    eachRow: jest.fn((callback) => {
      // Default implementation - can be overridden in tests
      // This is just a placeholder
    }),

    getCell: jest.fn((row, col) => {
      return createMockCell(null);
    }),
  };

  const mockWorkbook = {
    worksheets: [mockWorksheet],
    getWorksheet: jest.fn(() => mockWorksheet),
    xlsx: {
      load: jest.fn(),
    },
  };

  return {
    Workbook: jest.fn(() => mockWorkbook),
    mockWorksheet,
    mockWorkbook,
    createMockRow,
    createMockCell,
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4', 'Notas']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Add at least one data row
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000, 1200000, 1300000, '']), 2);
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
        getRow: jest.fn(() => mockExcelJS.createMockRow([])),
        eachRow: jest.fn(),
      };
      const dataSheet = {
        name: 'Dados Financeiros',
        getRow: jest.fn((rowNum) => {
          if (rowNum === 1) {
            return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1', 'P2', 'P3', 'P4']);
          }
          return mockExcelJS.createMockRow([]);
        }),
        eachRow: jest.fn((callback) => {
          callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000, 1200000, 1300000]), 2);
        }),
      };

      mockExcelJS.mockWorkbook.worksheets = [instructionSheet, dataSheet];

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      // Both sheets' getRow will be called during worksheet detection
      // but the dataSheet should be the one used because it has "Dados" in the name
      expect(dataSheet.eachRow).toHaveBeenCalled();
      expect(parsedData).toBeDefined();
      expect(parsedData).toHaveLength(4);
    });

    it('should handle worksheets without proper headers', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockReturnValue(mockExcelJS.createMockRow([]));
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Simulate rows with financial data
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000, 1200000, 1300000]), 2);
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1', 'P2', 'P3', 'P4', 'Notas']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000, 1200000, 1300000]), 2);
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
          // Using non-period text that will trigger the position-based fallback
          // Note: columns immediately after Description need at least 2 non-matching headers
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'X', 'Col1', 'Col2', 'Col3', 'Col4', 'Notas']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 0, 1000000, 1100000, 1200000, 1300000, 'Some note']), 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData).toHaveLength(4);
      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[3].revenue).toBe(1300000);
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
          return mockExcelJS.createMockRow(headerValues);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        const values = [undefined, 'Receita'];
        for (let i = 1; i <= 8; i++) {
          values.push(1000000 * i);
        }
        callback(mockExcelJS.createMockRow(values), 2);
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita Líquida', 1000000, 1100000, 1200000, 1300000]), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Margem Bruta %', 45, 46, 47, 48]), 3);
        callback(mockExcelJS.createMockRow([undefined, 'Despesas Operacionais', 300000, 320000, 340000, 360000]), 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[1].revenue).toBe(1100000);
      expect(parsedData[0].grossMarginPercentage).toBe(45);
      expect(parsedData[0].operatingExpenses).toBe(300000);
    });

    it('should handle working capital value fields', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1', 'P2']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Contas a Receber', 450000, 500000]), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Estoques', 300000, 350000]), 3);
        callback(mockExcelJS.createMockRow([undefined, 'Contas a Pagar', 600000, 650000]), 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].accountsReceivableValueAvg).toBe(450000);
      expect(parsedData[0].inventoryValueAvg).toBe(300000);
      expect(parsedData[0].accountsPayableValueAvg).toBe(600000);
    });

    it('should handle percentage values correctly', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Test different percentage formats
        callback(mockExcelJS.createMockRow([undefined, 'Margem Bruta %', 0.45]), 2); // Decimal format
        callback(mockExcelJS.createMockRow([undefined, 'Margem EBITDA (%)', 25]), 3); // Whole number
        callback(mockExcelJS.createMockRow([undefined, 'Taxa de Crescimento', '15%']), 4); // String with %
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].grossMarginPercentage).toBe(45); // Converted from 0.45
    });

    it('should skip grey-filled cells', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1', 'P2', 'P3']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Create row with grey fill on column 3 (P2)
        const rowWithGreyCell = mockExcelJS.createMockRow(
          [undefined, 'Receita', 1000000, 1100000, 1200000],
          { cellFills: { 3: 'FFD3D3D3' } },  // Grey fill on column 3 (P2)
        );
        callback(rowWithGreyCell, 2);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000); // P1 - not grey
      expect(parsedData[1].revenue).toBeUndefined(); // P2 - grey cell skipped
      expect(parsedData[2].revenue).toBe(1200000); // P3 - not grey
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
      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });
      mockExcelJS.mockWorksheet.eachRow.mockImplementation(() => {});

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(result.current.parsingError).toContain('dado');
    });

    it('should handle missing required fields', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Missing revenue field
        callback(mockExcelJS.createMockRow([undefined, 'Margem Bruta', 45]), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Despesas', 300000]), 3);
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 'invalid']), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Despesas', 50000]), 3); // Valid value to ensure parsing succeeds
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBeUndefined(); // Invalid value skipped
      expect(parsedData[0].operatingExpenses).toBe(50000); // Valid value parsed
    });

    it('should handle formula results', async () => {
      const { result } = renderHook(() => useExcelParser(mockExcelJS));

      mockExcelJS.mockWorksheet.getRow.mockImplementation((rowNum) => {
        if (rowNum === 1) {
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // Simulate formula result
        callback(mockExcelJS.createMockRow([undefined, 'Receita', { result: 1000000, formula: '=SUM(A1:A10)' }]), 2);
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1', 'P2', 'P3', 'P4']);
        }
        return mockExcelJS.createMockRow([]);
      });

      // Simulate 1000 rows
      mockExcelJS.mockWorksheet.rowCount = 1000;
      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        // First row with valid field to ensure parsing succeeds
        callback(
          mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000, 1200000, 1300000]),
          2,
        );
        // Remaining rows with invalid fields to test performance
        for (let i = 3; i <= 1000; i++) {
          callback(
            mockExcelJS.createMockRow([undefined, `Field ${i}`, 1000 * i, 1100 * i, 1200 * i, 1300 * i]),
            i,
          );
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'Período 1', undefined, 'Período 2']); // Merged cell
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, undefined, 1100000]), 2);
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
        return mockExcelJS.createMockRow(
          rowNum === 1 ? [undefined, 'Descrição', 'P1', 'P2'] : [],
          { hidden: rowNum === 3 },
        );
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita', 1000000, 1100000], { hidden: false }), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Hidden Field', 999, 999], { hidden: true }), 3);
        callback(mockExcelJS.createMockRow([undefined, 'Despesas', 300000, 320000], { hidden: false }), 4);
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
          return mockExcelJS.createMockRow([undefined, 'Descrição', 'P1']);
        }
        return mockExcelJS.createMockRow([]);
      });

      mockExcelJS.mockWorksheet.eachRow.mockImplementation((callback) => {
        callback(mockExcelJS.createMockRow([undefined, 'Receita (R$)', 1000000]), 2);
        callback(mockExcelJS.createMockRow([undefined, 'Margem Bruta (%)', 45]), 3);
        callback(mockExcelJS.createMockRow([undefined, 'D&A - Depreciação', 20000]), 4);
      });

      let parsedData;
      await act(async () => {
        parsedData = await result.current.parseExcelData(new ArrayBuffer(8));
      });

      expect(parsedData[0].revenue).toBe(1000000);
      expect(parsedData[0].grossMarginPercentage).toBe(45);
      expect(parsedData[0].depreciationAndAmortisation).toBe(20000);
    });
  });
});