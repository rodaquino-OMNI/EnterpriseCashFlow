# EnterpriseCashFlow - Domain Model Specification

## 1. Domain Overview

The EnterpriseCashFlow domain encompasses financial data processing, multi-modal AI analysis, and enterprise reporting. The system transforms raw financial inputs through sophisticated calculation engines to produce actionable business insights.

### 1.1 Core Domain Concepts
- **Financial Periods:** Time-based data containers (months, quarters, years)
- **Multi-modal Input:** Manual, Excel, PDF data sources with unified processing
- **AI Analysis Engine:** Multi-provider intelligence for financial insights
- **Calculation Engine:** Brazilian accounting standards compliance
- **Reporting System:** Interactive dashboards and professional exports

### 1.2 Domain Boundaries
- **Input Processing:** Data validation, parsing, and normalization
- **Financial Calculations:** P&L, Balance Sheet, Cash Flow, KPIs
- **AI Integration:** Multi-provider analysis with quality scoring
- **Visualization:** Charts, tables, and export generation
- **State Management:** Session persistence and error handling

## 2. Core Entities

### 2.1 Company Information Entity
```typescript
interface CompanyInfo {
  name: string                    // Company legal name
  reportTitle: string            // Custom report title
  periodType: PeriodType         // MONTHLY | QUARTERLY | YEARLY
  analysisDate: Date             // Report generation timestamp
  currency: CurrencyCode         // Default: BRL (Brazilian Real)
  fiscalYearStart: Month         // Default: January
  industry?: IndustryCode        // Optional industry classification
  size?: CompanySize            // SMALL | MEDIUM | LARGE | ENTERPRISE
}

enum PeriodType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY", 
  YEARLY = "YEARLY"
}

enum CompanySize {
  SMALL = "SMALL",           // < R$ 4.8M revenue
  MEDIUM = "MEDIUM",         // R$ 4.8M - R$ 300M revenue  
  LARGE = "LARGE",           // R$ 300M - R$ 1B revenue
  ENTERPRISE = "ENTERPRISE"   // > R$ 1B revenue
}
```

### 2.2 Financial Period Entity
```typescript
interface FinancialPeriod {
  periodIndex: number           // 0-based period sequence
  periodLabel: string          // "Q1 2024", "Jan 2024", etc.
  startDate: Date             // Period start date
  endDate: Date               // Period end date
  daysInPeriod: number        // Calendar days count
  isComplete: boolean         // Data completeness flag
  dataSource: DataSource      // Input method used
  lastModified: Date          // Last update timestamp
}

enum DataSource {
  MANUAL = "MANUAL",
  EXCEL = "EXCEL", 
  PDF = "PDF",
  API = "API"                 // Future integration
}
```

### 2.3 Raw Financial Data Entity
```typescript
interface RawFinancialData {
  periodIndex: number
  
  // Revenue Components
  grossRevenue?: number           // Receita Bruta
  salesDeductions?: number        // Deduções de Vendas
  netRevenue?: number            // Receita Líquida
  
  // Cost Structure  
  costOfGoodsSold?: number       // Custo dos Produtos Vendidos (CPV)
  grossProfit?: number           // Lucro Bruto
  grossMarginPercent?: number    // Margem Bruta %
  
  // Operating Expenses
  salesExpenses?: number         // Despesas de Vendas
  administrativeExpenses?: number // Despesas Administrativas
  operatingExpenses?: number     // Despesas Operacionais Totais
  
  // Financial Results
  financialRevenues?: number     // Receitas Financeiras
  financialExpenses?: number     // Despesas Financeiras
  netFinancialResult?: number    // Resultado Financeiro Líquido
  
  // Profitability
  ebitda?: number               // EBITDA
  ebit?: number                 // EBIT (Resultado Operacional)
  netIncome?: number            // Lucro Líquido
  
  // Balance Sheet Items
  currentAssets?: number        // Ativo Circulante
  nonCurrentAssets?: number     // Ativo Não Circulante
  totalAssets?: number          // Ativo Total
  currentLiabilities?: number   // Passivo Circulante
  nonCurrentLiabilities?: number // Passivo Não Circulante
  equity?: number               // Patrimônio Líquido
  
  // Working Capital Components
  accountsReceivable?: number   // Contas a Receber
  inventory?: number            // Estoque
  accountsPayable?: number      // Contas a Pagar
  
  // Cash Flow Items
  operatingCashFlow?: number    // Fluxo de Caixa Operacional
  investingCashFlow?: number    // Fluxo de Caixa de Investimento
  financingCashFlow?: number    // Fluxo de Caixa de Financiamento
  
  // Override Fields (for manual adjustments)
  overrides?: Record<string, number>
  
  // Metadata
  dataQuality: DataQuality
  validationErrors: ValidationError[]
  calculationNotes: string[]
}

enum DataQuality {
  EXCELLENT = "EXCELLENT",     // 95-100% complete
  GOOD = "GOOD",              // 80-94% complete  
  FAIR = "FAIR",              // 60-79% complete
  POOR = "POOR"               // < 60% complete
}
```

