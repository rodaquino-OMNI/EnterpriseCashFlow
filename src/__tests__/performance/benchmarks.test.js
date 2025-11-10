/**
 * Performance Benchmark Tests
 * Measures performance of critical calculations and data processing
 */

import { 
  processFinancialData,
  calculateIncomeStatement,
  calculateCashFlow,
  calculateWorkingCapitalMetrics,
  calculateFinancialRatios,
  calculateBalanceSheet,
} from '../../utils/calculations';
import { validateFinancialData, runAllValidations } from '../../utils/dataValidation';
import { useExcelParser } from '../../hooks/useExcelParser';
import { renderHook } from '@testing-library/react';
import { generateRandomFinancialData } from '../utils/testDataFactories.comprehensive';

// Performance measurement utility
const measurePerformance = async (fn, iterations = 100) => {
  const times = [];
  
  // Warm up
  for (let i = 0; i < 10; i++) {
    await fn();
  }
  
  // Actual measurements
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  // Calculate statistics
  const sorted = times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  
  return { avg, min, max, p50, p95, p99 };
};

describe('Performance Benchmarks', () => {
  describe('Financial Calculations Performance', () => {
    it('should calculate income statement within performance targets', async () => {
      const data = {
        revenue: 10000000,
        grossMarginPercent: 45,
        operatingExpenses: 3000000,
        depreciation: 200000,
        financialRevenue: 50000,
        financialExpenses: 150000,
      };

      const perf = await measurePerformance(() => calculateIncomeStatement(data));
      
      console.log('Income Statement Calculation Performance:', perf);
      
      expect(perf.avg).toBeLessThan(1); // Average < 1ms
      expect(perf.p95).toBeLessThan(2); // 95th percentile < 2ms
      expect(perf.p99).toBeLessThan(5); // 99th percentile < 5ms
    });

    it('should calculate cash flow within performance targets', async () => {
      const currentPeriod = {
        incomeStatement: {
          netIncome: 1000000,
          depreciation: 200000,
          revenue: 10000000,
        },
        workingCapital: {
          accountsReceivableValue: 1500000,
          inventoryValue: 1000000,
          accountsPayableValue: 800000,
        },
        capex: 500000,
      };

      const previousPeriod = {
        workingCapital: {
          accountsReceivableValue: 1400000,
          inventoryValue: 950000,
          accountsPayableValue: 750000,
        },
      };

      const perf = await measurePerformance(() => 
        calculateCashFlow(currentPeriod, previousPeriod),
      );
      
      console.log('Cash Flow Calculation Performance:', perf);
      
      expect(perf.avg).toBeLessThan(1);
      expect(perf.p95).toBeLessThan(2);
    });

    it('should process multiple periods within performance targets', async () => {
      const periodsData = generateRandomFinancialData({ periods: 12 });

      const perf = await measurePerformance(() => 
        processFinancialData(periodsData, 'MONTHLY'),
      );
      
      console.log('Multi-Period Processing Performance (12 periods):', perf);
      
      expect(perf.avg).toBeLessThan(50); // Average < 50ms for 12 periods
      expect(perf.p95).toBeLessThan(100); // 95th percentile < 100ms
    });

    it('should handle large datasets efficiently', async () => {
      // Test with 100 periods (8+ years of monthly data)
      const largeDataset = generateRandomFinancialData({ periods: 100 });

      const start = performance.now();
      const result = processFinancialData(largeDataset, 'MONTHLY');
      const end = performance.now();
      
      const processingTime = end - start;
      console.log(`Processing 100 periods took ${processingTime.toFixed(2)}ms`);
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toHaveLength(100);
    });

    it('should calculate complex financial ratios efficiently', async () => {
      const data = {
        incomeStatement: {
          revenue: 10000000,
          netIncome: 1000000,
          ebit: 1500000,
        },
        balanceSheet: {
          currentAssets: 5000000,
          inventory: 1000000,
          totalAssets: 10000000,
          currentLiabilities: 3000000,
          totalLiabilities: 4000000,
          equity: 6000000,
        },
        cashFlow: {
          operatingCashFlow: 1200000,
        },
      };

      const perf = await measurePerformance(() => calculateFinancialRatios(data));
      
      console.log('Financial Ratios Calculation Performance:', perf);
      
      expect(perf.avg).toBeLessThan(1);
      expect(perf.p95).toBeLessThan(2);
    });
  });

  describe('Data Validation Performance', () => {
    it('should validate financial data efficiently', async () => {
      const calculatedData = Array.from({ length: 12 }, (_, i) => ({
        periodIndex: i,
        estimatedTotalAssets: 10000000,
        estimatedTotalLiabilities: 4000000,
        equity: 6000000,
        balanceSheetDifference: 0,
        inventoryDaysDerived: 60,
        inventoryValueAvg: 1000000,
        cogs: 6000000,
        revenue: 10000000,
        wcDays: 45,
        arDaysDerived: 45,
        apDaysDerived: 60,
        closingCash: 1000000,
        ebit: 1500000,
        netCashFlowBeforeFinancing: 800000,
      }));

      const perf = await measurePerformance(() => validateFinancialData(calculatedData));
      
      console.log('Financial Data Validation Performance:', perf);
      
      expect(perf.avg).toBeLessThan(5); // Average < 5ms
      expect(perf.p95).toBeLessThan(10); // 95th percentile < 10ms
    });

    it('should run all validations efficiently', async () => {
      const calculatedData = generateRandomFinancialData({ periods: 12 }).map((data, i) => ({
        ...data,
        periodIndex: i,
        estimatedTotalAssets: 10000000,
        estimatedTotalLiabilities: 4000000,
        equity: 6000000,
        balanceSheetDifference: Math.random() * 10000,
        inventoryDaysDerived: 30 + Math.random() * 60,
        inventoryValueAvg: 1000000,
        cogs: 6000000,
        revenue: data.revenue,
        wcDays: 15 + Math.random() * 90,
        arDaysDerived: 45,
        apDaysDerived: 60,
        closingCash: 500000 + Math.random() * 1000000,
        ebit: data.revenue * 0.15,
        netCashFlowBeforeFinancing: data.revenue * 0.1,
      }));

      const perf = await measurePerformance(() => runAllValidations(calculatedData));
      
      console.log('All Validations Performance:', perf);
      
      expect(perf.avg).toBeLessThan(10);
      expect(perf.p95).toBeLessThan(20);
    });
  });

  describe('Excel Processing Performance', () => {
    it('should parse Excel data efficiently', async () => {
      // Mock ExcelJS
      const mockWorksheet = {
        getRow: jest.fn((rowNum) => {
          if (rowNum === 1) {
            return {
              values: [undefined, 'Descrição', 'Período 1', 'Período 2', 'Período 3', 'Período 4'],
            };
          }
          return { values: [] };
        }),
        eachRow: jest.fn((callback) => {
          // Simulate 100 rows of financial data
          for (let i = 2; i <= 101; i++) {
            callback({
              values: [undefined, `Field ${i}`, 1000000, 1100000, 1200000, 1300000],
            }, i);
          }
        }),
        rowCount: 101,
      };

      const mockExcelJS = {
        Workbook: jest.fn(() => ({
          worksheets: [mockWorksheet],
          xlsx: {
            load: jest.fn().mockResolvedValue(true),
          },
        })),
      };

      const { result } = renderHook(() => useExcelParser(mockExcelJS));
      
      const buffer = new ArrayBuffer(1024);
      
      const start = performance.now();
      await result.current.parseExcelData(buffer);
      const end = performance.now();
      
      const processingTime = end - start;
      console.log(`Excel parsing (100 rows) took ${processingTime.toFixed(2)}ms`);
      
      expect(processingTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory when processing large datasets', async () => {
      if (!performance.memory) {
        console.log('Memory profiling not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Process large dataset multiple times
      for (let i = 0; i < 10; i++) {
        const largeDataset = generateRandomFinancialData({ periods: 100 });
        const result = processFinancialData(largeDataset, 'MONTHLY');
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after 10 iterations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle concurrent calculations efficiently', async () => {
      const datasets = Array.from({ length: 10 }, () => 
        generateRandomFinancialData({ periods: 12 }),
      );

      const start = performance.now();
      
      // Process all datasets concurrently
      const results = await Promise.all(
        datasets.map(data => 
          new Promise(resolve => {
            const result = processFinancialData(data, 'MONTHLY');
            resolve(result);
          }),
        ),
      );
      
      const end = performance.now();
      const totalTime = end - start;
      
      console.log(`Concurrent processing of 10 datasets took ${totalTime.toFixed(2)}ms`);
      
      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Optimization Opportunities', () => {
    it('should identify performance bottlenecks', async () => {
      const performanceProfile = {
        incomeStatement: [],
        cashFlow: [],
        workingCapital: [],
        ratios: [],
        validation: [],
      };

      // Profile each calculation type
      const data = generateRandomFinancialData({ periods: 1 })[0];
      
      // Income Statement
      let perf = await measurePerformance(() => calculateIncomeStatement(data), 1000);
      performanceProfile.incomeStatement = perf;
      
      // Cash Flow
      const periodData = {
        incomeStatement: calculateIncomeStatement(data),
        workingCapital: { accountsReceivableValue: 100000, inventoryValue: 50000, accountsPayableValue: 30000 },
      };
      perf = await measurePerformance(() => calculateCashFlow(periodData, null), 1000);
      performanceProfile.cashFlow = perf;
      
      // Working Capital
      perf = await measurePerformance(() => calculateWorkingCapitalMetrics({
        ...data,
        incomeStatement: { revenue: 1000000, cogs: 600000 },
      }), 1000);
      performanceProfile.workingCapital = perf;
      
      console.log('Performance Profile:', performanceProfile);
      
      // All calculations should be sub-millisecond on average
      Object.values(performanceProfile).forEach(metrics => {
        if (metrics.avg) {
          expect(metrics.avg).toBeLessThan(1);
        }
      });
    });
  });

  describe('Real-world Scenario Performance', () => {
    it('should handle typical SME quarterly data efficiently', async () => {
      // Typical SME with 4 quarters of data
      const smeData = [
        { revenue: 2500000, grossMarginPercent: 35, operatingExpenses: 600000 },
        { revenue: 2750000, grossMarginPercent: 36, operatingExpenses: 650000 },
        { revenue: 3000000, grossMarginPercent: 37, operatingExpenses: 700000 },
        { revenue: 3250000, grossMarginPercent: 38, operatingExpenses: 750000 },
      ];

      const start = performance.now();
      const result = processFinancialData(smeData, 'QUARTERLY');
      const validationResult = validateFinancialData(result);
      const end = performance.now();
      
      const totalTime = end - start;
      console.log(`SME quarterly processing + validation took ${totalTime.toFixed(2)}ms`);
      
      expect(totalTime).toBeLessThan(50); // Should be very fast for typical use case
      expect(result).toHaveLength(4);
      expect(validationResult.isValid).toBeDefined();
    });

    it('should handle large enterprise monthly data efficiently', async () => {
      // Large enterprise with 24 months of data
      const enterpriseData = Array.from({ length: 24 }, (_, i) => ({
        revenue: 50000000 + i * 1000000,
        grossMarginPercent: 25 + (i % 4) * 0.5,
        operatingExpenses: 12000000 + i * 100000,
        depreciation: 1000000,
        capex: 2000000,
        accountsReceivableDays: 60,
        inventoryDays: 45,
        accountsPayableDays: 75,
      }));

      const start = performance.now();
      const result = processFinancialData(enterpriseData, 'MONTHLY');
      const validationResult = runAllValidations(result);
      const end = performance.now();
      
      const totalTime = end - start;
      console.log(`Enterprise monthly processing (24 months) + validation took ${totalTime.toFixed(2)}ms`);
      
      expect(totalTime).toBeLessThan(200); // Should complete within 200ms
      expect(result).toHaveLength(24);
    });
  });
});