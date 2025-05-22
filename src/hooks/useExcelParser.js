// src/hooks/useExcelParser.js
import { useState, useCallback } from 'react';
import { GREY_FILLS, HEADER_PATTERNS } from '../utils/constants';
import { fieldDefinitions } from '../utils/fieldDefinitions'; // Using the same fieldDefinitions

export function useExcelParser() {
  const [parsingError, setParsingError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  const findWorksheet = useCallback((workbook) => {
    const sheet = workbook.worksheets.find(ws => {
      const headerRow = ws.getRow(1).values; // .values can include empty slots
      if (!Array.isArray(headerRow)) return false;
      return headerRow.some(cellValue => 
        typeof cellValue === 'string' && 
        HEADER_PATTERNS.some(pattern => cellValue.toLowerCase().includes(pattern.toLowerCase()))
      );
    });
    return sheet || workbook.worksheets[0]; // Fallback to the first sheet
  }, []);

  const detectPeriodsInHeader = useCallback((worksheet) => {
    const headerRowValues = worksheet.getRow(1).values || [];
    let detectedPeriods = 0;
    headerRowValues.forEach(cellValue => {
      if (typeof cellValue === 'string' && cellValue.toLowerCase().startsWith('período ')) {
        detectedPeriods++;
      }
    });
    // Fallback if "Período X" not found, try to infer from number of columns
    // Assumes structure: Key, Description, P1, P2, ..., Note
    if (detectedPeriods === 0 && Array.isArray(headerRowValues) && headerRowValues.length >= 3) {
      // Count columns that are not "Item (Chave Interna)", "Descrição (Português)", or "Nota"
      const potentialPeriodHeaders = headerRowValues.slice(2, -1); // Exclude first two and last one
      detectedPeriods = potentialPeriodHeaders.length;
    }

    if (detectedPeriods === 0) return 2; // Default to 2 if no period columns detected
    return Math.min(Math.max(detectedPeriods, 1), 6); // Clamp between 1 and 6

  }, []);

  const isConsideredGreyCell = useCallback((cell) => {
    if (!cell || !cell.fill) return true; // If no fill, treat as inputtable for flexibility
    if (cell.fill.type === 'pattern' && cell.fill.pattern === 'solid' && cell.fill.fgColor && cell.fill.fgColor.argb) {
      const fillColor = cell.fill.fgColor.argb.toUpperCase();
      return GREY_FILLS.some(grey => fillColor === grey || fillColor.endsWith(grey)); // Check with and without FF prefix
    }
    return false; // If other fill type or pattern, not considered grey for input
  }, []);

  const parseFile = useCallback(async (file, ExcelJS) => {
    setIsParsing(true);
    setParsingError(null);

    if (!ExcelJS) {
      const err = new Error("Biblioteca ExcelJS não está carregada.");
      setParsingError(err);
      setIsParsing(false);
      throw err;
    }

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());

      const ws = findWorksheet(wb);
      if (!ws) {
        throw new Error("Nenhuma planilha válida encontrada no arquivo Excel. Verifique se a primeira planilha contém os dados ou se o cabeçalho corresponde aos padrões esperados.");
      }

      const detectedNumPeriods = detectPeriodsInHeader(ws);
      const extractedDataForPeriods = Array(detectedNumPeriods).fill(null).map(() => ({}));
      const allFieldKeys = Object.keys(fieldDefinitions);

      let foundAnyData = false;

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

  }, [findWorksheet, detectPeriodsInHeader, isConsideredGreyCell]); // Dependencies

  return {
    parseFile,
    isParsing,
    parsingError,
    setParsingError // Allow clearing error from component
  };
}