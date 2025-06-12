/**
 * @fileoverview Data export service for various formats
 */

import { validateModel } from './models';
import * as XLSX from 'xlsx';

/**
 * Data export service
 */
export class DataExportService {
  constructor(config = {}) {
    this.config = {
      dateFormat: config.dateFormat || 'YYYY-MM-DD',
      numberFormat: config.numberFormat || '0,0.00',
      includeMetadata: config.includeMetadata !== false,
      ...config
    };
  }

  /**
   * Export data to specified format
   * @param {Object} data - Data to export
   * @param {string} format - Export format (json, csv, excel)
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async export(data, format, options = {}) {
    const exportOptions = { ...this.config, ...options };
    
    switch (format.toLowerCase()) {
      case 'json':
        return this.exportJSON(data, exportOptions);
      case 'csv':
        return this.exportCSV(data, exportOptions);
      case 'excel':
      case 'xlsx':
        return this.exportExcel(data, exportOptions);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export project data
   * @param {Object} project - Project data
   * @param {Object[]} scenarios - Project scenarios
   * @param {Object[]} reports - Project reports
   * @param {string} format - Export format
   * @returns {Promise<Blob>}
   */
  async exportProject(project, scenarios, reports, format) {
    const exportData = {
      project,
      scenarios,
      reports,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return this.export(exportData, format, {
      filename: `${project.name}_export`
    });
  }

  /**
   * Export financial report
   * @param {Object} report - Report data
   * @param {string} format - Export format
   * @returns {Promise<Blob>}
   */
  async exportReport(report, format) {
    if (format === 'excel' || format === 'xlsx') {
      return this._exportReportToExcel(report);
    }
    
    return this.export(report, format, {
      filename: `${report.name}_report`
    });
  }

  /**
   * Export data as JSON
   * @param {Object} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportJSON(data, options = {}) {
    const exportData = {
      ...data,
      _metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        version: this.config.version || '1.0.0',
        format: 'json'
      } : undefined
    };
    
    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Export data as CSV
   * @param {Object} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportCSV(data, options = {}) {
    let csv = '';
    
    if (Array.isArray(data)) {
      csv = this._arrayToCSV(data);
    } else if (data.periods && Array.isArray(data.periods)) {
      // Export financial periods data
      csv = this._financialDataToCSV(data);
    } else {
      // Convert object to array format
      const rows = this._objectToRows(data);
      csv = this._arrayToCSV(rows);
    }
    
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Export data as Excel
   * @param {Object} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportExcel(data, options = {}) {
    const workbook = XLSX.utils.book_new();
    
    if (data.project && data.scenarios) {
      // Export complete project
      this._addProjectSheets(workbook, data);
    } else if (data.periods) {
      // Export financial data
      this._addFinancialSheets(workbook, data);
    } else {
      // Export generic data
      const worksheet = XLSX.utils.json_to_sheet(
        Array.isArray(data) ? data : [data]
      );
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    }
    
    // Add metadata sheet if enabled
    if (options.includeMetadata) {
      const metadataSheet = XLSX.utils.json_to_sheet([{
        exportDate: new Date().toISOString(),
        version: this.config.version || '1.0.0',
        format: 'excel',
        sheets: workbook.SheetNames.join(', ')
      }]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    }
    
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /**
   * Create downloadable file
   * @param {Blob} blob - Data blob
   * @param {string} filename - File name
   */
  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Private methods

  /**
   * Convert array to CSV string
   * @private
   */
  _arrayToCSV(array) {
    if (!array || array.length === 0) return '';
    
    // Get headers
    const headers = Object.keys(array[0]);
    const csv = [headers.join(',')];
    
    // Add rows
    array.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return this._formatCSVValue(value);
      });
      csv.push(values.join(','));
    });
    
    return csv.join('\n');
  }

  /**
   * Format value for CSV
   * @private
   */
  _formatCSVValue(value) {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Convert financial data to CSV
   * @private
   */
  _financialDataToCSV(data) {
    const rows = [];
    
    // Headers
    const periodHeaders = data.periods.map(p => `Period ${p.periodNumber}`);
    rows.push(['Metric', ...periodHeaders]);
    
    // Income Statement
    rows.push(['Income Statement']);
    rows.push(['Revenue', ...data.periods.map(p => p.financials.incomeStatement.revenue)]);
    rows.push(['COGS', ...data.periods.map(p => p.financials.incomeStatement.cogs)]);
    rows.push(['Gross Profit', ...data.periods.map(p => p.financials.incomeStatement.grossProfit)]);
    rows.push(['Operating Expenses', ...data.periods.map(p => p.financials.incomeStatement.operatingExpenses)]);
    rows.push(['EBITDA', ...data.periods.map(p => p.financials.incomeStatement.ebitda)]);
    rows.push(['Net Income', ...data.periods.map(p => p.financials.incomeStatement.netIncome)]);
    
    rows.push([]); // Empty row
    
    // Balance Sheet
    rows.push(['Balance Sheet']);
    rows.push(['Cash', ...data.periods.map(p => p.financials.balanceSheet.cash)]);
    rows.push(['Accounts Receivable', ...data.periods.map(p => p.financials.balanceSheet.accountsReceivable)]);
    rows.push(['Inventory', ...data.periods.map(p => p.financials.balanceSheet.inventory)]);
    rows.push(['Total Assets', ...data.periods.map(p => 
      p.financials.balanceSheet.cash + 
      p.financials.balanceSheet.accountsReceivable + 
      p.financials.balanceSheet.inventory +
      p.financials.balanceSheet.ppe
    )]);
    
    rows.push([]); // Empty row
    
    // Cash Flow
    rows.push(['Cash Flow']);
    rows.push(['Operating Cash Flow', ...data.periods.map(p => p.financials.cashFlow.operatingCashFlow)]);
    rows.push(['Investing Cash Flow', ...data.periods.map(p => p.financials.cashFlow.investingCashFlow)]);
    rows.push(['Financing Cash Flow', ...data.periods.map(p => p.financials.cashFlow.financingCashFlow)]);
    rows.push(['Free Cash Flow', ...data.periods.map(p => p.financials.cashFlow.freeCashFlow)]);
    
    return this._arrayToCSV(rows.map(row => {
      const obj = {};
      row.forEach((value, index) => {
        obj[`col${index}`] = value;
      });
      return obj;
    }));
  }

  /**
   * Convert object to rows
   * @private
   */
  _objectToRows(obj, prefix = '') {
    const rows = [];
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        rows.push(...this._objectToRows(value, fullKey));
      } else {
        rows.push({
          key: fullKey,
          value: value instanceof Date ? value.toISOString() : value
        });
      }
    });
    
    return rows;
  }

  /**
   * Add project sheets to Excel workbook
   * @private
   */
  _addProjectSheets(workbook, data) {
    // Project Overview
    const projectSheet = XLSX.utils.json_to_sheet([data.project]);
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project');
    
    // Scenarios
    if (data.scenarios && data.scenarios.length > 0) {
      data.scenarios.forEach(scenario => {
        const scenarioData = this._prepareScenarioData(scenario);
        const scenarioSheet = XLSX.utils.json_to_sheet(scenarioData);
        XLSX.utils.book_append_sheet(workbook, scenarioSheet, `Scenario_${scenario.name}`);
      });
    }
    
    // Reports
    if (data.reports && data.reports.length > 0) {
      const reportsSheet = XLSX.utils.json_to_sheet(data.reports);
      XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Reports');
    }
  }

  /**
   * Add financial sheets to Excel workbook
   * @private
   */
  _addFinancialSheets(workbook, data) {
    // Income Statement
    const incomeData = this._prepareIncomeStatementData(data);
    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Statement');
    
    // Balance Sheet
    const balanceData = this._prepareBalanceSheetData(data);
    const balanceSheet = XLSX.utils.aoa_to_sheet(balanceData);
    XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Balance Sheet');
    
    // Cash Flow
    const cashFlowData = this._prepareCashFlowData(data);
    const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowData);
    XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'Cash Flow');
    
    // Ratios
    const ratiosData = this._prepareRatiosData(data);
    const ratiosSheet = XLSX.utils.aoa_to_sheet(ratiosData);
    XLSX.utils.book_append_sheet(workbook, ratiosSheet, 'Financial Ratios');
  }

  /**
   * Prepare scenario data for export
   * @private
   */
  _prepareScenarioData(scenario) {
    if (!scenario.data || !scenario.data.periods) return [scenario];
    
    const flattened = [];
    
    scenario.data.periods.forEach(period => {
      flattened.push({
        periodNumber: period.periodNumber,
        startDate: period.startDate,
        endDate: period.endDate,
        revenue: period.financials.incomeStatement.revenue,
        cogs: period.financials.incomeStatement.cogs,
        grossProfit: period.financials.incomeStatement.grossProfit,
        operatingExpenses: period.financials.incomeStatement.operatingExpenses,
        ebitda: period.financials.incomeStatement.ebitda,
        netIncome: period.financials.incomeStatement.netIncome,
        cash: period.financials.balanceSheet.cash,
        totalAssets: this._calculateTotalAssets(period.financials.balanceSheet),
        totalLiabilities: this._calculateTotalLiabilities(period.financials.balanceSheet),
        equity: period.financials.balanceSheet.equity
      });
    });
    
    return flattened;
  }

  /**
   * Prepare income statement data
   * @private
   */
  _prepareIncomeStatementData(data) {
    const rows = [['Income Statement']];
    const periods = data.periods || [];
    
    // Headers
    rows.push(['Metric', ...periods.map(p => `Period ${p.periodNumber}`)]);
    
    // Data rows
    const metrics = [
      { key: 'revenue', label: 'Revenue' },
      { key: 'cogs', label: 'Cost of Goods Sold' },
      { key: 'grossProfit', label: 'Gross Profit' },
      { key: 'operatingExpenses', label: 'Operating Expenses' },
      { key: 'ebitda', label: 'EBITDA' },
      { key: 'depreciation', label: 'Depreciation' },
      { key: 'interestExpense', label: 'Interest Expense' },
      { key: 'taxExpense', label: 'Tax Expense' },
      { key: 'netIncome', label: 'Net Income' }
    ];
    
    metrics.forEach(metric => {
      rows.push([
        metric.label,
        ...periods.map(p => p.financials.incomeStatement[metric.key] || 0)
      ]);
    });
    
    return rows;
  }

  /**
   * Prepare balance sheet data
   * @private
   */
  _prepareBalanceSheetData(data) {
    const rows = [['Balance Sheet']];
    const periods = data.periods || [];
    
    // Headers
    rows.push(['Metric', ...periods.map(p => `Period ${p.periodNumber}`)]);
    
    // Assets
    rows.push(['ASSETS']);
    rows.push(['Current Assets']);
    rows.push(['Cash', ...periods.map(p => p.financials.balanceSheet.cash)]);
    rows.push(['Accounts Receivable', ...periods.map(p => p.financials.balanceSheet.accountsReceivable)]);
    rows.push(['Inventory', ...periods.map(p => p.financials.balanceSheet.inventory)]);
    rows.push(['Other Current Assets', ...periods.map(p => p.financials.balanceSheet.otherCurrentAssets)]);
    
    rows.push(['Non-Current Assets']);
    rows.push(['PP&E', ...periods.map(p => p.financials.balanceSheet.ppe)]);
    rows.push(['Other Non-Current Assets', ...periods.map(p => p.financials.balanceSheet.otherNonCurrentAssets)]);
    
    rows.push(['Total Assets', ...periods.map(p => this._calculateTotalAssets(p.financials.balanceSheet))]);
    
    rows.push([]);
    
    // Liabilities
    rows.push(['LIABILITIES']);
    rows.push(['Current Liabilities']);
    rows.push(['Accounts Payable', ...periods.map(p => p.financials.balanceSheet.accountsPayable)]);
    rows.push(['Short-term Debt', ...periods.map(p => p.financials.balanceSheet.shortTermDebt)]);
    rows.push(['Other Current Liabilities', ...periods.map(p => p.financials.balanceSheet.otherCurrentLiabilities)]);
    
    rows.push(['Non-Current Liabilities']);
    rows.push(['Long-term Debt', ...periods.map(p => p.financials.balanceSheet.longTermDebt)]);
    rows.push(['Other Non-Current Liabilities', ...periods.map(p => p.financials.balanceSheet.otherNonCurrentLiabilities)]);
    
    rows.push(['Total Liabilities', ...periods.map(p => this._calculateTotalLiabilities(p.financials.balanceSheet))]);
    
    rows.push([]);
    rows.push(['EQUITY']);
    rows.push(['Total Equity', ...periods.map(p => p.financials.balanceSheet.equity)]);
    
    return rows;
  }

  /**
   * Prepare cash flow data
   * @private
   */
  _prepareCashFlowData(data) {
    const rows = [['Cash Flow Statement']];
    const periods = data.periods || [];
    
    // Headers
    rows.push(['Metric', ...periods.map(p => `Period ${p.periodNumber}`)]);
    
    // Operating Activities
    rows.push(['Operating Activities']);
    rows.push(['Operating Cash Flow', ...periods.map(p => p.financials.cashFlow.operatingCashFlow)]);
    
    rows.push([]);
    
    // Investing Activities
    rows.push(['Investing Activities']);
    rows.push(['Investing Cash Flow', ...periods.map(p => p.financials.cashFlow.investingCashFlow)]);
    
    rows.push([]);
    
    // Financing Activities
    rows.push(['Financing Activities']);
    rows.push(['Financing Cash Flow', ...periods.map(p => p.financials.cashFlow.financingCashFlow)]);
    
    rows.push([]);
    
    // Summary
    rows.push(['Summary']);
    rows.push(['Beginning Cash', ...periods.map(p => p.financials.cashFlow.beginningCash)]);
    rows.push(['Total Cash Flow', ...periods.map(p => 
      p.financials.cashFlow.operatingCashFlow + 
      p.financials.cashFlow.investingCashFlow + 
      p.financials.cashFlow.financingCashFlow
    )]);
    rows.push(['Ending Cash', ...periods.map(p => p.financials.cashFlow.endingCash)]);
    rows.push(['Free Cash Flow', ...periods.map(p => p.financials.cashFlow.freeCashFlow)]);
    
    return rows;
  }

  /**
   * Prepare financial ratios data
   * @private
   */
  _prepareRatiosData(data) {
    const rows = [['Financial Ratios']];
    const periods = data.periods || [];
    
    // Headers
    rows.push(['Metric', ...periods.map(p => `Period ${p.periodNumber}`)]);
    
    // Profitability Ratios
    rows.push(['Profitability Ratios']);
    rows.push(['Gross Margin %', ...periods.map(p => 
      (p.financials.incomeStatement.grossProfit / p.financials.incomeStatement.revenue * 100).toFixed(2)
    )]);
    rows.push(['Operating Margin %', ...periods.map(p => 
      (p.financials.incomeStatement.ebitda / p.financials.incomeStatement.revenue * 100).toFixed(2)
    )]);
    rows.push(['Net Margin %', ...periods.map(p => 
      (p.financials.incomeStatement.netIncome / p.financials.incomeStatement.revenue * 100).toFixed(2)
    )]);
    
    rows.push([]);
    
    // Liquidity Ratios
    rows.push(['Liquidity Ratios']);
    rows.push(['Current Ratio', ...periods.map(p => {
      const currentAssets = p.financials.balanceSheet.cash + 
        p.financials.balanceSheet.accountsReceivable + 
        p.financials.balanceSheet.inventory;
      const currentLiabilities = p.financials.balanceSheet.accountsPayable + 
        p.financials.balanceSheet.shortTermDebt;
      return (currentAssets / currentLiabilities).toFixed(2);
    })]);
    
    rows.push([]);
    
    // Efficiency Ratios
    rows.push(['Efficiency Ratios']);
    rows.push(['Days Sales Outstanding', ...periods.map(p => p.financials.workingCapital.daysReceivables)]);
    rows.push(['Days Inventory Outstanding', ...periods.map(p => p.financials.workingCapital.daysInventory)]);
    rows.push(['Days Payables Outstanding', ...periods.map(p => p.financials.workingCapital.daysPayables)]);
    rows.push(['Cash Conversion Cycle', ...periods.map(p => p.financials.workingCapital.cashConversionCycle)]);
    
    return rows;
  }

  /**
   * Export report to Excel
   * @private
   */
  async _exportReportToExcel(report) {
    const workbook = XLSX.utils.book_new();
    
    // Executive Summary
    if (report.content.executiveSummary) {
      const summarySheet = XLSX.utils.json_to_sheet([report.content.executiveSummary]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    }
    
    // KPIs
    if (report.content.kpis) {
      const kpiData = Object.entries(report.content.kpis).map(([key, value]) => ({
        KPI: key,
        Value: value
      }));
      const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
    }
    
    // Financial Statements
    if (report.content.financialStatements) {
      this._addFinancialSheets(workbook, report.content.financialStatements);
    }
    
    // Analysis
    if (report.content.analysis) {
      const analysisSheet = XLSX.utils.json_to_sheet([report.content.analysis]);
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analysis');
    }
    
    // Recommendations
    if (report.content.recommendations && report.content.recommendations.length > 0) {
      const recsSheet = XLSX.utils.json_to_sheet(report.content.recommendations);
      XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recommendations');
    }
    
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /**
   * Calculate total assets
   * @private
   */
  _calculateTotalAssets(balanceSheet) {
    return (balanceSheet.cash || 0) +
      (balanceSheet.accountsReceivable || 0) +
      (balanceSheet.inventory || 0) +
      (balanceSheet.otherCurrentAssets || 0) +
      (balanceSheet.ppe || 0) +
      (balanceSheet.otherNonCurrentAssets || 0);
  }

  /**
   * Calculate total liabilities
   * @private
   */
  _calculateTotalLiabilities(balanceSheet) {
    return (balanceSheet.accountsPayable || 0) +
      (balanceSheet.shortTermDebt || 0) +
      (balanceSheet.otherCurrentLiabilities || 0) +
      (balanceSheet.longTermDebt || 0) +
      (balanceSheet.otherNonCurrentLiabilities || 0);
  }
}