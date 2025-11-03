/**
 * Comprehensive Financial Calculations Test Suite
 * Tests for Week 2-3 Financial Calculation Fixes
 *
 * This file tests all critical defects identified in FINANCIAL_CALCULATION_VALIDATION.md:
 * - DEFECT #1: Balance Sheet Estimation with Asset Turnover
 * - DEFECT #2: safeDivide Function Edge Cases
 * - DEFECT #3: Brazilian Tax Calculation (IRPJ + CSLL)
 * - DEFECT #4: Cash Flow Working Capital First Period
 * - DEFECT #5: Audit Trail System
 */

import {
  calculateIncomeStatement,
  calculateCashFlow,
  calculateWorkingCapitalMetrics,
  calculateBalanceSheet,
  calculateFinancialRatios,
  processFinancialData,
  safeDivide,
  calculateBrazilianTax,
  createAuditTrail,
} from '../../utils/calculations';

describe('DEFECT #2: safeDivide Function - Comprehensive Edge Case Testing', () => {
  describe('NaN handling', () => {
    test('should return 0 when denominator is NaN', () => {
      expect(safeDivide(100, NaN)).toBe(0);
    });

    test('should return 0 when numerator is NaN', () => {
      expect(safeDivide(NaN, 100)).toBe(0);
    });

    test('should return 0 when both numerator and denominator are NaN', () => {
      expect(safeDivide(NaN, NaN)).toBe(0);
    });
  });

  describe('Infinity handling', () => {
    test('should return 0 when numerator is Infinity', () => {
      expect(safeDivide(Infinity, 100)).toBe(0);
    });

    test('should return 0 when numerator is -Infinity', () => {
      expect(safeDivide(-Infinity, 100)).toBe(0);
    });

    test('should return 0 when denominator is Infinity', () => {
      expect(safeDivide(100, Infinity)).toBe(0);
    });

    test('should return 0 when result would be Infinity', () => {
      expect(safeDivide(1e308, 1e-308)).toBe(0);
    });
  });

  describe('Null and undefined handling', () => {
    test('should return 0 when numerator is null', () => {
      expect(safeDivide(null, 5)).toBe(0);
    });

    test('should return 0 when numerator is undefined', () => {
      expect(safeDivide(undefined, 5)).toBe(0);
    });

    test('should return 0 when denominator is null', () => {
      expect(safeDivide(100, null)).toBe(0);
    });

    test('should return 0 when denominator is undefined', () => {
      expect(safeDivide(100, undefined)).toBe(0);
    });
  });

  describe('Zero handling', () => {
    test('should return 0 when denominator is zero', () => {
      expect(safeDivide(100, 0)).toBe(0);
    });

    test('should return 0 when denominator is negative zero', () => {
      expect(safeDivide(100, -0)).toBe(0);
    });

    test('should return 0 when numerator is zero', () => {
      expect(safeDivide(0, 100)).toBe(0);
    });
  });

  describe('Near-zero handling (Number.EPSILON)', () => {
    test('should return 0 when denominator is smaller than Number.EPSILON', () => {
      expect(safeDivide(100, Number.EPSILON / 2)).toBe(0);
    });

    test('should handle denominator exactly at Number.EPSILON', () => {
      const result = safeDivide(100, Number.EPSILON);
      // Should either return valid number or 0
      expect(result === 0 || (isFinite(result) && Math.abs(result) <= Number.MAX_SAFE_INTEGER)).toBe(true);
    });
  });

  describe('Unsafe result handling', () => {
    test('should return 0 when result exceeds MAX_SAFE_INTEGER', () => {
      expect(safeDivide(Number.MAX_SAFE_INTEGER * 2, 1)).toBe(0);
    });

    test('should return 0 when result is below -MAX_SAFE_INTEGER', () => {
      expect(safeDivide(-Number.MAX_SAFE_INTEGER * 2, 1)).toBe(0);
    });

    test('should return 0 for very large division result', () => {
      expect(safeDivide(1e308, 1)).toBe(0);
    });
  });

  describe('Valid cases', () => {
    test('should handle normal positive division', () => {
      expect(safeDivide(100, 20)).toBe(5);
    });

    test('should handle normal negative division', () => {
      expect(safeDivide(-100, 20)).toBe(-5);
    });

    test('should handle decimal results', () => {
      expect(safeDivide(100, 3)).toBeCloseTo(33.333333, 5);
    });

    test('should handle very small numbers', () => {
      expect(safeDivide(0.001, 0.01)).toBeCloseTo(0.1, 10);
    });
  });
});

