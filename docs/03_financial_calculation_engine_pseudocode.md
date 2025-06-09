# EnterpriseCashFlow - Financial Calculation Engine Pseudocode

## 1. Module Overview

The Financial Calculation Engine is the core business logic module responsible for transforming raw financial data into calculated financial statements, ratios, and KPIs. It implements Brazilian accounting standards and provides audit trails for all calculations.

### 1.1 Module Dependencies
- Domain Models: [`CompanyInfo`](docs/02_domain_model_specification.md:25), [`RawFinancialData`](docs/02_domain_model_specification.md:55), [`CalculatedFinancialData`](docs/02_domain_model_specification.md:120)
- Validation Engine: Input validation and business rule enforcement
- Audit System: Calculation tracking and override management

### 1.2 Core Responsibilities
- Financial statement generation (Income Statement, Balance Sheet, Cash Flow)
- Financial ratio calculations (Profitability, Liquidity, Efficiency, Leverage)
- Working capital analysis and trend calculations
- Power of One analysis for operational insights
- Audit trail maintenance and override handling

## 2. FinancialCalculationEngine Class

```typescript
class FinancialCalculationEngine {
  private validationEngine: ValidationEngine
  private auditTrail: CalculationAuditTrail
  private overrideManager: OverrideManager
  
  // TEST: Engine initializes with proper dependencies
  constructor(validationEngine: ValidationEngine) {
    this.validationEngine = validationEngine
    this.auditTrail = new CalculationAuditTrail()
    this.overrideManager = new OverrideManager()
  }
  
  // TEST: Processes multiple periods and returns calculated data array
  // TEST: Handles empty input gracefully
  // TEST: Validates all periods before processing
  calculateFinancialData(
    companyInfo: CompanyInfo,
    rawDataArray: RawFinancialData[]
  ): CalculatedFinancialData[] {
    
    // Validate input parameters
    validateInputParameters(companyInfo, rawDataArray)
    
    // Process each period individually
    calculatedResults = []
    for each period in rawDataArray:
      // TEST: Each period calculation is independent
      calculatedPeriod = calculateSinglePeriod(companyInfo, period)
      calculatedResults.push(calculatedPeriod)
    
    // Calculate cross-period analysis
    // TEST: Trend analysis requires at least 2 periods
    if calculatedResults.length >= 2:
      addTrendAnalysis(calculatedResults)
    
    // TEST: Returns array with same length as input
    return calculatedResults
  }
  
  // TEST: Calculates complete financial statements for single period
  // TEST: Handles missing data with appropriate defaults
  // TEST: Applies overrides correctly
  private calculateSinglePeriod(
    companyInfo: CompanyInfo,
    rawData: RawFinancialData
  ): CalculatedFinancialData {
    
    // Apply any manual overrides first
    // TEST: Overrides take precedence over calculated values
    adjustedData = this.overrideManager.applyOverrides(rawData)
    
    // Validate adjusted data
    // TEST: Validation catches business rule violations
    validationResults = this.validationEngine.validatePeriodData(adjustedData)
    
    // Calculate core financial statements
    incomeStatement = calculateIncomeStatement(adjustedData)
    balanceSheet = calculateBalanceSheet(adjustedData)
    cashFlowStatement = calculateCashFlowStatement(adjustedData)
    
    // Calculate financial ratios
    ratios = calculateFinancialRatios(incomeStatement, balanceSheet, cashFlowStatement)
    
    // Calculate working capital analysis
    workingCapitalAnalysis = calculateWorkingCapitalAnalysis(balanceSheet, incomeStatement)
    
    // Calculate Power of One analysis
    powerOfOneAnalysis = calculatePowerOfOneAnalysis(incomeStatement, companyInfo)
    
    // Create audit trail entry
    // TEST: Audit trail captures all calculation steps
    auditEntry = this.auditTrail.createEntry(rawData, adjustedData, calculationSteps)
    
    // TEST: Returns complete calculated data structure
    return new CalculatedFinancialData({
      periodIndex: rawData.periodIndex,
      companyInfo: companyInfo,
      incomeStatement: incomeStatement,
      balanceSheet: balanceSheet,
      cashFlowStatement: cashFlowStatement,
      ratios: ratios,
      workingCapitalAnalysis: workingCapitalAnalysis,
      powerOfOneAnalysis: powerOfOneAnalysis,
      validationResults: validationResults,
      auditTrail: [auditEntry]
    })
  }
}
```

## 3. Income Statement Calculator

