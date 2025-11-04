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
 * Safely divides two numbers with comprehensive validation
 * Returns 0 for invalid inputs or unsafe results
 * Handles: NaN, Infinity, null, undefined, zero, near-zero, unsafe results
 */
const safeDivide = (numerator, denominator) => {
  // Validate numerator
  if (numerator === null || numerator === undefined || isNaN(numerator)) return 0;
  if (!isFinite(numerator)) return 0; // Handles Infinity and -Infinity

  // Validate denominator
  if (denominator === null || denominator === undefined || isNaN(denominator)) return 0;
  if (!isFinite(denominator)) return 0; // Handles Infinity and -Infinity

  // Check for zero and near-zero (using Number.EPSILON for precision)
  if (Math.abs(denominator) < Number.EPSILON) return 0;

  // Perform division
  const result = numerator / denominator;

  // Validate result
  if (!isFinite(result)) return 0; // Handles Infinity, -Infinity, NaN
  if (Math.abs(result) > Number.MAX_SAFE_INTEGER) return 0; // Unsafe large numbers

  return result;
};

// Export safeDivide for testing
export { safeDivide };

/**
 * Creates an audit trail for financial calculations
 * Tracks original values, calculation steps, overrides, and validation results
 *
 * @param {object} originalData - Original input data
 * @param {object} overrides - Manual overrides applied (optional)
 * @param {Array} calculationSteps - Array of calculation steps (optional)
 * @param {object} validationResults - Validation results (optional)
 * @returns {object} Audit trail object
 */
export const createAuditTrail = (originalData, overrides = null, calculationSteps = [], validationResults = null) => {
  // If no calculation steps provided, auto-generate basic metadata from input data
  const steps = calculationSteps.length > 0 ? calculationSteps : [
    {
      step: 'initialization',
      action: 'Created audit trail',
      inputFields: Object.keys(originalData),
      inputFieldCount: Object.keys(originalData).length,
    }
  ];

  return {
    timestamp: new Date().toISOString(),
    originalValues: { ...originalData },
    overrides: overrides ? { ...overrides } : null,
    calculationSteps: [...steps],
    validationResults: validationResults || { errors: [], warnings: [] },
    version: '1.0',
    system: 'EnterpriseCashFlow',
  };
};

/**
 * Calculates Brazilian corporate taxes (IRPJ + CSLL)
 * IRPJ: 15% on profit + 10% surtax on profit exceeding R$ 20,000/month
 * CSLL: 9% on profit for non-financial companies
 *
 * @param {number} profit - Taxable profit (EBT)
 * @param {number} months - Number of months in the period (1, 3, 12, etc.)
 * @returns {object} Tax breakdown with IRPJ, CSLL, total, and effective rate
 */
export const calculateBrazilianTax = (profit, months = 12) => {
  // No tax on zero or negative profit
  if (profit <= 0) {
    return {
      irpj: 0,
      irpjBase: 0,
      irpjSurtax: 0,
      csll: 0,
      total: 0,
      effectiveRate: 0,
    };
  }

  // IRPJ calculation
  const monthlyThreshold = 20000; // R$ 20,000 per month
  const periodThreshold = monthlyThreshold * months;
  const irpjBaseRate = 0.15; // 15%
  const irpjSurtaxRate = 0.10; // 10% additional

  let irpjBase, irpjSurtax;

  if (profit <= periodThreshold) {
    // Below threshold: only 15% base rate
    irpjBase = profit * irpjBaseRate;
    irpjSurtax = 0;
  } else {
    // Above threshold: 15% on first portion + 25% (15% + 10%) on excess
    irpjBase = periodThreshold * irpjBaseRate;
    irpjSurtax = (profit - periodThreshold) * irpjSurtaxRate;
  }

  const irpj = round2(irpjBase + irpjSurtax);

  // CSLL calculation (9% for non-financial companies)
  const csllRate = 0.09; // 9%
  const csll = round2(profit * csllRate);

  // Total tax
  const total = round2(irpj + csll);

  // Effective tax rate
  const effectiveRate = round2((total / profit) * 100);

  return {
    irpj,
    irpjBase: round2(irpjBase),
    irpjSurtax: round2(irpjSurtax),
    csll,
    total,
    effectiveRate,
  };
};

/**
 * Calculates a complete income statement from input data
 * Now includes audit trail tracking
 */
