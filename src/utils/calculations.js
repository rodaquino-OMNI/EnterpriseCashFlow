// src/utils/calculations.js
import { PERIOD_TYPES } from './constants';

// This function will be called by the Web Worker.
// It takes the raw input for all periods and the periodType.
export function processFinancialData(periodsInputDataRaw, periodTypeLabel) {
  if (!periodsInputDataRaw || periodsInputDataRaw.length === 0) {
    return [];
  }

  let previousPeriodCalculated = null;
  const daysInPeriod = PERIOD_TYPES[periodTypeLabel]?.days || 365;

  const calculatedDataAllPeriods = periodsInputDataRaw.map((periodInput, periodIndex) => {
    // --- P&L Reconstruction ---
    const revenue = periodInput.revenue || 0;
    const grossMarginPercentage = (periodInput.grossMarginPercentage || 0) / 100;
    const operatingExpenses = periodInput.operatingExpenses || 0;
    const depreciationAndAmortisation = periodInput.depreciationAndAmortisation || 0;
    const netInterestExpenseIncome = periodInput.netInterestExpenseIncome || 0;
    const incomeTaxRatePercentage = (periodInput.incomeTaxRatePercentage || 0) / 100;
    const dividendsPaid = periodInput.dividendsPaid || 0;
    const extraordinaryItems = periodInput.extraordinaryItems || 0;
    const capitalExpenditures = periodInput.capitalExpenditures || 0;

    const cogs = revenue * (1 - grossMarginPercentage);
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - operatingExpenses;
    const ebit = ebitda - depreciationAndAmortisation; // Operating Profit
    const pbt = ebit + netInterestExpenseIncome + extraordinaryItems;
    const incomeTax = pbt > 0 ? pbt * incomeTaxRatePercentage : 0;
    const netProfit = pbt - incomeTax;
    const retainedProfit = netProfit - dividendsPaid;

    // --- Balance Sheet & WC Inputs/Derivations ---
    const accountsReceivableValueAvg = periodInput.accountsReceivableValueAvg || 0;
    const inventoryValueAvg = periodInput.inventoryValueAvg || 0; // Updated to use inventoryValueAvg as input
    const accountsPayableValueAvg = periodInput.accountsPayableValueAvg || 0;
    const netFixedAssets = periodInput.netFixedAssets || 0;
    const totalBankLoans = periodInput.totalBankLoans || 0;

    // Derive Days from Average Values
    const arDaysDerived = revenue > 0 ? (accountsReceivableValueAvg / revenue) * daysInPeriod : 0;
    const inventoryDaysDerived = cogs > 0 ? (inventoryValueAvg / cogs) * daysInPeriod : 0; // Updated to calculate inventoryDaysDerived
    const apDaysDerived = cogs > 0 ? (accountsPayableValueAvg / cogs) * daysInPeriod : 0;

    const workingCapitalValue = accountsReceivableValueAvg + inventoryValueAvg - accountsPayableValueAvg;
    const wcDays = arDaysDerived + inventoryDaysDerived - apDaysDerived;

    // --- Cash Flow Analysis ---
    const openingCashForPeriod = periodIndex === 0
      ? (periodInput.openingCash || 0)
      : (previousPeriodCalculated?.closingCash || 0);

    const operatingCashFlow = netProfit + depreciationAndAmortisation;
    const workingCapitalChange = previousPeriodCalculated
      ? workingCapitalValue - previousPeriodCalculated.workingCapitalValue
      : workingCapitalValue - 0; // Assume initial WC was 0 or this period's value if no prev.
    // For a true "change", the first period's change is often vs an implied prior state or is 0.
    // For simplicity here, first period change is its own WC level from zero.
    // A more accurate first period WC change would require opening BS WC items.

    const cashFromOpsAfterWC = operatingCashFlow - workingCapitalChange; // Investment in WC reduces cash
    const netCashFlowBeforeFinancing = cashFromOpsAfterWC - capitalExpenditures;

    const changeInDebt = previousPeriodCalculated
      ? totalBankLoans - previousPeriodCalculated.totalBankLoans
      : totalBankLoans - 0; // Assume initial debt was 0 if no prev period or specific opening debt input.
    const cashFlowFromFinancing = changeInDebt - dividendsPaid;

    const netChangeInCash = netCashFlowBeforeFinancing + cashFlowFromFinancing;
    const closingCash = openingCashForPeriod + netChangeInCash;

    // --- Balance Sheet Reconstruction (using derived closingCash) ---
    const estimatedCurrentAssets = closingCash + accountsReceivableValueAvg + inventoryValueAvg; // Updated to use inventoryValueAvg
    const estimatedTotalAssets = estimatedCurrentAssets + netFixedAssets;

    let currentPeriodEquity;
    if (periodIndex === 0) {
      currentPeriodEquity = (periodInput.initialEquity || 0) + retainedProfit;
    } else {
      currentPeriodEquity = (previousPeriodCalculated?.equity || 0) + retainedProfit;
    }

    // Simplified liabilities for balance difference calculation
    const estimatedCurrentLiabilities = accountsPayableValueAvg; // Highly simplified, missing current portion of debt, other accruals
    const estimatedNonCurrentLiabilities = totalBankLoans; // Assuming all loans are non-current for simplicity here.
    const estimatedTotalLiabilities = estimatedCurrentLiabilities + estimatedNonCurrentLiabilities;

    const balanceSheetDifference = estimatedTotalAssets - (estimatedTotalLiabilities + currentPeriodEquity);

    // --- Enhanced Working Capital Analysis ---
    const arPer100Revenue = revenue ? (accountsReceivableValueAvg / revenue) * 100 : 0;
    const inventoryPer100Revenue = revenue ? (inventoryValueAvg / revenue) * 100 : 0; // Updated to use inventoryValueAvg
    const apPer100Revenue = revenue ? (accountsPayableValueAvg / cogs) * 100 : 0; // AP usually vs COGS for consistency with AP days
    const wcPer100Revenue = revenue ? (workingCapitalValue / revenue) * 100 : 0;

    const fundingGapOrSurplus = -(netCashFlowBeforeFinancing); // Positive = Gap (needs funding)

    const currentPeriodResult = {
      // Original Inputs (useful for display & AI context)
      ...periodInput,

      // P&L Calculated
      revenue, cogs, grossProfit, gmPct: grossMarginPercentage * 100,
      operatingExpenses, ebitda, depreciationAndAmortisation, ebit, opProfitPct: revenue ? (ebit / revenue) * 100 : 0,
      netInterestExpenseIncome, extraordinaryItems, pbt, incomeTaxRatePercentageActual: incomeTaxRatePercentage,
      incomeTax, netProfit, netProfitPct: revenue ? (netProfit / revenue) * 100 : 0,
      dividendsPaid, retainedProfit, capitalExpenditures,

      // Balance Sheet & WC Calculated/Derived
      openingCash: openingCashForPeriod,
      closingCash,
      accountsReceivableValueAvg, // Inputted Avg value
      arDaysDerived,              // Derived AR Days
      inventoryValueAvg,          // Updated to use inventoryValueAvg
      inventoryDaysDerived,       // Updated to calculate inventoryDaysDerived
      accountsPayableValueAvg,    // Inputted Avg value
      apDaysDerived,              // Derived AP Days
      wcDays,                     // Derived WC Days

      estimatedCurrentAssets, netFixedAssets, estimatedTotalAssets,
      totalBankLoans, // Input (ending balance)
      estimatedCurrentLiabilities, // Simplified
      estimatedNonCurrentLiabilities, // Simplified
      estimatedTotalLiabilities, // Simplified
      equity: currentPeriodEquity, balanceSheetDifference,

      // Working Capital Analysis
      workingCapitalValue, workingCapitalChange,
      arPer100Revenue, inventoryPer100Revenue, apPer100Revenue, wcPer100Revenue,

      // Cash Flow Analysis
      operatingCashFlow, cashFromOpsAfterWC, netCashFlowBeforeFinancing,
      changeInDebt, cashFlowFromFinancing, netChangeInCash, fundingGapOrSurplus,
    };
    previousPeriodCalculated = currentPeriodResult;
    return currentPeriodResult;

  });
  return calculatedDataAllPeriods;
}