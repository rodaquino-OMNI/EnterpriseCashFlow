/**
 * Custom Matchers Test Suite
 * Verifies that custom financial matchers are properly registered and functioning
 */

describe('Custom Financial Matchers', () => {
  describe('toBeValidCurrency', () => {
    it('should pass for valid currency values', () => {
      expect(100.50).toBeValidCurrency();
      expect(0).toBeValidCurrency();
      expect(1234.56).toBeValidCurrency();
    });

    it('should fail for invalid currency values', () => {
      expect(() => expect(-10).toBeValidCurrency()).toThrow();
      expect(() => expect(100.123).toBeValidCurrency()).toThrow();
      expect(() => expect(Infinity).toBeValidCurrency()).toThrow();
      expect(() => expect(NaN).toBeValidCurrency()).toThrow();
      expect(() => expect('100').toBeValidCurrency()).toThrow();
    });
  });

  describe('toBeValidPercentage', () => {
    it('should pass for valid percentage values', () => {
      expect(0).toBeValidPercentage();
      expect(0.5).toBeValidPercentage();
      expect(1).toBeValidPercentage();
      expect(0.25).toBeValidPercentage();
    });

    it('should fail for invalid percentage values', () => {
      expect(() => expect(-0.1).toBeValidPercentage()).toThrow();
      expect(() => expect(1.5).toBeValidPercentage()).toThrow();
      expect(() => expect(Infinity).toBeValidPercentage()).toThrow();
      expect(() => expect(NaN).toBeValidPercentage()).toThrow();
      expect(() => expect('0.5').toBeValidPercentage()).toThrow();
    });
  });

  describe('toHaveValidFinancialStructure', () => {
    it('should pass for valid financial structure', () => {
      expect({ revenue: 100000, expenses: 75000 }).toHaveValidFinancialStructure();
      expect({ revenue: 0, expenses: 0 }).toHaveValidFinancialStructure();
      expect({ revenue: 50000, expenses: 25000, profit: 25000 }).toHaveValidFinancialStructure();
    });

    it('should fail for invalid financial structure', () => {
      expect(() => expect({ revenue: -100 }).toHaveValidFinancialStructure()).toThrow();
      expect(() => expect({ revenue: 100, expenses: -50 }).toHaveValidFinancialStructure()).toThrow();
      expect(() => expect({ revenue: 'abc', expenses: 100 }).toHaveValidFinancialStructure()).toThrow();
      expect(() => expect(null).toHaveValidFinancialStructure()).toThrow();
      expect(() => expect('not an object').toHaveValidFinancialStructure()).toThrow();
    });
  });

  describe('toBeWithinRange', () => {
    it('should pass for values within range', () => {
      expect(50).toBeWithinRange(0, 100);
      expect(0).toBeWithinRange(0, 100);
      expect(100).toBeWithinRange(0, 100);
      expect(75.5).toBeWithinRange(50, 100);
    });

    it('should fail for values outside range', () => {
      expect(() => expect(-1).toBeWithinRange(0, 100)).toThrow();
      expect(() => expect(101).toBeWithinRange(0, 100)).toThrow();
      expect(() => expect(50).toBeWithinRange(60, 100)).toThrow();
    });
  });

  describe('toHaveValidFinancialFormat', () => {
    it('should pass for valid financial format', () => {
      expect('$1,234.56').toHaveValidFinancialFormat();
      expect('$0.00').toHaveValidFinancialFormat();
      expect('$1,000,000.00').toHaveValidFinancialFormat();
      expect('$999.99').toHaveValidFinancialFormat();
    });

    it('should fail for invalid financial format', () => {
      expect(() => expect('1234.56').toHaveValidFinancialFormat()).toThrow();
      expect(() => expect('$1234').toHaveValidFinancialFormat()).toThrow();
      expect(() => expect('$1,234.5').toHaveValidFinancialFormat()).toThrow();
      expect(() => expect('$1,234.567').toHaveValidFinancialFormat()).toThrow();
      expect(() => expect(1234.56).toHaveValidFinancialFormat()).toThrow();
    });
  });

  describe('Custom Matchers Integration', () => {
    it('should be available globally through setupTests', () => {
      // Verify matchers are registered by checking they exist
      expect(expect.extend).toBeDefined();

      // Test that we can use matchers together
      const financialData = {
        revenue: 100000.00,
        expenses: 75000.00,
        margin: 0.25,
      };

      expect(financialData).toHaveValidFinancialStructure();
      expect(financialData.revenue).toBeValidCurrency();
      expect(financialData.expenses).toBeValidCurrency();
      expect(financialData.margin).toBeValidPercentage();
      expect(financialData.margin).toBeWithinRange(0, 1);
    });

    it('should provide clear error messages', () => {
      try {
        expect(-100).toBeValidCurrency();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('to be a valid currency value');
      }

      try {
        expect(1.5).toBeValidPercentage();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('to be a valid percentage');
      }
    });

    it('should work in real test scenarios', () => {
      // Simulate a real financial calculation test
      const calculateProfit = (revenue, expenses) => ({
        revenue,
        expenses,
        profit: revenue - expenses,
        margin: (revenue - expenses) / revenue,
      });

      const result = calculateProfit(100000, 75000);

      expect(result).toHaveValidFinancialStructure();
      expect(result.profit).toBeValidCurrency();
      expect(result.margin).toBeValidPercentage();
      expect(result.margin).toBeWithinRange(0, 1);
    });
  });
});
