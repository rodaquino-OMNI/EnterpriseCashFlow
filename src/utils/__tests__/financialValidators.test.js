// src/utils/__tests__/financialValidators.test.js
import { FinancialConstraintValidator, OverrideValidator } from '../financialValidators';

describe('FinancialConstraintValidator', () => {
  describe('getTolerance', () => {
    it('should return tolerance based on percentage of amount', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(1000000);
      expect(tolerance).toBeGreaterThanOrEqual(5000); // 0.5% of 1M
    });

    it('should return minimum absolute tolerance for small amounts', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(10);
      expect(tolerance).toBeGreaterThanOrEqual(1);
    });

    it('should handle null amount', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(null);
      expect(tolerance).toBe(FinancialConstraintValidator.TOLERANCE_ABSOLUTE);
    });

    it('should handle undefined amount', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(undefined);
      expect(tolerance).toBe(FinancialConstraintValidator.TOLERANCE_ABSOLUTE);
    });

    it('should handle NaN amount', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(NaN);
      expect(tolerance).toBe(FinancialConstraintValidator.TOLERANCE_ABSOLUTE);
    });

    it('should respect custom absolute minimum tolerance', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(10, 50);
      expect(tolerance).toBeGreaterThanOrEqual(50);
    });

    it('should handle negative amounts correctly', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(-1000000);
      expect(tolerance).toBeGreaterThan(0);
    });

    it('should handle zero amount', () => {
      const tolerance = FinancialConstraintValidator.getTolerance(0, 5);
      expect(tolerance).toBeGreaterThanOrEqual(5);
    });
  });

  describe('validatePLConstraints', () => {
    it('should validate correct P&L with no errors', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect gross profit equation violation', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 500000, // Wrong: should be 450000
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('LUCRO_BRUTO_EQ_VIOLATION');
      expect(result.errors[0].fields).toContain('grossProfit');
    });

    it('should detect EBITDA equation violation', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 300000, // Wrong: should be 250000
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'EBITDA_EQ_VIOLATION')).toBe(true);
    });

    it('should detect EBIT equation violation', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 250000, // Wrong: should be 200000
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors.some(e => e.type === 'EBIT_EQ_VIOLATION')).toBe(true);
    });

    it('should detect PBT equation violation', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 250000, // Wrong: should be 190000
        incomeTax: 50000,
        netProfit: 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors.some(e => e.type === 'PBT_EQ_VIOLATION')).toBe(true);
    });

    it('should detect net profit equation violation', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 200000 // Wrong: should be 140000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors.some(e => e.type === 'LUCRO_LÍQUIDO_EQ_VIOLATION')).toBe(true);
    });

    it('should warn when COGS exceeds revenue', () => {
      const data = {
        revenue: 1000000,
        cogs: 1100000, // COGS > Revenue
        grossProfit: -100000,
        operatingExpenses: 200000,
        ebitda: -300000,
        depreciationAndAmortisation: 50000,
        ebit: -350000,
        netInterestExpenseIncome: 0,
        extraordinaryItems: 0,
        pbt: -350000,
        incomeTax: 0,
        netProfit: -350000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.warnings.some(w => w.type === 'COGS_HIGH')).toBe(true);
    });

    it('should not validate when values are null', () => {
      const data = {
        revenue: 1000000,
        cogs: null,
        grossProfit: null,
        operatingExpenses: 200000,
        ebitda: null,
        depreciationAndAmortisation: 50000,
        ebit: null,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: null,
        incomeTax: 50000,
        netProfit: null
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors).toHaveLength(0);
    });

    it('should not validate when values are undefined', () => {
      const data = {
        revenue: 1000000,
        cogs: undefined,
        grossProfit: undefined
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing optional fields (netInterestExpenseIncome)', () => {
      const data = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: null, // Optional
        extraordinaryItems: null, // Optional
        pbt: 200000,
        incomeTax: 50000,
        netProfit: 150000
      };

      const result = FinancialConstraintValidator.validatePLConstraints(data);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateBalanceSheetConstraints', () => {
    it('should validate correct balance sheet with no errors', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn on material balance sheet imbalance', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 100000, // Material difference
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.warnings.some(w => w.type === 'BS_IMBALANCE_MATERIAL')).toBe(true);
    });

    it('should error when current assets exceed total assets', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 6000000, // > Total Assets
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.errors.some(e => e.type === 'CA_GT_TA')).toBe(true);
    });

    it('should error when current liabilities exceed total liabilities', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 4000000 // > Total Liabilities
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.errors.some(e => e.type === 'CL_GT_TL')).toBe(true);
    });

    it('should not error when total assets is zero', () => {
      const data = {
        estimatedTotalAssets: 0,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.errors).toHaveLength(0);
    });

    it('should not error when total liabilities is zero', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 0,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle small imbalance within tolerance', () => {
      const data = {
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 50, // Small difference
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000
      };

      const result = FinancialConstraintValidator.validateBalanceSheetConstraints(data);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateCashFlowConstraints', () => {
    it('should validate correct cash flow with no errors', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect DFC internal calculation error', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 100000, // Wrong: doesn't match components
        closingCash: 200000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.errors.some(e => e.type === 'DFC_NET_CHANGE_CALC_ERROR')).toBe(true);
    });

    it('should warn on material cash override reconciliation difference', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 200000, // Override caused large difference
        cashReconciliationDifference: 50000,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.warnings.some(w => w.type === 'CASH_OVERRIDE_RECONCILIATION_IMPACT')).toBe(true);
    });

    it('should provide info when override matches calculated value', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 1, // Very small difference
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.infos && result.infos.some(i => i.type === 'CASH_OVERRIDE_APPLIED_MATCH')).toBe(true);
    });

    it('should handle null cash reconciliation difference', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: null,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle undefined cash reconciliation difference', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: undefined,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle zero cash reconciliation difference', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.infos || []).toHaveLength(0);
    });

    it('should handle missing optional fields', () => {
      const data = {
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: null,
        dividendsPaid: null
      };

      const result = FinancialConstraintValidator.validateCashFlowConstraints(data);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAllStatements', () => {
    it('should validate all statements and return combined results', () => {
      const current = {
        // P&L
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000,
        // Balance Sheet
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000,
        equity: 2000000,
        retainedProfit: 140000,
        // Cash Flow
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateAllStatements(current);
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('infos');
      expect(result).toHaveProperty('isValid');
      expect(result.errors).toHaveLength(0);
      expect(result.isValid).toBe(true);
    });

    it('should detect equity bridge warning when provided with previous period', () => {
      const previous = {
        equity: 2000000
      };

      const current = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000,
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000,
        equity: 2500000, // Should be 2000000 + 140000 = 2140000
        retainedProfit: 140000,
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateAllStatements(current, previous);
      expect(result.warnings.some(w => w.type === 'EQUITY_BRIDGE_WARN')).toBe(true);
    });

    it('should return isValid=false when there are errors', () => {
      const current = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 500000, // Wrong
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000,
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000,
        equity: 2000000,
        retainedProfit: 140000,
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateAllStatements(current);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should not check equity bridge when previous is not provided', () => {
      const current = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000,
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000,
        equity: 2500000,
        retainedProfit: 140000,
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateAllStatements(current, null);
      expect(result.warnings.some(w => w.type === 'EQUITY_BRIDGE_WARN')).toBe(false);
    });

    it('should not check equity bridge when equity is missing', () => {
      const previous = { equity: 2000000 };
      const current = {
        revenue: 1000000,
        cogs: 550000,
        grossProfit: 450000,
        operatingExpenses: 200000,
        ebitda: 250000,
        depreciationAndAmortisation: 50000,
        ebit: 200000,
        netInterestExpenseIncome: -10000,
        extraordinaryItems: 0,
        pbt: 190000,
        incomeTax: 50000,
        netProfit: 140000,
        estimatedTotalAssets: 5000000,
        estimatedTotalLiabilities: 3000000,
        balanceSheetDifference: 0,
        estimatedCurrentAssets: 2000000,
        estimatedCurrentLiabilities: 1000000,
        // equity is undefined
        retainedProfit: 140000,
        calculatedOpeningCash: 100000,
        netChangeInCash: 50000,
        closingCash: 150000,
        cashReconciliationDifference: 0,
        operatingCashFlow: 120000,
        workingCapitalChange: 20000,
        capitalExpenditures: 30000,
        changeInDebt: 0,
        dividendsPaid: 20000
      };

      const result = FinancialConstraintValidator.validateAllStatements(current, previous);
      expect(result.warnings.some(w => w.type === 'EQUITY_BRIDGE_WARN')).toBe(false);
    });
  });
});

