/**
 * Core financial calculation engine for EnterpriseCashFlow
 * All monetary values are in BRL and rounded to 2 decimal places
 * All percentages are stored as decimals (e.g., 40% = 40.0)
 */

// Constants
const DEFAULT_TAX_RATE = 0.34; // Brazilian corporate tax rate
const DEFAULT_DEPRECIATION_RATE = 0.02; // 2% of revenue
const DEFAULT_CAPEX_RATE = 0.05; // 5% of revenue
const DEFAULT_GROSS_MARGIN = 0.4; // 40% default margin

// Default working capital days
const DEFAULT_DSO = 45;
const DEFAULT_DIO = 30;
const DEFAULT_DPO = 60;

// Period days mapping
const PERIOD_DAYS = {
  MONTHLY: 30,
  QUARTERLY: 90,
  YEARLY: 365,
};

/**
 * Rounds a number to 2 decimal places
 */
const round2 = (num) => Math.round(num * 100) / 100;

/**
 * Safely divides two numbers, returning 0 if denominator is 0
 */
const safeDivide = (numerator, denominator) => {
  if (denominator === 0 || !denominator) return 0;
  return numerator / denominator;
};

/**
 * Calculates a complete income statement from input data
 */
export const calculateIncomeStatement = (data) => {
  const revenue = round2(data.revenue || 0);
  
  // Calculate COGS
  let cogs;
  if (data.cogs !== undefined) {
    cogs = round2(data.cogs);
  } else if (data.grossMarginPercent !== undefined) {
    // More precise calculation to match test expectations
    const marginDecimal = data.grossMarginPercent / 100;
    cogs = round2(revenue * (1 - marginDecimal));
  } else {
    cogs = round2(revenue * (1 - DEFAULT_GROSS_MARGIN));
  }
  
  // Gross profit and margin
  const grossProfit = round2(revenue - cogs);
  const grossMarginPercent = round2(safeDivide(grossProfit, revenue) * 100);
  
  // Operating expenses
  const operatingExpenses = round2(data.operatingExpenses || 0);
  
  // EBITDA
  const ebitda = round2(grossProfit - operatingExpenses);
  const ebitdaMargin = round2(safeDivide(ebitda, revenue) * 100);
  
  // Depreciation
  const depreciation = round2(
    data.depreciation !== undefined ? data.depreciation : revenue * DEFAULT_DEPRECIATION_RATE
  );
  
  // EBIT
  const ebit = round2(ebitda - depreciation);
  const ebitMargin = round2(safeDivide(ebit, revenue) * 100);
  
  // Financial result
  const financialRevenue = round2(data.financialRevenue || 0);
  const financialExpenses = round2(data.financialExpenses || 0);
  const netFinancialResult = round2(financialRevenue - financialExpenses);
  
  // EBT and taxes
  const ebt = round2(ebit + netFinancialResult);
  // No taxes on negative income
  const taxes = round2(ebt > 0 ? ebt * DEFAULT_TAX_RATE : 0);
  
  // Net income
  const netIncome = round2(ebt - taxes);
  const netMargin = round2(safeDivide(netIncome, revenue) * 100);
  
  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPercent,
    operatingExpenses,
    ebitda,
    ebitdaMargin,
    depreciation,
    ebit,
    ebitMargin,
    netFinancialResult,
    ebt,
    taxes,
    netIncome,
    netMargin,
  };
};

/**
 * Calculates cash flow statement
 */