describe('DEFECT #1: Balance Sheet Estimation - Asset Turnover Approach', () => {
  describe('Asset turnover calculation', () => {
    test('should use asset turnover ratio instead of revenue * 0.8', () => {
      const data = {
        incomeStatement: { revenue: 1000000 },
        workingCapital: {
          accountsReceivableValue: 123287.67,
          inventoryValue: 49315.07,
          accountsPayableValue: 82191.78,
        },
        cashFlow: { netCashFlow: 50000 },
      };

      const balanceSheet = calculateBalanceSheet(data);

      // With default asset turnover of 2.5:
      // estimatedTotalAssets = 1,000,000 / 2.5 = 400,000
      // NOT revenue * 0.8 = 800,000
      expect(balanceSheet.totalAssets).toBeCloseTo(400000, -3);
    });

    test('should calculate fixed assets as 40% of estimated total assets', () => {
      const data = {
        incomeStatement: { revenue: 1000000 },
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 75000,
        },
        cashFlow: { netCashFlow: 50000 },
      };

      const balanceSheet = calculateBalanceSheet(data);

      // estimatedTotalAssets = 1,000,000 / 2.5 = 400,000
      // fixedAssetsNet should be approximately 40% of total assets
      const expectedFixedAssets = 400000 * 0.4;
      expect(balanceSheet.nonCurrentAssets).toBeCloseTo(expectedFixedAssets, -3);
    });

    test('should allow custom asset turnover ratio', () => {
      const data = {
        incomeStatement: { revenue: 1000000 },
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 75000,
        },
        cashFlow: { netCashFlow: 50000 },
        assetTurnover: 5.0, // High turnover industry
      };

      const balanceSheet = calculateBalanceSheet(data);

      // estimatedTotalAssets = 1,000,000 / 5.0 = 200,000
      expect(balanceSheet.totalAssets).toBeCloseTo(200000, -3);
    });

    test('should validate balance sheet equation A = L + E', () => {
      const data = {
        incomeStatement: { revenue: 1000000 },
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 75000,
        },
        cashFlow: { netCashFlow: 50000 },
      };

      const balanceSheet = calculateBalanceSheet(data);

      const difference = Math.abs(
        balanceSheet.totalAssets -
        (balanceSheet.totalLiabilities + balanceSheet.equity)
      );

      // Should balance within tolerance (0.01)
      expect(difference).toBeLessThan(0.01);
    });
  });

  describe('Edge cases', () => {
    test('should handle zero revenue', () => {
      const data = {
        incomeStatement: { revenue: 0 },
        workingCapital: {
          accountsReceivableValue: 0,
          inventoryValue: 0,
          accountsPayableValue: 0,
        },
        cashFlow: { netCashFlow: 0 },
      };

      const balanceSheet = calculateBalanceSheet(data);
      expect(balanceSheet.totalAssets).toBeGreaterThanOrEqual(0);
    });

    test('should handle very high revenue', () => {
      const data = {
        incomeStatement: { revenue: 1e9 }, // 1 billion
        workingCapital: {
          accountsReceivableValue: 100000000,
          inventoryValue: 50000000,
          accountsPayableValue: 75000000,
        },
        cashFlow: { netCashFlow: 50000000 },
      };

      const balanceSheet = calculateBalanceSheet(data);
      expect(balanceSheet.totalAssets).toBeGreaterThan(0);
      expect(balanceSheet.totalAssets).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });
  });
});

