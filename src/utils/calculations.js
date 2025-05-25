// src/utils/calculations.js
import { PERIOD_TYPES } from './constants.js';

/**
 * Processes financial data for multiple periods.
 * @param {import('../types/financial').PeriodInputData[]} periodsInputDataRaw - Raw input data for each period.
 * @param {import('../types/financial').PeriodTypeOption} periodTypeLabel - The type of period ('anos', 'trimestres', 'meses').
 * @returns {import('../types/financial').CalculatedPeriodData[]} - Array of calculated data for each period.
 */
export function processFinancialData(periodsInputDataRaw, periodTypeLabel) {
  if (!periodsInputDataRaw || periodsInputDataRaw.length === 0) {
    console.warn("processFinancialData called with empty or null input.");
    return [];
  }

  let previousPeriodCalculated = null;
  const daysInPeriod = PERIOD_TYPES[periodTypeLabel]?.days || 365;

  const calculatedDataAllPeriods = periodsInputDataRaw.map((periodInput, periodIndex) => {
    // --- P&L Inputs & Initial Processing ---
    const revenue = periodInput.revenue === null || typeof periodInput.revenue === 'undefined' ? 0 : Number(periodInput.revenue);
    const grossMarginPercentageInput = (periodInput.grossMarginPercentage === null || typeof periodInput.grossMarginPercentage === 'undefined' ? 0 : Number(periodInput.grossMarginPercentage)) / 100;
    const operatingExpenses = periodInput.operatingExpenses === null || typeof periodInput.operatingExpenses === 'undefined' ? 0 : Number(periodInput.operatingExpenses);
    const depreciationAndAmortisation = periodInput.depreciationAndAmortisation === null || typeof periodInput.depreciationAndAmortisation === 'undefined' ? 0 : Number(periodInput.depreciationAndAmortisation);
    const netInterestExpenseIncome = periodInput.netInterestExpenseIncome === null || typeof periodInput.netInterestExpenseIncome === 'undefined' ? 0 : Number(periodInput.netInterestExpenseIncome);
    const incomeTaxRatePercentageInput = (periodInput.incomeTaxRatePercentage === null || typeof periodInput.incomeTaxRatePercentage === 'undefined' ? 0 : Number(periodInput.incomeTaxRatePercentage)) / 100;
    const dividendsPaid = periodInput.dividendsPaid === null || typeof periodInput.dividendsPaid === 'undefined' ? 0 : Number(periodInput.dividendsPaid);
    const extraordinaryItems = periodInput.extraordinaryItems === null || typeof periodInput.extraordinaryItems === 'undefined' ? 0 : Number(periodInput.extraordinaryItems);
    const capitalExpenditures = periodInput.capitalExpenditures === null || typeof periodInput.capitalExpenditures === 'undefined' ? 0 : Number(periodInput.capitalExpenditures);

    // --- P&L Reconstruction ---
    const cogs = revenue * (1 - grossMarginPercentageInput);
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - operatingExpenses;
    const ebit = ebitda - depreciationAndAmortisation;
    const pbt = ebit + netInterestExpenseIncome + extraordinaryItems;
    const incomeTax = pbt > 0 ? pbt * incomeTaxRatePercentageInput : 0;
    const netProfit = pbt - incomeTax;
    const retainedProfit = netProfit - dividendsPaid;

    // --- Balance Sheet & WC Inputs ---
    const accountsReceivableValueAvg = periodInput.accountsReceivableValueAvg === null || typeof periodInput.accountsReceivableValueAvg === 'undefined' ? 0 : Number(periodInput.accountsReceivableValueAvg);
    const inventoryValueAvg = periodInput.inventoryValueAvg === null || typeof periodInput.inventoryValueAvg === 'undefined' ? 0 : Number(periodInput.inventoryValueAvg);
    const accountsPayableValueAvg = periodInput.accountsPayableValueAvg === null || typeof periodInput.accountsPayableValueAvg === 'undefined' ? 0 : Number(periodInput.accountsPayableValueAvg);
    const netFixedAssets = periodInput.netFixedAssets === null || typeof periodInput.netFixedAssets === 'undefined' ? 0 : Number(periodInput.netFixedAssets);
    const totalBankLoans = periodInput.totalBankLoans === null || typeof periodInput.totalBankLoans === 'undefined' ? 0 : Number(periodInput.totalBankLoans);

    // --- Derive Days & Inventory Value (for BS) ---
    const arDaysDerived = revenue > 0 ? (accountsReceivableValueAvg / revenue) * daysInPeriod : 0;
    const inventoryDaysDerived = cogs > 0 ? (inventoryValueAvg / cogs) * daysInPeriod : 0;
    const apDaysDerived = cogs > 0 ? (accountsPayableValueAvg / cogs) * daysInPeriod : 0;
    
    // The inventoryValue for BS and WC calculations IS the inventoryValueAvg input.
    const inventoryValueForBalanceSheetAndWC = inventoryValueAvg;
    
    const workingCapitalValue = accountsReceivableValueAvg + inventoryValueForBalanceSheetAndWC - accountsPayableValueAvg;
    const wcDays = arDaysDerived + inventoryDaysDerived - apDaysDerived;

    // --- Cash Flow Analysis ---
    const openingCashForPeriod = periodIndex === 0 ? 
      (periodInput.openingCash === null || typeof periodInput.openingCash === 'undefined' ? 0 : Number(periodInput.openingCash)) : 
      (previousPeriodCalculated?.closingCash || 0);

    const operatingCashFlow = netProfit + depreciationAndAmortisation;
    const prevWcValue = previousPeriodCalculated?.workingCapitalValue;
    const workingCapitalChange = (prevWcValue !== null && typeof prevWcValue !== 'undefined') ? 
      workingCapitalValue - prevWcValue : workingCapitalValue;
    const cashFromOpsAfterWC = operatingCashFlow - workingCapitalChange;
    const netCashFlowBeforeFinancing = cashFromOpsAfterWC - capitalExpenditures;
    const prevTotalBankLoans = previousPeriodCalculated?.totalBankLoans;
    const changeInDebt = (prevTotalBankLoans !== null && typeof prevTotalBankLoans !== 'undefined') ? 
      totalBankLoans - prevTotalBankLoans : totalBankLoans;
    const cashFlowFromFinancing = changeInDebt - dividendsPaid;
    const netChangeInCash = netCashFlowBeforeFinancing + cashFlowFromFinancing;
    const closingCash = openingCashForPeriod + netChangeInCash;

    // --- Balance Sheet FINAL Reconstruction & Difference (using definitive values) ---
    const finalEstimatedCurrentAssets = closingCash + accountsReceivableValueAvg + inventoryValueForBalanceSheetAndWC;
    const finalEstimatedTotalAssets = finalEstimatedCurrentAssets + netFixedAssets;

    let finalEquity;
    if (periodIndex === 0) {
      finalEquity = (periodInput.initialEquity === null || typeof periodInput.initialEquity === 'undefined' ? 0 : Number(periodInput.initialEquity)) + retainedProfit;
    } else {
      finalEquity = (previousPeriodCalculated?.equity || 0) + retainedProfit;
    }

    // Liabilities remain simplified for this model based on inputs
    const finalEstimatedCurrentLiabilities = accountsPayableValueAvg;
    const finalEstimatedNonCurrentLiabilities = totalBankLoans;
    const finalEstimatedTotalLiabilities = finalEstimatedCurrentLiabilities + finalEstimatedNonCurrentLiabilities;

    // CRITICAL: Calculate balanceSheetDifference using these final derived/input BS figures for THIS period
    const finalBalanceSheetDifference = finalEstimatedTotalAssets - (finalEstimatedTotalLiabilities + finalEquity);

    // --- Other Analyses ---
    const arPer100Revenue = revenue ? (accountsReceivableValueAvg / revenue) * 100 : 0;
    const inventoryPer100Revenue = revenue ? (inventoryValueForBalanceSheetAndWC / revenue) * 100 : 0;
    const apPer100Revenue = cogs ? (accountsPayableValueAvg / cogs) * 100 : 0;
    const wcPer100Revenue = revenue ? (workingCapitalValue / revenue) * 100 : 0;
    const fundingGapOrSurplus = -(netCashFlowBeforeFinancing);

    const currentPeriodResult = {
      // Original Inputs
      ...periodInput,

      // P&L Calculated
      revenue,
      cogs,
      grossProfit,
      gmPct: grossMarginPercentageInput * 100,
      operatingExpenses,
      ebitda,
      depreciationAndAmortisation,
      ebit,
      opProfitPct: revenue ? (ebit / revenue) * 100 : 0,
      netInterestExpenseIncome,
      extraordinaryItems,
      pbt,
      incomeTaxRatePercentageActual: incomeTaxRatePercentageInput,
      incomeTax,
      netProfit,
      netProfitPct: revenue ? (netProfit / revenue) * 100 : 0,
      dividendsPaid,
      retainedProfit,
      capitalExpenditures,

      // Balance Sheet & WC Calculated/Derived
      openingCash: openingCashForPeriod,
      closingCash,
      
      accountsReceivableValueAvg, // Input
      arDaysDerived, // Derived
      
      inventoryValueAvg, // Input
      inventoryDaysDerived, // Derived
      inventoryValue: inventoryValueForBalanceSheetAndWC, // This is inventoryValueAvg
      
      accountsPayableValueAvg, // Input
      apDaysDerived, // Derived
      
      wcDays, // Derived using all derived days

      // Use FINAL BS figures
      estimatedCurrentAssets: finalEstimatedCurrentAssets,
      netFixedAssets,
      estimatedTotalAssets: finalEstimatedTotalAssets,
      totalBankLoans,
      estimatedCurrentLiabilities: finalEstimatedCurrentLiabilities,
      estimatedNonCurrentLiabilities: finalEstimatedNonCurrentLiabilities,
      estimatedTotalLiabilities: finalEstimatedTotalLiabilities,
      equity: finalEquity,
      balanceSheetDifference: finalBalanceSheetDifference, // Use the consistently calculated difference

      workingCapitalValue,
      workingCapitalChange,
      arPer100Revenue,
      inventoryPer100Revenue,
      apPer100Revenue,
      wcPer100Revenue,

      operatingCashFlow,
      cashFromOpsAfterWC,
      netCashFlowBeforeFinancing,
      changeInDebt,
      cashFlowFromFinancing,
      netChangeInCash,
      fundingGapOrSurplus,

      // Standardized day outputs for KPIs (all derived now)
      arDays: arDaysDerived,
      invDays: inventoryDaysDerived,
      apDays: apDaysDerived,
    };

    previousPeriodCalculated = currentPeriodResult;
    return currentPeriodResult;
  });

  return calculatedDataAllPeriods;
}