### 2.4 Calculated Financial Data Entity
```typescript
interface CalculatedFinancialData {
  periodIndex: number
  companyInfo: CompanyInfo
  
  // Core Financial Statements
  incomeStatement: IncomeStatement
  balanceSheet: BalanceSheet
  cashFlowStatement: CashFlowStatement
  
  // Financial Ratios & KPIs
  profitabilityRatios: ProfitabilityRatios
  liquidityRatios: LiquidityRatios
  efficiencyRatios: EfficiencyRatios
  leverageRatios: LeverageRatios
  
  // Working Capital Analysis
  workingCapitalAnalysis: WorkingCapitalAnalysis
  
  // Trend Analysis (vs previous period)
  trendAnalysis?: TrendAnalysis
  
  // Power of One Analysis
  powerOfOneAnalysis: PowerOfOneAnalysis
  
  // Calculation Metadata
  calculationEngine: CalculationEngineInfo
  auditTrail: CalculationAuditEntry[]
  validationResults: ValidationResults
}

interface IncomeStatement {
  grossRevenue: number
  netRevenue: number
  grossProfit: number
  grossMarginPercent: number
  operatingExpenses: number
  ebitda: number
  ebit: number
  netFinancialResult: number
  netIncome: number
  netMarginPercent: number
}

interface BalanceSheet {
  totalAssets: number
  currentAssets: number
  nonCurrentAssets: number
  totalLiabilities: number
  currentLiabilities: number
  nonCurrentLiabilities: number
  equity: number
  workingCapital: number
}

interface CashFlowStatement {
  operatingCashFlow: number
  investingCashFlow: number
  financingCashFlow: number
  netCashFlow: number
  freeCashFlow: number
}
```

### 2.5 AI Analysis Entity
```typescript
interface AiAnalysisResult {
  analysisId: string
  analysisType: AnalysisType
  provider: AiProvider
  timestamp: Date
  
  // Analysis Content
  executiveSummary: string
  keyInsights: string[]
  recommendations: Recommendation[]
  riskAssessment: RiskAssessment
  
  // Quality Metrics
  qualityScore: number          // 0-100 scale
  confidenceLevel: ConfidenceLevel
  processingTime: number        // milliseconds
  
  // Metadata
  promptVersion: string
  modelVersion: string
  tokenUsage: TokenUsage
  
  // Validation
  validationStatus: ValidationStatus
  reviewNotes?: string[]
}

enum AnalysisType {
  EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY",
  VARIANCE_ANALYSIS = "VARIANCE_ANALYSIS", 
  RISK_ASSESSMENT = "RISK_ASSESSMENT",
  CASH_FLOW_ANALYSIS = "CASH_FLOW_ANALYSIS",
  STRATEGIC_RECOMMENDATIONS = "STRATEGIC_RECOMMENDATIONS",
  DETAILED_AUDIT = "DETAILED_AUDIT"
}

enum AiProvider {
  GEMINI = "GEMINI",
  GPT4 = "GPT4",
  CLAUDE = "CLAUDE", 
  OLLAMA = "OLLAMA"
}

interface Recommendation {
  category: RecommendationCategory
  priority: Priority
  description: string
  expectedImpact: ImpactLevel
  timeframe: Timeframe
  implementationComplexity: ComplexityLevel
}

enum RecommendationCategory {
  COST_REDUCTION = "COST_REDUCTION",
  REVENUE_GROWTH = "REVENUE_GROWTH",
  WORKING_CAPITAL = "WORKING_CAPITAL",
  CASH_MANAGEMENT = "CASH_MANAGEMENT",
  OPERATIONAL_EFFICIENCY = "OPERATIONAL_EFFICIENCY",
  RISK_MITIGATION = "RISK_MITIGATION"
}
```