```typescript
// TEST: Calculates complete income statement from raw data
// TEST: Handles missing revenue components gracefully
// TEST: Validates gross margin calculations
function calculateIncomeStatement(rawData: RawFinancialData): IncomeStatement {
  
  // Revenue calculations
  // TEST: Net revenue = gross revenue - sales deductions
  grossRevenue = rawData.grossRevenue || 0
  salesDeductions = rawData.salesDeductions || 0
  netRevenue = grossRevenue - salesDeductions
  
  // Cost and gross profit calculations
  // TEST: Gross profit = net revenue - COGS
  costOfGoodsSold = rawData.costOfGoodsSold || 0
  grossProfit = netRevenue - costOfGoodsSold
  
  // TEST: Gross margin percentage calculation with division by zero protection
  grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0
  
  // Operating expenses
  // TEST: Operating expenses aggregation
  salesExpenses = rawData.salesExpenses || 0
  administrativeExpenses = rawData.administrativeExpenses || 0
  operatingExpenses = salesExpenses + administrativeExpenses
  
  // EBITDA and EBIT calculations
  // TEST: EBITDA = gross profit - operating expenses
  ebitda = grossProfit - operatingExpenses
  
  // TEST: EBIT calculation (assuming depreciation included in operating expenses)
  ebit = ebitda // Simplified for this pseudocode
  
  // Financial results
  // TEST: Net financial result calculation
  financialRevenues = rawData.financialRevenues || 0
  financialExpenses = rawData.financialExpenses || 0
  netFinancialResult = financialRevenues - financialExpenses
  
  // Net income calculation
  // TEST: Net income = EBIT + net financial result
  netIncome = ebit + netFinancialResult
  
  // TEST: Net margin percentage calculation
  netMarginPercent = netRevenue > 0 ? (netIncome / netRevenue) * 100 : 0
  
  // TEST: Returns complete income statement structure
  return new IncomeStatement({
    grossRevenue: grossRevenue,
    netRevenue: netRevenue,
    grossProfit: grossProfit,
    grossMarginPercent: grossMarginPercent,
    operatingExpenses: operatingExpenses,
    ebitda: ebitda,
    ebit: ebit,
    netFinancialResult: netFinancialResult,
    netIncome: netIncome,
    netMarginPercent: netMarginPercent
  })
}
```

## 4. Balance Sheet Calculator

```typescript
// TEST: Calculates complete balance sheet from raw data
// TEST: Validates balance sheet equation (Assets = Liabilities + Equity)
// TEST: Calculates working capital correctly
function calculateBalanceSheet(rawData: RawFinancialData): BalanceSheet {
  
  // Asset calculations
  // TEST: Asset aggregation and validation
  currentAssets = rawData.currentAssets || 0
  nonCurrentAssets = rawData.nonCurrentAssets || 0
  totalAssets = currentAssets + nonCurrentAssets
  
  // Liability calculations
  // TEST: Liability aggregation and validation
  currentLiabilities = rawData.currentLiabilities || 0
  nonCurrentLiabilities = rawData.nonCurrentLiabilities || 0
  totalLiabilities = currentLiabilities + nonCurrentLiabilities
  
  // Equity
  equity = rawData.equity || 0
  
  // Working capital calculation
  // TEST: Working capital = current assets - current liabilities
  workingCapital = currentAssets - currentLiabilities
  
  // Balance sheet validation
  // TEST: Balance sheet equation validation with tolerance for rounding
  balanceSheetDifference = totalAssets - (totalLiabilities + equity)
  if abs(balanceSheetDifference) > BALANCE_TOLERANCE:
    throw new BalanceSheetImbalanceError(balanceSheetDifference)
  
  // TEST: Returns complete balance sheet structure
  return new BalanceSheet({
    totalAssets: totalAssets,
    currentAssets: currentAssets,
    nonCurrentAssets: nonCurrentAssets,
    totalLiabilities: totalLiabilities,
    currentLiabilities: currentLiabilities,
    nonCurrentLiabilities: nonCurrentLiabilities,
    equity: equity,
    workingCapital: workingCapital
  })
}
```

## 5. Financial Ratios Calculator

