// src/utils/dataConsistencyValidator.js
import { formatCurrency, formatDays } from './formatters'; // Assuming formatters are in utils

/**
 * @typedef {Object} ConsistencyIssue
 * @property {string} type - Machine-readable issue type
 * @property {string} periodLabel - User-friendly period label
 * @property {string} message - User-friendly message
 * @property {any} [expected] - Expected value for context
 * @property {any} [actual] - Actual value for context
 * @property {'CRITICAL_ERROR' | 'WARNING' | 'INFO'} severity - Severity of the issue
 */

/**
 * Performs internal consistency checks on a single period's calculated data
 * to ensure the SSOT object itself is internally coherent.
 * @param {import('../types/financial').CalculatedPeriodData} periodData
 * @param {string} periodLabel
 * @returns {ConsistencyIssue[]}
 */
export function validateInternalSSOTConsistency(periodData, periodLabel) {
  /** @type {ConsistencyIssue[]} */
  const issues = [];
  const tolerance = 0.015; // For floating point comparisons

  if (!periodData) return issues;

  // 1. Validate Working Capital Value against its components
  const calculatedWCValueFromComponents = 
    (periodData.accountsReceivableValueAvg || 0) + 
    (periodData.inventoryValueAvg || 0) - // This is inventoryValueAvg (input)
    (periodData.accountsPayableValueAvg || 0);
  if (Math.abs(calculatedWCValueFromComponents - (periodData.workingCapitalValue || 0)) > tolerance) {
    issues.push({
      type: 'SSOT_WC_VALUE', periodLabel, severity: 'CRITICAL_ERROR',
      message: `SSOT - Valor do Capital de Giro inconsistente. Componentes: ${formatCurrency(calculatedWCValueFromComponents)}, Armazenado: ${formatCurrency(periodData.workingCapitalValue)}`,
      expected: calculatedWCValueFromComponents, actual: periodData.workingCapitalValue,
    });
  }

  // 2. Validate WC Days (Cash Conversion Cycle) against its components
  // The periodData.arDays, .invDays, .apDays should be the derived days
  const calculatedWCDaysFromComponents = 
    (periodData.arDays || 0) + 
    (periodData.invDays || 0) - 
    (periodData.apDays || 0);
  if (Math.abs(calculatedWCDaysFromComponents - (periodData.wcDays || 0)) > 0.1) { 
    issues.push({
      type: 'SSOT_WC_DAYS', periodLabel, severity: 'CRITICAL_ERROR',
      message: `SSOT - Ciclo de Caixa (WC Days) inconsistente. Componentes: ${formatDays(calculatedWCDaysFromComponents)}, Armazenado: ${formatDays(periodData.wcDays)}`,
      expected: calculatedWCDaysFromComponents, actual: periodData.wcDays,
    });
  }
  
  // 3. Validate Balance Sheet Equation (A = L + E + Diff) using stored SSOT values
  const assets = periodData.estimatedTotalAssets || 0;
  const liabilities = periodData.estimatedTotalLiabilities || 0;
  const equity = periodData.equity || 0;
  const storedDifference = periodData.balanceSheetDifference || 0;
  
  if (Math.abs(assets - (liabilities + equity) - storedDifference) > tolerance) {
    issues.push({
      type: 'SSOT_BS_EQUATION', periodLabel, severity: 'CRITICAL_ERROR',
      message: `SSOT - Equação do Balanço (A = L + E + Diff) não fecha com valores armazenados. A:${formatCurrency(assets)}, L:${formatCurrency(liabilities)}, E:${formatCurrency(equity)}, Diff Armazenada:${formatCurrency(storedDifference)}. Cálculo (A-(L+E)): ${formatCurrency(assets - (liabilities + equity))}`,
    });
  }

  // 4. Validate Cash Flow Reconciliation (Closing Cash) using SSOT values
  const openingCash = periodData.calculatedOpeningCash || 0; 
  const netChange = periodData.netChangeInCash || 0;
  const dfcCalculatedClosingCash = openingCash + netChange;
  if (Math.abs(dfcCalculatedClosingCash - (periodData.closingCash || 0)) > tolerance) {
    issues.push({
      type: 'SSOT_CASH_RECONCILIATION', periodLabel, severity: 'CRITICAL_ERROR',
      message: `SSOT - Reconciliação de Caixa Final inconsistente. Calculado DFC (Abertura+Variação): ${formatCurrency(dfcCalculatedClosingCash)}, Caixa Final Armazenado: ${formatCurrency(periodData.closingCash)}`,
      expected: dfcCalculatedClosingCash, actual: periodData.closingCash,
    });
  }
  
  return issues;
}