### 2.6 Application State Entity
```typescript
interface ApplicationState {
  currentView: ViewState
  companyInfo: CompanyInfo
  financialPeriods: FinancialPeriod[]
  rawData: RawFinancialData[]
  calculatedData: CalculatedFinancialData[]
  aiAnalyses: AiAnalysisResult[]
  
  // UI State
  selectedPeriods: number[]
  activeCharts: ChartType[]
  reportConfiguration: ReportConfiguration
  
  // Processing State
  loadingStates: LoadingStates
  errorStates: ErrorStates
  
  // AI Configuration
  aiConfiguration: AiConfiguration
  
  // Session Management
  sessionId: string
  lastSaved: Date
  isDirty: boolean
}

enum ViewState {
  INPUT = "INPUT",
  PROCESSING = "PROCESSING", 
  ANALYSIS = "ANALYSIS",
  REPORTING = "REPORTING"
}

interface LoadingStates {
  dataLoading: boolean
  calculating: boolean
  aiAnalyzing: boolean
  exporting: boolean
}
```

## 3. Business Rules & Constraints

### 3.1 Data Validation Rules
```typescript
interface ValidationRules {
  // Period Constraints
  minimumPeriods: 2
  maximumPeriods: 6
  
  // Financial Data Constraints
  revenueValidation: {
    grossRevenue: { min: 0, required: true }
    netRevenue: { min: 0, max: "grossRevenue", required: true }
    grossMargin: { min: 0, max: 100, unit: "percentage" }
  }
  
  // Balance Sheet Validation
  balanceSheetEquation: "totalAssets === totalLiabilities + equity"
  
  // Working Capital Rules
  workingCapitalComponents: {
    accountsReceivable: { min: 0 }
    inventory: { min: 0 }
    accountsPayable: { min: 0 }
  }
  
  // Brazilian Accounting Standards
  currencyFormat: "BRL"
  decimalPlaces: 2
  thousandsSeparator: "."
  decimalSeparator: ","
}
```

### 3.2 Calculation Dependencies
```typescript
interface CalculationDependencies {
  // Income Statement Dependencies
  netRevenue: ["grossRevenue", "salesDeductions"]
  grossProfit: ["netRevenue", "costOfGoodsSold"]
  grossMargin: ["grossProfit", "netRevenue"]
  ebitda: ["grossProfit", "operatingExpenses"]
  ebit: ["ebitda", "depreciation", "amortization"]
  netIncome: ["ebit", "netFinancialResult", "taxes"]
  
  // Balance Sheet Dependencies
  totalAssets: ["currentAssets", "nonCurrentAssets"]
  totalLiabilities: ["currentLiabilities", "nonCurrentLiabilities"]
  workingCapital: ["currentAssets", "currentLiabilities"]
  
  // Cash Flow Dependencies
  freeCashFlow: ["operatingCashFlow", "capitalExpenditures"]
  netCashFlow: ["operatingCashFlow", "investingCashFlow", "financingCashFlow"]
  
  // Ratio Dependencies
  currentRatio: ["currentAssets", "currentLiabilities"]
  quickRatio: ["currentAssets", "inventory", "currentLiabilities"]
  debtToEquity: ["totalLiabilities", "equity"]
  returnOnAssets: ["netIncome", "totalAssets"]
  returnOnEquity: ["netIncome", "equity"]
}
```

