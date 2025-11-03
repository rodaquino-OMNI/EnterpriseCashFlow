import { describe, it, expect } from '@jest/globals';

// Import the calculation functions directly from the worker
// In a real scenario, these would be imported from a separate module
const {
  calculateNPV,
  calculateIRR,
  calculatePaybackPeriod,
  calculateBreakEven,
  projectCashFlows,
} = require('../../workers/financialCalculator.worker.js');

describe('Financial Formulas', () => {
  describe('NPV (Net Present Value)', () => {
    it('should calculate positive NPV for profitable investment', () => {
      const cashFlows = [150000, 150000, 150000, 150000, 150000];
      const discountRate = 0.1;
      const initialInvestment = 500000;

      const result = calculateNPV(cashFlows, discountRate, initialInvestment);

      expect(result.npv).toBeCloseTo(68618.28, 2);
      expect(result.profitabilityIndex).toBeCloseTo(1.14, 2);
      expect(result.presentValues).toHaveLength(5);
    });

    it('should calculate negative NPV for unprofitable investment', () => {
      const cashFlows = [50000, 50000, 50000, 50000];
      const discountRate = 0.15;
      const initialInvestment = 200000;

      const result = calculateNPV(cashFlows, discountRate, initialInvestment);

      expect(result.npv).toBeLessThan(0);
      expect(result.profitabilityIndex).toBeLessThan(1);
    });

    it('should handle zero discount rate', () => {
      const cashFlows = [100000, 100000, 100000];
      const discountRate = 0;
      const initialInvestment = 250000;

      const result = calculateNPV(cashFlows, discountRate, initialInvestment);

      expect(result.npv).toBe(50000); // Sum of cash flows - initial investment
    });
  });

  describe('IRR (Internal Rate of Return)', () => {
    it('should calculate IRR for typical investment', () => {
      const cashFlows = [-1000000, 300000, 400000, 500000, 200000];

      const result = calculateIRR(cashFlows);

      expect(result.isValid).toBe(true);
      expect(result.irr).toBeCloseTo(14.49, 1);
    });

    it('should handle multiple sign changes in cash flows', () => {
      const cashFlows = [-1000, 3000, -3000, 2000];

      const result = calculateIRR(cashFlows);

      // May have multiple IRRs or no solution
      expect(result).toHaveProperty('irr');
    });

    it('should fail for impossible IRR', () => {
      const cashFlows = [1000, 1000, 1000]; // All positive

      const result = calculateIRR(cashFlows);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('IRR calculation did not converge');
    });

    it('should converge quickly for well-behaved cash flows', () => {
      const cashFlows = [-10000, 3000, 4000, 5000];

      const result = calculateIRR(cashFlows);

      expect(result.isValid).toBe(true);
      expect(result.iterations).toBeLessThan(20);
    });
  });

  describe('Payback Period', () => {
    it('should calculate exact payback period', () => {
      const cashFlows = [100000, 100000, 100000, 100000];
      const initialInvestment = 250000;

      const result = calculatePaybackPeriod(cashFlows, initialInvestment);

      expect(result.paybackPeriod).toBe(2.5);
      expect(result.isWithinProjectLife).toBe(true);
    });

    it('should handle payback in first period', () => {
      const cashFlows = [200000, 100000, 100000];
      const initialInvestment = 150000;

      const result = calculatePaybackPeriod(cashFlows, initialInvestment);

      expect(result.paybackPeriod).toBe(0.75);
      expect(result.isWithinProjectLife).toBe(true);
    });

    it('should handle no payback scenario', () => {
      const cashFlows = [10000, 10000, 10000, 10000];
      const initialInvestment = 100000;

      const result = calculatePaybackPeriod(cashFlows, initialInvestment);

      expect(result.paybackPeriod).toBeNull();
      expect(result.isWithinProjectLife).toBe(false);
    });

    it('should provide cumulative cash flows', () => {
      const cashFlows = [50000, 50000, 50000, 50000];
      const initialInvestment = 150000;

      const result = calculatePaybackPeriod(cashFlows, initialInvestment);

      expect(result.cumulativeCashFlows).toEqual([-100000, -50000, 0, 50000]);
    });
  });

  describe('Break-even Analysis', () => {
    it('should calculate break-even for positive contribution margin', () => {
      const fixedCosts = 1000000;
      const variableCostPerUnit = 60;
      const pricePerUnit = 100;

      const result = calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit);

      expect(result.breakEvenUnits).toBe(25000);
      expect(result.breakEvenRevenue).toBe(2500000);
      expect(result.contributionMargin).toBe(40);
      expect(result.contributionMarginRatio).toBe(40);
    });

    it('should handle zero contribution margin', () => {
      const fixedCosts = 500000;
      const variableCostPerUnit = 100;
      const pricePerUnit = 100;

      const result = calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit);

      expect(result.breakEvenUnits).toBeNull();
      expect(result.error).toBe('Negative or zero contribution margin');
    });

    it('should handle negative contribution margin', () => {
      const fixedCosts = 500000;
      const variableCostPerUnit = 120;
      const pricePerUnit = 100;

      const result = calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit);

      expect(result.breakEvenUnits).toBeNull();
      expect(result.contributionMargin).toBe(-20);
      expect(result.error).toBe('Negative or zero contribution margin');
    });

    it('should calculate margin of safety', () => {
      const fixedCosts = 100000;
      const variableCostPerUnit = 50;
      const pricePerUnit = 100;

      const result = calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit);

      expect(result.breakEvenUnits).toBe(2000);
      expect(result.breakEvenRevenue).toBe(200000);
      
      // Test margin of safety function
      const marginOfSafety = result.marginOfSafety(300000);
      expect(marginOfSafety).toBeCloseTo(33.33, 2);
    });
  });

  describe('Cash Flow Projections', () => {
    it('should project cash flows with constant growth', () => {
      const baseCashFlow = 1000000;
      const growthRate = 0.05;
      const periods = 5;

      const result = projectCashFlows(baseCashFlow, growthRate, periods);

      expect(result.projectedCashFlows).toEqual([
        1000000,
        1050000,
        1102500,
        1157625,
        1215506.25,
      ]);
    });

    it('should calculate present values with discount rate', () => {
      const baseCashFlow = 100000;
      const growthRate = 0.03;
      const periods = 3;
      const discountRate = 0.08;

      const result = projectCashFlows(baseCashFlow, growthRate, periods, discountRate);

      expect(result.presentValues[0]).toBe(100000); // First period not discounted
      expect(result.presentValues[1]).toBeCloseTo(95324.07, 2);
      expect(result.presentValues[2]).toBeCloseTo(90889.75, 2);
      expect(result.totalPV).toBeCloseTo(286213.82, 2);
    });

    it('should calculate terminal value when valid', () => {
      const baseCashFlow = 1000000;
      const growthRate = 0.02;
      const periods = 5;
      const discountRate = 0.10;

      const result = projectCashFlows(baseCashFlow, growthRate, periods, discountRate);

      expect(result.terminalValue).toBeGreaterThan(0);
      // Terminal value = Last CF * (1 + g) / (r - g)
      const expectedTerminal = result.projectedCashFlows[4] * (1 + growthRate) / (discountRate - growthRate);
      expect(result.terminalValue).toBeCloseTo(expectedTerminal, 2);
    });

    it('should handle zero growth rate', () => {
      const baseCashFlow = 500000;
      const growthRate = 0;
      const periods = 4;

      const result = projectCashFlows(baseCashFlow, growthRate, periods);

      expect(result.projectedCashFlows).toEqual([500000, 500000, 500000, 500000]);
    });

    it('should handle negative growth rate', () => {
      const baseCashFlow = 1000000;
      const growthRate = -0.05;
      const periods = 3;

      const result = projectCashFlows(baseCashFlow, growthRate, periods);

      expect(result.projectedCashFlows[0]).toBe(1000000);
      expect(result.projectedCashFlows[1]).toBe(950000);
      expect(result.projectedCashFlows[2]).toBe(902500);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very large numbers', () => {
      const cashFlows = [1e9, 1.5e9, 2e9, 2.5e9];
      const discountRate = 0.12;
      const initialInvestment = 5e9;

      const result = calculateNPV(cashFlows, discountRate, initialInvestment);

      expect(result.npv).toBeDefined();
      expect(result.profitabilityIndex).toBeDefined();
    });

    it('should handle very small discount rates', () => {
      const cashFlows = [100, 100, 100];
      const discountRate = 0.0001;
      const initialInvestment = 250;

      const result = calculateNPV(cashFlows, discountRate, initialInvestment);

      expect(result.npv).toBeCloseTo(49.97, 2);
    });

    it('should handle zero cash flows', () => {
      const cashFlows = [0, 0, 100000, 0];
      const discountRate = 0.1;

      const result = calculateNPV(cashFlows, discountRate, 0);

      expect(result.npv).toBeGreaterThan(0);
      expect(result.presentValues[0]).toBe(0);
      expect(result.presentValues[1]).toBe(0);
      expect(result.presentValues[2]).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should evaluate a typical capital investment project', () => {
      // Real estate investment scenario
      const initialInvestment = 10000000; // R$ 10M
      const monthlyRent = 80000; // R$ 80k/month
      const annualAppreciation = 0.05;
      const years = 10;
      
      // Annual cash flows (12 months of rent + appreciation)
      const cashFlows = [];
      let propertyValue = initialInvestment;
      
      for (let year = 1; year <= years; year++) {
        propertyValue *= (1 + annualAppreciation);
        const annualRent = monthlyRent * 12;
        
        if (year === years) {
          // Include property sale in final year
          cashFlows.push(annualRent + propertyValue);
        } else {
          cashFlows.push(annualRent);
        }
      }

      const discountRate = 0.12; // 12% required return
      const npvResult = calculateNPV(cashFlows, discountRate, initialInvestment);
      const irrResult = calculateIRR([-initialInvestment, ...cashFlows]);

      expect(npvResult.npv).toBeDefined();
      expect(irrResult.isValid).toBe(true);
      expect(irrResult.irr).toBeGreaterThan(0);
    });

    it('should analyze a manufacturing break-even scenario', () => {
      // Brazilian manufacturing company
      const monthlyFixedCosts = 2500000; // R$ 2.5M (rent, salaries, etc.)
      const unitMaterialCost = 150; // R$ 150
      const unitLaborCost = 50; // R$ 50
      const unitSellingPrice = 300; // R$ 300
      
      const annualFixedCosts = monthlyFixedCosts * 12;
      const variableCostPerUnit = unitMaterialCost + unitLaborCost;

      const result = calculateBreakEven(annualFixedCosts, variableCostPerUnit, unitSellingPrice);

      expect(result.breakEvenUnits).toBe(300000); // 300k units/year
      expect(result.breakEvenRevenue).toBe(90000000); // R$ 90M
      expect(result.contributionMarginRatio).toBe(33.33);
    });
  });
});