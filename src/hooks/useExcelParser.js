// src/hooks/useExcelParser.js
import { useState, useCallback } from 'react';
import { GREY_FILLS, HEADER_PATTERNS } from '../utils/constants';
import { fieldDefinitions } from '../utils/fieldDefinitions'; // Using the same fieldDefinitions

export function useExcelParser(ExcelJSLibrary) {
  const [parsingError, setParsingError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  const findWorksheet = useCallback((workbook) => {
    // First, try to find a worksheet with the expected headers
    const sheet = workbook.worksheets.find(ws => {
      const headerRow = ws.getRow(1).values; // .values can include empty slots
      if (!Array.isArray(headerRow)) return false;
      return headerRow.some(cellValue => 
        typeof cellValue === 'string' && 
        HEADER_PATTERNS.some(pattern => cellValue.toLowerCase().includes(pattern.toLowerCase()))
      );
    });
    
    if (sheet) return sheet;
    
    // If no sheet found with headers, look for sheet with "Dados" in the name
    const dataSheet = workbook.worksheets.find(ws => 
      ws.name && ws.name.toLowerCase().includes('dados')
    );
    
    if (dataSheet) return dataSheet;
    
    // Final fallback: use the first sheet that's not instructions
    const nonInstructionSheet = workbook.worksheets.find(ws => 
      ws.name && !ws.name.toLowerCase().includes('instruç')
    );
    
    return nonInstructionSheet || workbook.worksheets[0]; // Ultimate fallback to first sheet
  }, []);

  const detectPeriodsInHeader = useCallback((worksheet) => {
    const headerRowValues = worksheet.getRow(1).values || [];
    console.log("Excel header detection - Row values:", headerRowValues);
    
    let detectedPeriods = 0;
    
    // Expanded patterns for period headers detection
    const periodPatterns = [
      'período ', 'periodo ', 'per ', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'
    ];
    
    // First method: Look for explicit period headers with expanded patterns
    headerRowValues.forEach((cellValue, index) => {
      if (typeof cellValue === 'string') {
        const lowerValue = cellValue.toLowerCase();
        if (periodPatterns.some(pattern => lowerValue.includes(pattern)) ||
            /^per[íi]odo\s*\d+$/i.test(lowerValue)) {
          detectedPeriods++;
          console.log(`Found period header at column ${index}: "${cellValue}"`);
        }
      }
    });
    
    // Second method: Count consecutive numeric columns after key and description
    if (detectedPeriods === 0 && Array.isArray(headerRowValues) && headerRowValues.length >= 3) {
      // Look for data-containing columns between the ID/description columns and any notes column
      // This assumes structure: [Key, Description, Period1, Period2, ..., Notes]
      
      // Find the starting column (after key/description)
      let startCol = 2; // Default to column 3 (index 2)
      
      // Find the ending column (before notes or end)
      let endCol = headerRowValues.length - 1;
      
      // Adjust if Notes column is detected
      for (let i = endCol; i > startCol; i--) {
        if (headerRowValues[i] && typeof headerRowValues[i] === 'string' && 
            (headerRowValues[i].toLowerCase().includes('nota') || 
             headerRowValues[i].toLowerCase().includes('instrução'))) {
          endCol = i - 1;
          break;
        }
      }
      
      // Count potential period columns
      detectedPeriods = endCol - startCol + 1;
      console.log(`Inferred period count from columns: ${detectedPeriods} (columns ${startCol+1}-${endCol+1})`);
    }
    
    // Third method: Check data rows with non-null values to infer period count
    if (detectedPeriods <= 1) {
      try {
        // Check a couple of data rows
        const dataRows = [2, 3, 4, 5].map(rowNum => worksheet.getRow(rowNum));
        
        // Find max number of consecutive non-empty cells that could be period data
        let maxConsecutiveDataCells = 0;
        
        dataRows.forEach(row => {
          // Start from column 3 (index 2)
          let consecutiveCount = 0;
          let startIdx = 2;
          
          for (let i = startIdx; i < row.values.length; i++) {
            const cell = row.getCell(i + 1); // ExcelJS is 1-indexed for cells
            
            // Check if cell has a value and is not a header/label
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
              consecutiveCount++;
            } else if (consecutiveCount > 0) {
              // Found empty cell after data cells - might be end of periods
              break;
            }
          }
          
          maxConsecutiveDataCells = Math.max(maxConsecutiveDataCells, consecutiveCount);
        });
        
        // If we found more periods this way, use that number
        if (maxConsecutiveDataCells > detectedPeriods) {
          detectedPeriods = maxConsecutiveDataCells;
          console.log(`Detected ${detectedPeriods} periods from data cell analysis`);
        }
      } catch (err) {
        console.warn("Error analyzing data rows for period detection", err);
      }
    }
    
    // If all detection methods failed, default to 2
    if (detectedPeriods <= 1) {
      console.log("Could not confidently detect periods, defaulting to 2");
      return 2;
    }
    
    // Cap at 6 periods maximum
    const finalPeriodCount = Math.min(Math.max(detectedPeriods, 1), 6);
    console.log(`Final detected period count: ${finalPeriodCount}`);
    return finalPeriodCount;
  }, []);

  const isConsideredGreyCell = useCallback((cell) => {
    if (!cell || !cell.fill) return true; // If no fill, treat as inputtable for flexibility
    if (cell.fill.type === 'pattern' && cell.fill.pattern === 'solid' && cell.fill.fgColor && cell.fill.fgColor.argb) {
      const fillColor = cell.fill.fgColor.argb.toUpperCase();
      return GREY_FILLS.some(grey => fillColor === grey || fillColor.endsWith(grey)); // Check with and without FF prefix
    }
    return false; // If other fill type or pattern, not considered grey for input
  }, []);

  const parseFile = useCallback(async (file) => {
    setIsParsing(true);
    setParsingError(null);
    // Use the ExcelJS library passed as parameter to the hook, or fall back to window.ExcelJS
    const ExcelJS = ExcelJSLibrary || window.ExcelJS;
    if (!ExcelJS) {
      const err = new Error("Biblioteca ExcelJS não está carregada.");
      setParsingError(err);
      setIsParsing(false);
      throw err;
    }

    try {
      console.log(`Processing Excel file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      console.log(`Excel loaded successfully with ${wb.worksheets.length} worksheets`);
      
      const ws = findWorksheet(wb);
      if (!ws) {
        throw new Error("Nenhuma planilha válida encontrada no arquivo Excel. Verifique se a primeira planilha contém os dados ou se o cabeçalho corresponde aos padrões esperados.");
      }
      console.log(`Selected worksheet: "${ws.name}" with ${ws.rowCount} rows`);
      
      const detectedNumPeriods = detectPeriodsInHeader(ws);
      console.log(`Will extract data for ${detectedNumPeriods} periods`);
      
      const extractedDataForPeriods = Array(detectedNumPeriods).fill(null).map(() => ({}));
      const allFieldKeys = Object.keys(fieldDefinitions);
      let foundAnyData = false;

      // Before processing, log the first few rows to help with debugging
      console.log("First 3 rows of the selected worksheet:");
      for (let i = 1; i <= 3 && i <= ws.rowCount; i++) {
        const rowValues = ws.getRow(i).values;
        console.log(`Row ${i}:`, rowValues);
      }

      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        // Column A for field key (internal English key)
        const fieldKeyFromFile = row.getCell(1).value?.toString().trim();
        if (!fieldKeyFromFile || !allFieldKeys.includes(fieldKeyFromFile)) {
            // console.warn(`Linha ${rowNumber}: Chave de campo "${fieldKeyFromFile}" não reconhecida ou ausente na coluna A. Pulando linha.`);
            return;
        }
        
        const fieldDef = fieldDefinitions[fieldKeyFromFile];
        
        for (let periodIdx = 0; periodIdx < detectedNumPeriods; periodIdx++) {
          const dataCell = row.getCell(3 + periodIdx); // Data starts at column C (ExcelJS is 1-indexed)
          
          if (fieldDef.firstPeriodOnly && periodIdx > 0) {
            extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null;
            continue;
          }
          
          if (dataCell.value === "[Não Aplicável]") {
            extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null;
            continue;
          }
          
          // Process if it's a grey cell OR if it has a value (for flexibility if user removes formatting)
          if (isConsideredGreyCell(dataCell) || (dataCell.value !== null && typeof dataCell.value !== 'object')) {
            const cellValue = dataCell.value;
            if (cellValue !== null && typeof cellValue !== 'object') { // typeof object can be Date
              let numValue = Number(cellValue);
              if (isNaN(numValue) && typeof cellValue === 'object' && cellValue.result !== undefined) { // Formula result
                numValue = Number(cellValue.result);
              }
              
              if (!isNaN(numValue)) {
                extractedDataForPeriods[periodIdx][fieldKeyFromFile] = numValue;
                foundAnyData = true;
              } else {
                extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null;
              }
            } else {
              extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null;
            }
          } else {
             extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null; // Not a grey cell / no value
          }
        }
      });

      if (!foundAnyData) {
        console.warn("Nenhum dado numérico encontrado nas células de entrada esperadas do Excel.");
        // Optionally throw an error or return empty if this is critical
      }

      // Ensure all defined fields are present in each period object, even if null
      const finalData = extractedDataForPeriods.map(period => {
        const completePeriod = {};
        allFieldKeys.forEach(key => {
          completePeriod[key] = period[key] === undefined ? null : period[key];
        });
        return completePeriod;
      });

      console.log(`Extracted data for ${finalData.length} periods successfully`);
      
      setIsParsing(false);
      return {
        data: finalData,
        detectedPeriods: detectedNumPeriods
      };
    } catch (error) {
      console.error('Erro ao analisar o arquivo Excel:', error);
      setParsingError(error);
      setIsParsing(false);
      throw error; // Re-throw for the caller to handle
    }
  }, [findWorksheet, detectPeriodsInHeader, isConsideredGreyCell, ExcelJSLibrary]); // Dependencies

  return {
    parseFile,
    isParsing,
    parsingError,
    setParsingError // Allow clearing error from component
  };
}