export const calculateCashFlow = (currentPeriod, previousPeriod) => {
  const netIncome = currentPeriod.incomeStatement.netIncome;
  const depreciation = currentPeriod.incomeStatement.depreciation;
  const revenue = currentPeriod.incomeStatement.revenue;
  
  // Working capital changes
  let workingCapitalChange = 0;
  if (previousPeriod && previousPeriod.workingCapital) {
    const currentWC = currentPeriod.workingCapital;
    const previousWC = previousPeriod.workingCapital;
    
    const currentAR = currentWC.accountsReceivableValue || 0;
    const previousAR = previousWC.accountsReceivableValue || 0;
    const currentInv = currentWC.inventoryValue || 0;
    const previousInv = previousWC.inventoryValue || 0;
    const currentAP = currentWC.accountsPayableValue || 0;
    const previousAP = previousWC.accountsPayableValue || 0;
    
    const arChange = currentAR - previousAR;
    const inventoryChange = currentInv - previousInv;
    const apChange = currentAP - previousAP;
    
    // Negative because increases in AR/Inventory are cash outflows
    workingCapitalChange = -(arChange + inventoryChange - apChange);
  }
  
  const operatingCashFlow = round2(netIncome + depreciation + workingCapitalChange);
  
  // Investing cash flow
  const capex = round2(currentPeriod.capex !== undefined ? currentPeriod.capex : revenue * DEFAULT_CAPEX_RATE);
  const investingCashFlow = round2(-capex);
  
  // Free cash flow
  const freeCashFlow = round2(operatingCashFlow + investingCashFlow);
  
  // Financing cash flow
  const debtChange = round2(currentPeriod.debtChange || 0);
  const equityChange = round2(currentPeriod.equityChange || 0);
  const dividends = round2(currentPeriod.dividends || 0);
  const financingCashFlow = round2(debtChange + equityChange - dividends);
  
  // Net cash flow
  const netCashFlow = round2(operatingCashFlow + investingCashFlow + financingCashFlow);
  
  // Cash conversion rate
  const cashConversionRate = round2(safeDivide(operatingCashFlow, netIncome) * 100);
  
  return {
    operatingCashFlow,
    workingCapitalChange: round2(workingCapitalChange),
    investingCashFlow,
    capex,
    freeCashFlow,
    financingCashFlow,
    netCashFlow,
    cashConversionRate,
  };
};

/**
 * Calculates working capital metrics
 */
export const calculateWorkingCapitalMetrics = (data) => {
  const revenue = data.incomeStatement?.revenue || 0;
  const cogs = data.incomeStatement?.cogs || 0;
  const daysInPeriod = data.daysInPeriod || 365;
  
  // DSO (Days Sales Outstanding)
  let dso, accountsReceivableValue;
  if (data.accountsReceivableValue !== undefined) {
    accountsReceivableValue = data.accountsReceivableValue;
    dso = round2(safeDivide(accountsReceivableValue, revenue) * daysInPeriod);
  } else if (data.accountsReceivableDays !== undefined) {
    dso = data.accountsReceivableDays;
    accountsReceivableValue = round2(safeDivide(revenue, daysInPeriod) * dso);
  } else {
    dso = DEFAULT_DSO;
    accountsReceivableValue = round2(safeDivide(revenue, daysInPeriod) * dso);
  }
  
  // DIO (Days Inventory Outstanding)
  let dio, inventoryValue;
  if (data.inventoryValue !== undefined) {
    inventoryValue = data.inventoryValue;
    dio = round2(safeDivide(inventoryValue, cogs) * daysInPeriod);
  } else if (data.inventoryDays !== undefined) {
    dio = data.inventoryDays;
    inventoryValue = round2(safeDivide(cogs, daysInPeriod) * dio);
  } else {
    dio = DEFAULT_DIO;
    inventoryValue = round2(safeDivide(cogs, daysInPeriod) * dio);
  }
  
  // DPO (Days Payable Outstanding)
  let dpo, accountsPayableValue;
  if (data.accountsPayableValue !== undefined) {
    accountsPayableValue = data.accountsPayableValue;
    dpo = round2(safeDivide(accountsPayableValue, cogs) * daysInPeriod);
  } else if (data.accountsPayableDays !== undefined) {
    dpo = data.accountsPayableDays;
    accountsPayableValue = round2(safeDivide(cogs, daysInPeriod) * dpo);
  } else {
    dpo = DEFAULT_DPO;
    accountsPayableValue = round2(safeDivide(cogs, daysInPeriod) * dpo);
  }
  
  // Cash conversion cycle and working capital
  const cashConversionCycle = round2(dso + dio - dpo);
  const workingCapitalValue = round2(accountsReceivableValue + inventoryValue - accountsPayableValue);
  const workingCapitalPercent = round2(safeDivide(workingCapitalValue, revenue) * 100);
  
  return {
    dso: round2(dso),
    dio: round2(dio),
    dpo: round2(dpo),
    cashConversionCycle,
    workingCapitalValue,
    workingCapitalPercent,
    accountsReceivableValue: round2(accountsReceivableValue),
    inventoryValue: round2(inventoryValue),
    accountsPayableValue: round2(accountsPayableValue),
  };
};

