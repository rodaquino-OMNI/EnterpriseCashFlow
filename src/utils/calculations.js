// src/utils/calculations.js
import { PERIOD_TYPES } from './constants.js';
// No direct import of fieldDefinitions here, logic relies on periodInput keys

/**
 * Helper to check if a valid (numeric) override value exists in periodInput.
 * @param {import('../types/financial').PeriodInputData} periodInput
 * @param {string} overrideKey e.g., 'override_cogs'
 * @returns {number | null} The numeric value or null if not a valid override.
 */
function getOverrideValue(periodInput, overrideKey) {
  const value = periodInput[overrideKey];
  if (value !== null && typeof value !== 'undefined' && value !== '' && !isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * Processes financial data for multiple periods with adaptive logic.
 * @param {import('../types/financial').PeriodInputData[]} periodsInputDataRaw
 * @param {import('../types/financial').PeriodTypeOption} periodTypeLabel
 * @returns {import('../types/financial').CalculatedPeriodData[]}
 */
export function processFinancialData(periodsInputDataRaw, periodTypeLabel) {
  if (!periodsInputDataRaw || periodsInputDataRaw.length === 0) {
    return [];
  }

  let previousPeriodCalculated = null;
  const daysInPeriod = PERIOD_TYPES[periodTypeLabel]?.days || 365;

  const calculatedDataAllPeriods = periodsInputDataRaw.map((periodInput, periodIndex) => {
    // --- Get DRIVER Inputs (default to 0 if not provided, for calculation safety) ---
    const revenue_driver = Number(periodInput.revenue || 0);
    const grossMarginPercentage_driver = Number(periodInput.grossMarginPercentage || 0) / 100;
    const operatingExpenses_driver = Number(periodInput.operatingExpenses || 0);
    const depreciationAndAmortisation_driver = Number(periodInput.depreciationAndAmortisation || 0);
    const netInterestExpenseIncome_driver = Number(periodInput.netInterestExpenseIncome || 0);
    const incomeTaxRatePercentage_driver = Number(periodInput.incomeTaxRatePercentage || 0) / 100;
    const dividendsPaid_driver = Number(periodInput.dividendsPaid || 0);
    const extraordinaryItems_driver = Number(periodInput.extraordinaryItems || 0);
    const capitalExpenditures_driver = Number(periodInput.capitalExpenditures || 0);
    
    const accountsReceivableValueAvg_driver = Number(periodInput.accountsReceivableValueAvg || 0);
    const inventoryValueAvg_driver = Number(periodInput.inventoryValueAvg || 0);
    const accountsPayableValueAvg_driver = Number(periodInput.accountsPayableValueAvg || 0);
    const netFixedAssets_driver = Number(periodInput.netFixedAssets || 0);
    const totalBankLoans_driver = Number(periodInput.totalBankLoans || 0);
    const openingCash_driver = periodIndex === 0 ? Number(periodInput.openingCash || 0) : (previousPeriodCalculated?.closingCash || 0);
    const initialEquity_driver = periodIndex === 0 ? Number(periodInput.initialEquity || 0) : (previousPeriodCalculated?.equity || 0);


    // --- P&L Reconstruction with Overrides ---
    const revenue = revenue_driver; // Revenue is always a primary driver

    let cogs = getOverrideValue(periodInput, 'override_cogs');
    if (cogs === null) {
      cogs = revenue * (1 - grossMarginPercentage_driver);
    }

    let grossProfit = getOverrideValue(periodInput, 'override_grossProfit');
    if (grossProfit === null) {
      grossProfit = revenue - cogs; // Uses potentially overridden cogs
    }

    let ebitda = getOverrideValue(periodInput, 'override_ebitda');
    if (ebitda === null) {
      ebitda = grossProfit - operatingExpenses_driver; // Uses potentially overridden grossProfit
    }

    let ebit = getOverrideValue(periodInput, 'override_ebit');
    if (ebit === null) {
      ebit = ebitda - depreciationAndAmortisation_driver; // Uses potentially overridden ebitda
    }

    let pbt = getOverrideValue(periodInput, 'override_pbt');
    if (pbt === null) {
        pbt = ebit + netInterestExpenseIncome_driver + extraordinaryItems_driver; // Uses potentially overridden ebit
    }
    
    let incomeTax = getOverrideValue(periodInput, 'override_incomeTax');
    if (incomeTax === null) {
        incomeTax = pbt > 0 ? pbt * incomeTaxRatePercentage_driver : 0; // Uses potentially overridden pbt
    }

    let netProfit = getOverrideValue(periodInput, 'override_netProfit');
    if (netProfit === null) {
      netProfit = pbt - incomeTax; // Uses potentially overridden pbt and incomeTax
    }
    
    const retainedProfit = netProfit - dividendsPaid_driver; // Uses potentially overridden netProfit

    // --- WORKING CAPITAL DAYS (Always derived from average value inputs) ---
    const arDaysDerived = revenue > 0 ? (accountsReceivableValueAvg_driver / revenue) * daysInPeriod : 0;
    const inventoryDaysDerived = cogs > 0 ? (inventoryValueAvg_driver / cogs) * daysInPeriod : 0;
    const apDaysDerived = cogs > 0 ? (accountsPayableValueAvg_driver / cogs) * daysInPeriod : 0;
    const wcDays = arDaysDerived + inventoryDaysDerived - apDaysDerived;

    // --- WORKING CAPITAL VALUE (Always from average value inputs) ---
    const workingCapitalValue = accountsReceivableValueAvg_driver + inventoryValueAvg_driver - accountsPayableValueAvg_driver;

    // --- CASH FLOW ANALYSIS (Uses final P&L values, driver-based WC values, and input CAPEX) ---
    let operatingCashFlow = getOverrideValue(periodInput, 'override_operatingCashFlow');
    if (operatingCashFlow === null) {
      operatingCashFlow = netProfit + depreciationAndAmortisation_driver;
    }

    const prevWcValue = previousPeriodCalculated?.workingCapitalValue; // Uses WC value from previous period
    let workingCapitalChange = getOverrideValue(periodInput, 'override_workingCapitalChange');
    if (workingCapitalChange === null) {
        workingCapitalChange = (prevWcValue !== null && typeof prevWcValue !== 'undefined') 
            ? workingCapitalValue - prevWcValue 
            : workingCapitalValue;
    }
    
    const cashFromOpsAfterWC = operatingCashFlow - workingCapitalChange;
    const netCashFlowBeforeFinancing = cashFromOpsAfterWC - capitalExpenditures_driver;
    
    const prevTotalBankLoans = previousPeriodCalculated?.totalBankLoans; // Uses totalBankLoans from previous period
    const changeInDebt = (prevTotalBankLoans !== null && typeof prevTotalBankLoans !== 'undefined') 
        ? totalBankLoans_driver - prevTotalBankLoans 
        : totalBankLoans_driver; // Assume initial debt if first period
        
    const cashFlowFromFinancing = changeInDebt - dividendsPaid_driver;
    const netChangeInCash = netCashFlowBeforeFinancing + cashFlowFromFinancing;
    
    const calculatedClosingCash = openingCash_driver + netChangeInCash;
    const closingCash = getOverrideValue(periodInput, 'override_closingCash') ?? calculatedClosingCash;
    const cashReconciliationDifference = (getOverrideValue(periodInput, 'override_closingCash') !== null) 
                                       ? closingCash - calculatedClosingCash 
                                       : 0;

    // --- BALANCE SHEET ASSEMBLY (Adaptive - Prioritize Overrides for Ending Balances) ---
    const arValueForBS = getOverrideValue(periodInput, 'override_AR_ending') ?? accountsReceivableValueAvg_driver;
    const inventoryValueForBS = getOverrideValue(periodInput, 'override_Inventory_ending') ?? inventoryValueAvg_driver;
    const accountsPayableValueForBS = getOverrideValue(periodInput, 'override_AP_ending') ?? accountsPayableValueAvg_driver;

    let finalEstimatedCurrentAssets = getOverrideValue(periodInput, 'override_totalCurrentAssets');
    if (finalEstimatedCurrentAssets === null) {
      finalEstimatedCurrentAssets = closingCash + arValueForBS + inventoryValueForBS;
    }

    let finalEstimatedTotalAssets = getOverrideValue(periodInput, 'override_totalAssets');
    if (finalEstimatedTotalAssets === null) {
      finalEstimatedTotalAssets = finalEstimatedCurrentAssets + netFixedAssets_driver;
    }
    
    let finalEquity = getOverrideValue(periodInput, 'override_equity_ending');
    if (finalEquity === null) {
      if (periodIndex === 0) {
        finalEquity = initialEquity_driver + retainedProfit;
      } else {
        finalEquity = (previousPeriodCalculated?.equity || 0) + retainedProfit;
      }
    }

    let finalEstimatedTotalLiabilities = getOverrideValue(periodInput, 'override_totalLiabilities');
    if (finalEstimatedTotalLiabilities === null) {
        const finalEstimatedCurrentLiabilities = getOverrideValue(periodInput, 'override_totalCurrentLiabilities') ?? accountsPayableValueForBS;
        // For simplicity, if totalLiabilities is not overridden, non-current is totalBankLoans
        const finalEstimatedNonCurrentLiabilities = totalBankLoans_driver; 
        finalEstimatedTotalLiabilities = finalEstimatedCurrentLiabilities + finalEstimatedNonCurrentLiabilities;
    }
    
    const finalBalanceSheetDifference = finalEstimatedTotalAssets - (finalEstimatedTotalLiabilities + finalEquity);

    // --- Additional KPIs ---
    const gmPct = revenue ? (grossProfit / revenue) * 100 : 0;
    const opProfitPct = revenue ? (ebit / revenue) * 100 : 0;
    const netProfitPct = revenue ? (netProfit / revenue) * 100 : 0;
    const arPer100Revenue = revenue ? (accountsReceivableValueAvg_driver / revenue) * 100 : 0;
    const inventoryPer100Revenue = revenue ? (inventoryValueAvg_driver / revenue) * 100 : 0;
    const apPer100Revenue = cogs ? (accountsPayableValueAvg_driver / cogs) * 100 : 0;
    const wcPer100Revenue = revenue ? (workingCapitalValue / revenue) * 100 : 0;
    const fundingGapOrSurplus = -(netCashFlowBeforeFinancing);

    const currentPeriodResult = {
      // Store original inputs (as numbers or null)
      revenue: revenue_driver, grossMarginPercentage: periodInput.grossMarginPercentage, 
      operatingExpenses: operatingExpenses_driver, depreciationAndAmortisation: depreciationAndAmortisation_driver,
      netInterestExpenseIncome: netInterestExpenseIncome_driver, incomeTaxRatePercentage: periodInput.incomeTaxRatePercentage,
      dividendsPaid: dividendsPaid_driver, extraordinaryItems: extraordinaryItems_driver, capitalExpenditures: capitalExpenditures_driver,
      openingCash: periodInput.openingCash, accountsReceivableValueAvg: accountsReceivableValueAvg_driver,
      inventoryValueAvg: inventoryValueAvg_driver, netFixedAssets: netFixedAssets_driver,
      accountsPayableValueAvg: accountsPayableValueAvg_driver, totalBankLoans: totalBankLoans_driver, initialEquity: periodInput.initialEquity,
      // Store all override inputs
      override_cogs: periodInput.override_cogs, override_grossProfit: periodInput.override_grossProfit,
      override_ebitda: periodInput.override_ebitda, override_ebit: periodInput.override_ebit,
      override_pbt: periodInput.override_pbt, override_incomeTax: periodInput.override_incomeTax,
      override_netProfit: periodInput.override_netProfit, override_AR_ending: periodInput.override_AR_ending,
      override_Inventory_ending: periodInput.override_Inventory_ending, override_AP_ending: periodInput.override_AP_ending,
      override_totalCurrentAssets: periodInput.override_totalCurrentAssets, override_totalAssets: periodInput.override_totalAssets,
      override_totalCurrentLiabilities: periodInput.override_totalCurrentLiabilities, override_totalLiabilities: periodInput.override_totalLiabilities,
      override_equity_ending: periodInput.override_equity_ending, override_closingCash: periodInput.override_closingCash,
      override_operatingCashFlow: periodInput.override_operatingCashFlow, override_workingCapitalChange: periodInput.override_workingCapitalChange,

      // P&L Final Values
      cogs, grossProfit, gmPct, ebitda, ebit, opProfitPct, pbt,
      incomeTaxRatePercentageActual: incomeTaxRatePercentage_driver, // Keep track of driver used for tax calc
      incomeTax, netProfit, netProfitPct, retainedProfit,
      
      // BS & WC Final Values
      calculatedOpeningCash: openingCash_driver, // The actual opening cash used
      closingCash, arDaysDerived, inventoryDaysDerived, apDaysDerived, wcDays,
      inventoryValue: inventoryValueForBS, // What's used in BS
      workingCapitalValue, workingCapitalChange,
      estimatedCurrentAssets: finalEstimatedCurrentAssets, 
      estimatedTotalAssets: finalEstimatedTotalAssets,
      estimatedTotalLiabilities: finalEstimatedTotalLiabilities, 
      equity: finalEquity, 
      balanceSheetDifference: finalBalanceSheetDifference,
      cashReconciliationDifference, // New field for cash override impact
      
      // KPIs
      arPer100Revenue, inventoryPer100Revenue, apPer100Revenue, wcPer100Revenue,
      operatingCashFlow, cashFromOpsAfterWC, netCashFlowBeforeFinancing,
      changeInDebt, cashFlowFromFinancing, netChangeInCash, fundingGapOrSurplus,

      // Standardized day outputs for direct KPI use
      arDays: arDaysDerived, 
      invDays: inventoryDaysDerived, 
      apDays: apDaysDerived, 
    };
    previousPeriodCalculated = currentPeriodResult; 
    return currentPeriodResult;
  });
  return calculatedDataAllPeriods;
}