describe('OverrideValidator', () => {
  describe('extractOverrides', () => {
    it('should extract all override fields', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000,
        override_grossProfit: 450000,
        override_operatingExpenses: 200000
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).toHaveProperty('cogs', 550000);
      expect(overrides).toHaveProperty('grossProfit', 450000);
      expect(overrides).toHaveProperty('operatingExpenses', 200000);
      expect(overrides).not.toHaveProperty('revenue');
    });

    it('should ignore null override values', () => {
      const periodInput = {
        override_cogs: 550000,
        override_grossProfit: null
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).toHaveProperty('cogs');
      expect(overrides).not.toHaveProperty('grossProfit');
    });

    it('should ignore undefined override values', () => {
      const periodInput = {
        override_cogs: 550000,
        override_grossProfit: undefined
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).toHaveProperty('cogs');
      expect(overrides).not.toHaveProperty('grossProfit');
    });

    it('should ignore empty string override values', () => {
      const periodInput = {
        override_cogs: 550000,
        override_grossProfit: ''
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).toHaveProperty('cogs');
      expect(overrides).not.toHaveProperty('grossProfit');
    });

    it('should ignore NaN override values', () => {
      const periodInput = {
        override_cogs: 550000,
        override_grossProfit: 'not-a-number'
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).toHaveProperty('cogs');
      expect(overrides).not.toHaveProperty('grossProfit');
    });

    it('should convert string numbers to numbers', () => {
      const periodInput = {
        override_cogs: '550000',
        override_grossProfit: '450000'
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides.cogs).toBe(550000);
      expect(overrides.grossProfit).toBe(450000);
    });

    it('should ignore fields without override_ prefix', () => {
      const periodInput = {
        cogs: 550000,
        override_grossProfit: 450000
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(overrides).not.toHaveProperty('cogs');
      expect(overrides).toHaveProperty('grossProfit');
    });

    it('should return empty object when no overrides present', () => {
      const periodInput = {
        revenue: 1000000,
        cogs: 550000
      };

      const overrides = OverrideValidator.extractOverrides(periodInput);
      expect(Object.keys(overrides)).toHaveLength(0);
    });
  });

  describe('validateOverrideConsistency', () => {
    it('should validate consistent overrides with no errors', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000,
        override_grossProfit: 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect inconsistent P&L overrides', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000,
        override_grossProfit: 500000 // Wrong: should be 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors.some(e => e.type === 'PL_OVERRIDE_INCONSISTENT')).toBe(true);
    });

    it('should warn about excessive overrides', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000,
        override_grossProfit: 450000,
        override_operatingExpenses: 200000,
        override_ebitda: 250000,
        override_ebit: 200000,
        override_pbt: 190000,
        override_incomeTax: 50000,
        override_netProfit: 140000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.warnings.some(w => w.type === 'EXCESSIVE_OVERRIDES_WARNING')).toBe(true);
    });

    it('should handle null revenue', () => {
      const periodInput = {
        revenue: null,
        override_cogs: 550000,
        override_grossProfit: 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle undefined revenue', () => {
      const periodInput = {
        revenue: undefined,
        override_cogs: 550000,
        override_grossProfit: 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty string revenue', () => {
      const periodInput = {
        revenue: '',
        override_cogs: 550000,
        override_grossProfit: 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle string revenue', () => {
      const periodInput = {
        revenue: '1000000',
        override_cogs: 550000,
        override_grossProfit: 450000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should not check consistency when only one override present', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });

    it('should not warn about 7 or fewer overrides', () => {
      const periodInput = {
        revenue: 1000000,
        override_cogs: 550000,
        override_grossProfit: 450000,
        override_operatingExpenses: 200000,
        override_ebitda: 250000,
        override_ebit: 200000,
        override_pbt: 190000,
        override_incomeTax: 50000
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.warnings.some(w => w.type === 'EXCESSIVE_OVERRIDES_WARNING')).toBe(false);
    });

    it('should handle zero revenue correctly', () => {
      const periodInput = {
        revenue: 0,
        override_cogs: 0,
        override_grossProfit: 0
      };

      const result = OverrideValidator.validateOverrideConsistency(periodInput);
      expect(result.errors).toHaveLength(0);
    });
  });
});