describe('DEFECT #3: Brazilian Tax Calculation - IRPJ + CSLL', () => {
  describe('IRPJ calculation', () => {
    test('should calculate 15% IRPJ for profit below R$ 240k/year', () => {
      const profit = 200000; // Below threshold
      const months = 12;

      const tax = calculateBrazilianTax(profit, months);

      // IRPJ: 200,000 * 0.15 = 30,000
      // CSLL: 200,000 * 0.09 = 18,000
      // Total: 48,000 (24%)
      expect(tax.irpj).toBeCloseTo(30000, 1);
      expect(tax.csll).toBeCloseTo(18000, 1);
      expect(tax.total).toBeCloseTo(48000, 1);
      expect(tax.effectiveRate).toBeCloseTo(24, 1);
    });

    test('should calculate 15% + 10% surtax for profit above R$ 240k/year', () => {
      const profit = 500000; // Above threshold (240k)
      const months = 12;

      const tax = calculateBrazilianTax(profit, months);

      // IRPJ base: 240,000 * 0.15 = 36,000
      // IRPJ surtax: (500,000 - 240,000) * 0.10 = 26,000
      // IRPJ total: 36,000 + 26,000 = 62,000
      // CSLL: 500,000 * 0.09 = 45,000
      // Total: 107,000 (21.4%)
      expect(tax.irpj).toBeCloseTo(62000, 1);
      expect(tax.csll).toBeCloseTo(45000, 1);
      expect(tax.total).toBeCloseTo(107000, 1);
      expect(tax.effectiveRate).toBeCloseTo(21.4, 1);
    });

    test('should handle monthly threshold of R$ 20k/month', () => {
      const profit = 50000; // Per month for 1 month
      const months = 1;

      const tax = calculateBrazilianTax(profit, months);

      // Monthly threshold: 20,000
      // IRPJ base: 20,000 * 0.15 = 3,000
      // IRPJ surtax: (50,000 - 20,000) * 0.10 = 3,000
      // IRPJ total: 6,000
      // CSLL: 50,000 * 0.09 = 4,500
      // Total: 10,500 (21%)
      expect(tax.irpj).toBeCloseTo(6000, 1);
      expect(tax.csll).toBeCloseTo(4500, 1);
      expect(tax.total).toBeCloseTo(10500, 1);
    });

    test('should handle quarterly periods', () => {
      const profit = 150000; // For 3 months
      const months = 3;

      const tax = calculateBrazilianTax(profit, months);

      // Quarterly threshold: 20,000 * 3 = 60,000
      // IRPJ base: 60,000 * 0.15 = 9,000
      // IRPJ surtax: (150,000 - 60,000) * 0.10 = 9,000
      // IRPJ total: 18,000
      // CSLL: 150,000 * 0.09 = 13,500
      // Total: 31,500 (21%)
      expect(tax.irpj).toBeCloseTo(18000, 1);
      expect(tax.csll).toBeCloseTo(13500, 1);
      expect(tax.total).toBeCloseTo(31500, 1);
    });
  });

  describe('CSLL calculation', () => {
    test('should always calculate 9% CSLL on profit', () => {
      const testCases = [
        { profit: 100000, expected: 9000 },
        { profit: 500000, expected: 45000 },
        { profit: 1000000, expected: 90000 },
      ];

      testCases.forEach(({ profit, expected }) => {
        const tax = calculateBrazilianTax(profit, 12);
        expect(tax.csll).toBeCloseTo(expected, 1);
      });
    });
  });

  describe('Edge cases', () => {
    test('should return 0 for zero profit', () => {
      const tax = calculateBrazilianTax(0, 12);
      expect(tax.total).toBe(0);
    });

    test('should return 0 for negative profit (no tax on losses)', () => {
      const tax = calculateBrazilianTax(-50000, 12);
      expect(tax.total).toBe(0);
    });

    test('should handle very large profit', () => {
      const profit = 10000000; // 10 million
      const months = 12;

      const tax = calculateBrazilianTax(profit, months);

      // IRPJ: 240,000 * 0.15 + (10,000,000 - 240,000) * 0.10 = 36,000 + 976,000 = 1,012,000
      // CSLL: 10,000,000 * 0.09 = 900,000
      // Total: 1,912,000 (19.12%)
      expect(tax.irpj).toBeCloseTo(1012000, 1);
      expect(tax.csll).toBeCloseTo(900000, 1);
      expect(tax.total).toBeCloseTo(1912000, 1);
    });
  });

  describe('Integration with income statement', () => {
    test('should replace flat 34% tax with progressive IRPJ + CSLL', () => {
      const data = {
        revenue: 1000000,
        grossMarginPercent: 40,
        operatingExpenses: 200000,
      };

      const incomeStatement = calculateIncomeStatement(data);

      // With progressive tax, effective rate varies based on profit level
      // Old: 34% flat
      // New: 24% for profits < 240k, then progressive

      if (incomeStatement.ebt > 240000) {
        // Should use progressive calculation
        expect(incomeStatement.effectiveTaxRate).toBeLessThan(34);
      } else {
        // Should be 24% for lower profits
        expect(incomeStatement.effectiveTaxRate).toBeCloseTo(24, 1);
      }
    });
  });
});

