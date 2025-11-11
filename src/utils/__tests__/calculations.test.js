/**
 * @jest-environment jsdom
 */
import {
  calculateIncomeStatement,
  calculateCashFlow,
  calculateWorkingCapitalMetrics,
  calculateFinancialRatios,
  calculateBalanceSheet,
  processFinancialData,
} from '../calculations';

describe('Financial Calculations Engine', () => {
  describe('calculateIncomeStatement', () => {
    it('should calculate income statement with all provided values', () => {
      const input = {
        revenue: 1000000,
        cogs: 600000,
        operatingExpenses: 200000,
        depreciation: 50000,
        financialExpenses: 30000,
        financialRevenue: 10000,
      };

      const result = calculateIncomeStatement(input);

      // Extract auditTrail for separate validation
      const { auditTrail, taxBreakdown, ...resultWithoutAudit } = result;

      // Verify core financial metrics
      expect(resultWithoutAudit).toEqual({
        revenue: 1000000,
        cogs: 600000,
        grossProfit: 400000,
        grossMarginPercentage: 40.0,
        operatingExpenses: 200000,
        ebitda: 200000,
        ebitdaMargin: 20.0,
        depreciation: 50000,
        ebit: 150000,
        ebitMargin: 15.0,
        netFinancialResult: -20000,
        ebt: 130000,
        taxes: 31200, // Brazilian IRPJ (15%) + CSLL (9%) = 24%
        effectiveTaxRate: 24, // Effective tax rate
        netIncome: 98800, // 130000 - 31200
        netMargin: 9.88,
      });

      // Verify tax breakdown (Brazilian progressive tax)
      expect(taxBreakdown).toEqual({
        irpj: 19500, // 15% on all profit (130,000 * 0.15)
        irpjBase: 19500,
        irpjSurtax: 0, // No surtax (profit below 240k threshold)
        csll: 11700, // 9% on all profit (130,000 * 0.09)
      });

      // Verify audit trail exists and has required properties
      expect(auditTrail).toHaveProperty('timestamp');
      expect(auditTrail).toHaveProperty('originalValues');
      expect(auditTrail).toHaveProperty('calculationSteps');
      expect(auditTrail.calculationSteps).toBeInstanceOf(Array);
      expect(auditTrail.calculationSteps.length).toBeGreaterThan(0);
    });

    it('should calculate COGS from gross margin percentage', () => {
      const input = {
        revenue: 1000000,
        grossMarginPercentage: 45,
        operatingExpenses: 200000,
      };

      const result = calculateIncomeStatement(input);

      expect(result.cogs).toBe(550000);
      expect(result.grossProfit).toBe(450000);
      expect(result.grossMarginPercent).toBe(45.0);
    });

    it('should handle zero revenue gracefully', () => {
      const input = {
        revenue: 0,
        cogs: 0,
        operatingExpenses: 50000,
      };

      const result = calculateIncomeStatement(input);

      expect(result.revenue).toBe(0);
      expect(result.grossMarginPercent).toBe(0);
      expect(result.netIncome).toBe(-50000); // Operating expenses with no revenue
    });

    it('should apply default depreciation rate when not provided', () => {
      const input = {
        revenue: 1000000,
        cogs: 600000,
        operatingExpenses: 200000,
      };

      const result = calculateIncomeStatement(input);

      expect(result.depreciation).toBe(20000); // 2% of revenue
      expect(result.ebit).toBe(180000);
    });

    it('should ensure decimal precision for financial values', () => {
      const input = {
        revenue: 1234567.89,
        grossMarginPercentage: 33.33,
        operatingExpenses: 234567.89,
      };

      const result = calculateIncomeStatement(input);

      // All financial values should have max 2 decimal places
      expect(result.revenue).toBe(1234567.89);
      expect(result.cogs).toBe(823086.41); // (1 - 0.3333) * 1234567.89
      expect(result.grossProfit).toBe(411481.48);
      expect(Math.round(result.grossMarginPercent * 100) / 100).toBe(33.33);
    });
  });

  describe('calculateCashFlow', () => {
    const currentPeriod = {
      incomeStatement: {
        netIncome: 100000,
        depreciation: 20000,
        revenue: 1000000,
      },
      workingCapital: {
        accountsReceivableValue: 150000,
        inventoryValue: 100000,
        accountsPayableValue: 80000,
      },
    };

    const previousPeriod = {
      workingCapital: {
        accountsReceivableValue: 120000,
        inventoryValue: 90000,
        accountsPayableValue: 70000,
      },
    };

    it('should calculate operating cash flow with working capital changes', () => {
      const result = calculateCashFlow(currentPeriod, previousPeriod);

      expect(result.operatingCashFlow).toBe(90000); // 100000 + 20000 - 30000
      expect(result.workingCapitalChange).toBe(-30000);
      // WC Change = -((150000-120000) + (100000-90000) - (80000-70000))
      // = -((30000) + (10000) - (10000)) = -30000
    });

    it('should handle first period without previous data', () => {
      const result = calculateCashFlow(currentPeriod, null);

      // First period: Working capital represents cash investment (outflow)
      // WC change = -(AR + Inventory - AP) = -(150000 + 100000 - 80000) = -170000
      expect(result.workingCapitalChange).toBe(-170000);

      // Operating cash flow = Net income + Depreciation + WC change
      // = 100000 + 20000 + (-170000) = -50000
      expect(result.operatingCashFlow).toBe(-50000);
    });

    it('should calculate free cash flow with default capex', () => {
      const result = calculateCashFlow(currentPeriod, previousPeriod);

      expect(result.capex).toBe(50000); // 5% of revenue
      expect(result.investingCashFlow).toBe(-50000);
      expect(result.freeCashFlow).toBe(40000); // OCF (90000) - Capex (50000)
    });

    it('should calculate cash conversion rate', () => {
      const result = calculateCashFlow(currentPeriod, previousPeriod);

      expect(result.cashConversionRate).toBe(90.0); // (OCF 90000 / Net Income 100000) * 100
    });

    it('should handle custom capex and financing values', () => {
      const customPeriod = {
        ...currentPeriod,
        capex: 75000,
        debtChange: 50000,
        equityChange: 100000,
        dividends: 30000,
      };

      const result = calculateCashFlow(customPeriod, previousPeriod);

      expect(result.capex).toBe(75000);
      expect(result.financingCashFlow).toBe(120000); // 50000 + 100000 - 30000
      expect(result.netCashFlow).toBe(135000); // OCF (90000) + Investing (-75000) + Financing (120000)
    });
  });

  describe('calculateWorkingCapitalMetrics', () => {
    const baseData = {
      incomeStatement: {
        revenue: 1200000, // 100k per month
        cogs: 720000, // 60k per month
      },
      daysInPeriod: 365,
    };

    it('should calculate DSO from accounts receivable value', () => {
      const data = {
        ...baseData,
        accountsReceivableValueAvg: 200000,
      };

      const result = calculateWorkingCapitalMetrics(data);

      expect(result.dso).toBeCloseTo(60.83, 2); // (200000 / 1200000) * 365
      expect(result.accountsReceivableValue).toBe(200000);
    });

    it('should calculate DIO from inventory value', () => {
      const data = {
        ...baseData,
        inventoryValueAvg: 120000,
      };

      const result = calculateWorkingCapitalMetrics(data);

      expect(result.dio).toBeCloseTo(60.83, 2); // (120000 / 720000) * 365
      expect(result.inventoryValue).toBe(120000);
    });

    it('should calculate DPO from accounts payable value', () => {
      const data = {
        ...baseData,
        accountsPayableValueAvg: 90000,
      };

      const result = calculateWorkingCapitalMetrics(data);

      expect(result.dpo).toBeCloseTo(45.63, 2); // (90000 / 720000) * 365
      expect(result.accountsPayableValue).toBe(90000);
    });

    it('should calculate cash conversion cycle correctly', () => {
      const data = {
        ...baseData,
        accountsReceivableValueAvg: 200000,
        inventoryValueAvg: 120000,
        accountsPayableValueAvg: 90000,
      };

      const result = calculateWorkingCapitalMetrics(data);

      expect(result.cashConversionCycle).toBeCloseTo(76.03, 2); // DSO + DIO - DPO
      expect(result.workingCapitalValue).toBe(230000); // AR + Inv - AP
      expect(result.workingCapitalPercent).toBeCloseTo(19.17, 2); // (WC / Revenue) * 100
    });

    it('should derive values from days when provided', () => {
      const data = {
        ...baseData,
        accountsReceivableDays: 45,
        inventoryDays: 30,
        accountsPayableDays: 60,
      };

      const result = calculateWorkingCapitalMetrics(data);

      expect(result.dso).toBe(45);
      expect(result.dio).toBe(30);
      expect(result.dpo).toBe(60);
      expect(result.cashConversionCycle).toBe(15); // 45 + 30 - 60
      expect(result.accountsReceivableValue).toBeCloseTo(147945.21, 2);
      expect(result.inventoryValue).toBeCloseTo(59178.08, 2);
      expect(result.accountsPayableValue).toBeCloseTo(118356.16, 2);
    });

    it('should use default values when no data provided', () => {
      const result = calculateWorkingCapitalMetrics(baseData);

      expect(result.dso).toBe(45); // Default
      expect(result.dio).toBe(30); // Default
      expect(result.dpo).toBe(60); // Default
      expect(result.cashConversionCycle).toBe(15);
    });
  });

  describe('calculateFinancialRatios', () => {
    const financialData = {
      incomeStatement: {
        netIncome: 100000,
        ebit: 150000,
        revenue: 1000000,
      },
      balanceSheet: {
        currentAssets: 500000,
        totalAssets: 1000000,
        currentLiabilities: 200000,
        totalLiabilities: 400000,
        equity: 600000,
      },
      cashFlow: {
        operatingCashFlow: 120000,
      },
    };

    it('should calculate liquidity ratios', () => {
      const result = calculateFinancialRatios(financialData);

      expect(result.currentRatio).toBe(2.5); // CA / CL
      expect(result.quickRatio).toBe(2.5); // (CA - Inventory) / CL (no inventory in this case)
      expect(result.cashRatio).toBeCloseTo(0.6, 2); // OCF / CL
    });

    it('should calculate leverage ratios', () => {
      const result = calculateFinancialRatios(financialData);

      expect(result.debtToEquity).toBeCloseTo(0.67, 2); // Total Liabilities / Equity
      expect(result.debtRatio).toBe(0.4); // Total Liabilities / Total Assets
      expect(result.equityRatio).toBe(0.6); // Equity / Total Assets
    });

    it('should calculate profitability ratios', () => {
      const result = calculateFinancialRatios(financialData);

      expect(result.roe).toBeCloseTo(16.67, 2); // (Net Income / Equity) * 100
      expect(result.roa).toBe(10.0); // (Net Income / Total Assets) * 100
      expect(result.roic).toBe(15.0); // (EBIT / Total Assets) * 100
    });

    it('should calculate efficiency ratios', () => {
      const result = calculateFinancialRatios(financialData);

      expect(result.assetTurnover).toBe(1.0); // Revenue / Total Assets
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseData = {
        incomeStatement: {
          netIncome: -50000,
          ebit: -20000,
          revenue: 100000,
        },
        balanceSheet: {
          currentAssets: 50000,
          totalAssets: 100000,
          currentLiabilities: 80000,
          totalLiabilities: 90000,
          equity: 10000,
        },
        cashFlow: {
          operatingCashFlow: -10000,
        },
      };

      const result = calculateFinancialRatios(edgeCaseData);

      expect(result.currentRatio).toBeCloseTo(0.63, 2);
      expect(result.roe).toBe(-500.0); // Negative ROE
      expect(result.debtToEquity).toBe(9.0); // High leverage
    });
  });

  describe('calculateBalanceSheet', () => {
    const baseData = {
      incomeStatement: {
        revenue: 1000000,
        totalAssets: 800000,
      },
      workingCapital: {
        accountsReceivableValue: 150000,
        inventoryValue: 100000,
        accountsPayableValue: 80000,
        workingCapitalValue: 170000,
      },
      cashFlow: {
        netCashFlow: 50000,
      },
    };

    it('should estimate balance sheet components', () => {
      const result = calculateBalanceSheet(baseData);

      expect(result.currentAssets).toBeGreaterThan(0);
      expect(result.nonCurrentAssets).toBeGreaterThan(0);
      expect(result.totalAssets).toBe(result.currentAssets + result.nonCurrentAssets);
      // Current liabilities = AP (80000) + Short-term debt (50000) + Accrued expenses (20000)
      expect(result.currentLiabilities).toBe(150000);
      expect(result.totalLiabilitiesEquity).toBe(result.totalAssets);
    });

    it('should calculate balance sheet check', () => {
      const result = calculateBalanceSheet(baseData);

      const balanceCheck = Math.abs(result.totalAssets - result.totalLiabilitiesEquity);
      expect(balanceCheck).toBeLessThan(0.01); // Should balance
    });

    it('should handle missing data with estimates', () => {
      const minimalData = {
        incomeStatement: {
          revenue: 500000,
        },
        workingCapital: {
          workingCapitalValue: 50000,
        },
        cashFlow: {
          netCashFlow: 10000,
        },
      };

      const result = calculateBalanceSheet(minimalData);

      expect(result.totalAssets).toBeGreaterThan(0);
      expect(result.equity).toBeGreaterThan(0);
      expect(result.currentRatio).toBeGreaterThan(1); // Healthy ratio
    });
  });

  describe('processFinancialData', () => {
    const rawPeriodData = [
      {
        revenue: 100000,
        grossMarginPercentage: 40,
        operatingExpenses: 20000,
        accountsReceivableDays: 45,
        inventoryDays: 30,
        accountsPayableDays: 60,
      },
      {
        revenue: 120000,
        grossMarginPercentage: 42,
        operatingExpenses: 25000,
        accountsReceivableDays: 40,
        inventoryDays: 28,
        accountsPayableDays: 55,
      },
    ];

    it('should process multiple periods correctly', () => {
      const result = processFinancialData(rawPeriodData, 'MONTHLY');

      expect(result).toHaveLength(2);
      expect(result[0].incomeStatement).toBeDefined();
      expect(result[0].cashFlow).toBeDefined();
      expect(result[0].workingCapital).toBeDefined();
      expect(result[0].ratios).toBeDefined();
      expect(result[0].balanceSheet).toBeDefined();
    });

    it('should calculate period-over-period changes', () => {
      const result = processFinancialData(rawPeriodData, 'MONTHLY');

      // Second period should have working capital changes
      expect(result[1].cashFlow.workingCapitalChange).not.toBe(0);
    });

    it('should handle different period types', () => {
      const quarterlyResult = processFinancialData(rawPeriodData, 'QUARTERLY');
      const yearlyResult = processFinancialData(rawPeriodData, 'YEARLY');

      expect(quarterlyResult[0].daysInPeriod).toBe(90);
      expect(yearlyResult[0].daysInPeriod).toBe(365);
    });

    it('should validate data before processing', () => {
      const invalidData = [
        {
          revenue: -100000, // Invalid negative revenue
          grossMarginPercentage: 150, // Invalid percentage
        },
      ];

      expect(() => processFinancialData(invalidData, 'MONTHLY')).toThrow();
    });

    it('should enrich data with trends and analytics', () => {
      const result = processFinancialData(rawPeriodData, 'MONTHLY');

      // Check for trend data
      expect(result[1].trends).toBeDefined();
      expect(result[1].trends.revenueGrowth).toBe(20.0); // 20% growth
      expect(result[1].trends.marginImprovement).toBe(2.0); // 2 percentage points
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle division by zero gracefully', () => {
      const zeroRevenueData = {
        revenue: 0,
        cogs: 50000,
        operatingExpenses: 20000,
      };

      const result = calculateIncomeStatement(zeroRevenueData);

      expect(result.grossMarginPercent).toBe(0);
      expect(result.ebitdaMargin).toBe(0);
      expect(result.netMargin).toBe(0);
    });

    it('should maintain precision for large numbers', () => {
      const largeNumberData = {
        revenue: 1234567890.12,
        grossMarginPercentage: 33.33,
        operatingExpenses: 234567890.12,
      };

      const result = calculateIncomeStatement(largeNumberData);

      expect(result.revenue).toBe(1234567890.12);
      expect(typeof result.grossProfit).toBe('number');
      expect(isFinite(result.grossProfit)).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const minimalData = {
        revenue: 100000,
      };

      const result = calculateIncomeStatement(minimalData);

      expect(result).toBeDefined();
      expect(result.revenue).toBe(100000);
      expect(result.cogs).toBeGreaterThan(0); // Should use default margin
    });

    it('should round all monetary values to 2 decimal places', () => {
      const precisionData = {
        revenue: 100000.999,
        cogs: 60000.444,
        operatingExpenses: 20000.555,
      };

      const result = calculateIncomeStatement(precisionData);

      // Check that all monetary values have at most 2 decimal places
      Object.entries(result).forEach(([key, value]) => {
        if (typeof value === 'number' && !key.includes('Percent') && !key.includes('Margin')) {
          const decimalPlaces = (value.toString().split('.')[1] || '').length;
          expect(decimalPlaces).toBeLessThanOrEqual(2);
        }
      });
    });
  });
});