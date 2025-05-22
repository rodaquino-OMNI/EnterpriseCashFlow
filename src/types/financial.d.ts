// src/types/financial.d.ts

// Define a type for the keys in fieldDefinitions
export type FieldKey =
| 'revenue'
| 'grossMarginPercentage'
| 'operatingExpenses'
| 'depreciationAndAmortisation'
| 'netInterestExpenseIncome'
| 'incomeTaxRatePercentage'
| 'dividendsPaid'
| 'extraordinaryItems'
| 'capitalExpenditures'
| 'openingCash'
| 'accountsReceivableValueAvg'
| 'inventoryValueAvg' // CHANGED from inventoryDays
| 'netFixedAssets'
| 'accountsPayableValueAvg'
| 'totalBankLoans'
| 'initialEquity';

export interface FieldDefinition {
  label: string;
  type: 'currency' | 'percentage' | 'days';
  group: 'P&L' | 'Balance Sheet' | 'Cash Flow';
  note?: string;
  firstPeriodOnly?: boolean;
  required?: boolean;
  validation?: (value: number | null | undefined) => string | null;
}

export type FieldDefinitions = Record<FieldKey, FieldDefinition>;

export interface PeriodInputData {
  revenue?: number | null;
  grossMarginPercentage?: number | null;
  operatingExpenses?: number | null;
  depreciationAndAmortisation?: number | null;
  netInterestExpenseIncome?: number | null;
  incomeTaxRatePercentage?: number | null;
  dividendsPaid?: number | null;
  extraordinaryItems?: number | null;
  capitalExpenditures?: number | null;
  openingCash?: number | null;
  accountsReceivableValueAvg?: number | null;
  inventoryValueAvg?: number | null; // CHANGED: Now input value
  netFixedAssets?: number | null;
  accountsPayableValueAvg?: number | null;
  totalBankLoans?: number | null;
  initialEquity?: number | null;
  // Legacy or other fields
  inventoryDays?: number | null; // Keep for potential legacy or if user inputs days by mistake
  [key: string]: number | null | undefined; // Allow other keys for flexibility
}

export interface CalculatedPeriodData extends PeriodInputData {
  // P&L Calculated
  cogs: number;
  grossProfit: number;
  gmPct: number; // Gross Margin Percentage (0-100 scale)
  ebitda: number;
  ebit: number; // Operating Profit
  opProfitPct: number; // Operating Profit Percentage (0-100 scale)
  pbt: number;
  incomeTaxRatePercentageActual: number; // Tax rate as decimal (0-1 scale)
  incomeTax: number;
  netProfit: number;
  netProfitPct: number; // Net Profit Percentage (0-100 scale)
  retainedProfit: number;

  // Balance Sheet & WC Calculated/Derived
  closingCash: number;

  // Input values (what user provides for WC components)
  // accountsReceivableValueAvg is already in PeriodInputData
  // inventoryValueAvg is now in PeriodInputData 
  // accountsPayableValueAvg is already in PeriodInputData

  // Derived days (what system calculates)
  arDaysDerived: number;
  inventoryDaysDerived: number; // CHANGED: Now calculated
  apDaysDerived: number;
  
  inventoryValue: number; // This will be inventoryValueAvg for consistency in BS display after derivation
  wcDays: number;

  estimatedCurrentAssets: number;
  estimatedTotalAssets: number;
  estimatedTotalLiabilities: number;
  equity: number;
  balanceSheetDifference: number;

  // Working Capital Analysis
  workingCapitalValue: number;
  workingCapitalChange: number;
  arPer100Revenue: number;
  inventoryPer100Revenue: number;
  apPer100Revenue: number;
  wcPer100Revenue: number;

  // Cash Flow Analysis
  operatingCashFlow: number;
  cashFromOpsAfterWC: number;
  netCashFlowBeforeFinancing: number;
  changeInDebt: number;
  cashFlowFromFinancing: number;
  netChangeInCash: number; 
  fundingGapOrSurplus: number;
}

export type PeriodTypeOption = 'anos' | 'trimestres' | 'meses';
export type InputMethodOption = 'manual' | 'excel';

export interface CompanyInfo {
  name: string;
  reportTitle: string;
  periodType: PeriodTypeOption;
  numberOfPeriods: number;
}