describe('DEFECT #4: Cash Flow Working Capital - First Period Calculation', () => {
  describe('First period working capital change', () => {
    test('should calculate first period WC change as cash outflow to establish WC', () => {
      const currentPeriod = {
        incomeStatement: {
          revenue: 1000000,
          cogs: 600000,
          netIncome: 150000,
          depreciation: 20000,
        },
        workingCapital: {
          accountsReceivableValue: 123287.67,
          inventoryValue: 49315.07,
          accountsPayableValue: 82191.78,
        },
      };

      const cashFlow = calculateCashFlow(currentPeriod, null); // No previous period

      // First period: WC change = -(AR + Inventory - AP)
      const expectedWCChange = -(123287.67 + 49315.07 - 82191.78);
      expect(cashFlow.workingCapitalChange).toBeCloseTo(expectedWCChange, 1);
    });

    test('should treat first period WC as cash investment', () => {
      const currentPeriod = {
        incomeStatement: {
          revenue: 1000000,
          cogs: 600000,
          netIncome: 150000,
          depreciation: 20000,
        },
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 60000,
        },
      };

      const cashFlow = calculateCashFlow(currentPeriod, null);

      // Cash outflow to establish working capital
      // -(100,000 + 50,000 - 60,000) = -90,000
      expect(cashFlow.workingCapitalChange).toBeLessThan(0);
      expect(cashFlow.workingCapitalChange).toBeCloseTo(-90000, 1);
    });
  });

  describe('Subsequent period working capital change', () => {
    test('should calculate WC change as delta from previous period', () => {
      const previousPeriod = {
        incomeStatement: {
          revenue: 800000,
          netIncome: 100000,
          depreciation: 15000,
        },
        workingCapital: {
          accountsReceivableValue: 90000,
          inventoryValue: 40000,
          accountsPayableValue: 50000,
        },
      };

      const currentPeriod = {
        incomeStatement: {
          revenue: 1000000,
          netIncome: 150000,
          depreciation: 20000,
        },
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 60000,
        },
      };

      const cashFlow = calculateCashFlow(currentPeriod, previousPeriod);

      // WC change = -ΔAR - ΔInventory + ΔAP
      // ΔAR = 100,000 - 90,000 = 10,000
      // ΔInventory = 50,000 - 40,000 = 10,000
      // ΔAP = 60,000 - 50,000 = 10,000
      // WC change = -10,000 - 10,000 + 10,000 = -10,000
      expect(cashFlow.workingCapitalChange).toBeCloseTo(-10000, 1);
    });
  });

  describe('Edge cases', () => {
    test('should handle zero working capital in first period', () => {
      const currentPeriod = {
        incomeStatement: {
          revenue: 1000000,
          netIncome: 150000,
          depreciation: 20000,
        },
        workingCapital: {
          accountsReceivableValue: 0,
          inventoryValue: 0,
          accountsPayableValue: 0,
        },
      };

      const cashFlow = calculateCashFlow(currentPeriod, null);
      expect(cashFlow.workingCapitalChange).toBe(0);
    });

    test('should handle negative working capital change (cash inflow)', () => {
      const previousPeriod = {
        workingCapital: {
          accountsReceivableValue: 100000,
          inventoryValue: 50000,
          accountsPayableValue: 40000,
        },
      };

      const currentPeriod = {
        incomeStatement: {
          netIncome: 150000,
          depreciation: 20000,
        },
        workingCapital: {
          accountsReceivableValue: 80000, // Decreased
          inventoryValue: 40000, // Decreased
          accountsPayableValue: 50000, // Increased
        },
      };

      const cashFlow = calculateCashFlow(currentPeriod, previousPeriod);

      // ΔAR = 80,000 - 100,000 = -20,000 (cash inflow)
      // ΔInventory = 40,000 - 50,000 = -10,000 (cash inflow)
      // ΔAP = 50,000 - 40,000 = 10,000 (cash outflow)
      // WC change = -(-20,000) - (-10,000) + 10,000 = 40,000 (cash inflow)
      expect(cashFlow.workingCapitalChange).toBeGreaterThan(0);
    });
  });
});

