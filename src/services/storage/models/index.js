/**
 * @fileoverview Data models for storage
 */

/**
 * Project model
 * @typedef {Object} Project
 * @property {string} id - Unique project ID
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} userId - Owner user ID
 * @property {ProjectSettings} settings - Project settings
 * @property {string[]} scenarioIds - Associated scenario IDs
 * @property {string[]} reportIds - Associated report IDs
 * @property {Object} metadata - Additional metadata
 */

/**
 * Project settings
 * @typedef {Object} ProjectSettings
 * @property {string} currency - Default currency (e.g., 'USD')
 * @property {string} fiscalYearEnd - Fiscal year end month (e.g., 'December')
 * @property {string} industry - Industry classification
 * @property {string} companySize - Company size classification
 * @property {Object} preferences - User preferences for this project
 */

/**
 * Scenario model
 * @typedef {Object} Scenario
 * @property {string} id - Unique scenario ID
 * @property {string} projectId - Parent project ID
 * @property {string} name - Scenario name
 * @property {string} description - Scenario description
 * @property {string} type - Scenario type (base, optimistic, pessimistic, custom)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {ScenarioData} data - Scenario financial data
 * @property {ScenarioAssumptions} assumptions - Scenario assumptions
 * @property {Object} metadata - Additional metadata
 */

/**
 * Scenario data
 * @typedef {Object} ScenarioData
 * @property {PeriodData[]} periods - Financial data for each period
 * @property {string} periodType - Period type (months, quarters, years)
 * @property {number} periodCount - Number of periods
 * @property {Date} startDate - Start date of first period
 */

/**
 * Period data
 * @typedef {Object} PeriodData
 * @property {number} periodNumber - Period number (1-based)
 * @property {Date} startDate - Period start date
 * @property {Date} endDate - Period end date
 * @property {FinancialData} financials - Financial data for the period
 */

/**
 * Financial data
 * @typedef {Object} FinancialData
 * @property {IncomeStatementData} incomeStatement - Income statement data
 * @property {BalanceSheetData} balanceSheet - Balance sheet data
 * @property {CashFlowData} cashFlow - Cash flow data
 * @property {WorkingCapitalData} workingCapital - Working capital data
 */

/**
 * Income statement data
 * @typedef {Object} IncomeStatementData
 * @property {number} revenue - Total revenue
 * @property {number} cogs - Cost of goods sold
 * @property {number} grossProfit - Gross profit
 * @property {number} operatingExpenses - Operating expenses
 * @property {number} ebitda - EBITDA
 * @property {number} depreciation - Depreciation
 * @property {number} interestExpense - Interest expense
 * @property {number} taxExpense - Tax expense
 * @property {number} netIncome - Net income
 */

/**
 * Balance sheet data
 * @typedef {Object} BalanceSheetData
 * @property {number} cash - Cash and cash equivalents
 * @property {number} accountsReceivable - Accounts receivable
 * @property {number} inventory - Inventory
 * @property {number} otherCurrentAssets - Other current assets
 * @property {number} ppe - Property, plant, and equipment
 * @property {number} otherNonCurrentAssets - Other non-current assets
 * @property {number} accountsPayable - Accounts payable
 * @property {number} shortTermDebt - Short-term debt
 * @property {number} otherCurrentLiabilities - Other current liabilities
 * @property {number} longTermDebt - Long-term debt
 * @property {number} otherNonCurrentLiabilities - Other non-current liabilities
 * @property {number} equity - Total equity
 */

/**
 * Cash flow data
 * @typedef {Object} CashFlowData
 * @property {number} operatingCashFlow - Cash from operations
 * @property {number} investingCashFlow - Cash from investing
 * @property {number} financingCashFlow - Cash from financing
 * @property {number} freeCashFlow - Free cash flow
 * @property {number} beginningCash - Beginning cash balance
 * @property {number} endingCash - Ending cash balance
 */

/**
 * Working capital data
 * @typedef {Object} WorkingCapitalData
 * @property {number} daysReceivables - Days sales outstanding
 * @property {number} daysInventory - Days inventory outstanding
 * @property {number} daysPayables - Days payables outstanding
 * @property {number} cashConversionCycle - Cash conversion cycle
 * @property {number} workingCapital - Net working capital
 * @property {number} workingCapitalChange - Change in working capital
 */

/**
 * Scenario assumptions
 * @typedef {Object} ScenarioAssumptions
 * @property {GrowthAssumptions} growth - Growth assumptions
 * @property {MarginAssumptions} margins - Margin assumptions
 * @property {WorkingCapitalAssumptions} workingCapital - Working capital assumptions
 * @property {CapexAssumptions} capex - Capex assumptions
 * @property {FinancingAssumptions} financing - Financing assumptions
 */

/**
 * Report model
 * @typedef {Object} Report
 * @property {string} id - Unique report ID
 * @property {string} projectId - Parent project ID
 * @property {string} scenarioId - Associated scenario ID
 * @property {string} name - Report name
 * @property {string} type - Report type (standard, custom, executive)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} generatedAt - Generation timestamp
 * @property {ReportContent} content - Report content
 * @property {ReportSettings} settings - Report settings
 * @property {Object} metadata - Additional metadata
 */

/**
 * Report content
 * @typedef {Object} ReportContent
 * @property {ExecutiveSummary} executiveSummary - Executive summary
 * @property {KPIData} kpis - Key performance indicators
 * @property {FinancialStatements} financialStatements - Financial statements
 * @property {ChartData[]} charts - Chart data
 * @property {AnalysisResults} analysis - Analysis results
 * @property {Recommendations[]} recommendations - Recommendations
 */

