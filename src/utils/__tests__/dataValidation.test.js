/**
 * Unit Tests for Data Validation Utilities
 * Testing all validation functions and edge cases
 */

import {
  validateBalanceSheetInternalConsistency,
  validateInventoryLevels,
  validateRealisticBusinessMetrics,
  validateCashFlowPatterns,
  validateWorkingCapitalEfficiency,
  validateBalanceSheetConsistency,
  validateFinancialData,
  runAllValidations
} from '../dataValidation';

describe('Data Validation Utilities', () => {
  describe('validateBalanceSheetInternalConsistency', () => {
    it('should return null when balance sheet is consistent', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 600000,
        balanceSheetDifference: 0
      };

      const result = validateBalanceSheetInternalConsistency(periodData);
      expect(result).toBeNull();
    });

    it('should return critical error for significant differences', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 500000,
        balanceSheetDifference: 100000 // 10% of assets
      };

      const result = validateBalanceSheetInternalConsistency(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('BALANCO_INCONSISTENTE');
      expect(result.severity).toBe('critical');
      expect(result.value).toBe(100000);
    });

    it('should return warning for minor differences', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 599990,
        balanceSheetDifference: 10 // Minor difference
      };

      const result = validateBalanceSheetInternalConsistency(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('BALANCO_INCONSISTENTE');
      expect(result.severity).toBe('warning');
    });

    it('should handle zero assets edge case', () => {
      const periodData = {
        estimatedTotalAssets: 0,
        estimatedTotalLiabilities: 0,
        equity: 0,
        balanceSheetDifference: 500 // Any difference is significant when assets are 0
      };

      const result = validateBalanceSheetInternalConsistency(periodData);
      expect(result).not.toBeNull();
      expect(result.severity).toBe('critical');
    });
  });

  describe('validateInventoryLevels', () => {
    it('should return null for normal inventory levels', () => {
      const periodData = {
        inventoryDaysDerived: 60,
        inventoryValueAvg: 100000,
        cogs: 600000,
        revenue: 1000000
      };

      const result = validateInventoryLevels(periodData);
      expect(result).toBeNull();
    });

    it('should return critical error for extremely high inventory days', () => {
      const periodData = {
        inventoryDaysDerived: 400, // > 365 days
        inventoryValueAvg: 200000,
        cogs: 182500,
        revenue: 1000000
      };

      const result = validateInventoryLevels(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('PME_ALTO_EXTREMO');
      expect(result.severity).toBe('critical');
      expect(result.field).toBe('inventoryDaysDerived');
    });

    it('should return warning for very low inventory days', () => {
      const periodData = {
        inventoryDaysDerived: 0.5,
        inventoryValueAvg: 1000,
        cogs: 730000,
        revenue: 1000000
      };

      const result = validateInventoryLevels(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('PME_BAIXO');
      expect(result.severity).toBe('warning');
    });

    it('should check inventory to revenue ratio', () => {
      const periodData = {
        inventoryDaysDerived: 90,
        inventoryValueAvg: 800000, // 80% of revenue
        cogs: 600000,
        revenue: 1000000
      };

      const result = validateInventoryLevels(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('PME_ALTO_EXTREMO');
      expect(result.category).toContain('Nível de Estoques vs Receita');
    });

    it('should handle zero revenue edge case', () => {
      const periodData = {
        inventoryDaysDerived: 0,
        inventoryValueAvg: 50000,
        cogs: 0,
        revenue: 0
      };

      const result = validateInventoryLevels(periodData);
      expect(result).toBeNull(); // No validation when revenue is 0
    });
  });

  describe('validateRealisticBusinessMetrics', () => {
    it('should return empty array for healthy metrics', () => {
      const periodData = {
        closingCash: 100000,
        ebit: 50000
      };

      const result = validateRealisticBusinessMetrics(periodData);
      expect(result).toEqual([]);
    });

    it('should detect insolvency risk', () => {
      const periodData = {
        closingCash: -50000,
        ebit: -100000
      };

      const result = validateRealisticBusinessMetrics(periodData);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('RISCO_INSOLVENCIA');
      expect(result[0].severity).toBe('critical');
    });

    it('should not flag insolvency if only one metric is negative', () => {
      const periodData = {
        closingCash: 50000,
        ebit: -100000
      };

      const result = validateRealisticBusinessMetrics(periodData);
      expect(result).toEqual([]);
    });

    it('should handle missing data gracefully', () => {
      const result = validateRealisticBusinessMetrics(null);
      expect(result).toEqual([]);
    });
  });

  describe('validateCashFlowPatterns', () => {
    it('should return null for healthy cash flow patterns', () => {
      const calculatedData = [
        { netCashFlowBeforeFinancing: 100000 },
        { netCashFlowBeforeFinancing: 150000 },
        { netCashFlowBeforeFinancing: 120000 },
        { netCashFlowBeforeFinancing: -50000 } // Only 1 negative out of 4
      ];

      const result = validateCashFlowPatterns(calculatedData);
      expect(result).toBeNull();
    });

    it('should detect concerning negative cash flow pattern', () => {
      const calculatedData = [
        { netCashFlowBeforeFinancing: -100000 },
        { netCashFlowBeforeFinancing: -150000 },
        { netCashFlowBeforeFinancing: 50000 },
        { netCashFlowBeforeFinancing: -120000 } // 3 negative out of 4 (75%)
      ];

      const result = validateCashFlowPatterns(calculatedData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('CASH_FLOW_TREND');
      expect(result.severity).toBe('warning');
    });

    it('should handle edge case of all negative cash flows', () => {
      const calculatedData = [
        { netCashFlowBeforeFinancing: -100000 },
        { netCashFlowBeforeFinancing: -150000 }
      ];

      const result = validateCashFlowPatterns(calculatedData);
      expect(result).not.toBeNull();
      expect(result.message).toContain('2 de 2 períodos');
    });
  });

  describe('validateWorkingCapitalEfficiency', () => {
    it('should return null for normal working capital cycle', () => {
      const periodData = {
        wcDays: 60,
        arDaysDerived: 45,
        inventoryDaysDerived: 30,
        apDaysDerived: 15
      };

      const result = validateWorkingCapitalEfficiency(periodData, 'Q1 2024');
      expect(result).toBeNull();
    });

    it('should flag very long cash cycle', () => {
      const periodData = {
        wcDays: 150, // > 120 days
        arDaysDerived: 90,
        inventoryDaysDerived: 80,
        apDaysDerived: 20
      };

      const result = validateWorkingCapitalEfficiency(periodData, 'Q1 2024');
      expect(result).not.toBeNull();
      expect(result.type).toBe('CICLO_POSITIVO_ALTO');
      expect(result.severity).toBe('warning');
    });

    it('should celebrate very negative (good) cash cycle', () => {
      const periodData = {
        wcDays: -45, // < -30 days
        arDaysDerived: 30,
        inventoryDaysDerived: 15,
        apDaysDerived: 90
      };

      const result = validateWorkingCapitalEfficiency(periodData, 'Q1 2024');
      expect(result).not.toBeNull();
      expect(result.type).toBe('CICLO_NEGATIVO_ALTO');
      expect(result.severity).toBe('success');
    });

    it('should handle zero working capital days', () => {
      const periodData = {
        wcDays: 0,
        arDaysDerived: 30,
        inventoryDaysDerived: 30,
        apDaysDerived: 60
      };

      const result = validateWorkingCapitalEfficiency(periodData, 'Q1 2024');
      expect(result).toBeNull();
    });
  });

  describe('validateBalanceSheetConsistency', () => {
    it('should return null when balance sheet balances', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 600000,
        balanceSheetDifference: 0
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).toBeNull();
    });

    it('should detect calculation inconsistency', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 600000,
        balanceSheetDifference: 50000 // Stored value doesn't match A - (L + E)
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('error');
      expect(result.category).toContain('Inconsistência de Cálculo');
    });

    it('should flag material imbalances', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 580000,
        balanceSheetDifference: 20000 // 2% of assets
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).not.toBeNull();
      expect(result.type).toBe('warning');
      expect(result.severity).toBe('medium');
    });

    it('should allow immaterial differences', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 599500,
        balanceSheetDifference: 500 // < 1% threshold
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).toBeNull();
    });
  });

  describe('runAllValidations', () => {
    it('should handle empty data gracefully', () => {
      const result = runAllValidations([]);
      expect(result.isValidOverall).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should aggregate all validation results', () => {
      const calculatedData = [
        {
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 500000,
          balanceSheetDifference: 100000, // Critical error
          inventoryDaysDerived: 60,
          inventoryValueAvg: 100000,
          cogs: 600000,
          revenue: 1000000,
          wcDays: 60,
          arDaysDerived: 45,
          inventoryDaysDerived: 30,
          apDaysDerived: 15,
          closingCash: 50000,
          ebit: 100000,
          netCashFlowBeforeFinancing: 80000
        }
      ];

      const result = runAllValidations(calculatedData);
      expect(result.isValidOverall).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].periodLabel).toBe('Período 1');
    });

    it('should categorize by severity correctly', () => {
      const calculatedData = [
        {
          // Data that triggers different severity levels
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 599990,
          balanceSheetDifference: 10, // Warning
          inventoryDaysDerived: 400, // Critical
          inventoryValueAvg: 200000,
          cogs: 182500,
          revenue: 1000000,
          wcDays: -45, // Success
          arDaysDerived: 30,
          inventoryDaysDerived: 15,
          apDaysDerived: 90,
          closingCash: 100000,
          ebit: 50000,
          netCashFlowBeforeFinancing: 100000
        }
      ];

      const result = runAllValidations(calculatedData);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.successes.length).toBeGreaterThan(0);
    });
  });

  describe('validateFinancialData', () => {
    it('should handle empty data', () => {
      const result = validateFinancialData([]);
      expect(result.isValid).toBe(true);
      expect(result.critical).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.latest).toBeNull();
    });

    it('should focus on latest period for critical issues', () => {
      const calculatedData = [
        {
          // Period 1 - healthy
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 600000,
          balanceSheetDifference: 0,
          closingCash: 100000,
          netCashFlowBeforeFinancing: 50000,
          ebit: 100000
        },
        {
          // Period 2 - critical issues
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 500000,
          balanceSheetDifference: 100000,
          closingCash: -50000,
          netCashFlowBeforeFinancing: -100000,
          ebit: -50000
        }
      ];

      const result = validateFinancialData(calculatedData);
      expect(result.isValid).toBe(false);
      expect(result.latest).toBe(2);
      expect(result.critical.length).toBeGreaterThan(0);
      expect(result.critical[0].periodLabel).toContain('Período 2');
    });

    it('should consolidate warnings across periods', () => {
      const calculatedData = Array.from({ length: 4 }, (_, i) => ({
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 400000,
        equity: 580000 + i * 5000,
        balanceSheetDifference: 20000 - i * 5000,
        inventoryDaysDerived: 100 + i * 50, // Increasing inventory days
        inventoryValueAvg: 150000 + i * 50000,
        cogs: 600000,
        revenue: 1000000,
        closingCash: 100000,
        netCashFlowBeforeFinancing: 50000,
        ebit: 100000
      }));

      const result = validateFinancialData(calculatedData);
      const consolidatedWarnings = result.warnings.filter(w => w.isConsolidated);
      expect(consolidatedWarnings.length).toBeGreaterThan(0);
      expect(consolidatedWarnings[0].affectedPeriods).toBeDefined();
    });

    it('should analyze trends when multiple periods exist', () => {
      const calculatedData = [
        { netCashFlowBeforeFinancing: -50000, balanceSheetDifference: 5000 },
        { netCashFlowBeforeFinancing: -60000, balanceSheetDifference: 10000 },
        { netCashFlowBeforeFinancing: -70000, balanceSheetDifference: 15000 },
        { netCashFlowBeforeFinancing: -80000, balanceSheetDifference: 20000 }
      ];

      const result = validateFinancialData(calculatedData);
      expect(result.trends.length).toBeGreaterThan(0);
      expect(result.trends.some(t => t.type === 'trend')).toBe(true);
    });

    it('should calculate summary correctly', () => {
      const calculatedData = [
        {
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 500000,
          balanceSheetDifference: 100000, // Will create critical issue
          inventoryDaysDerived: 150, // Will create warning
          inventoryValueAvg: 200000,
          cogs: 600000,
          revenue: 1000000,
          closingCash: 50000,
          netCashFlowBeforeFinancing: -100000,
          ebit: 50000
        }
      ];

      const result = validateFinancialData(calculatedData);
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.critical).toBeGreaterThan(0);
      expect(result.summary.warnings).toBeGreaterThan(0);
    });

    it('should detect liquidity crisis', () => {
      const calculatedData = [
        {
          closingCash: 10000,
          netCashFlowBeforeFinancing: -100000, // FCL negative much larger than cash
          estimatedTotalAssets: 1000000,
          estimatedTotalLiabilities: 400000,
          equity: 600000,
          balanceSheetDifference: 0
        }
      ];

      const result = validateFinancialData(calculatedData);
      expect(result.critical.some(c => c.category.includes('Crise de Liquidez'))).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined values gracefully', () => {
      const periodData = {
        estimatedTotalAssets: undefined,
        estimatedTotalLiabilities: undefined,
        equity: undefined,
        balanceSheetDifference: undefined
      };

      expect(() => validateBalanceSheetInternalConsistency(periodData)).not.toThrow();
      expect(() => validateInventoryLevels(periodData)).not.toThrow();
      expect(() => validateRealisticBusinessMetrics(periodData)).not.toThrow();
    });

    it('should handle NaN values', () => {
      const periodData = {
        inventoryDaysDerived: NaN,
        inventoryValueAvg: 100000,
        cogs: 0, // Division by zero causing NaN
        revenue: 1000000
      };

      const result = validateInventoryLevels(periodData);
      expect(result).toBeDefined(); // Should handle NaN without crashing
    });

    it('should handle extremely large numbers', () => {
      const periodData = {
        estimatedTotalAssets: 1e15, // 1 quadrillion
        estimatedTotalLiabilities: 4e14,
        equity: 6e14,
        balanceSheetDifference: 0
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).toBeNull(); // Should handle large numbers correctly
    });

    it('should handle negative equity scenarios', () => {
      const periodData = {
        estimatedTotalAssets: 1000000,
        estimatedTotalLiabilities: 1500000,
        equity: -500000, // Negative equity
        balanceSheetDifference: 0
      };

      const result = validateBalanceSheetConsistency(periodData);
      expect(result).toBeNull(); // Should accept negative equity as valid
    });
  });
});