// src/services/ai/templates/PromptTemplates.js
import { formatCurrency, formatPercentage, formatDays } from '../../../utils/formatters';
import { PERIOD_TYPES } from '../../../utils/constants';

/**
 * Base template class for financial analysis prompts
 */
export class PromptTemplate {
  constructor(options = {}) {
    this.language = options.language || 'pt-BR';
    this.currency = options.currency || 'BRL';
    this.dateFormat = options.dateFormat || 'DD/MM/YYYY';
  }

  /**
   * Build financial context from data
   * @protected
   */
  buildFinancialContext(financialData, companyInfo) {
    const { calculatedData } = financialData;
    if (!calculatedData?.length) return '';

    let context = `COMPANY: ${companyInfo.name}\n`;
    context += `ANALYSIS: ${companyInfo.reportTitle}\n`;
    context += `PERIODS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})\n\n`;

    context += this.buildFinancialSummary(calculatedData, companyInfo.periodType);
    return context;
  }

  /**
   * Build detailed financial summary
   * @protected
   */
  buildFinancialSummary(periods, periodType) {
    let summary = 'FINANCIAL DATA BY PERIOD:\n\n';

    periods.forEach((period, index) => {
      summary += `--- PERIOD ${index + 1} ---\n`;
      summary += this.formatPeriodData(period);
      summary += '\n';
    });

    return summary;
  }

  /**
   * Format period data for prompt
   * @protected
   */
  formatPeriodData(period) {
    return `
Revenue: ${formatCurrency(period.revenue)}
COGS: ${formatCurrency(period.cogs)}
Gross Profit: ${formatCurrency(period.grossProfit)} (Margin: ${formatPercentage(period.gmPct)})
Operating Expenses: ${formatCurrency(period.operatingExpenses)}
EBITDA: ${formatCurrency(period.ebitda)}
EBIT: ${formatCurrency(period.ebit)} (Margin: ${formatPercentage(period.opProfitPct)})
Net Profit: ${formatCurrency(period.netProfit)} (Margin: ${formatPercentage(period.netProfitPct)})

Working Capital: ${formatCurrency(period.workingCapitalValue)}
Cash Cycle: ${formatDays(period.wcDays)}
AR Days: ${formatDays(period.arDaysDerived)}
Inventory Days: ${formatDays(period.inventoryDaysDerived)}
AP Days: ${formatDays(period.apDaysDerived)}

Operating Cash Flow: ${formatCurrency(period.operatingCashFlow)}
Free Cash Flow: ${formatCurrency(period.netCashFlowBeforeFinancing)}
Closing Cash: ${formatCurrency(period.closingCash)}
`;
  }
}

/**
 * Executive Summary Prompt Template
 */
export class ExecutiveSummaryTemplate extends PromptTemplate {
  generate(financialData, companyInfo, options = {}) {
    const context = this.buildFinancialContext(financialData, companyInfo);
    
    return `You are a senior financial consultant with 20+ years of experience in business analysis.

${context}

EXECUTIVE ANALYSIS REQUIREMENTS:

1. CURRENT SITUATION (Based on Latest Period):
   - Overall financial health assessment (Critical/Alert/Stable/Strong/Excellent)
   - Top 3 financial strengths with quantification
   - Top 3 risks or concerns with impact analysis

2. TREND ANALYSIS (If Multiple Periods):
   - Revenue and profitability evolution
   - Operational efficiency trends
   - Cash generation capacity

3. KEY INSIGHTS:
   - Most significant findings
   - Critical metrics requiring attention
   - Strategic opportunities identified

4. RECOMMENDATIONS (Top 3-4):
   - Immediate actions for next 30-90 days
   - Expected impact and priority level

FORMAT: Executive briefing style, concise and actionable
LANGUAGE: ${this.language === 'pt-BR' ? 'Portuguese (Brazil)' : 'English'}
`;
  }
}

/**
 * Risk Assessment Prompt Template
 */
export class RiskAssessmentTemplate extends PromptTemplate {
  generate(financialData, companyInfo, options = {}) {
    const context = this.buildFinancialContext(financialData, companyInfo);
    
    return `You are a financial risk management expert specializing in liquidity, solvency, and business sustainability.

${context}

RISK ASSESSMENT FRAMEWORK:

1. LIQUIDITY RISKS:
   - Cash position adequacy
   - Short-term obligations coverage
   - Operating cash flow quality
   - Cash conversion cycle

2. OPERATIONAL RISKS:
   - Margin sustainability
   - Revenue concentration
   - Cost structure flexibility
   - Working capital efficiency

3. FINANCIAL STRUCTURE RISKS:
   - Debt levels and coverage
   - Interest coverage ratio
   - Funding gap analysis
   - Capital structure optimization

4. STRATEGIC RISKS:
   - Business model sustainability
   - Market position vulnerabilities
   - Growth constraints

DELIVERABLES:
- Risk matrix with probability and impact
- Top 5 prioritized risks with mitigation strategies
- Early warning indicators
- Risk monitoring recommendations

FORMAT: Structured risk report with quantification
LANGUAGE: ${this.language === 'pt-BR' ? 'Portuguese (Brazil)' : 'English'}
`;
  }
}

/**
 * Cash Flow Analysis Prompt Template
 */