/**
 * Report settings
 * @typedef {Object} ReportSettings
 * @property {string} template - Report template
 * @property {string[]} sections - Included sections
 * @property {string} format - Output format (pdf, excel, html)
 * @property {boolean} includeCharts - Include charts
 * @property {boolean} includeAnalysis - Include AI analysis
 * @property {Object} customization - Custom settings
 */

/**
 * User preferences model
 * @typedef {Object} UserPreferences
 * @property {string} id - User ID
 * @property {string} theme - UI theme (light, dark)
 * @property {string} locale - User locale
 * @property {string} currency - Default currency
 * @property {string} dateFormat - Date format preference
 * @property {string} numberFormat - Number format preference
 * @property {AIProviderSettings} aiProvider - AI provider settings
 * @property {ExportSettings} exportSettings - Export settings
 * @property {NotificationSettings} notifications - Notification settings
 * @property {Object} customSettings - Custom settings
 */

/**
 * AI provider settings
 * @typedef {Object} AIProviderSettings
 * @property {string} defaultProvider - Default AI provider
 * @property {Object} apiKeys - Encrypted API keys
 * @property {Object} preferences - Provider-specific preferences
 */

/**
 * Auto-save state model
 * @typedef {Object} AutoSaveState
 * @property {string} id - State ID
 * @property {string} entityType - Entity type (project, scenario, report)
 * @property {string} entityId - Entity ID
 * @property {Date} timestamp - Save timestamp
 * @property {Object} data - Saved data
 * @property {boolean} isDraft - Is draft state
 */

// Model validation schemas
export const ModelSchemas = {
  project: {
    required: ['id', 'name', 'createdAt', 'updatedAt', 'userId'],
    types: {
      id: 'string',
      name: 'string',
      description: 'string',
      createdAt: 'date',
      updatedAt: 'date',
      userId: 'string',
      settings: 'object',
      scenarioIds: 'array',
      reportIds: 'array',
      metadata: 'object',
    },
  },
  scenario: {
    required: ['id', 'projectId', 'name', 'type', 'createdAt', 'updatedAt', 'data'],
    types: {
      id: 'string',
      projectId: 'string',
      name: 'string',
      description: 'string',
      type: 'string',
      createdAt: 'date',
      updatedAt: 'date',
      data: 'object',
      assumptions: 'object',
      metadata: 'object',
    },
  },
  report: {
    required: ['id', 'projectId', 'scenarioId', 'name', 'type', 'createdAt', 'content'],
    types: {
      id: 'string',
      projectId: 'string',
      scenarioId: 'string',
      name: 'string',
      type: 'string',
      createdAt: 'date',
      generatedAt: 'date',
      content: 'object',
      settings: 'object',
      metadata: 'object',
    },
  },
};

// Export model factory functions
export const createProject = (data) => ({
  id: data.id || generateId('project'),
  name: data.name,
  description: data.description || '',
  createdAt: data.createdAt || new Date(),
  updatedAt: data.updatedAt || new Date(),
  userId: data.userId,
  settings: data.settings || getDefaultProjectSettings(),
  scenarioIds: data.scenarioIds || [],
  reportIds: data.reportIds || [],
  metadata: data.metadata || {},
});

export const createScenario = (data) => ({
  id: data.id || generateId('scenario'),
  projectId: data.projectId,
  name: data.name,
  description: data.description || '',
  type: data.type || 'base',
  createdAt: data.createdAt || new Date(),
  updatedAt: data.updatedAt || new Date(),
  data: data.data,
  assumptions: data.assumptions || getDefaultAssumptions(),
  metadata: data.metadata || {},
});

export const createReport = (data) => ({
  id: data.id || generateId('report'),
  projectId: data.projectId,
  scenarioId: data.scenarioId,
  name: data.name,
  type: data.type || 'standard',
  createdAt: data.createdAt || new Date(),
  generatedAt: data.generatedAt || new Date(),
  content: data.content,
  settings: data.settings || getDefaultReportSettings(),
  metadata: data.metadata || {},
});

// Helper functions
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultProjectSettings() {
  return {
    currency: 'USD',
    fiscalYearEnd: 'December',
    industry: 'General',
    companySize: 'Medium',
    preferences: {},
  };
}

function getDefaultAssumptions() {
  return {
    growth: {},
    margins: {},
    workingCapital: {},
    capex: {},
    financing: {},
  };
}

function getDefaultReportSettings() {
  return {
    template: 'standard',
    sections: ['summary', 'kpis', 'financials', 'charts', 'analysis'],
    format: 'html',
    includeCharts: true,
    includeAnalysis: true,
    customization: {},
  };
}

// Model validation function
export function validateModel(model, type) {
  const schema = ModelSchemas[type];
  if (!schema) {
    throw new Error(`Unknown model type: ${type}`);
  }

  const errors = [];

  // Check required fields
  schema.required.forEach(field => {
    if (!model.hasOwnProperty(field) || model[field] === null || model[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check field types
  Object.entries(schema.types).forEach(([field, expectedType]) => {
    if (model.hasOwnProperty(field) && model[field] !== null && model[field] !== undefined) {
      const actualType = getType(model[field]);
      if (actualType !== expectedType) {
        errors.push(`Invalid type for field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

function getType(value) {
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}