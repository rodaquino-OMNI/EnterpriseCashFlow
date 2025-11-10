/**
 * Default Report Templates
 * Pre-configured templates for common report types
 */

export const defaultTemplates = [
  {
    id: 'executive-summary',
    name: 'Executive Summary Report',
    description: 'High-level overview with KPIs and key insights',
    category: 'summary',
    layout: {
      title: 'Executive Financial Summary',
      orientation: 'portrait',
      sections: ['title', 'metadata', 'summary', 'kpis', 'charts', 'recommendations'],
    },
    sections: [
      {
        id: 'summary',
        type: 'summary',
        title: 'Executive Summary',
        dataKey: 'summary',
        defaultText: 'This report provides a comprehensive overview of the financial performance and position.',
        highlights: ['revenue', 'profit', 'cash_flow'],
      },
      {
        id: 'kpis',
        type: 'kpis',
        title: 'Key Performance Indicators',
        dataKey: 'kpis',
        filter: ['revenue', 'gross_margin', 'operating_margin', 'net_margin', 'cash_balance'],
        sort: { field: 'importance', order: 'desc' },
      },
      {
        id: 'revenue-chart',
        type: 'chart',
        title: 'Revenue Trend',
        dataKey: 'revenueChart',
        chartType: 'line',
        chartOptions: {
          showLegend: true,
          showGrid: true,
          colors: ['#007bff'],
        },
      },
      {
        id: 'margin-chart',
        type: 'chart',
        title: 'Margin Analysis',
        dataKey: 'marginChart',
        chartType: 'bar',
        chartOptions: {
          showLegend: true,
          stacked: false,
        },
      },
    ],
    styling: {
      theme: 'professional',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
      },
      fonts: {
        heading: 'Arial, sans-serif',
        body: 'Arial, sans-serif',
      },
    },
    metadata: {
      author: 'Finance Department',
      confidentiality: 'Internal Use Only',
    },
    defaultOptions: {
      format: 'pdf',
      orientation: 'portrait',
      includeCharts: true,
      includeTimestamp: true,
    },
  },
  
  {
    id: 'detailed-financial',
    name: 'Detailed Financial Report',
    description: 'Comprehensive financial statements with detailed analysis',
    category: 'financial',
    layout: {
      title: 'Detailed Financial Analysis',
      orientation: 'landscape',
      sections: ['title', 'toc', 'summary', 'pnl', 'balance_sheet', 'cash_flow', 'ratios', 'notes'],
    },
    sections: [
      {
        id: 'pnl',
        type: 'table',
        title: 'Profit & Loss Statement',
        dataKey: 'profitLoss',
        showTotals: true,
        totalColumns: ['amount', 'budget', 'variance'],
        formatting: {
          amount: 'currency',
          budget: 'currency',
          variance: 'currency',
          variance_pct: 'percentage',
        },
      },
      {
        id: 'balance-sheet',
        type: 'table',
        title: 'Balance Sheet',
        dataKey: 'balanceSheet',
        showTotals: true,
        totalColumns: ['current_period', 'prior_period'],
        formatting: {
          current_period: 'currency',
          prior_period: 'currency',
          change: 'currency',
          change_pct: 'percentage',
        },
      },
      {
        id: 'cash-flow',
        type: 'table',
        title: 'Cash Flow Statement',
        dataKey: 'cashFlow',
        showTotals: true,
        totalColumns: ['amount'],
        formatting: {
          amount: 'currency',
        },
      },
      {
        id: 'ratios',
        type: 'table',
        title: 'Financial Ratios',
        dataKey: 'ratios',
        formatting: {
          current_ratio: 'number',
          quick_ratio: 'number',
          debt_to_equity: 'number',
          roe: 'percentage',
          roa: 'percentage',
        },
      },
    ],
    styling: {
      theme: 'formal',
      colors: {
        primary: '#1a237e',
        secondary: '#424242',
        accent: '#4caf50',
      },
    },
    metadata: {
      author: 'Chief Financial Officer',
      confidentiality: 'Confidential',
    },
    defaultOptions: {
      format: 'excel',
      orientation: 'landscape',
      includeFormulas: true,
      multipleSheets: true,
    },
  },
  
  {
    id: 'cash-flow-analysis',
    name: 'Cash Flow Analysis Report',
    description: 'Detailed cash flow analysis with projections',
    category: 'analysis',
    layout: {
      title: 'Cash Flow Analysis',
      orientation: 'portrait',
      sections: ['title', 'summary', 'cash_sources', 'cash_uses', 'waterfall', 'projections', 'recommendations'],
    },
    sections: [
      {
        id: 'cash-summary',
        type: 'summary',
        title: 'Cash Flow Overview',
        dataKey: 'cashSummary',
        metrics: ['opening_balance', 'net_cash_flow', 'closing_balance'],
      },
      {
        id: 'cash-sources',
        type: 'table',
        title: 'Sources of Cash',
        dataKey: 'cashSources',
        showTotals: true,
        totalColumns: ['amount'],
        formatting: {
          amount: 'currency',
          percentage: 'percentage',
        },
        sort: { column: 'amount', order: 'desc' },
      },
      {
        id: 'cash-uses',
        type: 'table',
        title: 'Uses of Cash',
        dataKey: 'cashUses',
        showTotals: true,
        totalColumns: ['amount'],
        formatting: {
          amount: 'currency',
          percentage: 'percentage',
        },
        sort: { column: 'amount', order: 'desc' },
      },
      {
        id: 'waterfall-chart',
        type: 'chart',
        title: 'Cash Flow Waterfall',
        dataKey: 'cashWaterfall',
        chartType: 'waterfall',
        chartOptions: {
          showValues: true,
          positiveColor: '#28a745',
          negativeColor: '#dc3545',
        },
      },
      {
        id: 'projections',
        type: 'table',
        title: 'Cash Flow Projections',
        dataKey: 'cashProjections',
        formatting: {
          month1: 'currency',
          month2: 'currency',
          month3: 'currency',
          quarter: 'currency',
          year: 'currency',
        },
      },
    ],
    styling: {
      theme: 'modern',
      colors: {
        primary: '#2196f3',
        secondary: '#757575',
        positive: '#4caf50',
        negative: '#f44336',
      },
    },
    metadata: {
      author: 'Treasury Department',
      confidentiality: 'Internal Use Only',
    },
    defaultOptions: {
      format: 'pdf',
      orientation: 'portrait',
      includeCharts: true,
    },
  },
  
  {
    id: 'variance-analysis',
    name: 'Variance Analysis Report',
    description: 'Budget vs actual variance analysis',
    category: 'analysis',
    layout: {
      title: 'Variance Analysis Report',
      orientation: 'landscape',
      sections: ['title', 'summary', 'variance_table', 'variance_charts', 'explanations', 'actions'],
    },
    sections: [
      {
        id: 'variance-summary',
        type: 'summary',
        title: 'Variance Summary',
        dataKey: 'varianceSummary',
        highlights: ['total_variance', 'favorable_items', 'unfavorable_items'],
      },
      {
        id: 'variance-table',
        type: 'table',
        title: 'Detailed Variance Analysis',
        dataKey: 'varianceDetails',
        showTotals: true,
        totalColumns: ['actual', 'budget', 'variance'],
        formatting: {
          actual: 'currency',
          budget: 'currency',
          variance: 'currency',
          variance_pct: 'percentage',
        },
        conditionalFormatting: {
          variance: {
            positive: true,
            negative: true,
            threshold: { high: 0.05, low: -0.05 },
          },
        },
      },
      {
        id: 'variance-chart',
        type: 'chart',
        title: 'Variance by Category',
        dataKey: 'varianceChart',
        chartType: 'bar',
        chartOptions: {
          horizontal: true,
          showValues: true,
          positiveColor: '#28a745',
          negativeColor: '#dc3545',
        },
      },
      {
        id: 'explanations',
        type: 'custom',
        title: 'Variance Explanations',
        dataKey: 'varianceExplanations',
        processor: (data) => {
          return data.varianceExplanations || [];
        },
      },
    ],
    styling: {
      theme: 'analytical',
      colors: {
        primary: '#ff5722',
        secondary: '#616161',
        favorable: '#4caf50',
        unfavorable: '#f44336',
      },
    },
    metadata: {
      author: 'Financial Planning & Analysis',
      confidentiality: 'Management Only',
    },
    defaultOptions: {
      format: 'excel',
      orientation: 'landscape',
      includeFormulas: true,
      autoFilter: true,
    },
  },
  
  {
    id: 'board-presentation',
    name: 'Board Presentation Report',
    description: 'Concise report formatted for board presentations',
    category: 'presentation',
    layout: {
      title: 'Board of Directors Financial Report',
      orientation: 'landscape',
      sections: ['cover', 'agenda', 'highlights', 'financials', 'strategic', 'appendix'],
    },
    sections: [
      {
        id: 'highlights',
        type: 'kpis',
        title: 'Financial Highlights',
        dataKey: 'highlights',
        filter: ['revenue', 'ebitda', 'net_income', 'eps', 'cash_position'],
        layout: 'grid',
      },
      {
        id: 'performance-summary',
        type: 'summary',
        title: 'Performance Summary',
        dataKey: 'performanceSummary',
        bullets: true,
        maxBullets: 5,
      },
      {
        id: 'financial-overview',
        type: 'table',
        title: 'Financial Overview',
        dataKey: 'financialOverview',
        visibleColumns: ['metric', 'current_period', 'prior_period', 'change_pct'],
        formatting: {
          current_period: 'currency',
          prior_period: 'currency',
          change_pct: 'percentage',
        },
      },
      {
        id: 'strategic-initiatives',
        type: 'custom',
        title: 'Strategic Initiatives Update',
        dataKey: 'strategicInitiatives',
      },
    ],
    styling: {
      theme: 'corporate',
      colors: {
        primary: '#0d47a1',
        secondary: '#37474f',
        accent: '#00c853',
      },
      fonts: {
        heading: 'Georgia, serif',
        body: 'Arial, sans-serif',
      },
    },
    metadata: {
      author: 'Executive Team',
      confidentiality: 'Board Confidential',
      classification: 'Restricted',
    },
    defaultOptions: {
      format: 'pdf',
      orientation: 'landscape',
      includeCharts: true,
      watermark: 'CONFIDENTIAL',
    },
  },
  
  {
    id: 'investor-report',
    name: 'Investor Relations Report',
    description: 'External report for investors and analysts',
    category: 'external',
    layout: {
      title: 'Investor Update',
      orientation: 'portrait',
      sections: ['cover', 'letter', 'highlights', 'financials', 'outlook', 'disclaimer'],
    },
    sections: [
      {
        id: 'ceo-letter',
        type: 'custom',
        title: 'Letter from the CEO',
        dataKey: 'ceoLetter',
      },
      {
        id: 'quarterly-highlights',
        type: 'kpis',
        title: 'Quarterly Highlights',
        dataKey: 'quarterlyHighlights',
        layout: 'cards',
        includeComparison: true,
      },
      {
        id: 'income-statement',
        type: 'table',
        title: 'Condensed Income Statement',
        dataKey: 'incomeStatement',
        formatting: {
          q1: 'currency',
          q2: 'currency',
          q3: 'currency',
          q4: 'currency',
          ytd: 'currency',
        },
      },
      {
        id: 'segment-performance',
        type: 'table',
        title: 'Segment Performance',
        dataKey: 'segmentPerformance',
        formatting: {
          revenue: 'currency',
          operating_income: 'currency',
          margin: 'percentage',
        },
      },
      {
        id: 'outlook',
        type: 'custom',
        title: 'Forward-Looking Guidance',
        dataKey: 'guidance',
      },
    ],
    styling: {
      theme: 'investor',
      colors: {
        primary: '#1976d2',
        secondary: '#455a64',
        accent: '#00acc1',
      },
    },
    metadata: {
      author: 'Investor Relations',
      disclaimer: 'This report contains forward-looking statements...',
      website: 'www.company.com/investors',
    },
    defaultOptions: {
      format: 'pdf',
      orientation: 'portrait',
      includeCharts: true,
      branding: {
        logo: true,
        footer: true,
      },
    },
  },
  
  {
    id: 'department-budget',
    name: 'Department Budget Report',
    description: 'Departmental budget tracking and analysis',
    category: 'budget',
    layout: {
      title: 'Department Budget Report',
      orientation: 'portrait',
      sections: ['title', 'summary', 'budget_table', 'trends', 'forecast', 'notes'],
    },
    sections: [
      {
        id: 'budget-summary',
        type: 'summary',
        title: 'Budget Summary',
        dataKey: 'budgetSummary',
        metrics: ['total_budget', 'ytd_spent', 'remaining', 'utilization_rate'],
      },
      {
        id: 'budget-details',
        type: 'table',
        title: 'Budget Details by Category',
        dataKey: 'budgetDetails',
        showTotals: true,
        totalColumns: ['budget', 'actual', 'committed', 'available'],
        formatting: {
          budget: 'currency',
          actual: 'currency',
          committed: 'currency',
          available: 'currency',
          utilization: 'percentage',
        },
        conditionalFormatting: {
          utilization: {
            threshold: { high: 0.9, low: 0.7 },
          },
        },
      },
      {
        id: 'trend-chart',
        type: 'chart',
        title: 'Monthly Spending Trend',
        dataKey: 'spendingTrend',
        chartType: 'line',
        chartOptions: {
          showBudgetLine: true,
          showForecast: true,
        },
      },
      {
        id: 'forecast',
        type: 'table',
        title: 'Year-End Forecast',
        dataKey: 'forecast',
        formatting: {
          projected: 'currency',
          budget: 'currency',
          variance: 'currency',
          variance_pct: 'percentage',
        },
      },
    ],
    styling: {
      theme: 'departmental',
      colors: {
        primary: '#4caf50',
        secondary: '#666666',
        warning: '#ff9800',
        danger: '#f44336',
      },
    },
    metadata: {
      author: 'Department Manager',
      approver: 'Finance Director',
    },
    defaultOptions: {
      format: 'excel',
      orientation: 'portrait',
      includeFormulas: true,
      autoFilter: true,
    },
  },
];

/**
 * Template categories
 */
export const templateCategories = [
  { id: 'summary', name: 'Summary Reports', description: 'High-level overview reports' },
  { id: 'financial', name: 'Financial Statements', description: 'Detailed financial statements' },
  { id: 'analysis', name: 'Analysis Reports', description: 'In-depth analysis and insights' },
  { id: 'presentation', name: 'Presentation Reports', description: 'Reports for presentations' },
  { id: 'external', name: 'External Reports', description: 'Reports for external stakeholders' },
  { id: 'budget', name: 'Budget Reports', description: 'Budget tracking and forecasting' },
];

/**
 * Get template by category
 * @param {string} category - Category ID
 * @returns {Array} Templates in category
 */
export function getTemplatesByCategory(category) {
  return defaultTemplates.filter(template => template.category === category);
}

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object} Template or null
 */
export function getTemplateById(id) {
  return defaultTemplates.find(template => template.id === id);
}