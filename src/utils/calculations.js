// src/utils/calculations.js
import { PERIOD_TYPES } from './constants.js'; // Assuming constants.js has PERIOD_TYPES

// Helper to parse financial values, defaulting to 0 if input is invalid/missing.
// Ensure this handles various numeric string inputs robustly.
function parseToNumber(value, defaultValue = 0) {
    if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
        return defaultValue;
    }
    // Attempt to remove currency symbols or group separators common in some locales before converting
    const cleanedValue = typeof value === 'string' 
        ? value.replace(/[R$.]/g, '').replace(',', '.') // More robust cleaning for pt-BR
        : value;
    const parsed = Number(cleanedValue);
    return isNaN(parsed) ? defaultValue : parsed;
}


/**
 * Processes financial data ensuring single source of truth.
 * @param {import('../types/financial').PeriodInputData[]} periodsInputDataRaw - Raw input data for each period.
 * @param {import('../types/financial').PeriodTypeOption} periodTypeLabel - The type of period ('anos', 'trimestres', 'meses').
 * @returns {import('../types/financial').CalculatedPeriodData[]} - Array of calculated data for each period.
 */
export function processFinancialData(periodsInputDataRaw, periodTypeLabel) {
  if (!periodsInputDataRaw || periodsInputDataRaw.length === 0) {
    console.warn("processFinancialData called with empty input.");
    return [];
  }

  let previousPeriodCalculated = null;
  const daysInPeriod = PERIOD_TYPES[periodTypeLabel]?.days || 365;

  const calculatedDataAllPeriods = periodsInputDataRaw.map((periodInput, periodIndex) => {
    // === STEP 1: Parse and validate inputs (using parseToNumber for safety) ===
    const revenue = parseToNumber(periodInput.revenue);
    const grossMarginPercentage = parseToNumber(periodInput.grossMarginPercentage, 0) / 100; // Default to 0 if not provided
    const operatingExpenses = parseToNumber(periodInput.operatingExpenses);
    const depreciationAndAmortisation = parseToNumber(periodInput.depreciationAndAmortisation);
    const netInterestExpenseIncome = parseToNumber(periodInput.netInterestExpenseIncome);
    const incomeTaxRatePercentage = parseToNumber(periodInput.incomeTaxRatePercentage, 0) / 100; // Default to 0 if not provided
    const dividendsPaid = parseToNumber(periodInput.dividendsPaid);
    const extraordinaryItems = parseToNumber(periodInput.extraordinaryItems);
    const capitalExpenditures = parseToNumber(periodInput.capitalExpenditures);
    
    const accountsReceivableValueAvg = parseToNumber(periodInput.accountsReceivableValueAvg);
    const inventoryValueAvg = parseToNumber(periodInput.inventoryValueAvg);
    const accountsPayableValueAvg = parseToNumber(periodInput.accountsPayableValueAvg);
    
    const netFixedAssets = parseToNumber(periodInput.netFixedAssets);
    const totalBankLoans = parseToNumber(periodInput.totalBankLoans);
    
    const openingCashInput = periodIndex === 0 ? parseToNumber(periodInput.openingCash) : null; // Only for first period from input
    const initialEquityInput = periodIndex === 0 ? parseToNumber(periodInput.initialEquity) : null; // Only for first period from input

    // === STEP 2: P&L Calculations ===
    const cogs = revenue * (1 - grossMarginPercentage);
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - operatingExpenses;
    const ebit = ebitda - depreciationAndAmortisation;
    const pbt = ebit + netInterestExpenseIncome + extraordinaryItems;
    const incomeTax = pbt > 0 ? pbt * incomeTaxRatePercentage : 0;
    const netProfit = pbt - incomeTax;
    const retainedProfit = netProfit - dividendsPaid;

    // === STEP 3: Working Capital - SINGLE SOURCE CALCULATIONS ===
    const arDaysDerived = revenue > 0 ? (accountsReceivableValueAvg / revenue) * daysInPeriod : 0;
    const inventoryDaysDerived = cogs > 0 ? (inventoryValueAvg / cogs) * daysInPeriod : 0;
    const apDaysDerived = cogs > 0 ? (accountsPayableValueAvg / cogs) * daysInPeriod : 0;
    
    const workingCapitalValue = accountsReceivableValueAvg + inventoryValueAvg - accountsPayableValueAvg;
    const wcDays = arDaysDerived + inventoryDaysDerived - apDaysDerived;

    // === STEP 4: Cash Flow Calculations ===
    const openingCashForPeriod = periodIndex === 0 
      ? (openingCashInput !== null ? openingCashInput : 0) // Use input if provided, else 0 for first period
      : (previousPeriodCalculated?.closingCash || 0);

    const operatingCashFlow = netProfit + depreciationAndAmortisation;
    
    const prevWcValue = previousPeriodCalculated?.workingCapitalValue; // Could be 0 if previousPeriodCalculated is null
    // For the first period, workingCapitalChange is effectively its own workingCapitalValue assuming prior WC was zero or not relevant for "change"
    const workingCapitalChange = (periodIndex === 0 || typeof prevWcValue === 'undefined') 
        ? workingCapitalValue 
        : workingCapitalValue - prevWcValue;
    
    const cashFromOpsAfterWC = operatingCashFlow - workingCapitalChange;
    const netCashFlowBeforeFinancing = cashFromOpsAfterWC - capitalExpenditures;
    
    const prevTotalBankLoans = previousPeriodCalculated?.totalBankLoans;
    const changeInDebt = (periodIndex === 0 || typeof prevTotalBankLoans === 'undefined')
        ? totalBankLoans // If first period, change is the total amount of loans (assuming starting from 0 debt before P1)
        : totalBankLoans - prevTotalBankLoans;
        
    const cashFlowFromFinancing = changeInDebt - dividendsPaid;
    const netChangeInCash = netCashFlowBeforeFinancing + cashFlowFromFinancing;
    const closingCash = openingCashForPeriod + netChangeInCash;

    // === STEP 5: Balance Sheet Calculations ===
    const estimatedCurrentAssets = closingCash + accountsReceivableValueAvg + inventoryValueAvg;
    const estimatedTotalAssets = estimatedCurrentAssets + netFixedAssets;
    
    // Liabilities are simplified in this model based on direct inputs for AP_Avg and TotalLoans
    const estimatedCurrentLiabilities = accountsPayableValueAvg; 
    const estimatedNonCurrentLiabilities = totalBankLoans; // Assuming all loans are non-current if not split
    const estimatedTotalLiabilities = estimatedCurrentLiabilities + estimatedNonCurrentLiabilities;
    
    const equity = periodIndex === 0 
      ? (initialEquityInput !== null ? initialEquityInput : 0) + retainedProfit // Use input if provided, else 0 for first period
      : (previousPeriodCalculated?.equity || 0) + retainedProfit;
    
    const balanceSheetDifference = estimatedTotalAssets - (estimatedTotalLiabilities + equity);

    // === STEP 6: Create SINGLE SOURCE OF TRUTH object ===
    const currentPeriodResult = {
      // Original inputs (parsed and stored)
      revenue: periodInput.revenue, grossMarginPercentage: periodInput.grossMarginPercentage,
      operatingExpenses: periodInput.operatingExpenses, depreciationAndAmortisation: periodInput.depreciationAndAmortisation,
      netInterestExpenseIncome: periodInput.netInterestExpenseIncome, incomeTaxRatePercentage: periodInput.incomeTaxRatePercentage,
      dividendsPaid: periodInput.dividendsPaid, extraordinaryItems: periodInput.extraordinaryItems,
      capitalExpenditures: periodInput.capitalExpenditures, 
      openingCash: periodInput.openingCash, // Original input for P0
      accountsReceivableValueAvg: periodInput.accountsReceivableValueAvg,
      inventoryValueAvg: periodInput.inventoryValueAvg,
      accountsPayableValueAvg: periodInput.accountsPayableValueAvg,
      netFixedAssets: periodInput.netFixedAssets,
      totalBankLoans: periodInput.totalBankLoans,
      initialEquity: periodInput.initialEquity, // Original input for P0
      
      // P&L Final Values
      cogs, grossProfit, 
      gmPct: grossMarginPercentage * 100, // Using input percentage directly for gmPct
      ebitda, ebit,
      opProfitPct: revenue ? (ebit / revenue) * 100 : 0,
      pbt,
      incomeTaxRatePercentageActual: incomeTaxRatePercentage, // Storing the rate used
      incomeTax, netProfit, 
      netProfitPct: revenue ? (netProfit / revenue) * 100 : 0,
      retainedProfit,

      // Working Capital SSOT Values
      arDaysDerived, inventoryDaysDerived, apDaysDerived,
      workingCapitalValue, wcDays, workingCapitalChange,

      // Cash Flow SSOT Values
      calculatedOpeningCash: openingCashForPeriod, // The opening cash actually used in calculation
      closingCash, operatingCashFlow, cashFromOpsAfterWC, 
      netCashFlowBeforeFinancing, changeInDebt, cashFlowFromFinancing, netChangeInCash,

      // Balance Sheet SSOT Values
      estimatedCurrentAssets, estimatedTotalAssets,
      estimatedCurrentLiabilities, // Simplified based on AP_Avg
      estimatedNonCurrentLiabilities, // Simplified based on TotalLoans
      estimatedTotalLiabilities,
      equity, balanceSheetDifference,

      // Ratios & Other KPIs
      arPer100Revenue: revenue ? (accountsReceivableValueAvg / revenue) * 100 : 0,
      inventoryPer100Revenue: revenue ? (inventoryValueAvg / revenue) * 100 : 0,
      apPer100Revenue: cogs ? (accountsPayableValueAvg / cogs) * 100 : 0, // More standard to use COGS for AP ratio
      wcPer100Revenue: revenue ? (workingCapitalValue / revenue) * 100 : 0,
      fundingGapOrSurplus: -netCashFlowBeforeFinancing,

      // ALIAS FIELDS FOR CHARTS & KPIs (standardized names from SSOT)
      arDays: arDaysDerived,
      invDays: inventoryDaysDerived,
      apDays: apDaysDerived,
      // wcDays is already correctly named and calculated
    };

    previousPeriodCalculated = currentPeriodResult;
    return currentPeriodResult;
  });

  return calculatedDataAllPeriods;
}