describe('DEFECT #5: Audit Trail System', () => {
  describe('Audit trail creation', () => {
    test('should create audit trail for calculations', () => {
      const originalData = {
        revenue: 1000000,
        grossMarginPercent: 40,
      };

      const auditTrail = createAuditTrail(originalData);

      expect(auditTrail).toHaveProperty('timestamp');
      expect(auditTrail).toHaveProperty('originalValues');
      expect(auditTrail).toHaveProperty('calculationSteps');
      expect(auditTrail.originalValues.revenue).toBe(1000000);
    });

    test('should track calculation steps', () => {
      const originalData = {
        revenue: 1000000,
        grossMarginPercent: 40,
      };

      const auditTrail = createAuditTrail(originalData);

      expect(auditTrail.calculationSteps).toBeInstanceOf(Array);
      expect(auditTrail.calculationSteps.length).toBeGreaterThan(0);
    });

    test('should track overrides applied', () => {
      const originalData = {
        revenue: 1000000,
        grossMarginPercent: 40,
      };

      const overrides = {
        cogs: 550000, // Override calculated COGS
      };

      const auditTrail = createAuditTrail(originalData, overrides);

      expect(auditTrail).toHaveProperty('overrides');
      expect(auditTrail.overrides).toEqual(overrides);
    });

    test('should track validation results', () => {
      const originalData = {
        revenue: 1000000,
        grossMarginPercent: 150, // Invalid
      };

      const auditTrail = createAuditTrail(originalData);

      expect(auditTrail).toHaveProperty('validationResults');
      expect(auditTrail.validationResults.errors).toBeInstanceOf(Array);
    });
  });

  describe('Audit trail storage', () => {
    test('should store audit trail with calculation results', () => {
      const data = {
        revenue: 1000000,
        grossMarginPercent: 40,
        operatingExpenses: 200000,
      };

      const incomeStatement = calculateIncomeStatement(data);

      expect(incomeStatement).toHaveProperty('auditTrail');
      expect(incomeStatement.auditTrail).toHaveProperty('timestamp');
    });

    test('should include calculation chain in audit trail', () => {
      const data = {
        revenue: 1000000,
        grossMarginPercent: 40,
        operatingExpenses: 200000,
      };

      const incomeStatement = calculateIncomeStatement(data);

      expect(incomeStatement.auditTrail.calculationSteps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ step: expect.any(String), value: expect.any(Number) })
        ])
      );
    });
  });

  describe('Audit trail querying', () => {
    test('should allow querying calculation history', () => {
      const data = {
        revenue: 1000000,
        grossMarginPercent: 40,
        operatingExpenses: 200000,
      };

      const incomeStatement = calculateIncomeStatement(data);
      const auditTrail = incomeStatement.auditTrail;

      // Should be able to find how EBITDA was calculated
      const ebitdaStep = auditTrail.calculationSteps.find(step => step.metric === 'ebitda');
      expect(ebitdaStep).toBeDefined();
      expect(ebitdaStep.formula).toBeDefined();
    });

    test('should allow querying override history', () => {
      const data = {
        revenue: 1000000,
        grossMarginPercent: 40,
        operatingExpenses: 200000,
      };

      const overrides = {
        ebitda: 250000, // Manual override
      };

      const incomeStatement = calculateIncomeStatement(data, overrides);
      const auditTrail = incomeStatement.auditTrail;

      expect(auditTrail.overrides).toHaveProperty('ebitda');
      expect(auditTrail.overrides.ebitda).toBe(250000);
    });
  });
});

describe('Integration Tests - Complete Financial Processing', () => {
  test('should process multi-period data with all fixes applied', () => {
    const periods = [
      {
        revenue: 800000,
        grossMarginPercent: 40,
        operatingExpenses: 180000,
        accountsReceivableDays: 45,
        inventoryDays: 30,
        accountsPayableDays: 60,
      },
      {
        revenue: 1000000,
        grossMarginPercent: 42,
        operatingExpenses: 200000,
        accountsReceivableDays: 40,
        inventoryDays: 28,
        accountsPayableDays: 65,
      },
    ];

    const results = processFinancialData(periods, 'MONTHLY');

    expect(results).toHaveLength(2);

    // Verify safeDivide doesn't cause NaN propagation
    results.forEach(result => {
      expect(result.incomeStatement.grossMarginPercent).not.toBeNaN();
      expect(result.ratios.currentRatio).not.toBeNaN();
    });

    // Verify Brazilian tax calculation is applied
    expect(results[0].incomeStatement.effectiveTaxRate).toBeLessThanOrEqual(34);

    // Verify balance sheet uses asset turnover
    expect(results[0].balanceSheet.totalAssets).not.toBe(results[0].incomeStatement.revenue * 0.8);

    // Verify audit trail exists
    expect(results[0].incomeStatement.auditTrail).toBeDefined();
  });

  test('should handle edge cases across all calculations', () => {
    const periods = [
      {
        revenue: 0, // Edge case: zero revenue
        grossMarginPercent: 40,
        operatingExpenses: 10000,
      },
    ];

    expect(() => {
      const results = processFinancialData(periods, 'MONTHLY');
      // Should not throw, should handle gracefully
      expect(results[0].incomeStatement.revenue).toBe(0);
    }).not.toThrow();
  });
});