export class CashFlowAnalysisTemplate extends PromptTemplate {
  generate(financialData, companyInfo, options = {}) {
    const context = this.buildFinancialContext(financialData, companyInfo);
    
    return `You are a cash flow and treasury management specialist.

${context}

CASH FLOW ANALYSIS OBJECTIVES:

1. OPERATING CASH FLOW:
   - Quality and sustainability assessment
   - Comparison with net profit
   - Key drivers and detractors

2. WORKING CAPITAL IMPACT:
   - Investment trends
   - Efficiency opportunities
   - Cycle optimization potential

3. INVESTMENT ACTIVITIES:
   - CAPEX levels and alignment
   - Investment strategy assessment
   - ROI considerations

4. FINANCING ACTIVITIES:
   - Debt management effectiveness
   - Dividend policy impact
   - Capital structure optimization

5. CASH POSITION:
   - Adequacy for operations
   - Liquidity buffer analysis
   - Funding requirements forecast

RECOMMENDATIONS:
- Top 3 cash optimization opportunities
- Working capital improvement strategies
- Financing structure suggestions

FORMAT: Detailed cash flow diagnostic with actionable insights
LANGUAGE: ${this.language === 'pt-BR' ? 'Portuguese (Brazil)' : 'English'}
`;
  }
}

/**
 * Variance Analysis Prompt Template
 */
export class VarianceAnalysisTemplate extends PromptTemplate {
  generate(financialData, companyInfo, options = {}) {
    const context = this.buildFinancialContext(financialData, companyInfo);
    
    return `You are a senior financial analyst specializing in variance analysis and root cause identification.

${context}

VARIANCE ANALYSIS REQUIREMENTS:

1. PERIOD-OVER-PERIOD ANALYSIS:
   - Calculate variances (absolute and %) for key metrics
   - Compare: Last vs Previous AND Last vs First period
   - Focus on: Revenue, Margins, Cash Flow, Working Capital

2. ROOT CAUSE ANALYSIS:
   - Identify primary drivers for significant variances
   - Distinguish between operational and market factors
   - Quantify impact of each driver

3. TREND PATTERNS:
   - Identify accelerating or decelerating trends
   - Correlation between different metrics
   - Sustainability assessment

4. STRATEGIC QUESTIONS:
   - Formulate 3-4 critical questions for management
   - Focus on variance explanations and future actions

DELIVERABLES:
- Variance table with calculations
- Top 5 most significant changes with causes
- Trend insights and correlations
- Management discussion points

FORMAT: Analytical report with data tables
LANGUAGE: ${this.language === 'pt-BR' ? 'Portuguese (Brazil)' : 'English'}
`;
  }
}

/**
 * Data Extraction Prompt Template
 */
export class DataExtractionTemplate extends PromptTemplate {
  generate(content, schema, sourceType, options = {}) {
    const schemaJson = JSON.stringify(schema, null, 2);
    
    return `You are a financial data extraction specialist with expertise in parsing ${sourceType} documents.

EXTRACTION TASK:
Extract financial data from the provided content according to the schema below.

SCHEMA:
${schemaJson}

EXTRACTION RULES:
1. Extract ONLY fields specified in the schema
2. Use null for missing or unclear values
3. Parse numbers correctly:
   - Remove currency symbols (R$, $, €, etc.)
   - Handle thousand separators (. or ,) based on locale
   - Handle decimal separators (, or .) based on locale
   - For Brazilian format: R$ 1.234,56 = 1234.56

4. Date formats should be normalized to YYYY-MM-DD
5. Percentages should be decimal (5% = 0.05)
6. Maintain data type consistency with schema

CONTENT TO EXTRACT FROM:
${content}

RESPONSE FORMAT:
Return ONLY valid JSON matching the schema structure.
If multiple periods are found, return as array.
Include confidence indicators where applicable.
`;
  }
}

/**
 * Insight Generation Prompt Template
 */
export class InsightGenerationTemplate extends PromptTemplate {
  generate(financialData, companyInfo, focusAreas = [], options = {}) {
    const context = this.buildFinancialContext(financialData, companyInfo);
    const areas = focusAreas.length > 0 ? focusAreas.join(', ') : 'all financial aspects';
    
    return `You are an AI-powered financial insight generator with pattern recognition capabilities.

${context}

INSIGHT GENERATION TASK:
Generate actionable insights focusing on: ${areas}

INSIGHT CATEGORIES:

1. HIDDEN PATTERNS:
   - Correlations between metrics
   - Anomalies or outliers
   - Cyclical patterns

2. PREDICTIVE INDICATORS:
   - Leading indicators of performance
   - Risk signals
   - Opportunity indicators

3. COMPARATIVE INSIGHTS:
   - Benchmark implications
   - Peer comparison insights
   - Best practice gaps

4. STRATEGIC IMPLICATIONS:
   - Business model insights
   - Competitive positioning
   - Growth opportunities

REQUIREMENTS:
- Each insight must be data-driven
- Include quantification and impact
- Provide actionability score (1-5)
- Suggest validation methods

FORMAT: Structured insights with evidence and recommendations
LANGUAGE: ${this.language === 'pt-BR' ? 'Portuguese (Brazil)' : 'English'}
`;
  }
}

/**
 * Template Factory
 */
export class PromptTemplateFactory {
  static templates = {
    executive_summary: ExecutiveSummaryTemplate,
    risk_assessment: RiskAssessmentTemplate,
    cash_flow_analysis: CashFlowAnalysisTemplate,
    variance_analysis: VarianceAnalysisTemplate,
    data_extraction: DataExtractionTemplate,
    insight_generation: InsightGenerationTemplate
  };

  static create(type, options = {}) {
    const TemplateClass = this.templates[type];
    if (!TemplateClass) {
      throw new Error(`Unknown prompt template type: ${type}`);
    }
    return new TemplateClass(options);
  }

  static registerTemplate(type, templateClass) {
    this.templates[type] = templateClass;
  }
}