```typescript
// TEST: Calculates all financial ratio categories
// TEST: Handles division by zero scenarios gracefully
// TEST: Returns ratios in appropriate units (percentages, decimals, ratios)
function calculateFinancialRatios(
  incomeStatement: IncomeStatement,
  balanceSheet: BalanceSheet,
  cashFlowStatement: CashFlowStatement
): FinancialRatios {
  
  // Profitability ratios
  // TEST: Profitability ratio calculations with zero revenue protection
  profitabilityRatios = calculateProfitabilityRatios(incomeStatement, balanceSheet)
  
  // Liquidity ratios
  // TEST: Liquidity ratio calculations with zero liability protection
  liquidityRatios = calculateLiquidityRatios(balanceSheet)
  
  // Efficiency ratios
  // TEST: Efficiency ratio calculations
  efficiencyRatios = calculateEfficiencyRatios(incomeStatement, balanceSheet)
  
  // Leverage ratios
  // TEST: Leverage ratio calculations with zero equity protection
  leverageRatios = calculateLeverageRatios(balanceSheet)
  
  // TEST: Returns complete ratios structure
  return new FinancialRatios({
    profitability: profitabilityRatios,
    liquidity: liquidityRatios,
    efficiency: efficiencyRatios,
    leverage: leverageRatios
  })
}

// TEST: Calculates profitability ratios correctly
// TEST: Handles edge cases (zero revenue, negative income)
function calculateProfitabilityRatios(
  incomeStatement: IncomeStatement,
  balanceSheet: BalanceSheet
): ProfitabilityRatios {
  
  // Return on Assets (ROA)
  // TEST: ROA = net income / total assets
  returnOnAssets = balanceSheet.totalAssets > 0 
    ? (incomeStatement.netIncome / balanceSheet.totalAssets) * 100 
    : 0
  
  // Return on Equity (ROE)
  // TEST: ROE = net income / equity
  returnOnEquity = balanceSheet.equity > 0 
    ? (incomeStatement.netIncome / balanceSheet.equity) * 100 
    : 0
  
  // EBITDA Margin
  // TEST: EBITDA margin = EBITDA / net revenue
  ebitdaMargin = incomeStatement.netRevenue > 0 
    ? (incomeStatement.ebitda / incomeStatement.netRevenue) * 100 
    : 0
  
  // TEST: Returns profitability ratios structure
  return new ProfitabilityRatios({
    returnOnAssets: returnOnAssets,
    returnOnEquity: returnOnEquity,
    ebitdaMargin: ebitdaMargin,
    grossMargin: incomeStatement.grossMarginPercent,
    netMargin: incomeStatement.netMarginPercent
  })
}

// TEST: Calculates liquidity ratios correctly
// TEST: Handles zero current liabilities scenario
function calculateLiquidityRatios(balanceSheet: BalanceSheet): LiquidityRatios {
  
  // Current Ratio
  // TEST: Current ratio = current assets / current liabilities
  currentRatio = balanceSheet.currentLiabilities > 0 
    ? balanceSheet.currentAssets / balanceSheet.currentLiabilities 
    : INFINITY_INDICATOR
  
  // Quick Ratio (assuming inventory is part of current assets)
  // TEST: Quick ratio calculation with inventory estimation
  estimatedInventory = balanceSheet.currentAssets * INVENTORY_ESTIMATION_FACTOR
  quickAssets = balanceSheet.currentAssets - estimatedInventory
  quickRatio = balanceSheet.currentLiabilities > 0 
    ? quickAssets / balanceSheet.currentLiabilities 
    : INFINITY_INDICATOR
  
  // Working Capital Ratio
  // TEST: Working capital ratio calculation
  workingCapitalRatio = balanceSheet.currentLiabilities > 0 
    ? balanceSheet.workingCapital / balanceSheet.currentLiabilities 
    : INFINITY_INDICATOR
  
  // TEST: Returns liquidity ratios structure
  return new LiquidityRatios({
    currentRatio: currentRatio,
    quickRatio: quickRatio,
    workingCapitalRatio: workingCapitalRatio
  })
}
```

## 6. Working Capital Analysis

