/**
 * Comprehensive Test Data Factories for EnterpriseCashFlow Application
 * Provides extensive factory functions for creating realistic mock data for testing
 */

// Financial data factory with realistic business scenarios
export const createMockFinancialData = (overrides = {}) => {
  const defaults = {
    revenue: 1000000,
    grossMarginPercent: 45,
    operatingExpenses: 300000,
    depreciation: 20000,
    financialRevenue: 5000,
    financialExpenses: 15000,
    capex: 50000,
    
    // Working capital
    accountsReceivableDays: 45,
    inventoryDays: 30,
    accountsPayableDays: 60,
    
    // Additional fields
    debtChange: 0,
    equityChange: 0,
    dividends: 0,
    
    // Metadata
    period: 'Q1 2024',
    currency: 'BRL',
    lastUpdated: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

// Income statement factory
export const createMockIncomeStatement = (overrides = {}) => {
  const revenue = overrides.revenue || 1000000;
  const grossMarginPercent = overrides.grossMarginPercent || 45;
  const cogs = revenue * (1 - grossMarginPercent / 100);
  const grossProfit = revenue - cogs;
  const operatingExpenses = overrides.operatingExpenses || 300000;
  const ebitda = grossProfit - operatingExpenses;
  const depreciation = overrides.depreciation || 20000;
  const ebit = ebitda - depreciation;
  const netFinancialResult = (overrides.financialRevenue || 5000) - (overrides.financialExpenses || 15000);
  const ebt = ebit + netFinancialResult;
  const taxes = ebt > 0 ? ebt * 0.34 : 0;
  const netIncome = ebt - taxes;

  return {
    revenue,
    cogs: Math.round(cogs * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossMarginPercent,
    operatingExpenses,
    ebitda: Math.round(ebitda * 100) / 100,
    ebitdaMargin: Math.round((ebitda / revenue) * 10000) / 100,
    depreciation,
    ebit: Math.round(ebit * 100) / 100,
    ebitMargin: Math.round((ebit / revenue) * 10000) / 100,
    netFinancialResult: Math.round(netFinancialResult * 100) / 100,
    ebt: Math.round(ebt * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    netMargin: Math.round((netIncome / revenue) * 10000) / 100,
    ...overrides,
  };
};

// Cash flow factory
export const createMockCashFlow = (overrides = {}) => {
  const defaults = {
    operatingCashFlow: 120000,
    workingCapitalChange: -20000,
    investingCashFlow: -50000,
    capex: 50000,
    freeCashFlow: 70000,
    financingCashFlow: -30000,
    netCashFlow: 40000,
    cashConversionRate: 120,
    
    // Additional details
    debtRepayment: 0,
    debtIssuance: 0,
    equityIssuance: 0,
    dividendsPaid: 30000,
  };

  return { ...defaults, ...overrides };
};

// Working capital factory
export const createMockWorkingCapital = (overrides = {}) => {
  const defaults = {
    dso: 45,
    dio: 30,
    dpo: 60,
    cashConversionCycle: 15,
    workingCapitalValue: 170000,
    workingCapitalPercent: 17,
    accountsReceivableValue: 123287.67,
    inventoryValue: 82191.78,
    accountsPayableValue: 35479.45,
  };

  return { ...defaults, ...overrides };
};

// Balance sheet factory
export const createMockBalanceSheet = (overrides = {}) => {
  const defaults = {
    // Assets
    cash: 100000,
    accountsReceivable: 150000,
    inventory: 100000,
    currentAssets: 350000,
    fixedAssets: 450000,
    intangibleAssets: 50000,
    nonCurrentAssets: 500000,
    totalAssets: 850000,
    
    // Liabilities
    accountsPayable: 80000,
    shortTermDebt: 50000,
    currentLiabilities: 130000,
    longTermDebt: 200000,
    nonCurrentLiabilities: 200000,
    totalLiabilities: 330000,
    
    // Equity
    shareCapital: 300000,
    retainedEarnings: 220000,
    equity: 520000,
    
    // Validation
    totalLiabilitiesEquity: 850000,
    balanceCheck: 0,
    currentRatio: 2.69,
  };

  return { ...defaults, ...overrides };
};

// Financial ratios factory
export const createMockFinancialRatios = (overrides = {}) => {
  const defaults = {
    // Liquidity
    currentRatio: 2.69,
    quickRatio: 1.92,
    cashRatio: 0.77,
    
    // Leverage
    debtToEquity: 0.63,
    debtRatio: 0.39,
    equityRatio: 0.61,
    interestCoverage: 8.5,
    
    // Profitability
    roe: 11.54,
    roa: 7.06,
    roic: 10.59,
    roce: 12.5,
    
    // Efficiency
    assetTurnover: 1.18,
    inventoryTurnover: 5.5,
    receivablesTurnover: 8.11,
    
    // Market (if applicable)
    priceToEarnings: 15,
    priceToBook: 1.8,
    evToEbitda: 8.5,
  };

  return { ...defaults, ...overrides };
};

// Complete period data factory
export const createMockPeriodData = (overrides = {}) => {
  const incomeStatement = createMockIncomeStatement(overrides.incomeStatement);
  const workingCapital = createMockWorkingCapital(overrides.workingCapital);
  const cashFlow = createMockCashFlow(overrides.cashFlow);
  const balanceSheet = createMockBalanceSheet(overrides.balanceSheet);
  const ratios = createMockFinancialRatios(overrides.ratios);

  return {
    periodIndex: overrides.periodIndex || 0,
    daysInPeriod: overrides.daysInPeriod || 90,
    incomeStatement,
    cashFlow,
    workingCapital,
    balanceSheet,
    ratios,
    trends: overrides.trends || {},
    ...overrides,
  };
};

// Scenario-based factories
export const createScenarios = {
  // Healthy growing company
  healthyGrowth: (periods = 4) => {
    return Array.from({ length: periods }, (_, i) => {
      const growthRate = 1.1; // 10% quarterly growth
      const baseRevenue = 1000000;
      
      return createMockPeriodData({
        periodIndex: i,
        incomeStatement: {
          revenue: baseRevenue * Math.pow(growthRate, i),
          grossMarginPercent: 45 + i * 0.5, // Improving margins
          operatingExpenses: 300000 * Math.pow(1.05, i), // Controlled expense growth
        },
        trends: i > 0 ? {
          revenueGrowth: 10,
          marginImprovement: 0.5,
          profitGrowth: 15,
        } : {},
      });
    });
  },

  // Struggling company
  struggling: (periods = 4) => {
    return Array.from({ length: periods }, (_, i) => {
      const declineRate = 0.95; // 5% quarterly decline
      const baseRevenue = 1000000;
      
      return createMockPeriodData({
        periodIndex: i,
        incomeStatement: {
          revenue: baseRevenue * Math.pow(declineRate, i),
          grossMarginPercent: 40 - i * 2, // Deteriorating margins
          operatingExpenses: 350000, // Fixed high expenses
        },
        cashFlow: {
          operatingCashFlow: 50000 - i * 20000, // Declining cash generation
          freeCashFlow: -50000 - i * 10000, // Negative and worsening
        },
        trends: i > 0 ? {
          revenueGrowth: -5,
          marginImprovement: -2,
          profitGrowth: -20,
        } : {},
      });
    });
  },

  // Seasonal business
  seasonal: (periods = 4) => {
    const seasonalFactors = [1.5, 0.7, 0.9, 1.8]; // Q1 and Q4 are high seasons
    
    return seasonalFactors.map((factor, i) => {
      return createMockPeriodData({
        periodIndex: i,
        incomeStatement: {
          revenue: 1000000 * factor,
          grossMarginPercent: factor > 1 ? 50 : 40, // Better margins in high season
          operatingExpenses: 300000, // Fixed expenses
        },
        workingCapital: {
          inventoryDays: factor > 1 ? 45 : 60, // More inventory in low season
          dso: factor > 1 ? 40 : 55, // Slower collections in low season
        },
      });
    });
  },

  // Turnaround story
  turnaround: (periods = 6) => {
    return Array.from({ length: periods }, (_, i) => {
      const isRecoveryPhase = i >= 3;
      const baseRevenue = 800000;
      
      return createMockPeriodData({
        periodIndex: i,
        incomeStatement: {
          revenue: isRecoveryPhase 
            ? baseRevenue * (1 + (i - 2) * 0.15) 
            : baseRevenue * (1 - i * 0.1),
          grossMarginPercent: isRecoveryPhase ? 40 + (i - 2) * 2 : 35,
          operatingExpenses: isRecoveryPhase ? 280000 : 350000,
        },
        cashFlow: {
          operatingCashFlow: isRecoveryPhase ? 50000 + (i - 2) * 20000 : -50000,
          capex: isRecoveryPhase ? 30000 : 10000, // Minimal capex during crisis
        },
      });
    });
  },

  // High leverage scenario
  highLeverage: (periods = 4) => {
    return Array.from({ length: periods }, (_, i) => {
      return createMockPeriodData({
        periodIndex: i,
        incomeStatement: {
          revenue: 2000000,
          grossMarginPercent: 35,
          operatingExpenses: 500000,
          financialExpenses: 80000 + i * 10000, // Increasing interest burden
        },
        balanceSheet: {
          longTermDebt: 2000000 + i * 200000, // Growing debt
          equity: 500000 + i * 50000, // Slow equity growth
        },
        ratios: {
          debtToEquity: 4 + i * 0.3,
          interestCoverage: 3 - i * 0.5, // Deteriorating coverage
        },
      });
    });
  },
};

// Excel data factory (simulates parsed Excel data)
export const createMockExcelData = (overrides = {}) => {
  const defaults = {
    metadata: {
      fileName: 'financial_data.xlsx',
      uploadDate: new Date().toISOString(),
      fileSize: 125000,
      numberOfSheets: 3,
      version: '2.0',
    },
    sheets: {
      'Income Statement': {
        headers: ['Period', 'Revenue', 'COGS', 'Gross Profit', 'Operating Expenses', 'EBITDA'],
        data: [
          ['Q1 2024', 1000000, 550000, 450000, 300000, 150000],
          ['Q2 2024', 1100000, 595000, 505000, 320000, 185000],
          ['Q3 2024', 1200000, 636000, 564000, 340000, 224000],
          ['Q4 2024', 1300000, 676000, 624000, 360000, 264000],
        ],
      },
      'Balance Sheet': {
        headers: ['Period', 'Total Assets', 'Total Liabilities', 'Equity'],
        data: [
          ['Q1 2024', 850000, 330000, 520000],
          ['Q2 2024', 900000, 340000, 560000],
          ['Q3 2024', 950000, 350000, 600000],
          ['Q4 2024', 1000000, 360000, 640000],
        ],
      },
      'Cash Flow': {
        headers: ['Period', 'Operating CF', 'Investing CF', 'Financing CF'],
        data: [
          ['Q1 2024', 120000, -50000, -30000],
          ['Q2 2024', 140000, -60000, -40000],
          ['Q3 2024', 160000, -70000, -50000],
          ['Q4 2024', 180000, -80000, -60000],
        ],
      },
    },
    validationErrors: [],
    warnings: [],
  };

  return { ...defaults, ...overrides };
};

// PDF data factory (simulates extracted PDF data)
export const createMockPDFData = (overrides = {}) => {
  const defaults = {
    metadata: {
      fileName: 'annual_report_2024.pdf',
      pages: 120,
      extractedPages: [45, 46, 47, 89, 90],
      extractionConfidence: 0.92,
    },
    extractedText: `
      DEMONSTRAÇÃO DE RESULTADOS
      Exercício findo em 31 de dezembro de 2024
      (Em milhares de reais)
      
      Receita líquida de vendas          1.000.000
      Custo dos produtos vendidos        (550.000)
      Lucro bruto                         450.000
      
      Despesas operacionais              (300.000)
      EBITDA                              150.000
    `,
    structuredData: {
      revenue: 1000000,
      cogs: 550000,
      grossProfit: 450000,
      operatingExpenses: 300000,
      ebitda: 150000,
    },
    confidence: {
      revenue: 0.95,
      cogs: 0.93,
      grossProfit: 0.94,
      operatingExpenses: 0.89,
      ebitda: 0.91,
    },
  };

  return { ...defaults, ...overrides };
};

// AI analysis response factory
export const createMockAIAnalysis = (overrides = {}) => {
  const defaults = {
    provider: 'gemini',
    model: 'gemini-pro',
    timestamp: new Date().toISOString(),
    analysis: {
      summary: 'The company shows strong revenue growth of 10% QoQ with improving margins.',
      keyInsights: [
        'Revenue growth accelerating in recent quarters',
        'Gross margins expanding due to operational efficiency',
        'Working capital management improving with shorter cash cycle',
        'Free cash flow positive and growing',
      ],
      risks: [
        'High dependency on few major customers',
        'Increasing competition in core market',
        'Rising interest expenses due to debt levels',
      ],
      opportunities: [
        'Expand into adjacent markets',
        'Improve inventory turnover',
        'Refinance debt at lower rates',
      ],
      recommendations: [
        'Focus on customer diversification',
        'Implement cost reduction initiatives',
        'Accelerate digital transformation',
      ],
    },
    metrics: {
      analysisTime: 2500, // ms
      tokenCount: 1500,
      confidence: 0.88,
    },
  };

  return { ...defaults, ...overrides };
};

// Validation result factory
export const createMockValidationResults = (overrides = {}) => {
  const defaults = {
    isValid: true,
    critical: [],
    warnings: [
      {
        type: 'warning',
        category: 'Working Capital',
        message: 'High inventory days detected (90 days)',
        severity: 'medium',
        periodLabel: 'Q4 2024',
        suggestion: 'Review inventory management practices',
      },
    ],
    infos: [
      {
        type: 'info',
        category: 'Cash Flow',
        message: 'Strong cash conversion rate of 120%',
        severity: 'low',
        periodLabel: 'Q4 2024',
      },
    ],
    trends: [],
    latest: 4,
    summary: {
      total: 1,
      critical: 0,
      warnings: 1,
    },
  };

  return { ...defaults, ...overrides };
};

// Export configuration factory
export const createMockExportConfig = (overrides = {}) => {
  const defaults = {
    format: 'pdf',
    includeCharts: true,
    includeAnalysis: true,
    includeTables: true,
    pageOrientation: 'portrait',
    language: 'pt-BR',
    companyInfo: {
      name: 'Test Company Ltd.',
      logo: null,
      address: 'São Paulo, Brazil',
      taxId: '00.000.000/0001-00',
    },
    reportTitle: 'Financial Analysis Report',
    reportPeriod: 'Q1-Q4 2024',
    generatedBy: 'Financial Analyst',
    generatedAt: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
};

// Test utilities for creating complex test scenarios
export const createTestScenario = (scenarioType, options = {}) => {
  const scenarios = {
    complete: () => ({
      periods: createScenarios.healthyGrowth(4),
      excelData: createMockExcelData(),
      pdfData: createMockPDFData(),
      aiAnalysis: createMockAIAnalysis(),
      validationResults: createMockValidationResults(),
      exportConfig: createMockExportConfig(),
    }),
    
    withErrors: () => ({
      periods: createScenarios.struggling(4),
      validationResults: createMockValidationResults({
        isValid: false,
        critical: [
          {
            type: 'error',
            category: 'Balance Sheet',
            message: 'Significant imbalance detected',
            severity: 'critical',
          },
        ],
      }),
    }),
    
    minimal: () => ({
      periods: [createMockPeriodData()],
      validationResults: createMockValidationResults({ 
        warnings: [], 
        infos: [], 
      }),
    }),
  };

  return scenarios[scenarioType] ? scenarios[scenarioType](options) : scenarios.complete(options);
};

// Random data generators for stress testing
export const generateRandomFinancialData = (constraints = {}) => {
  const {
    minRevenue = 100000,
    maxRevenue = 10000000,
    minMargin = 10,
    maxMargin = 60,
    periods = 4,
  } = constraints;

  return Array.from({ length: periods }, (_, i) => {
    const revenue = Math.random() * (maxRevenue - minRevenue) + minRevenue;
    const margin = Math.random() * (maxMargin - minMargin) + minMargin;
    
    return createMockFinancialData({
      revenue: Math.round(revenue),
      grossMarginPercent: Math.round(margin * 10) / 10,
      operatingExpenses: Math.round(revenue * (0.2 + Math.random() * 0.3)),
      period: `Q${(i % 4) + 1} ${2024 + Math.floor(i / 4)}`,
    });
  });
};

// Export all factories
export default {
  createMockFinancialData,
  createMockIncomeStatement,
  createMockCashFlow,
  createMockWorkingCapital,
  createMockBalanceSheet,
  createMockFinancialRatios,
  createMockPeriodData,
  createScenarios,
  createMockExcelData,
  createMockPDFData,
  createMockAIAnalysis,
  createMockValidationResults,
  createMockExportConfig,
  createTestScenario,
  generateRandomFinancialData,
};