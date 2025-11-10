/**
 * Comprehensive Unit Tests for Financial Calculations
 * Following TDD principles - All edge cases and critical paths covered
 */

import {
  calculateIncomeStatement,
  calculateCashFlow,
  calculateWorkingCapitalMetrics,
  calculateFinancialRatios,
  calculateBalanceSheet,
  processFinancialData,
} from '../calculations';

describe('Financial Calculations - Comprehensive Tests', () => {
  describe('calculateIncomeStatement', () => {
    describe('Revenue and COGS calculations', () => {
      it('should calculate COGS from gross margin percentage', () => {
        const data = {
          revenue: 1000000,
          grossMarginPercent: 45,
          operatingExpenses: 300000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.revenue).toBe(1000000);
        expect(result.cogs).toBe(550000); // 1M * (1 - 0.45)
        expect(result.grossProfit).toBe(450000);
        expect(result.grossMarginPercent).toBe(45);
      });

      it('should use provided COGS when available', () => {
        const data = {
          revenue: 1000000,
          cogs: 600000,
          operatingExpenses: 300000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.cogs).toBe(600000);
        expect(result.grossProfit).toBe(400000);
        expect(result.grossMarginPercent).toBe(40);
      });

      it('should handle zero revenue gracefully', () => {
        const data = {
          revenue: 0,
          grossMarginPercent: 45,
          operatingExpenses: 100000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.revenue).toBe(0);
        expect(result.cogs).toBe(0);
        expect(result.grossProfit).toBe(0);
        expect(result.grossMarginPercent).toBe(0);
        expect(result.netIncome).toBe(-100000);
      });

      it('should handle negative margins correctly', () => {
        const data = {
          revenue: 1000000,
          cogs: 1200000, // More than revenue
          operatingExpenses: 100000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.grossProfit).toBe(-200000);
        expect(result.grossMarginPercent).toBe(-20);
      });
    });

    describe('EBITDA and EBIT calculations', () => {
      it('should calculate EBITDA and margins correctly', () => {
        const data = {
          revenue: 1000000,
          grossMarginPercent: 50,
          operatingExpenses: 200000,
          depreciation: 50000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.ebitda).toBe(300000); // 500k - 200k
        expect(result.ebitdaMargin).toBe(30);
        expect(result.ebit).toBe(250000); // 300k - 50k
        expect(result.ebitMargin).toBe(25);
      });

      it('should use default depreciation rate when not provided', () => {
        const data = {
          revenue: 1000000,
          grossMarginPercent: 50,
          operatingExpenses: 200000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.depreciation).toBe(20000); // 2% of revenue
        expect(result.ebit).toBe(280000);
      });
    });

    describe('Tax calculations', () => {
      it('should calculate taxes on positive income', () => {
        const data = {
          revenue: 1000000,
          grossMarginPercent: 50,
          operatingExpenses: 200000,
        };
        const result = calculateIncomeStatement(data);

        expect(result.ebt).toBeGreaterThan(0);
        // Brazilian GAAP: IRPJ (15%) + CSLL (9%) = 24% effective tax rate
        expect(result.taxes).toBe(Math.round(result.ebt * 0.24 * 100) / 100);
      });

      it('should not apply taxes on negative income', () => {
        const data = {
          revenue: 100000,
          grossMarginPercent: 20,
          operatingExpenses: 200000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.ebt).toBeLessThan(0);
        expect(result.taxes).toBe(0);
      });
    });

    describe('Financial result calculations', () => {
      it('should calculate net financial result correctly', () => {
        const data = {
          revenue: 1000000,
          grossMarginPercent: 50,
          operatingExpenses: 200000,
          financialRevenue: 10000,
          financialExpenses: 25000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.netFinancialResult).toBe(-15000);
        expect(result.ebt).toBe(265000); // EBIT 280k + (-15k)
      });
    });

    describe('Edge cases', () => {
      it('should handle all zero values', () => {
        const data = {
          revenue: 0,
          operatingExpenses: 0,
          financialRevenue: 0,
          financialExpenses: 0,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.revenue).toBe(0);
        expect(result.netIncome).toBe(0);
        expect(result.ebitda).toBe(0);
      });

      it('should handle very large numbers', () => {
        const data = {
          revenue: 1000000000000, // 1 trillion
          grossMarginPercent: 45,
          operatingExpenses: 300000000000,
        };
        const result = calculateIncomeStatement(data);
        
        expect(result.revenue).toBe(1000000000000);
        expect(result.grossProfit).toBe(450000000000);
        expect(result.netIncome).toBeDefined();
      });

      it('should handle decimal precision correctly', () => {
        const data = {
          revenue: 123456.789,
          grossMarginPercent: 33.333,
          operatingExpenses: 12345.678,
        };
        const result = calculateIncomeStatement(data);
        
        // All results should be rounded to 2 decimal places
        expect(result.revenue).toBe(123456.79);
        expect(Number.isInteger(result.cogs * 100)).toBe(true);
        expect(Number.isInteger(result.grossProfit * 100)).toBe(true);
      });
    });
  });

  describe('calculateCashFlow', () => {
    const basePeriod = {
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
      capex: 50000,
    };

    describe('Operating cash flow calculations', () => {
      it('should calculate OCF for first period (with WC investment)', () => {
        const result = calculateCashFlow(basePeriod, null);

        // First period: WC change = -(AR + Inventory - AP)
        // = -(150k + 100k - 80k) = -170k (cash outflow to establish WC)
        expect(result.workingCapitalChange).toBe(-170000);
        // OCF = NI + Depreciation + WC change = 100k + 20k + (-170k) = -50k
        expect(result.operatingCashFlow).toBe(-50000);
      });

      it('should calculate OCF with working capital changes', () => {
        const currentPeriod = {
          ...basePeriod,
          workingCapital: {
            accountsReceivableValue: 180000, // +30k
            inventoryValue: 120000, // +20k
            accountsPayableValue: 90000, // +10k
          },
        };
        
        const result = calculateCashFlow(currentPeriod, basePeriod);
        
        // WC change = -(30k + 20k - 10k) = -40k
        expect(result.workingCapitalChange).toBe(-40000);
        expect(result.operatingCashFlow).toBe(80000); // 120k - 40k
      });

      it('should handle decreasing working capital (cash inflow)', () => {
        const currentPeriod = {
          ...basePeriod,
          workingCapital: {
            accountsReceivableValue: 120000, // -30k
            inventoryValue: 80000, // -20k
            accountsPayableValue: 70000, // -10k
          },
        };
        
        const result = calculateCashFlow(currentPeriod, basePeriod);
        
        // WC change = -(-30k - 20k - (-10k)) = +40k
        expect(result.workingCapitalChange).toBe(40000);
        expect(result.operatingCashFlow).toBe(160000); // 120k + 40k
      });
    });

    describe('Investing and free cash flow', () => {
      it('should calculate investing cash flow with provided capex', () => {
        const result = calculateCashFlow(basePeriod, null);

        expect(result.capex).toBe(50000);
        expect(result.investingCashFlow).toBe(-50000);
        // FCF = OCF + Investing CF = -50k + (-50k) = -100k
        expect(result.freeCashFlow).toBe(-100000);
      });

      it('should use default capex rate when not provided', () => {
        const periodWithoutCapex = {
          ...basePeriod,
          capex: undefined,
        };
        
        const result = calculateCashFlow(periodWithoutCapex, null);
        
        expect(result.capex).toBe(50000); // 5% of 1M revenue
        expect(result.investingCashFlow).toBe(-50000);
      });
    });

    describe('Financing cash flow', () => {
      it('should calculate financing cash flow correctly', () => {
        const periodWithFinancing = {
          ...basePeriod,
          debtChange: 100000,
          equityChange: 50000,
          dividends: 30000,
        };

        const result = calculateCashFlow(periodWithFinancing, null);

        expect(result.financingCashFlow).toBe(120000); // 100k + 50k - 30k
        // Net CF = OCF + Investing CF + Financing CF = -50k + (-50k) + 120k = 20k
        expect(result.netCashFlow).toBe(20000);
      });

      it('should handle debt repayment and dividend payments', () => {
        const periodWithRepayments = {
          ...basePeriod,
          debtChange: -50000, // Repayment
          equityChange: 0,
          dividends: 40000,
        };
        
        const result = calculateCashFlow(periodWithRepayments, null);
        
        expect(result.financingCashFlow).toBe(-90000); // -50k + 0 - 40k
      });
    });

    describe('Cash conversion metrics', () => {
      it('should calculate cash conversion rate correctly', () => {
        const result = calculateCashFlow(basePeriod, null);

        // Cash conversion rate = (OCF / NI) * 100 = (-50k / 100k) * 100 = -50%
        expect(result.cashConversionRate).toBe(-50);
      });

      it('should handle negative net income', () => {
        const lossmaking = {
          ...basePeriod,
          incomeStatement: {
            ...basePeriod.incomeStatement,
            netIncome: -50000,
          },
        };

        const result = calculateCashFlow(lossmaking, null);

        // OCF = NI + Depreciation + WC change = -50k + 20k + (-170k) = -200k
        expect(result.operatingCashFlow).toBe(-200000);
        // Cash conversion rate = (-200k / -50k) * 100 = 400%
        expect(result.cashConversionRate).toBe(400);
      });
    });
  });

  describe('calculateWorkingCapitalMetrics', () => {
    const baseData = {
      incomeStatement: {
        revenue: 1000000,
        cogs: 600000,
      },
      daysInPeriod: 365,
    };

    describe('Days calculations', () => {
      it('should calculate DSO from AR value', () => {
        const data = {
          ...baseData,
          accountsReceivableValue: 123287.67,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.accountsReceivableValue).toBe(123287.67);
        expect(result.dso).toBe(45); // (123287.67 / 1M) * 365
      });

      it('should calculate AR value from DSO days', () => {
        const data = {
          ...baseData,
          accountsReceivableDays: 60,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.dso).toBe(60);
        expect(result.accountsReceivableValue).toBe(164383.56); // (1M / 365) * 60
      });

      it('should use default DSO when neither provided', () => {
        const result = calculateWorkingCapitalMetrics(baseData);
        
        expect(result.dso).toBe(45); // Default
        expect(result.accountsReceivableValue).toBe(123287.67);
      });

      it('should calculate DIO and inventory correctly', () => {
        const data = {
          ...baseData,
          inventoryDays: 30,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.dio).toBe(30);
        expect(result.inventoryValue).toBe(49315.07); // (600k / 365) * 30
      });

      it('should calculate DPO and payables correctly', () => {
        const data = {
          ...baseData,
          accountsPayableDays: 45,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.dpo).toBe(45);
        expect(result.accountsPayableValue).toBe(73972.6); // (600k / 365) * 45
      });
    });

    describe('Cash conversion cycle', () => {
      it('should calculate positive CCC', () => {
        const data = {
          ...baseData,
          accountsReceivableDays: 60,
          inventoryDays: 45,
          accountsPayableDays: 30,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.cashConversionCycle).toBe(75); // 60 + 45 - 30
        expect(result.workingCapitalValue).toBeGreaterThan(0);
      });

      it('should handle negative CCC (good cash management)', () => {
        const data = {
          ...baseData,
          accountsReceivableDays: 30,
          inventoryDays: 20,
          accountsPayableDays: 60,
        };

        const result = calculateWorkingCapitalMetrics(data);

        expect(result.cashConversionCycle).toBe(-10); // 30 + 20 - 60
        // WC value = AR + Inventory - AP
        // AR = (1M/365)*30 = 82,191.78
        // Inventory = (500K/365)*20 = 27,397.26
        // AP = (500K/365)*60 = 82,191.78
        // WC = 82,191.78 + 27,397.26 - 82,191.78 = 27,397.26 (positive)
        // Note: Negative CCC doesn't guarantee negative WC value
        expect(result.workingCapitalValue).toBeGreaterThan(0);
        expect(result.cashConversionCycle).toBeLessThan(0); // This is the key metric
      });
    });

    describe('Working capital calculations', () => {
      it('should calculate working capital value and percentage', () => {
        const data = {
          ...baseData,
          accountsReceivableValue: 150000,
          inventoryValue: 100000,
          accountsPayableValue: 80000,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.workingCapitalValue).toBe(170000); // 150k + 100k - 80k
        expect(result.workingCapitalPercent).toBe(17); // (170k / 1M) * 100
      });

      it('should handle quarterly periods correctly', () => {
        const data = {
          ...baseData,
          daysInPeriod: 90,
          accountsReceivableDays: 45,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        // AR for quarterly period
        expect(result.accountsReceivableValue).toBe(500000); // (1M / 90) * 45
      });
    });

    describe('Edge cases', () => {
      it('should handle zero revenue', () => {
        const data = {
          incomeStatement: {
            revenue: 0,
            cogs: 0,
          },
          daysInPeriod: 365,
          accountsReceivableDays: 45,
        };

        const result = calculateWorkingCapitalMetrics(data);

        expect(result.accountsReceivableValue).toBe(0);
        // DSO is set from accountsReceivableDays when provided, regardless of revenue
        expect(result.dso).toBe(45);
        expect(result.workingCapitalValue).toBe(0);
      });

      it('should handle missing income statement', () => {
        const data = {
          daysInPeriod: 365,
          accountsReceivableDays: 45,
        };
        
        const result = calculateWorkingCapitalMetrics(data);
        
        expect(result.accountsReceivableValue).toBe(0);
        expect(result.workingCapitalValue).toBe(0);
      });
    });
  });

  describe('calculateFinancialRatios', () => {
    const baseData = {
      incomeStatement: {
        revenue: 1000000,
        netIncome: 100000,
        ebit: 150000,
      },
      balanceSheet: {
        currentAssets: 500000,
        inventory: 100000,
        totalAssets: 1000000,
        currentLiabilities: 300000,
        totalLiabilities: 400000,
        equity: 600000,
      },
      cashFlow: {
        operatingCashFlow: 120000,
      },
    };

    describe('Liquidity ratios', () => {
      it('should calculate current ratio correctly', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.currentRatio).toBe(1.67); // 500k / 300k
      });

      it('should calculate quick ratio excluding inventory', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.quickRatio).toBe(1.33); // (500k - 100k) / 300k
      });

      it('should calculate cash ratio', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.cashRatio).toBe(0.4); // 120k / 300k
      });

      it('should handle zero current liabilities', () => {
        const data = {
          ...baseData,
          balanceSheet: {
            ...baseData.balanceSheet,
            currentLiabilities: 0,
          },
        };
        
        const result = calculateFinancialRatios(data);
        
        expect(result.currentRatio).toBe(0);
        expect(result.quickRatio).toBe(0);
      });
    });

    describe('Leverage ratios', () => {
      it('should calculate debt ratios correctly', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.debtToEquity).toBe(0.67); // 400k / 600k
        expect(result.debtRatio).toBe(0.4); // 400k / 1M
        expect(result.equityRatio).toBe(0.6); // 600k / 1M
      });

      it('should handle missing total liabilities', () => {
        const data = {
          ...baseData,
          balanceSheet: {
            ...baseData.balanceSheet,
            totalLiabilities: undefined,
            currentLiabilities: 300000,
            nonCurrentLiabilities: 100000,
          },
        };
        
        const result = calculateFinancialRatios(data);
        
        expect(result.debtToEquity).toBe(0.67); // (300k + 100k) / 600k
      });
    });

    describe('Profitability ratios', () => {
      it('should calculate ROE, ROA, and ROIC', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.roe).toBe(16.67); // (100k / 600k) * 100
        expect(result.roa).toBe(10); // (100k / 1M) * 100
        expect(result.roic).toBe(15); // (150k / 1M) * 100
      });

      it('should handle negative profits', () => {
        const data = {
          ...baseData,
          incomeStatement: {
            ...baseData.incomeStatement,
            netIncome: -50000,
            ebit: -30000,
          },
        };
        
        const result = calculateFinancialRatios(data);
        
        expect(result.roe).toBe(-8.33); // (-50k / 600k) * 100
        expect(result.roa).toBe(-5); // (-50k / 1M) * 100
      });
    });

    describe('Efficiency ratios', () => {
      it('should calculate asset turnover', () => {
        const result = calculateFinancialRatios(baseData);
        
        expect(result.assetTurnover).toBe(1); // 1M / 1M
      });

      it('should handle high asset turnover', () => {
        const data = {
          ...baseData,
          incomeStatement: {
            ...baseData.incomeStatement,
            revenue: 3000000,
          },
        };
        
        const result = calculateFinancialRatios(data);
        
        expect(result.assetTurnover).toBe(3); // 3M / 1M
      });
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
      },
      cashFlow: {
        netCashFlow: 50000,
      },
    };

    describe('Asset calculations', () => {
      it('should estimate cash and current assets', () => {
        const result = calculateBalanceSheet(baseData);
        
        expect(result.cash).toBe(100000); // Max of 10% revenue or net cash flow
        expect(result.accountsReceivable).toBe(150000);
        expect(result.inventory).toBe(100000);
        expect(result.currentAssets).toBe(350000); // 100k + 150k + 100k
      });

      it('should calculate non-current assets to balance', () => {
        const result = calculateBalanceSheet(baseData);
        
        expect(result.totalAssets).toBe(800000);
        expect(result.nonCurrentAssets).toBe(450000); // 800k - 350k
      });

      it('should use revenue-based estimation when total assets not provided', () => {
        const data = {
          ...baseData,
          incomeStatement: {
            revenue: 1000000,
          },
        };
        
        const result = calculateBalanceSheet(data);
        
        expect(result.totalAssets).toBe(800000); // 80% of revenue
      });
    });

    describe('Liability calculations', () => {
      it('should calculate current liabilities', () => {
        const result = calculateBalanceSheet(baseData);
        
        expect(result.accountsPayable).toBe(80000);
        expect(result.shortTermDebt).toBe(50000); // 5% of revenue
        expect(result.currentLiabilities).toBe(130000); // 80k + 50k
      });

      it('should balance with appropriate debt/equity ratio', () => {
        const result = calculateBalanceSheet(baseData);
        
        const targetDebtEquity = 0.5;
        const actualDebtEquity = result.totalLiabilities / result.equity;
        
        expect(actualDebtEquity).toBeCloseTo(targetDebtEquity, 1);
      });
    });

    describe('Balance sheet equation', () => {
      it('should ensure assets = liabilities + equity', () => {
        const result = calculateBalanceSheet(baseData);
        
        const leftSide = result.totalAssets;
        const rightSide = result.totalLiabilities + result.equity;
        
        expect(Math.abs(leftSide - rightSide)).toBeLessThan(1); // Rounding tolerance
        expect(result.balanceCheck).toBeLessThan(1);
      });

      it('should calculate current ratio', () => {
        const result = calculateBalanceSheet(baseData);
        
        expect(result.currentRatio).toBe(
          Math.round((result.currentAssets / result.currentLiabilities) * 100) / 100,
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle missing working capital data', () => {
        const data = {
          incomeStatement: {
            revenue: 1000000,
          },
          cashFlow: {
            netCashFlow: 50000,
          },
        };

        const result = calculateBalanceSheet(data);

        // Without WC data, balance sheet estimates all components based on asset turnover
        // Total assets = revenue / 2.5 = 400k
        // Current assets = 60% = 240k
        // Estimates: AR=40% of CA=96k, Inventory=20% of CA=48k, AP estimated similarly
        expect(result.accountsReceivable).toBeGreaterThan(0); // Estimated at ~96k
        expect(result.inventory).toBeGreaterThan(0); // Estimated at ~48k
        expect(result.currentAssets).toBeGreaterThan(0);
      });

      it('should handle negative net cash flow', () => {
        const data = {
          ...baseData,
          cashFlow: {
            netCashFlow: -50000,
          },
        };

        const result = calculateBalanceSheet(data);

        // Cash is calculated based on working capital and current assets allocation
        // Not directly from net cash flow or revenue percentage
        // With baseData WC values, cash = max(0, currentAssetsEstimate - (AR + Inventory))
        expect(result.cash).toBeGreaterThanOrEqual(0);
        expect(result.totalAssets).toBeGreaterThan(0);
      });
    });
  });

  describe('processFinancialData', () => {
    const validPeriodData = [
      {
        revenue: 1000000,
        grossMarginPercent: 45,
        operatingExpenses: 300000,
        accountsReceivableDays: 45,
        inventoryDays: 30,
        accountsPayableDays: 60,
      },
      {
        revenue: 1100000,
        grossMarginPercent: 46,
        operatingExpenses: 320000,
        accountsReceivableDays: 50,
        inventoryDays: 35,
        accountsPayableDays: 65,
      },
    ];

    describe('Multi-period processing', () => {
      it('should process multiple periods correctly', () => {
        const result = processFinancialData(validPeriodData, 'QUARTERLY');
        
        expect(result).toHaveLength(2);
        expect(result[0].periodIndex).toBe(0);
        expect(result[1].periodIndex).toBe(1);
        expect(result[0].daysInPeriod).toBe(90);
      });

      it('should calculate trends for periods after the first', () => {
        const result = processFinancialData(validPeriodData, 'QUARTERLY');
        
        expect(result[0].trends).toEqual({});
        expect(result[1].trends.revenueGrowth).toBe(10); // 10% growth
        expect(result[1].trends.marginImprovement).toBe(1); // 1% improvement
      });

      it('should handle working capital changes between periods', () => {
        const result = processFinancialData(validPeriodData, 'QUARTERLY');
        
        // Second period should have WC change impact on cash flow
        expect(result[1].cashFlow.workingCapitalChange).not.toBe(0);
      });
    });

    describe('Data validation', () => {
      it('should reject negative revenue', () => {
        const invalidData = [
          { revenue: -1000000, grossMarginPercent: 45, operatingExpenses: 300000 },
        ];
        
        expect(() => processFinancialData(invalidData, 'QUARTERLY'))
          .toThrow('Revenue cannot be negative');
      });

      it('should reject invalid gross margin percentages', () => {
        const invalidData = [
          { revenue: 1000000, grossMarginPercent: 150, operatingExpenses: 300000 },
        ];
        
        expect(() => processFinancialData(invalidData, 'QUARTERLY'))
          .toThrow('Gross margin must be between 0-100%');
      });

      it('should accept gross margin of 0%', () => {
        const zeroMarginData = [
          { revenue: 1000000, grossMarginPercent: 0, operatingExpenses: 300000 },
        ];
        
        const result = processFinancialData(zeroMarginData, 'QUARTERLY');
        expect(result[0].incomeStatement.grossMarginPercent).toBe(0);
      });

      it('should accept gross margin of 100%', () => {
        const fullMarginData = [
          { revenue: 1000000, grossMarginPercent: 100, operatingExpenses: 300000 },
        ];
        
        const result = processFinancialData(fullMarginData, 'QUARTERLY');
        expect(result[0].incomeStatement.grossMarginPercent).toBe(100);
      });
    });

    describe('Period type handling', () => {
      it('should handle monthly periods', () => {
        const result = processFinancialData(validPeriodData, 'MONTHLY');
        
        expect(result[0].daysInPeriod).toBe(30);
      });

      it('should handle yearly periods', () => {
        const result = processFinancialData(validPeriodData, 'YEARLY');
        
        expect(result[0].daysInPeriod).toBe(365);
      });

      it('should default to 30 days for unknown period types', () => {
        const result = processFinancialData(validPeriodData, 'UNKNOWN');
        
        expect(result[0].daysInPeriod).toBe(30);
      });
    });

    describe('Complex scenarios', () => {
      it('should handle turnaround scenario (loss to profit)', () => {
        const turnaroundData = [
          {
            revenue: 1000000,
            grossMarginPercent: 20,
            operatingExpenses: 300000, // Will create a loss
          },
          {
            revenue: 1200000,
            grossMarginPercent: 40,
            operatingExpenses: 350000, // Should be profitable
          },
        ];
        
        const result = processFinancialData(turnaroundData, 'QUARTERLY');
        
        expect(result[0].incomeStatement.netIncome).toBeLessThan(0);
        expect(result[1].incomeStatement.netIncome).toBeGreaterThan(0);
        expect(result[1].trends.profitGrowth).toBeDefined();
      });

      it('should handle high growth scenario', () => {
        const highGrowthData = Array.from({ length: 4 }, (_, i) => ({
          revenue: 1000000 * Math.pow(1.5, i), // 50% growth each period
          grossMarginPercent: 40 + i * 2, // Improving margins
          operatingExpenses: 300000 * Math.pow(1.3, i), // Scaling opex
        }));
        
        const result = processFinancialData(highGrowthData, 'QUARTERLY');
        
        expect(result[3].incomeStatement.revenue).toBe(3375000);
        expect(result[3].trends.revenueGrowth).toBe(50);
      });

      it('should handle seasonal business', () => {
        const seasonalData = [
          { revenue: 2000000, grossMarginPercent: 50, operatingExpenses: 500000 }, // Peak
          { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 400000 }, // Low
          { revenue: 1500000, grossMarginPercent: 48, operatingExpenses: 450000 }, // Mid
          { revenue: 2500000, grossMarginPercent: 52, operatingExpenses: 600000 },  // Peak
        ];
        
        const result = processFinancialData(seasonalData, 'QUARTERLY');
        
        // Should handle negative growth gracefully
        expect(result[1].trends.revenueGrowth).toBe(-50);
        expect(result[3].trends.revenueGrowth).toBe(66.67);
      });
    });

    describe('Performance considerations', () => {
      it('should handle large number of periods efficiently', () => {
        const manyPeriods = Array.from({ length: 100 }, (_, i) => ({
          revenue: 1000000 + i * 10000,
          grossMarginPercent: 40 + (i % 10) * 0.5,
          operatingExpenses: 300000 + i * 3000,
        }));
        
        const startTime = Date.now();
        const result = processFinancialData(manyPeriods, 'MONTHLY');
        const endTime = Date.now();
        
        expect(result).toHaveLength(100);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      });
    });
  });

  describe('Calculation precision and rounding', () => {
    it('should maintain 2 decimal precision throughout calculations', () => {
      const data = {
        revenue: 123456.789,
        grossMarginPercent: 33.333,
        operatingExpenses: 12345.678,
        depreciation: 1234.567,
        financialRevenue: 123.456,
        financialExpenses: 234.567,
      };
      
      const result = calculateIncomeStatement(data);
      
      // Check all monetary values are rounded to 2 decimals
      Object.entries(result).forEach(([key, value]) => {
        if (typeof value === 'number' && !key.includes('Percent') && !key.includes('Margin')) {
          const decimals = (value.toString().split('.')[1] || '').length;
          expect(decimals).toBeLessThanOrEqual(2);
        }
      });
    });

    it('should handle currency calculations without floating point errors', () => {
      const data = {
        revenue: 0.1 + 0.2, // Classic floating point issue
        grossMarginPercent: 50,
        operatingExpenses: 0.1,
      };
      
      const result = calculateIncomeStatement(data);
      
      expect(result.revenue).toBe(0.3);
      expect(result.grossProfit).toBe(0.15);
    });
  });
});