```typescript
// TEST: Calculates comprehensive working capital analysis
// TEST: Identifies working capital trends and efficiency metrics
function calculateWorkingCapitalAnalysis(
  balanceSheet: BalanceSheet,
  incomeStatement: IncomeStatement
): WorkingCapitalAnalysis {
  
  // Basic working capital metrics
  workingCapital = balanceSheet.workingCapital
  workingCapitalRatio = balanceSheet.currentLiabilities > 0 
    ? workingCapital / balanceSheet.currentLiabilities 
    : 0
  
  // Working capital as percentage of revenue
  // TEST: Working capital to revenue ratio calculation
  workingCapitalToRevenue = incomeStatement.netRevenue > 0 
    ? (workingCapital / incomeStatement.netRevenue) * 100 
    : 0
  
  // Working capital efficiency metrics
  // TEST: Working capital turnover calculation
  workingCapitalTurnover = workingCapital > 0 
    ? incomeStatement.netRevenue / workingCapital 
    : 0
  
  // Days working capital
  // TEST: Days working capital calculation (365-day year)
  daysWorkingCapital = workingCapitalTurnover > 0 
    ? 365 / workingCapitalTurnover 
    : 0
  
  // Working capital quality assessment
  // TEST: Working capital quality scoring
  qualityScore = assessWorkingCapitalQuality(workingCapitalRatio, workingCapitalTurnover)
  
  // TEST: Returns complete working capital analysis
  return new WorkingCapitalAnalysis({
    workingCapital: workingCapital,
    workingCapitalRatio: workingCapitalRatio,
    workingCapitalToRevenue: workingCapitalToRevenue,
    workingCapitalTurnover: workingCapitalTurnover,
    daysWorkingCapital: daysWorkingCapital,
    qualityScore: qualityScore
  })
}
```

## 7. Power of One Analysis

```typescript
// TEST: Calculates Power of One analysis for operational insights
// TEST: Identifies highest impact operational improvements
function calculatePowerOfOneAnalysis(
  incomeStatement: IncomeStatement,
  companyInfo: CompanyInfo
): PowerOfOneAnalysis {
  
  baseNetIncome = incomeStatement.netIncome
  baseRevenue = incomeStatement.netRevenue
  
  // Revenue improvement impact (1% increase)
  // TEST: Revenue increase impact calculation
  revenueIncrease = baseRevenue * 0.01
  revenueImpactOnNetIncome = revenueIncrease * (incomeStatement.grossMarginPercent / 100)
  
  // Cost reduction impact (1% decrease in COGS)
  // TEST: COGS reduction impact calculation
  cogsReduction = (baseRevenue - incomeStatement.grossProfit) * 0.01
  cogsImpactOnNetIncome = cogsReduction
  
  // Operating expense reduction impact (1% decrease)
  // TEST: Operating expense reduction impact calculation
  opexReduction = incomeStatement.operatingExpenses * 0.01
  opexImpactOnNetIncome = opexReduction
  
  // Working capital improvement impact
  // TEST: Working capital improvement calculation
  workingCapitalImprovement = calculateWorkingCapitalImpact(incomeStatement, companyInfo)
  
  // Rank improvements by impact
  // TEST: Impact ranking and prioritization
  improvements = [
    { type: "REVENUE_INCREASE", impact: revenueImpactOnNetIncome },
    { type: "COGS_REDUCTION", impact: cogsImpactOnNetIncome },
    { type: "OPEX_REDUCTION", impact: opexImpactOnNetIncome },
    { type: "WORKING_CAPITAL", impact: workingCapitalImprovement }
  ]
  
  rankedImprovements = improvements.sortBy(improvement => improvement.impact).reverse()
  
  // TEST: Returns complete Power of One analysis
  return new PowerOfOneAnalysis({
    baseNetIncome: baseNetIncome,
    revenueImpact: revenueImpactOnNetIncome,
    cogsImpact: cogsImpactOnNetIncome,
    opexImpact: opexImpactOnNetIncome,
    workingCapitalImpact: workingCapitalImprovement,
    rankedImprovements: rankedImprovements
  })
}
```

## 8. Trend Analysis Calculator

```typescript
// TEST: Calculates trend analysis across multiple periods
// TEST: Handles periods with missing data appropriately
// TEST: Calculates growth rates and variance analysis
function addTrendAnalysis(calculatedResults: CalculatedFinancialData[]): void {
  
  for i = 1 to calculatedResults.length - 1:
    currentPeriod = calculatedResults[i]
    previousPeriod = calculatedResults[i - 1]
    
    // Calculate period-over-period changes
    // TEST: Revenue growth calculation
    revenueGrowth = calculateGrowthRate(
      previousPeriod.incomeStatement.netRevenue,
      currentPeriod.incomeStatement.netRevenue
    )
    
    // TEST: Profitability trend calculation
    profitabilityTrend = calculateGrowthRate(
      previousPeriod.incomeStatement.netIncome,
      currentPeriod.incomeStatement.netIncome
    )
    
    // TEST: Working capital trend calculation
    workingCapitalTrend = calculateGrowthRate(
      previousPeriod.balanceSheet.workingCapital,
      currentPeriod.balanceSheet.workingCapital
    )
    
    // Create trend analysis object
    // TEST: Trend analysis object creation
    trendAnalysis = new TrendAnalysis({
      revenueGrowth: revenueGrowth,
      profitabilityTrend: profitabilityTrend,
      workingCapitalTrend: workingCapitalTrend,
      periodComparison: {
        current: currentPeriod.periodIndex,
        previous: previousPeriod.periodIndex
      }
    })
    
    // Attach trend analysis to current period
    currentPeriod.trendAnalysis = trendAnalysis
}

// TEST: Calculates growth rate with proper handling of edge cases
// TEST: Handles zero and negative base values appropriately
function calculateGrowthRate(previousValue: number, currentValue: number): number {
  if previousValue === 0:
    return currentValue > 0 ? POSITIVE_INFINITY_INDICATOR : 0
  
  return ((currentValue - previousValue) / abs(previousValue)) * 100
}
```

