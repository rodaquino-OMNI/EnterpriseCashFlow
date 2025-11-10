/**
 * Unit Tests for Formatter Utilities
 * Testing all formatting functions with edge cases
 */

import {
  formatCurrency,
  formatCurrencyWithSign,
  formatPercentage,
  formatDays,
  getMovementClass,
  getMovementIndicator,
  formatMovement,
} from '../formatters';

describe('Formatter Utilities', () => {
  describe('formatCurrency', () => {
    it('should format basic currency values correctly', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should handle symbol parameter', () => {
      expect(formatCurrency(1000, false)).toBe('1.000,00');
      expect(formatCurrency(1000, true)).toBe('R$ 1.000,00');
    });

    it('should abbreviate large numbers when requested', () => {
      expect(formatCurrency(1_000_000)).toBe('R$ 1,00 mi');
      expect(formatCurrency(1_500_000)).toBe('R$ 1,50 mi');
      expect(formatCurrency(1_000_000_000)).toBe('R$ 1,00 bi');
      expect(formatCurrency(1_000_000_000_000)).toBe('R$ 1,00 tri');
    });

    it('should handle precision option', () => {
      expect(formatCurrency(1234.5678, true, { precision: 0 })).toBe('R$ 1.235');
      expect(formatCurrency(1234.5678, true, { precision: 3 })).toBe('R$ 1.234,568');
      expect(formatCurrency(1_000_000, true, { precision: 1 })).toBe('R$ 1,0 mi');
    });

    it('should not abbreviate when abbreviate is false', () => {
      expect(formatCurrency(1_000_000, true, { abbreviate: false })).toBe('R$ 1.000.000,00');
      expect(formatCurrency(1_000_000_000, true, { abbreviate: false })).toBe('R$ 1.000.000.000,00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('R$ -1.000,00');
      expect(formatCurrency(-1_000_000)).toBe('R$ -1,00 mi');
    });

    it('should handle null and undefined values', () => {
      expect(formatCurrency(null)).toBe('N/A');
      expect(formatCurrency(undefined)).toBe('N/A');
      expect(formatCurrency(NaN)).toBe('N/A');
    });

    it('should handle string numbers', () => {
      expect(formatCurrency('1000')).toBe('R$ 1.000,00');
      expect(formatCurrency('1000.50')).toBe('R$ 1.000,50');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999_999_999_999)).toBe('R$ 1,00 tri'); // Rounds to 1 trillion
      expect(formatCurrency(1_234_567_890_123)).toBe('R$ 1,23 tri');
      expect(formatCurrency(999_999_999)).toBe('R$ 1,00 bi'); // Rounds to 1 billion
    });

    it('should handle edge cases for abbreviation thresholds', () => {
      expect(formatCurrency(999_999)).toBe('R$ 999.999,00');
      expect(formatCurrency(999_999.99)).toBe('R$ 999.999,99');
      expect(formatCurrency(1_000_000)).toBe('R$ 1,00 mi');
    });
  });

  describe('formatCurrencyWithSign', () => {
    it('should format positive values normally', () => {
      expect(formatCurrencyWithSign(1000)).toBe('R$ 1.000,00');
      expect(formatCurrencyWithSign(1234.56)).toBe('R$ 1.234,56');
    });

    it('should format negative values with sign before symbol', () => {
      expect(formatCurrencyWithSign(-1000)).toBe('-R$ 1.000,00');
      expect(formatCurrencyWithSign(-1234.56)).toBe('-R$ 1.234,56');
    });

    it('should handle symbol parameter', () => {
      expect(formatCurrencyWithSign(1000, false)).toBe('1.000,00');
      expect(formatCurrencyWithSign(-1000, false)).toBe('-1.000,00');
    });

    it('should handle null and undefined values', () => {
      expect(formatCurrencyWithSign(null)).toBe('N/A');
      expect(formatCurrencyWithSign(undefined)).toBe('N/A');
      expect(formatCurrencyWithSign(NaN)).toBe('N/A');
    });

    it('should handle zero', () => {
      expect(formatCurrencyWithSign(0)).toBe('R$ 0,00');
      expect(formatCurrencyWithSign(-0)).toBe('R$ 0,00');
    });
  });

  describe('formatPercentage', () => {
    it('should format basic percentage values', () => {
      expect(formatPercentage(45)).toBe('45,00%');
      expect(formatPercentage(45.5)).toBe('45,50%');
      expect(formatPercentage(0)).toBe('0,00%');
    });

    it('should handle multiplyBy100 parameter', () => {
      expect(formatPercentage(0.45, true)).toBe('45,00%');
      expect(formatPercentage(0.455, true)).toBe('45,50%');
      expect(formatPercentage(1, true)).toBe('100,00%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-20)).toBe('-20,00%');
      expect(formatPercentage(-0.2, true)).toBe('-20,00%');
    });

    it('should handle decimal precision', () => {
      expect(formatPercentage(45.123)).toBe('45,12%');
      expect(formatPercentage(45.456)).toBe('45,46%');
      expect(formatPercentage(45.999)).toBe('46,00%');
    });

    it('should handle null and undefined values', () => {
      expect(formatPercentage(null)).toBe('N/A');
      expect(formatPercentage(undefined)).toBe('N/A');
      expect(formatPercentage(NaN)).toBe('N/A');
    });

    it('should handle large percentages', () => {
      expect(formatPercentage(150)).toBe('150,00%');
      expect(formatPercentage(1000)).toBe('1.000,00%');
      expect(formatPercentage(10, true)).toBe('1.000,00%');
    });
  });

  describe('formatDays', () => {
    it('should format whole number days without decimals', () => {
      expect(formatDays(30)).toBe('30 dias');
      expect(formatDays(45)).toBe('45 dias');
      expect(formatDays(365)).toBe('365 dias');
    });

    it('should format decimal days with one decimal place', () => {
      expect(formatDays(30.5)).toBe('30,5 dias');
      expect(formatDays(45.1)).toBe('45,1 dias');
      expect(formatDays(45.123)).toBe('45,1 dias');
    });

    it('should round to nearest decimal', () => {
      expect(formatDays(30.14)).toBe('30,1 dias');
      expect(formatDays(30.15)).toBe('30,2 dias');
      expect(formatDays(30.95)).toBe('31 dias');
    });

    it('should handle negative days', () => {
      expect(formatDays(-30)).toBe('-30 dias');
      expect(formatDays(-45.5)).toBe('-45,5 dias');
    });

    it('should handle null and undefined values', () => {
      expect(formatDays(null)).toBe('N/A');
      expect(formatDays(undefined)).toBe('N/A');
      expect(formatDays(NaN)).toBe('N/A');
    });

    it('should handle zero days', () => {
      expect(formatDays(0)).toBe('0 dias');
      expect(formatDays(0.0)).toBe('0 dias');
    });

    it('should handle very large numbers', () => {
      expect(formatDays(1000)).toBe('1.000 dias');
      expect(formatDays(1500.5)).toBe('1.500,5 dias');
    });
  });

  describe('getMovementClass', () => {
    it('should return green class for positive values', () => {
      expect(getMovementClass(100)).toBe('text-green-600 print:text-green-700');
      expect(getMovementClass(0.01)).toBe('text-green-600 print:text-green-700');
    });

    it('should return red class for negative values', () => {
      expect(getMovementClass(-100)).toBe('text-red-600 print:text-red-700');
      expect(getMovementClass(-0.01)).toBe('text-red-600 print:text-red-700');
    });

    it('should return neutral class for zero or invalid values', () => {
      expect(getMovementClass(0)).toBe('text-slate-500 print:text-gray-600');
      expect(getMovementClass(null)).toBe('text-slate-500 print:text-gray-600');
      expect(getMovementClass(undefined)).toBe('text-slate-500 print:text-gray-600');
      expect(getMovementClass(NaN)).toBe('text-slate-500 print:text-gray-600');
    });

    it('should handle string numbers', () => {
      expect(getMovementClass('100')).toBe('text-green-600 print:text-green-700');
      expect(getMovementClass('-100')).toBe('text-red-600 print:text-red-700');
      expect(getMovementClass('0')).toBe('text-slate-500 print:text-gray-600');
    });
  });

  describe('getMovementIndicator', () => {
    it('should return up arrow for positive values', () => {
      expect(getMovementIndicator(100)).toBe('▲');
      expect(getMovementIndicator(0.01)).toBe('▲');
    });

    it('should return down arrow for negative values', () => {
      expect(getMovementIndicator(-100)).toBe('▼');
      expect(getMovementIndicator(-0.01)).toBe('▼');
    });

    it('should return empty string for zero or invalid values', () => {
      expect(getMovementIndicator(0)).toBe('');
      expect(getMovementIndicator(null)).toBe('');
      expect(getMovementIndicator(undefined)).toBe('');
      expect(getMovementIndicator(NaN)).toBe('');
    });
  });

  describe('formatMovement', () => {
    it('should format currency movements by default', () => {
      expect(formatMovement(1000)).toBe('1.000,00');
      expect(formatMovement(1_000_000)).toBe('1,00 mi');
      expect(formatMovement(-500)).toBe('-500,00');
    });

    it('should format percentage points', () => {
      expect(formatMovement(2.5, 'percentage_points')).toBe('2,50 p.p.');
      expect(formatMovement(-1.25, 'percentage_points')).toBe('-1,25 p.p.');
      expect(formatMovement(0, 'percentage_points')).toBe('0,00 p.p.');
    });

    it('should format days movements', () => {
      expect(formatMovement(5, 'days')).toBe('5');
      expect(formatMovement(5.5, 'days')).toBe('5,5');
      expect(formatMovement(-3.1, 'days')).toBe('-3,1');
    });

    it('should format percentage changes', () => {
      expect(formatMovement(10, 'percentage_change')).toBe('10,00%');
      expect(formatMovement(-5.5, 'percentage_change')).toBe('-5,50%');
    });

    it('should handle isPercentContext parameter', () => {
      expect(formatMovement(2.5, 'value', true)).toBe('2,50 p.p.');
      expect(formatMovement(2.5, 'anything', true)).toBe('2,50 p.p.');
    });

    it('should handle null and undefined values', () => {
      expect(formatMovement(null)).toBe('N/A');
      expect(formatMovement(undefined)).toBe('N/A');
      expect(formatMovement(NaN)).toBe('N/A');
    });

    it('should handle edge cases', () => {
      expect(formatMovement(0)).toBe('0,00');
      expect(formatMovement('1000')).toBe('1.000,00');
      expect(formatMovement(0.005, 'percentage_points')).toBe('0,01 p.p.');
    });
  });

  describe('Locale-specific formatting', () => {
    it('should use Brazilian Portuguese number formatting', () => {
      // Decimal separator should be comma
      expect(formatCurrency(1234.56)).toContain(',56');
      expect(formatPercentage(45.5)).toContain(',50');
      expect(formatDays(30.5)).toContain(',5');
      
      // Thousand separator should be dot
      expect(formatCurrency(1000)).toContain('1.000');
      expect(formatPercentage(1000)).toContain('1.000');
      expect(formatDays(1000)).toContain('1.000');
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('R$ 0,01');
      expect(formatCurrency(0.001)).toBe('R$ 0,00');
      expect(formatPercentage(0.01)).toBe('0,01%');
    });

    it('should handle infinity', () => {
      expect(formatCurrency(Infinity)).toBe('N/A');
      expect(formatCurrency(-Infinity)).toBe('N/A');
      expect(formatPercentage(Infinity)).toBe('N/A');
      expect(formatDays(Infinity)).toBe('N/A');
    });

    it('should handle scientific notation', () => {
      expect(formatCurrency(1e6)).toBe('R$ 1,00 mi');
      expect(formatCurrency(1e9)).toBe('R$ 1,00 bi');
      expect(formatCurrency(1e12)).toBe('R$ 1,00 tri');
    });

    it('should maintain precision for financial calculations', () => {
      // Test that rounding is consistent
      expect(formatCurrency(0.005)).toBe('R$ 0,01');
      expect(formatCurrency(0.004)).toBe('R$ 0,00');
      expect(formatCurrency(1.995)).toBe('R$ 2,00');
    });
  });
});