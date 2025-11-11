import { describe, it, expect } from '@jest/globals';

// Import the exported functions from the worker
const {
  calculateNPV,
  calculateIRR,
  calculatePaybackPeriod,
  calculateBreakEven,
  projectCashFlows,
  performSensitivityAnalysis,
} = require('../../workers/financialCalculator.worker.js');

describe('Financial Calculator Worker', () => {
  describe('Basic Worker Functionality', () => {
    it('should export calculation functions', () => {
      expect(calculateNPV).toBeDefined();
      expect(calculateIRR).toBeDefined();
      expect(calculatePaybackPeriod).toBeDefined();
      expect(calculateBreakEven).toBeDefined();
      expect(projectCashFlows).toBeDefined();
      expect(performSensitivityAnalysis).toBeDefined();
    });
  });

  describe('Advanced Financial Calculations', () => {
    it('should handle NPV calculation', () => {
      const result = calculateNPV(
        [100000, 150000, 200000, 250000],
        0.1,
        500000
      );

      expect(result).toBeDefined();
      expect(result.npv).toBeDefined();
      expect(result.profitabilityIndex).toBeDefined();
      expect(result.presentValues).toBeDefined();
      expect(Array.isArray(result.presentValues)).toBe(true);
    });

    it('should handle IRR calculation', () => {
      const result = calculateIRR(
        [-500000, 100000, 150000, 200000, 250000]
      );

      expect(result).toBeDefined();
      expect(result.irr).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.iterations).toBeDefined();
    });

    it('should handle payback period calculation', () => {
      const result = calculatePaybackPeriod(
        [100000, 150000, 200000, 250000],
        400000
      );

      expect(result).toBeDefined();
      expect(result.paybackPeriod).toBeDefined();
      expect(result.cumulativeCashFlows).toBeDefined();
      expect(result.isWithinProjectLife).toBeDefined();
    });

    it('should handle break-even analysis', () => {
      const result = calculateBreakEven(
        500000,
        50,
        100
      );

      expect(result).toBeDefined();
      expect(result.breakEvenUnits).toBeDefined();
      expect(result.breakEvenRevenue).toBeDefined();
      expect(result.contributionMargin).toBeDefined();
    });

    it('should handle cash flow projections', () => {
      const result = projectCashFlows(
        100000,
        0.1,
        5,
        0.08
      );

      expect(result).toBeDefined();
      expect(result.projectedCashFlows).toBeDefined();
      expect(Array.isArray(result.projectedCashFlows)).toBe(true);
      expect(result.projectedCashFlows.length).toBe(5);
      expect(result.totalPV).toBeDefined();
    });
  });

  describe('Performance and Large Dataset Handling', () => {
    it('should handle large dataset calculations efficiently', () => {
      const largeDataset = Array(1000).fill(100000);

      const startTime = Date.now();
      const result = calculateNPV(largeDataset, 0.1, 0);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle multiple calculation types', () => {
      const npvResult = calculateNPV([100000, 150000, 200000], 0.1, 300000);
      const irrResult = calculateIRR([-300000, 100000, 150000, 200000]);
      const paybackResult = calculatePaybackPeriod([100000, 150000, 200000], 300000);

      expect(npvResult).toBeDefined();
      expect(irrResult).toBeDefined();
      expect(paybackResult).toBeDefined();
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle zero discount rate', () => {
      const result = calculateNPV([100000, 150000], 0, 200000);
      expect(result).toBeDefined();
      expect(result.npv).toBeDefined();
    });

    it('should handle negative cash flows in IRR', () => {
      const result = calculateIRR([-500000, -100000, 200000, 300000, 400000]);
      expect(result).toBeDefined();
      expect(result.irr).toBeDefined();
    });

    it('should handle break-even with high fixed costs', () => {
      const result = calculateBreakEven(1000000, 50, 100);
      expect(result).toBeDefined();
      expect(result.breakEvenUnits).toBe(20000);
    });
  });

  describe('Memory Management', () => {
    it('should handle large projections without memory issues', () => {
      const result = projectCashFlows(1000000, 0.05, 100, 0.08);

      expect(result).toBeDefined();
      expect(result.projectedCashFlows).toBeDefined();
      expect(result.projectedCashFlows.length).toBe(100);
      expect(result.totalPV).toBeDefined();
    });

    it('should handle sensitivity analysis with multiple variables', () => {
      const baseCase = {
        revenue: 1000000,
        costs: 600000,
        growth: 0.05,
      };

      const variables = {
        revenue: [900000, 1000000, 1100000],
        costs: [550000, 600000, 650000],
      };

      const calculation = (scenario) => scenario.revenue - scenario.costs;

      const result = performSensitivityAnalysis(baseCase, variables, calculation);

      expect(result).toBeDefined();
      expect(result.revenue).toBeDefined();
      expect(result.costs).toBeDefined();
      expect(Array.isArray(result.revenue)).toBe(true);
      expect(Array.isArray(result.costs)).toBe(true);
    });
  });
});