## 9. Validation and Error Handling

```typescript
// TEST: Validates input parameters comprehensively
// TEST: Throws appropriate errors for invalid inputs
function validateInputParameters(
  companyInfo: CompanyInfo,
  rawDataArray: RawFinancialData[]
): void {
  
  // Company info validation
  // TEST: Company info validation rules
  if !companyInfo || !companyInfo.name:
    throw new ValidationError("Company name is required")
  
  if !companyInfo.periodType:
    throw new ValidationError("Period type is required")
  
  // Raw data array validation
  // TEST: Raw data array validation rules
  if !rawDataArray || rawDataArray.length === 0:
    throw new ValidationError("At least one period of data is required")
  
  if rawDataArray.length > MAX_PERIODS:
    throw new ValidationError(`Maximum ${MAX_PERIODS} periods allowed`)
  
  // Individual period validation
  // TEST: Individual period data validation
  for each period in rawDataArray:
    validatePeriodData(period)
}

// TEST: Validates individual period data
// TEST: Checks business rules and data consistency
function validatePeriodData(rawData: RawFinancialData): void {
  
  // Revenue validation
  // TEST: Revenue validation rules
  if rawData.grossRevenue && rawData.grossRevenue < 0:
    throw new ValidationError("Gross revenue cannot be negative")
  
  if rawData.netRevenue && rawData.grossRevenue && rawData.netRevenue > rawData.grossRevenue:
    throw new ValidationError("Net revenue cannot exceed gross revenue")
  
  // Balance sheet validation
  // TEST: Balance sheet validation rules
  if rawData.currentAssets && rawData.currentAssets < 0:
    throw new ValidationError("Current assets cannot be negative")
  
  if rawData.currentLiabilities && rawData.currentLiabilities < 0:
    throw new ValidationError("Current liabilities cannot be negative")
  
  // Business logic validation
  // TEST: Business logic validation rules
  if rawData.grossProfit && rawData.netRevenue && rawData.costOfGoodsSold:
    expectedGrossProfit = rawData.netRevenue - rawData.costOfGoodsSold
    if abs(rawData.grossProfit - expectedGrossProfit) > CALCULATION_TOLERANCE:
      throw new ValidationError("Gross profit calculation inconsistency detected")
}
```

## 10. Constants and Configuration

```typescript
// Calculation constants
const BALANCE_TOLERANCE = 0.01              // Balance sheet equation tolerance
const CALCULATION_TOLERANCE = 0.01          // General calculation tolerance
const INVENTORY_ESTIMATION_FACTOR = 0.3     // Estimated inventory as % of current assets
const MAX_PERIODS = 6                       // Maximum periods for analysis
const POSITIVE_INFINITY_INDICATOR = 999999  // Indicator for infinite ratios
const INFINITY_INDICATOR = 999999           // General infinity indicator

// Brazilian accounting standards
const BRAZILIAN_CURRENCY = "BRL"
const DECIMAL_PLACES = 2
const THOUSANDS_SEPARATOR = "."
const DECIMAL_SEPARATOR = ","

// Working capital quality thresholds
const EXCELLENT_WC_RATIO_MIN = 2.0
const GOOD_WC_RATIO_MIN = 1.5
const FAIR_WC_RATIO_MIN = 1.0
```

---

**Document Version:** 1.0  
**Dependencies:** [`02_domain_model_specification.md`](docs/02_domain_model_specification.md)  
**Next Module:** AI Service Integration Pseudocode  
**TDD Coverage:** 45+ test anchors covering all major calculation paths and edge cases