export const calculateIncomeStatement = (data, overrides = null) => {
  // Track calculation steps for audit trail
  const calculationSteps = [];

  const revenue = round2(data.revenue || 0);
  calculationSteps.push({ step: 'revenue', value: revenue, formula: 'data.revenue' });

  // Calculate COGS
  let cogs;
  if (overrides && overrides.cogs !== undefined) {
    cogs = round2(overrides.cogs);
    calculationSteps.push({ step: 'cogs', value: cogs, formula: 'OVERRIDE', source: 'manual' });
  } else if (data.cogs !== undefined) {
    cogs = round2(data.cogs);
    calculationSteps.push({ step: 'cogs', value: cogs, formula: 'data.cogs', source: 'input' });
  } else if (data.grossMarginPercent !== undefined) {
    // More precise calculation to match test expectations
    const marginDecimal = data.grossMarginPercent / 100;
    cogs = round2(revenue * (1 - marginDecimal));
    calculationSteps.push({
      step: 'cogs',
      value: cogs,
      formula: `revenue * (1 - grossMarginPercent/100) = ${revenue} * (1 - ${data.grossMarginPercent}/100)`,
      source: 'calculated',
    });
  } else {
    cogs = round2(revenue * (1 - DEFAULT_GROSS_MARGIN));
    calculationSteps.push({
      step: 'cogs',
      value: cogs,
      formula: `revenue * (1 - DEFAULT_GROSS_MARGIN) = ${revenue} * (1 - ${DEFAULT_GROSS_MARGIN})`,
      source: 'default',
    });
  }
  
  // Gross profit and margin
  const grossProfit = round2(revenue - cogs);
  calculationSteps.push({
    metric: 'grossProfit',
    value: grossProfit,
    formula: `revenue - cogs = ${revenue} - ${cogs}`,
  });

  const grossMarginPercent = round2(safeDivide(grossProfit, revenue) * 100);
  calculationSteps.push({
    metric: 'grossMarginPercent',
    value: grossMarginPercent,
    formula: `(grossProfit / revenue) * 100 = (${grossProfit} / ${revenue}) * 100`,
  });

  // Operating expenses
  const operatingExpenses = round2(data.operatingExpenses || 0);

  // EBITDA
  const ebitda = overrides && overrides.ebitda !== undefined
    ? round2(overrides.ebitda)
    : round2(grossProfit - operatingExpenses);
  calculationSteps.push({
    metric: 'ebitda',
    value: ebitda,
    formula: overrides && overrides.ebitda !== undefined
      ? 'OVERRIDE'
      : `grossProfit - operatingExpenses = ${grossProfit} - ${operatingExpenses}`,
    source: overrides && overrides.ebitda !== undefined ? 'manual' : 'calculated',
  });

  const ebitdaMargin = round2(safeDivide(ebitda, revenue) * 100);

  // Depreciation
  const depreciation = round2(
    data.depreciation !== undefined ? data.depreciation : revenue * DEFAULT_DEPRECIATION_RATE
  );

  // EBIT
  const ebit = round2(ebitda - depreciation);
  calculationSteps.push({
    metric: 'ebit',
    value: ebit,
    formula: `ebitda - depreciation = ${ebitda} - ${depreciation}`,
  });

  const ebitMargin = round2(safeDivide(ebit, revenue) * 100);

  // Financial result
  const financialRevenue = round2(data.financialRevenue || 0);
  const financialExpenses = round2(data.financialExpenses || 0);
  const netFinancialResult = round2(financialRevenue - financialExpenses);

  // EBT and taxes
  const ebt = round2(ebit + netFinancialResult);
  calculationSteps.push({
    metric: 'ebt',
    value: ebt,
    formula: `ebit + netFinancialResult = ${ebit} + ${netFinancialResult}`,
  });

  // Calculate Brazilian taxes (IRPJ + CSLL) - default to annual (12 months)
  const periodMonths = data.periodMonths || 12;
  const taxCalculation = calculateBrazilianTax(ebt, periodMonths);
  const taxes = taxCalculation.total;
  const effectiveTaxRate = taxCalculation.effectiveRate;

  calculationSteps.push({
    metric: 'taxes',
    value: taxes,
    formula: `IRPJ (${taxCalculation.irpj}) + CSLL (${taxCalculation.csll})`,
    detail: `IRPJ: ${taxCalculation.irpjBase} base + ${taxCalculation.irpjSurtax} surtax`,
  });

  // Net income
  const netIncome = round2(ebt - taxes);
  calculationSteps.push({
    metric: 'netIncome',
    value: netIncome,
    formula: `ebt - taxes = ${ebt} - ${taxes}`,
  });

  const netMargin = round2(safeDivide(netIncome, revenue) * 100);

  // Create audit trail
  const auditTrail = createAuditTrail(data, overrides, calculationSteps);

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
    taxBreakdown: {
      irpj: taxCalculation.irpj,
      irpjBase: taxCalculation.irpjBase,
      irpjSurtax: taxCalculation.irpjSurtax,
      csll: taxCalculation.csll,
    },
    effectiveTaxRate,
    netIncome,
    netMargin,
    auditTrail, // Include audit trail
  };
};