/**
 * Calculates financial ratios
 */
export const calculateFinancialRatios = (data) => {
  const { incomeStatement, balanceSheet, cashFlow } = data;
  
  // Liquidity ratios
  const currentRatio = round2(
    safeDivide(balanceSheet.currentAssets, balanceSheet.currentLiabilities)
  );
  
  const quickRatio = round2(
    safeDivide(
      balanceSheet.currentAssets - (balanceSheet.inventory || 0),
      balanceSheet.currentLiabilities
    )
  );
  
  const cashRatio = round2(
    safeDivide(cashFlow.operatingCashFlow, balanceSheet.currentLiabilities)
  );
  
  // Leverage ratios
  const totalLiabilities = balanceSheet.totalLiabilities || 
    (balanceSheet.currentLiabilities + (balanceSheet.nonCurrentLiabilities || 0));
    
  const debtToEquity = round2(safeDivide(totalLiabilities, balanceSheet.equity));
  const debtRatio = round2(safeDivide(totalLiabilities, balanceSheet.totalAssets));
  const equityRatio = round2(safeDivide(balanceSheet.equity, balanceSheet.totalAssets));
  
  // Profitability ratios
  const roe = round2(safeDivide(incomeStatement.netIncome, balanceSheet.equity) * 100);
  const roa = round2(safeDivide(incomeStatement.netIncome, balanceSheet.totalAssets) * 100);
  const roic = round2(safeDivide(incomeStatement.ebit, balanceSheet.totalAssets) * 100);
  
  // Efficiency ratios
  const assetTurnover = round2(safeDivide(incomeStatement.revenue, balanceSheet.totalAssets));
  
  return {
    // Liquidity
    currentRatio,
    quickRatio,
    cashRatio,
    // Leverage
    debtToEquity,
    debtRatio,
    equityRatio,
    // Profitability
    roe,
    roa,
    roic,
    // Efficiency
    assetTurnover,
  };
};

/**
 * Estimates balance sheet components
 */
