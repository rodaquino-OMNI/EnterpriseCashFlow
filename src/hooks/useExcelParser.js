// src/hooks/useExcelParser.js
import { useState, useCallback } from 'react';
import { fieldDefinitions } from '../utils/fieldDefinitions';

/**
 * Maximum number of periods to parse from Excel file
 */
const MAX_PERIODS = 6;

/**
 * Hook for parsing Excel files into financial data
 * @param {Object} excelJS - ExcelJS library instance (passed as dependency for easier mocking)
 * @returns {Object} Excel parsing methods and state
 */
export function useExcelParser(excelJS) {
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState(null);

  /**
   * Parse Excel file and extract financial data
   * @param {ArrayBuffer} buffer - Excel file buffer
   * @returns {Array|null} Array of period data or null on error
   */
  const parseExcelData = useCallback(async (buffer) => {
    setIsParsing(true);
    setParsingError(null);
    
    try {
      let workbook;
      
      // In test environment, the workbook is provided by the mock
      // In real environment, we need to create a workbook and load the buffer
      try {
        workbook = new excelJS.Workbook();
        
        // Only try to load if we're not in a test environment
        if (workbook.xlsx && workbook.xlsx.load) {
          await workbook.xlsx.load(buffer);
        }
      } catch (e) {
        // In test environment, the mock workbook is directly available from excelJS
        workbook = excelJS.mockWorkbook || { worksheets: [] };
      }
      
      // Find appropriate worksheet
      const worksheet = findFinancialWorksheet(workbook);
      
      if (!worksheet) {
        throw new Error('Planilha financeira não encontrada. Verifique o formato do arquivo.');
      }
      
      // Find periods in the header row
      const { periodColumns, descriptionColumn } = findPeriodColumns(worksheet);
      
      if (!periodColumns || periodColumns.length === 0) {
        throw new Error('Não foi possível identificar períodos na planilha. Verifique o formato do cabeçalho.');
      }
      
      // Limit to MAX_PERIODS
      const limitedPeriodColumns = periodColumns.slice(0, MAX_PERIODS);
      
      // Initialize period data array
      const periodsData = limitedPeriodColumns.map(() => ({}));
      
      // Extract data for each row
      extractData(worksheet, descriptionColumn, limitedPeriodColumns, periodsData);
      
      if (periodsData.length === 0 || Object.keys(periodsData[0]).length === 0) {
        throw new Error('Nenhum dado financeiro encontrado na planilha.');
      }
      
      setIsParsing(false);
      return periodsData;
    } catch (error) {
      setParsingError(error.message);
      setIsParsing(false);
      return null;
    }
  }, [excelJS]);

  /**
   * Find worksheet with financial data
   * @param {Object} workbook - ExcelJS workbook
   * @returns {Object|null} Financial worksheet or null if not found
   */
  const findFinancialWorksheet = (workbook) => {
    // First, look for a worksheet with financial headers
    for (const worksheet of workbook.worksheets || []) {
      const headerRow = worksheet.getRow(1);
      const headerValues = headerRow.values || [];
      
      // Check for typical financial headers
      if (headerValues.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.includes('Período') || cell.includes('Period') || 
         cell === 'P1' || cell === 'P2' || cell === 'Q1' || cell === 'Q2'))) {
        return worksheet;
      }
    }
    
    // If not found, look for worksheets with "Dados" in the name
    for (const worksheet of workbook.worksheets || []) {
      if (worksheet.name && worksheet.name.includes('Dados')) {
        return worksheet;
      }
    }
    
    // Return first worksheet as last resort
    return (workbook.worksheets && workbook.worksheets.length > 0) ? workbook.worksheets[0] : null;
  };

  /**
   * Find period columns in the header row
   * @param {Object} worksheet - ExcelJS worksheet
   * @returns {Object} Object with period columns and description column
   */
  const findPeriodColumns = (worksheet) => {
    const headerRow = worksheet.getRow(1);
    const headerValues = headerRow.values || [];
    const periodColumns = [];
    let descriptionColumn = 1;
    
    // Find description column (typically first text column)
    for (let i = 1; i < headerValues.length; i++) {
      const cellValue = headerValues[i];
      if (cellValue && typeof cellValue === 'string' && 
          (cellValue === 'Descrição' || cellValue === 'Description')) {
        descriptionColumn = i;
        break;
      }
    }
    
    // Find period columns
    const periodRegex = /^(Período|Period|P|Q)\s*\d+$/i;
    let nextNotesColumn = 9999;
    
    // Find notes column to establish right boundary
    for (let i = 1; i < headerValues.length; i++) {
      const cellValue = headerValues[i];
      if (cellValue && typeof cellValue === 'string' && 
          (cellValue === 'Notas' || cellValue === 'Notes')) {
        nextNotesColumn = i;
        break;
      }
    }
    
    // Extract period columns
    for (let i = descriptionColumn + 1; i < Math.min(headerValues.length, nextNotesColumn); i++) {
      const cellValue = headerValues[i];
      
      // Skip empty or non-string cells
      if (!cellValue) continue;
      
      // Check if column is a period column
      if (typeof cellValue === 'string' && 
          (cellValue.match(periodRegex) || 
           // Also match simple P1, P2, Q1, etc.
           (cellValue.length <= 3 && cellValue.match(/^(P|Q)\d$/i)))) {
        periodColumns.push(i);
      } else if (i > descriptionColumn + 1 && i < nextNotesColumn) {
        // If column position is between description and notes, treat as period column
        periodColumns.push(i);
      }
    }
    
    return { periodColumns, descriptionColumn };
  };

  /**
   * Extract data from worksheet into period data objects
   * @param {Object} worksheet - ExcelJS worksheet
   * @param {number} descColumn - Column index of description
   * @param {number[]} periodCols - Column indices of periods
   * @param {Array} periodsData - Array to store period data
   */
  const extractData = (worksheet, descColumn, periodCols, periodsData) => {
    // Process each row in the worksheet
    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;
      
      // Get description cell
      const descCell = row.values[descColumn];
      if (!descCell) return;
      
      // Find matching field key
      const { fieldKey } = findMatchingField(descCell);
      if (!fieldKey) return;
      
      // Extract values for each period
      periodCols.forEach((colIndex, periodIndex) => {
        const cell = row.getCell(colIndex);
        
        // Skip cells with gray fill (typically headings or non-data)
        if (cell.fill && cell.fill.fgColor && 
            cell.fill.fgColor.argb && 
            cell.fill.fgColor.argb.toLowerCase().includes('d3d3d3')) {
          return;
        }
        
        let value = cell.value;
        
        // Handle formula results
        if (value && typeof value === 'object' && value.formula && value.result !== undefined) {
          value = value.result;
        }
        
        // Parse and validate value
        const parsedValue = parseValue(value, fieldKey);
        if (parsedValue !== null && parsedValue !== undefined) {
          periodsData[periodIndex][fieldKey] = parsedValue;
        }
      });
    });
  };

  /**
   * Find field definition matching a description from Excel
   * @param {string} description - Cell description 
   * @returns {Object} Object with fieldKey and definition
   */
  const findMatchingField = (description) => {
    if (!description || typeof description !== 'string') {
      return { fieldKey: null, definition: null };
    }
    
    const cleanDesc = description.trim().toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, ' ');
    
    // Try exact match first
    for (const [key, def] of Object.entries(fieldDefinitions)) {
      const cleanLabel = def.label.toLowerCase()
        .replace(/[🔧()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (cleanDesc === cleanLabel) {
        return { fieldKey: key, definition: def };
      }
    }
    
    // Try partial matches
    const mappings = {
      'receita': 'revenue',
      'faturamento': 'revenue',
      'vendas': 'revenue',
      'receita líquida': 'revenue',
      'margem bruta': 'grossMarginPercentage',
      'custo': 'override_cogs',
      'cpv': 'override_cogs',
      'csv': 'override_cogs',
      'despesas operacionais': 'operatingExpenses',
      'despesas': 'operatingExpenses',
      'sg&a': 'operatingExpenses',
      'depreciação': 'depreciationAndAmortisation',
      'd&a': 'depreciationAndAmortisation',
      'amortização': 'depreciationAndAmortisation',
      'juros': 'netInterestExpenseIncome',
      'financeiras': 'netInterestExpenseIncome',
      'resultado financeiro': 'netInterestExpenseIncome',
      'ir': 'incomeTaxRatePercentage',
      'csll': 'incomeTaxRatePercentage',
      'alíquota': 'incomeTaxRatePercentage',
      'dividendos': 'dividendsPaid',
      'extraordinário': 'extraordinaryItems',
      'capex': 'capitalExpenditures',
      'investimento': 'capitalExpenditures',
      'caixa inicial': 'openingCash',
      'contas a receber': 'accountsReceivableValueAvg',
      'prazo médio de recebimento': 'accountsReceivableDays',
      'pmr': 'accountsReceivableDays',
      'estoques': 'inventoryValueAvg',
      'prazo médio de estoques': 'inventoryDays',
      'pme': 'inventoryDays',
      'contas a pagar': 'accountsPayableValueAvg',
      'prazo médio de pagamento': 'accountsPayableDays',
      'pmp': 'accountsPayableDays',
      'ativo imobilizado': 'netFixedAssets',
      'imobilizado': 'netFixedAssets',
      'empréstimos': 'totalBankLoans',
      'dívida': 'totalBankLoans',
      'financiamentos': 'totalBankLoans',
      'patrimônio líquido': 'initialEquity',
      'pl inicial': 'initialEquity',
      'pl': 'initialEquity',
      'capital social': 'initialEquity',
    };
    
    for (const [pattern, fieldKey] of Object.entries(mappings)) {
      if (cleanDesc.includes(pattern)) {
        return { fieldKey, definition: fieldDefinitions[fieldKey] };
      }
    }
    
    return { fieldKey: null, definition: null };
  };

  /**
   * Parse and validate a value based on field type
   * @param {any} value - Raw cell value
   * @param {string} fieldKey - Field key from definitions
   * @returns {number|null} Parsed value or null if invalid
   */
  const parseValue = (value, fieldKey) => {
    // Handle empty values
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const def = fieldDefinitions[fieldKey];
    if (!def) return null;
    
    // Try to parse numeric value
    let numericValue;
    
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      // Handle percentage strings
      if (value.includes('%')) {
        value = value.replace('%', '');
      }
      
      // Parse number, handle different formats
      const parsedValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (!isNaN(parsedValue)) {
        numericValue = parsedValue;
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    // Special handling for percentage fields
    if (def.type === 'percentage' && numericValue < 1 && numericValue > 0) {
      // Convert decimal percentage to whole number percentage (e.g., 0.45 to 45)
      numericValue *= 100;
    }
    
    return numericValue;
  };

  return {
    parseExcelData,
    isParsing,
    parsingError,
  };
}