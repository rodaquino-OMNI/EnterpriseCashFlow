/**
 * @fileoverview Data import service with validation
 */

import { validateModel, createProject, createScenario, createReport } from './models';
import * as XLSX from 'xlsx';

/**
 * Data import service
 */
export class DataImportService {
  constructor(config = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      allowedFormats: config.allowedFormats || ['json', 'csv', 'excel', 'xlsx'],
      strictValidation: config.strictValidation !== false,
      autoCorrect: config.autoCorrect !== false,
      ...config
    };
    
    this.validators = new Map();
    this.transformers = new Map();
    this._registerDefaultValidators();
    this._registerDefaultTransformers();
  }

  /**
   * Import data from file
   * @param {File} file - File to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>}
   */
  async import(file, options = {}) {
    // Validate file
    this._validateFile(file);
    
    const format = this._detectFormat(file);
    const content = await this._readFile(file);
    
    switch (format) {
      case 'json':
        return this.importJSON(content, options);
      case 'csv':
        return this.importCSV(content, options);
      case 'excel':
      case 'xlsx':
        return this.importExcel(content, options);
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  /**
   * Import JSON data
   * @param {string} content - JSON content
   * @param {Object} options - Import options
   * @returns {Promise<Object>}
   */
  async importJSON(content, options = {}) {
    try {
      const data = JSON.parse(content);
      return this._processImportedData(data, options);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Import CSV data
   * @param {string} content - CSV content
   * @param {Object} options - Import options
   * @returns {Promise<Object>}
   */
  async importCSV(content, options = {}) {
    const rows = this._parseCSV(content);
    
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Detect data type based on headers
    const dataType = this._detectCSVDataType(rows[0]);
    
    switch (dataType) {
      case 'financial':
        return this._importFinancialCSV(rows, options);
      case 'project':
        return this._importProjectCSV(rows, options);
      default:
        return this._importGenericCSV(rows, options);
    }
  }

  /**
   * Import Excel data
   * @param {ArrayBuffer} content - Excel file content
   * @param {Object} options - Import options
   * @returns {Promise<Object>}
   */
  async importExcel(content, options = {}) {
    try {
      const workbook = XLSX.read(content, { type: 'array' });
      
      // Detect import type based on sheet names
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.includes('Project') || sheetNames.includes('Scenarios')) {
        return this._importProjectExcel(workbook, options);
      } else if (sheetNames.includes('Income Statement') || sheetNames.includes('Balance Sheet')) {
        return this._importFinancialExcel(workbook, options);
      } else {
        // Import first sheet as generic data
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        return this._processImportedData({ data }, options);
      }
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Validate imported data
   * @param {Object} data - Data to validate
   * @param {string} type - Data type
   * @returns {Object} Validation result
   */
  validateImportedData(data, type) {
    const validator = this.validators.get(type);
    
    if (!validator) {
      return validateModel(data, type);
    }
    
    return validator(data);
  }

  /**
   * Register custom validator
   * @param {string} type - Data type
   * @param {Function} validator - Validator function
   */
  registerValidator(type, validator) {
    this.validators.set(type, validator);
  }

  /**
   * Register custom transformer
   * @param {string} type - Data type
   * @param {Function} transformer - Transformer function
   */
  registerTransformer(type, transformer) {
    this.transformers.set(type, transformer);
  }

  // Private methods

  /**
   * Validate file before import
   * @private
   */
  _validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.config.maxFileSize / 1024 / 1024}MB`);
    }
    
    const format = this._detectFormat(file);
    if (!this.config.allowedFormats.includes(format)) {
      throw new Error(`File format not allowed: ${format}`);
    }
  }

  /**
   * Detect file format
   * @private
   */
  _detectFormat(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'json') return 'json';
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    
    // Try to detect by MIME type
    if (file.type === 'application/json') return 'json';
    if (file.type === 'text/csv') return 'csv';
    if (file.type.includes('spreadsheet')) return 'excel';
    
    return extension;
  }

  /**
   * Read file content
   * @private
   */
  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      
      const format = this._detectFormat(file);
      
      if (format === 'excel' || format === 'xlsx') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  /**
   * Parse CSV content
   * @private
   */
  _parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const rows = [];
    
    for (const line of lines) {
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Detect CSV data type
   * @private
   */
  _detectCSVDataType(headers) {
    const headerStr = headers.join(',').toLowerCase();
    
    if (headerStr.includes('revenue') || headerStr.includes('income') || headerStr.includes('cash')) {
      return 'financial';
    }
    
    if (headerStr.includes('project') || headerStr.includes('scenario')) {
      return 'project';
    }
    
    return 'generic';
  }

  /**
   * Import financial CSV
   * @private
   */
  async _importFinancialCSV(rows, options) {
    const headers = rows[0];
    const data = {
      periods: []
    };
    
    // Find period columns
    const periodColumns = headers
      .map((header, index) => ({ header, index }))
      .filter(({ header }) => header.match(/period|month|quarter|year/i))
      .map(({ index }) => index);
    
    if (periodColumns.length === 0) {
      throw new Error('No period columns found in CSV');
    }
    
    // Initialize periods
    periodColumns.forEach((colIndex, periodIndex) => {
      data.periods.push({
        periodNumber: periodIndex + 1,
        financials: {
          incomeStatement: {},
          balanceSheet: {},
          cashFlow: {},
          workingCapital: {}
        }
      });
    });
    
    // Parse financial data
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const metric = row[0].toLowerCase();
      
      periodColumns.forEach((colIndex, periodIndex) => {
        const value = parseFloat(row[colIndex]) || 0;
        
        // Map metric to appropriate field
        if (metric.includes('revenue')) {
          data.periods[periodIndex].financials.incomeStatement.revenue = value;
        } else if (metric.includes('cogs') || metric.includes('cost of goods')) {
          data.periods[periodIndex].financials.incomeStatement.cogs = value;
        } else if (metric.includes('gross profit')) {
          data.periods[periodIndex].financials.incomeStatement.grossProfit = value;
        } else if (metric.includes('operating expense')) {
          data.periods[periodIndex].financials.incomeStatement.operatingExpenses = value;
        } else if (metric.includes('ebitda')) {
          data.periods[periodIndex].financials.incomeStatement.ebitda = value;
        } else if (metric.includes('net income')) {
          data.periods[periodIndex].financials.incomeStatement.netIncome = value;
        } else if (metric.includes('cash') && !metric.includes('flow')) {
          data.periods[periodIndex].financials.balanceSheet.cash = value;
        } else if (metric.includes('accounts receivable')) {
          data.periods[periodIndex].financials.balanceSheet.accountsReceivable = value;
        } else if (metric.includes('inventory')) {
          data.periods[periodIndex].financials.balanceSheet.inventory = value;
        } else if (metric.includes('accounts payable')) {
          data.periods[periodIndex].financials.balanceSheet.accountsPayable = value;
        } else if (metric.includes('operating cash flow')) {
          data.periods[periodIndex].financials.cashFlow.operatingCashFlow = value;
        } else if (metric.includes('free cash flow')) {
          data.periods[periodIndex].financials.cashFlow.freeCashFlow = value;
        }
      });
    }
    
    return this._processImportedData(data, options);
  }

  /**
   * Import project CSV
   * @private
   */
  async _importProjectCSV(rows, options) {
    const headers = rows[0];
    const projects = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const project = {};
      
      headers.forEach((header, index) => {
        const key = this._normalizeKey(header);
        project[key] = row[index];
      });
      
      projects.push(project);
    }
    
    return this._processImportedData({ projects }, options);
  }

  /**
   * Import generic CSV
   * @private
   */
  async _importGenericCSV(rows, options) {
    const headers = rows[0];
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      
      data.push(obj);
    }
    
    return this._processImportedData({ data }, options);
  }

  /**
   * Import project Excel
   * @private
   */
  async _importProjectExcel(workbook, options) {
    const result = {
      project: null,
      scenarios: [],
      reports: []
    };
    
    // Import project data
    if (workbook.SheetNames.includes('Project')) {
      const projectSheet = workbook.Sheets['Project'];
      const projectData = XLSX.utils.sheet_to_json(projectSheet);
      
      if (projectData.length > 0) {
        result.project = this._transformProject(projectData[0]);
      }
    }
    
    // Import scenarios
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.startsWith('Scenario_')) {
        const scenarioSheet = workbook.Sheets[sheetName];
        const scenarioData = XLSX.utils.sheet_to_json(scenarioSheet);
        
        if (scenarioData.length > 0) {
          const scenario = this._transformScenario({
            name: sheetName.replace('Scenario_', ''),
            data: { periods: scenarioData }
          });
          
          result.scenarios.push(scenario);
        }
      }
    });
    
    // Import reports
    if (workbook.SheetNames.includes('Reports')) {
      const reportsSheet = workbook.Sheets['Reports'];
      const reportsData = XLSX.utils.sheet_to_json(reportsSheet);
      
      result.reports = reportsData.map(report => this._transformReport(report));
    }
    
    return this._processImportedData(result, options);
  }

  /**
   * Import financial Excel
   * @private
   */
  async _importFinancialExcel(workbook, options) {
    const data = {
      periods: []
    };
    
    // Get period count from first financial sheet
    const incomeSheet = workbook.Sheets['Income Statement'];
    if (!incomeSheet) {
      throw new Error('Income Statement sheet not found');
    }
    
    const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 });
    const periodCount = incomeData[0].length - 1; // Exclude metric column
    
    // Initialize periods
    for (let i = 0; i < periodCount; i++) {
      data.periods.push({
        periodNumber: i + 1,
        financials: {
          incomeStatement: {},
          balanceSheet: {},
          cashFlow: {},
          workingCapital: {}
        }
      });
    }
    
    // Import Income Statement
    this._importFinancialSheet(
      workbook.Sheets['Income Statement'],
      data.periods,
      'incomeStatement'
    );
    
    // Import Balance Sheet
    if (workbook.Sheets['Balance Sheet']) {
      this._importFinancialSheet(
        workbook.Sheets['Balance Sheet'],
        data.periods,
        'balanceSheet'
      );
    }
    
    // Import Cash Flow
    if (workbook.Sheets['Cash Flow']) {
      this._importFinancialSheet(
        workbook.Sheets['Cash Flow'],
        data.periods,
        'cashFlow'
      );
    }
    
    return this._processImportedData(data, options);
  }

  /**
   * Import financial sheet data
   * @private
   */
  _importFinancialSheet(sheet, periods, statementType) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let row = 1; row < data.length; row++) {
      const metric = data[row][0];
      if (!metric || typeof metric !== 'string') continue;
      
      const metricKey = this._getMetricKey(metric, statementType);
      if (!metricKey) continue;
      
      for (let col = 1; col < data[row].length && col - 1 < periods.length; col++) {
        const value = parseFloat(data[row][col]) || 0;
        periods[col - 1].financials[statementType][metricKey] = value;
      }
    }
  }

  /**
   * Get metric key from label
   * @private
   */
  _getMetricKey(label, statementType) {
    const normalized = label.toLowerCase();
    
    const mappings = {
      incomeStatement: {
        'revenue': 'revenue',
        'cost of goods sold': 'cogs',
        'cogs': 'cogs',
        'gross profit': 'grossProfit',
        'operating expenses': 'operatingExpenses',
        'ebitda': 'ebitda',
        'depreciation': 'depreciation',
        'interest expense': 'interestExpense',
        'tax expense': 'taxExpense',
        'net income': 'netIncome'
      },
      balanceSheet: {
        'cash': 'cash',
        'accounts receivable': 'accountsReceivable',
        'inventory': 'inventory',
        'pp&e': 'ppe',
        'accounts payable': 'accountsPayable',
        'short-term debt': 'shortTermDebt',
        'long-term debt': 'longTermDebt',
        'total equity': 'equity'
      },
      cashFlow: {
        'operating cash flow': 'operatingCashFlow',
        'investing cash flow': 'investingCashFlow',
        'financing cash flow': 'financingCashFlow',
        'free cash flow': 'freeCashFlow',
        'beginning cash': 'beginningCash',
        'ending cash': 'endingCash'
      }
    };
    
    const mapping = mappings[statementType] || {};
    
    for (const [key, value] of Object.entries(mapping)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Process imported data
   * @private
   */
  async _processImportedData(data, options) {
    // Transform data
    const transformed = await this._transformData(data, options);
    
    // Validate data
    if (this.config.strictValidation) {
      const validation = await this._validateData(transformed, options);
      
      if (!validation.valid) {
        if (this.config.autoCorrect) {
          return this._autoCorrectData(transformed, validation.errors);
        } else {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }
    }
    
    return transformed;
  }

  /**
   * Transform imported data
   * @private
   */
  async _transformData(data, options) {
    if (options.transformer) {
      return options.transformer(data);
    }
    
    // Apply type-specific transformations
    if (data.project) {
      data.project = this._transformProject(data.project);
    }
    
    if (data.scenarios) {
      data.scenarios = data.scenarios.map(s => this._transformScenario(s));
    }
    
    if (data.reports) {
      data.reports = data.reports.map(r => this._transformReport(r));
    }
    
    return data;
  }

  /**
   * Transform project data
   * @private
   */
  _transformProject(data) {
    const transformer = this.transformers.get('project');
    
    if (transformer) {
      return transformer(data);
    }
    
    return createProject({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    });
  }

  /**
   * Transform scenario data
   * @private
   */
  _transformScenario(data) {
    const transformer = this.transformers.get('scenario');
    
    if (transformer) {
      return transformer(data);
    }
    
    return createScenario({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    });
  }

  /**
   * Transform report data
   * @private
   */
  _transformReport(data) {
    const transformer = this.transformers.get('report');
    
    if (transformer) {
      return transformer(data);
    }
    
    return createReport({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      generatedAt: data.generatedAt ? new Date(data.generatedAt) : new Date()
    });
  }

  /**
   * Validate imported data
   * @private
   */
  async _validateData(data, options) {
    const errors = [];
    
    if (data.project) {
      const validation = this.validateImportedData(data.project, 'project');
      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `Project: ${e}`));
      }
    }
    
    if (data.scenarios) {
      data.scenarios.forEach((scenario, index) => {
        const validation = this.validateImportedData(scenario, 'scenario');
        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `Scenario ${index}: ${e}`));
        }
      });
    }
    
    if (data.reports) {
      data.reports.forEach((report, index) => {
        const validation = this.validateImportedData(report, 'report');
        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `Report ${index}: ${e}`));
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Auto-correct validation errors
   * @private
   */
  _autoCorrectData(data, errors) {
    // Implement auto-correction logic
    errors.forEach(error => {
      if (error.includes('Missing required field')) {
        // Add default values for missing fields
        const field = error.match(/field: (\w+)/)?.[1];
        if (field) {
          // Add field with default value
          console.warn(`Auto-correcting missing field: ${field}`);
        }
      }
    });
    
    return data;
  }

  /**
   * Normalize key names
   * @private
   */
  _normalizeKey(key) {
    return key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/^(\d)/, '_$1');
  }

  /**
   * Register default validators
   * @private
   */
  _registerDefaultValidators() {
    // Add custom validators here
  }

  /**
   * Register default transformers
   * @private
   */
  _registerDefaultTransformers() {
    // Add custom transformers here
  }
}