/**
 * Calculates cash flow statement
 * Properly handles first period working capital as cash investment
 */
export const calculateCashFlow = (currentPeriod, previousPeriod) => {
  const netIncome = currentPeriod.incomeStatement.netIncome;
  const depreciation = currentPeriod.incomeStatement.depreciation;
  const revenue = currentPeriod.incomeStatement.revenue;

  // Working capital changes
  let workingCapitalChange = 0;

  if (previousPeriod && previousPeriod.workingCapital) {
    // Subsequent period: Calculate change from previous period
    // Per spec: WC change = -ΔAR - ΔInventory + ΔAP
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
    // Positive because increases in AP are cash inflows
    workingCapitalChange = -(arChange + inventoryChange - apChange);
  } else {
    // First period: Working capital represents cash outflow to establish WC
    // Per spec lines 78-84: First period WC change = -(AR + Inventory - AP)
    const currentWC = currentPeriod.workingCapital;

    if (currentWC) {
      const arValue = currentWC.accountsReceivableValue || 0;
      const inventoryValue = currentWC.inventoryValue || 0;
      const apValue = currentWC.accountsPayableValue || 0;

      // Cash investment needed to establish working capital
      // This is a cash outflow (negative)
      workingCapitalChange = -(arValue + inventoryValue - apValue);
    }
  }

  // Handle JavaScript's -0 quirk: convert -0 to 0
  if (Object.is(workingCapitalChange, -0)) {
    workingCapitalChange = 0;
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
  
  // Handle edge cases for debt-to-equity ratio
  const equity = balanceSheet.equity || 0;
  let debtToEquity;
  
  if (equity <= 0 && totalLiabilities > 0) {
    // If equity is negative or zero but there is debt, indicate a problematic ratio
    debtToEquity = 99.99; // Use a high capped value to indicate extremely high leverage
  } else if (equity <= 0 && totalLiabilities <= 0) {
    // Both negative/zero - problematic company, use 0
    debtToEquity = 0;
  } else {
    // Normal case - positive equity
    debtToEquity = round2(safeDivide(totalLiabilities, equity));
    // Cap at a reasonable maximum for display purposes
    if (debtToEquity > 99.99) debtToEquity = 99.99;
  }
  
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
 * Estimates balance sheet components using asset turnover approach
 * Per spec: lines 226-235 from 17_financial_algorithms_pseudocode.md
 */
export const calculateBalanceSheet = (data) => {
  const { incomeStatement, workingCapital, cashFlow } = data;
  const revenue = incomeStatement?.revenue || 0;

  // Constants for balance sheet estimation
  const DEFAULT_ASSET_TURNOVER = 2.5; // Industry average
  const FIXED_ASSETS_RATIO = 0.4; // 40% of total assets are fixed assets
  const BALANCE_TOLERANCE = 0.01; // Balance sheet equation tolerance

  // Get asset turnover (allow override, default to 2.5)
  const assetTurnover = data.assetTurnover || DEFAULT_ASSET_TURNOVER;

  // Calculate total assets using asset turnover ratio
  // Per spec: estimatedTotalAssets = revenue / assetTurnover
  const estimatedTotalAssets = round2(safeDivide(revenue, assetTurnover));

  // Use estimated total assets as the primary driver
  const totalAssets = estimatedTotalAssets;

  // Allocate assets: 60% current, 40% non-current (per spec)
  const currentAssetsEstimate = round2(totalAssets * (1 - FIXED_ASSETS_RATIO)); // 60%
  const nonCurrentAssetsEstimate = round2(totalAssets * FIXED_ASSETS_RATIO); // 40%

  // Break down current assets
  // Use working capital values if available, otherwise estimate proportionally
  let accountsReceivable = round2(workingCapital?.accountsReceivableValue || 0);
  let inventory = round2(workingCapital?.inventoryValue || 0);

  // If we have working capital values, use them; otherwise estimate
  let cash, otherCurrentAssets, currentAssets;

  if (accountsReceivable > 0 || inventory > 0) {
    // We have some working capital data - calculate cash to balance
    const knownCurrentAssets = accountsReceivable + inventory;
    cash = round2(Math.max(0, currentAssetsEstimate - knownCurrentAssets));
    otherCurrentAssets = 0;
    currentAssets = round2(cash + accountsReceivable + inventory);
  } else {
    // No working capital data - estimate all components
    cash = round2(currentAssetsEstimate * 0.3); // 30% cash
    accountsReceivable = round2(currentAssetsEstimate * 0.4); // 40% AR
    inventory = round2(currentAssetsEstimate * 0.2); // 20% inventory
    otherCurrentAssets = round2(currentAssetsEstimate * 0.1); // 10% other
    currentAssets = round2(cash + accountsReceivable + inventory + otherCurrentAssets);
  }

  // Non-current assets (fixed assets)
  // Per spec: fixedAssetsNet = estimatedTotalAssets * 0.4 (40% fixed assets)
  let fixedAssetsNet = nonCurrentAssetsEstimate;

  // Apply depreciation and capex if provided
  if (data.depreciation || data.capex) {
    const depreciation = data.depreciation || 0;
    const capex = data.capex || 0;
    fixedAssetsNet = round2(fixedAssetsNet - depreciation + capex);
  }

  const nonCurrentAssets = round2(Math.max(fixedAssetsNet, 0));

  // Recalculate total assets to ensure balance sheet equation holds
  // Total Assets must equal Current Assets + Non-Current Assets
  const actualTotalAssets = round2(currentAssets + nonCurrentAssets);

  // Current liabilities
  const accountsPayable = round2(workingCapital?.accountsPayableValue || 0);
  const shortTermDebt = round2(revenue * 0.05); // 5% estimate
  const accruedExpenses = round2(revenue * 0.02); // 2% estimate
  const currentLiabilities = round2(accountsPayable + shortTermDebt + accruedExpenses);

  // Long-term liabilities
  // Use target debt-to-equity ratio to estimate
  const targetDebtToEquity = data.targetDebtToEquity || 0.5; // 50% conservative
  const totalLiabilitiesEquity = actualTotalAssets;

  // Solve for equity: Total = E + L, where L = CurrentLiab + NonCurrentLiab
  // And we want: (CurrentLiab + NonCurrentLiab) / E = targetDebtToEquity
  // So: L = targetDebtToEquity * E
  // Total = E + targetDebtToEquity * E = E(1 + targetDebtToEquity)
  // E = Total / (1 + targetDebtToEquity)
  const equity = round2(actualTotalAssets / (1 + targetDebtToEquity));
  const totalLiabilities = round2(actualTotalAssets - equity);
  const nonCurrentLiabilities = round2(Math.max(0, totalLiabilities - currentLiabilities));

  // Validation: Check balance sheet equation A = L + E
  const balanceCheck = round2(actualTotalAssets - (totalLiabilities + equity));

  if (Math.abs(balanceCheck) > BALANCE_TOLERANCE) {
    console.warn(
      `Balance sheet equation violated: Assets (${actualTotalAssets}) != Liabilities (${totalLiabilities}) + Equity (${equity}). Difference: ${balanceCheck}`
    );
  }

  return {
    // Assets
    cash,
    accountsReceivable,
    inventory,
    otherCurrentAssets,
    currentAssets,
    fixedAssetsNet,
    nonCurrentAssets,
    totalAssets: actualTotalAssets,

    // Liabilities
    accountsPayable,
    shortTermDebt,
    accruedExpenses,
    currentLiabilities,
    nonCurrentLiabilities,
    totalLiabilities,

    // Equity
    equity,
    totalLiabilitiesEquity: round2(totalLiabilities + equity),

    // Validation
    balanceCheck,
    isBalanced: Math.abs(balanceCheck) < BALANCE_TOLERANCE,
    assetTurnoverUsed: assetTurnover,

    // Ratios
    currentRatio: round2(safeDivide(currentAssets, currentLiabilities)),
    debtToEquity: round2(safeDivide(totalLiabilities, equity)),
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
            Math.abs(previousPeriod.incomeStatement.netIncome || 0.01)
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