export const calculateBalanceSheet = (data) => {
  const { incomeStatement, workingCapital, cashFlow } = data;
  const revenue = incomeStatement?.revenue || 0;
  
  // Current assets estimation
  const cash = round2(Math.max(revenue * 0.1, cashFlow?.netCashFlow || 0));
  const accountsReceivable = round2(workingCapital?.accountsReceivableValue || 0);
  const inventory = round2(workingCapital?.inventoryValue || 0);
  const currentAssets = round2(cash + accountsReceivable + inventory);
  
  // Non-current assets estimation
  const totalAssets = round2(incomeStatement?.totalAssets || revenue * 0.8);
  const nonCurrentAssets = round2(Math.max(0, totalAssets - currentAssets));
  
  // Current liabilities
  const accountsPayable = round2(workingCapital?.accountsPayableValue || 0);
  const shortTermDebt = round2(revenue * 0.05); // Estimate
  const currentLiabilities = round2(accountsPayable + shortTermDebt);
  
  // Calculate equity and long-term debt to balance
  const targetDebtToEquity = 0.5; // Conservative estimate
  const totalLiabilitiesEquity = totalAssets;
  
  // Solve for equity: E + D = Total, D/E = 0.5, so D = 0.5E
  // E + 0.5E = Total - CurrentLiabilities
  const nonCurrentLiabilities = round2(
    (totalLiabilitiesEquity - currentLiabilities) * (targetDebtToEquity / (1 + targetDebtToEquity))
  );
  const equity = round2(totalLiabilitiesEquity - currentLiabilities - nonCurrentLiabilities);
  
  const totalLiabilities = round2(currentLiabilities + nonCurrentLiabilities);
  const balanceCheck = round2(totalAssets - totalLiabilitiesEquity);
  
  return {
    // Assets
    cash,
    accountsReceivable,
    inventory,
    currentAssets,
    nonCurrentAssets,
    totalAssets: round2(currentAssets + nonCurrentAssets),
    // Liabilities
    accountsPayable,
    shortTermDebt,
    currentLiabilities,
    nonCurrentLiabilities,
    totalLiabilities,
    // Equity
    equity,
    totalLiabilitiesEquity,
    // Validation
    balanceCheck,
    currentRatio: round2(safeDivide(currentAssets, currentLiabilities)),
  };
};

/**
 * Validates financial data
 */
const validateFinancialData = (data) => {
  const errors = [];
  
  data.forEach((period, index) => {
    if (period.revenue < 0) {
      errors.push(`Period ${index + 1}: Revenue cannot be negative`);
    }
    if (period.grossMarginPercent !== undefined && 
        (period.grossMarginPercent < 0 || period.grossMarginPercent > 100)) {
      errors.push(`Period ${index + 1}: Gross margin must be between 0-100%`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join('; ')}`);
  }
};

/**
 * Main function to process financial data for multiple periods
 */
export const processFinancialData = (rawPeriodData, periodType) => {
  // Validate input data
  validateFinancialData(rawPeriodData);
  
  const daysInPeriod = PERIOD_DAYS[periodType] || 30;
  const processedData = [];
  
  rawPeriodData.forEach((periodData, index) => {
    // Calculate income statement
    const incomeStatement = calculateIncomeStatement(periodData);
    
    // Calculate working capital metrics
    const workingCapital = calculateWorkingCapitalMetrics({
      ...periodData,
      incomeStatement,
      daysInPeriod,
    });
    
    // Get previous period for cash flow calculations
    const previousPeriod = index > 0 ? processedData[index - 1] : null;
    
    // Calculate cash flow
    const currentPeriodData = {
      ...periodData,
      incomeStatement,
      workingCapital,
    };
    
    const cashFlow = calculateCashFlow(currentPeriodData, previousPeriod);
    
    // Estimate balance sheet
    const balanceSheet = calculateBalanceSheet({
      incomeStatement,
      workingCapital,
      cashFlow,
    });
    
    // Calculate financial ratios
    const ratios = calculateFinancialRatios({
      incomeStatement,
      balanceSheet,
      cashFlow,
    });
    
    // Calculate trends (for periods after the first)
    let trends = {};
    if (previousPeriod) {
      trends = {
        revenueGrowth: round2(
          safeDivide(
            incomeStatement.revenue - previousPeriod.incomeStatement.revenue,
            previousPeriod.incomeStatement.revenue
          ) * 100
        ),
        marginImprovement: round2(
          incomeStatement.grossMarginPercent - previousPeriod.incomeStatement.grossMarginPercent
        ),
        profitGrowth: round2(
          safeDivide(
            incomeStatement.netIncome - previousPeriod.incomeStatement.netIncome,
            Math.abs(previousPeriod.incomeStatement.netIncome)
          ) * 100
        ),
      };
    }
    
    processedData.push({
      periodIndex: index,
      daysInPeriod,
      incomeStatement,
      cashFlow,
      workingCapital,
      balanceSheet,
      ratios,
      trends,
    });
  });
  
  return processedData;
};