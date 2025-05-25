// src/hooks/useExcelParser.js
import { useState, useCallback } from 'react';
import { GREY_FILLS, HEADER_PATTERNS, MAX_PERIODS, DEFAULT_PERIODS_EXCEL } from '../utils/constants';
import { fieldDefinitions, getFieldKeys } from '../utils/fieldDefinitions';

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
    
    // IMPROVEMENT: Stricter primary detection for "Período X" patterns
    // First method: Look for explicit period headers with strict pattern matching
    const strictPeriodPattern = /^per[íi]odo\s*\d+$/i;  // Matches "Período X" or "Periodo X" exactly
    
    for (let i = 3; i < headerRowValues.length; i++) {  // Start from column C (index 3)
      const cellValue = headerRowValues[i];
      
      if (typeof cellValue === 'string') {
        const lowerValue = cellValue.toLowerCase();
        
        // Strict primary detection: Check for exact "Período X" pattern
        if (strictPeriodPattern.test(lowerValue)) {
          detectedPeriods++;
          console.log(`Found period header at column ${i}: "${cellValue}" (strict match)`);
        }
      }
    }

    // Secondary detection: Check for loose period patterns if strict pattern didn't find any
    if (detectedPeriods === 0) {
      // Expanded patterns for period headers detection - looser matching
      const periodPatterns = [
        'período ', 'periodo ', 'per ', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'
      ];
      
      for (let i = 3; i < headerRowValues.length; i++) {
        const cellValue = headerRowValues[i];
        
        if (typeof cellValue === 'string') {
          const lowerValue = cellValue.toLowerCase();
          if (periodPatterns.some(pattern => lowerValue.includes(pattern))) {
            detectedPeriods++;
            console.log(`Found period header at column ${i}: "${cellValue}" (pattern match)`);
          }
        }
      }
    }
    
    // IMPROVEMENT: Better fallback logic for when no period headers are found
    if (detectedPeriods === 0) {
      // Try to find "Descrição" and "Nota" columns to determine period columns in between
      const descIndex = headerRowValues.findIndex(
        h => typeof h === 'string' && h.toLowerCase().includes('descrição')
      );
      
      const noteIndex = headerRowValues.findIndex(
        h => typeof h === 'string' && 
        (h.toLowerCase().includes('nota') || h.toLowerCase().includes('instruções'))
      );
      
      console.log(`Fallback detection: Description column at ${descIndex}, Notes column at ${noteIndex}`);
      
      if (descIndex !== -1) {
        if (noteIndex !== -1 && noteIndex > descIndex + 1) {
          // Count columns between "Descrição" and "Nota"
          detectedPeriods = noteIndex - (descIndex + 1);
          console.log(`Detected ${detectedPeriods} periods between Description and Notes columns`);
        } else {
          // Count non-empty cells after "Descrição" if no "Nota" column found
          let potentialCols = 0;
          for (let i = descIndex + 2; i < headerRowValues.length; i++) {
            if (headerRowValues[i] !== null && typeof headerRowValues[i] !== 'undefined') {
              potentialCols++;
            } else {
              break; // Stop at first empty header
            }
          }
          detectedPeriods = potentialCols;
          console.log(`Detected ${detectedPeriods} periods after Description column (no Notes column found)`);
        }
      }
      
      // Additional fallback - analyze data rows to check for numeric content in potential period columns
      if (detectedPeriods === 0 || detectedPeriods > MAX_PERIODS) {
        try {
          // Check a few data rows (rows 2-5) for numeric content
          const potentialPeriodCounts = [];
          
          for (let rowNum = 2; rowNum <= 5 && rowNum <= worksheet.rowCount; rowNum++) {
            const rowValues = worksheet.getRow(rowNum).values || [];
            let numericCellCount = 0;
            
            // Start from column C (index 3) - typical position for first period
            for (let colIdx = 3; colIdx < rowValues.length && colIdx < 10; colIdx++) {
              const cellValue = rowValues[colIdx];
              // Check if it's a number or can be converted to a number
              if (typeof cellValue === 'number' || 
                 (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue)))) {
                numericCellCount++;
              } else if (cellValue === null || cellValue === undefined) {
                // Skip empty cells, they could just be missing data
                continue;
              } else {
                // If we hit a non-numeric, non-empty cell, break - might be notes or other content
                break;
              }
            }
            
            if (numericCellCount > 0) {
              potentialPeriodCounts.push(numericCellCount);
            }
          }
          
          // If we found any potential period counts from data analysis
          if (potentialPeriodCounts.length > 0) {
            // Use the most common count or the max if there's a tie
            const countOccurrences = {};
            potentialPeriodCounts.forEach(count => {
              countOccurrences[count] = (countOccurrences[count] || 0) + 1;
            });
            
            let mostCommonCount = 0;
            let highestOccurrence = 0;
            
            Object.entries(countOccurrences).forEach(([count, occurrences]) => {
              if (occurrences > highestOccurrence || 
                 (occurrences === highestOccurrence && parseInt(count) > mostCommonCount)) {
                mostCommonCount = parseInt(count);
                highestOccurrence = occurrences;
              }
            });
            
            if (mostCommonCount > 0 && mostCommonCount <= MAX_PERIODS) {
              detectedPeriods = mostCommonCount;
              console.log(`Detected ${detectedPeriods} periods from numeric data analysis in rows`);
            }
          }
        } catch (err) {
          console.warn("Error during data row analysis for period detection:", err);
        }
      }
    }
    
    // IMPROVEMENT: If all detection methods failed, log a warning and use DEFAULT_PERIODS_EXCEL
    if (detectedPeriods === 0 || detectedPeriods > MAX_PERIODS) {
      console.warn(`Could not reliably detect periods in Excel file, defaulting to ${DEFAULT_PERIODS_EXCEL} periods`);
      return DEFAULT_PERIODS_EXCEL;
    }
    
    // Ensure detected periods is at least 1 and at most MAX_PERIODS
    const finalPeriodCount = Math.max(1, Math.min(detectedPeriods, MAX_PERIODS));
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
      const allFieldKeys = getFieldKeys();
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