### 3.3 AI Analysis Rules
```typescript
interface AiAnalysisRules {
  // Provider Selection Rules
  providerSelection: {
    executiveSummary: ["gemini", "gpt4"]      // Best for strategic insights
    varianceAnalysis: ["claude", "gemini"]    // Best for detailed analysis
    riskAssessment: ["claude", "gpt4"]       // Best for risk evaluation
    cashFlowAnalysis: ["gemini", "ollama"]   // Best for operational focus
  }
  
  // Quality Thresholds
  minimumQualityScore: 70
  retryThreshold: 50
  maxRetryAttempts: 3
  
  // Content Validation
  minimumContentLength: 500
  maximumContentLength: 5000
  requiredSections: ["summary", "insights", "recommendations"]
  
  // Rate Limiting
  maxRequestsPerMinute: 10
  maxTokensPerRequest: 4000
  cooldownPeriod: 60000  // milliseconds
}
```

## 4. Data Flow Patterns

### 4.1 Input Processing Flow
```
Raw Input → Validation → Normalization → Storage
    ↓
Manual Entry: Form Validation → Real-time Feedback
Excel Upload: File Parse → Schema Validation → Data Extraction
PDF Upload: Text Extraction → AI Processing → Data Identification
```

### 4.2 Calculation Flow
```
Raw Data → Field Validation → Dependency Resolution → Calculation Engine
    ↓
Period-by-Period Processing → Cross-Period Analysis → Trend Calculation
    ↓
Financial Statements → Ratios & KPIs → Working Capital Analysis
```

### 4.3 AI Analysis Flow
```
Calculated Data → Prompt Generation → Provider Selection → API Call
    ↓
Response Validation → Quality Scoring → Content Standardization
    ↓
Analysis Storage → UI Presentation → Export Generation
```

## 5. Error Handling Patterns

### 5.1 Validation Error Types
```typescript
enum ValidationErrorType {
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
  INVALID_DATA_TYPE = "INVALID_DATA_TYPE",
  VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  CALCULATION_DEPENDENCY_MISSING = "CALCULATION_DEPENDENCY_MISSING",
  BALANCE_SHEET_IMBALANCE = "BALANCE_SHEET_IMBALANCE"
}

interface ValidationError {
  type: ValidationErrorType
  field: string
  message: string
  severity: ErrorSeverity
  suggestedFix?: string
  relatedFields?: string[]
}

enum ErrorSeverity {
  ERROR = "ERROR",       // Blocks processing
  WARNING = "WARNING",   // Allows processing with notice
  INFO = "INFO"         // Informational only
}
```

### 5.2 Recovery Strategies
```typescript
interface ErrorRecoveryStrategy {
  validationErrors: "showInlineErrors + preventSubmission"
  calculationErrors: "fallbackToDefaults + logError + notifyUser"
  aiServiceErrors: "retryWithBackoff + fallbackProvider + gracefulDegradation"
  fileProcessingErrors: "detailedErrorReport + suggestCorrections"
  networkErrors: "offlineMode + queueRequests + autoRetry"
}
```

## 6. Performance Considerations

### 6.1 Calculation Optimization
- **Web Workers:** Heavy calculations run in background threads
- **Memoization:** Cache calculated results for unchanged inputs
- **Incremental Updates:** Recalculate only affected periods
- **Lazy Loading:** Load analysis results on demand

### 6.2 Memory Management
- **Data Pagination:** Limit in-memory period count
- **Garbage Collection:** Clear unused analysis results
- **State Compression:** Minimize stored state size
- **Session Cleanup:** Clear data on navigation away

---

**Document Version:** 1.0  
**Dependencies:** 01_project_overview_specification.md  
**Next Phase:** Component Architecture & Data Flow Design