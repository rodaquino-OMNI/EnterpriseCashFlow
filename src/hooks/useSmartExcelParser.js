// src/hooks/useSmartExcelParser.js
import { useState, useCallback } from 'react';
import { TEMPLATE_TYPES, HEADER_PATTERNS, MAX_PERIODS, DEFAULT_PERIODS_EXCEL } from '../utils/constants';
import { fieldDefinitions, getFieldKeys, FIELD_CATEGORIES } from '../utils/fieldDefinitions';

/**
 * @typedef {import('../types/financial').PeriodInputData} PeriodInputData
 * @typedef {import('../utils/excelTemplateGenerator').TEMPLATE_TYPES[keyof import('../utils/excelTemplateGenerator').TEMPLATE_TYPES]} TemplateTypeKey
 */

/**
 * @typedef {Object} TemplateStructureInfo
 * @property {TemplateTypeKey} type
 * @property {string} version
 * @property {string[]} sheetNamesFound // All sheet names found in the workbook
 * @property {{
 * instructions?: string; 
 * drivers?: string; 
 * overridePL?: string; 
 * overrideBS?: string; 
 * overrideCF?: string;
 * mainData?: string; // For basic templates
 * }} sheetPaths - Paths (names) to relevant sheets.
 */

/**
 * @typedef {Object} PeriodDetectionInfo
 * @property {number} headerColumnsCount - How many "Período X" style headers were found.
 * @property {number} actualDataColCount - How many of those columns actually seem to contain data.
 * @property {import('../types/financial').PeriodTypeOption | null} detectedPeriodTypeFromFile - Type detected from Excel (e.g. instructions sheet)
 * @property {Array<{text: string; columnIndex: number}>} periodHeaders - List of identified period headers.
 */

async function detectAdvancedTemplateStructure(workbook) {
  const sheets = workbook.worksheets.map(ws => ({ name: ws.name, nameLower: ws.name.toLowerCase(), rowCount: ws.actualRowCount }));
  const structure = { type: TEMPLATE_TYPES.BASIC_DRIVERS, version: '1.0', sheetNamesFound: sheets.map(s => s.name), sheetPaths: {} };

  const instructionSheet = sheets.find(s => s.nameLower.includes('instruções') || s.nameLower.includes('instructions'));
  const driversSheet = sheets.find(s => s.nameLower.includes('drivers') || s.nameLower.includes('dados principais'));

  if (instructionSheet && driversSheet) {
    structure.type = TEMPLATE_TYPES.SMART_ADAPTIVE;
    structure.version = '2.1'; // Indicate smart template version
    structure.sheetPaths.instructions = instructionSheet.name;
    structure.sheetPaths.drivers = driversSheet.name;
    structure.sheetPaths.overridePL = sheets.find(s => s.nameLower.includes('override') && s.nameLower.includes('dre'))?.name;
    structure.sheetPaths.overrideBS = sheets.find(s => s.nameLower.includes('override') && s.nameLower.includes('balanço'))?.name;
    structure.sheetPaths.overrideCF = sheets.find(s => s.nameLower.includes('override') && s.nameLower.includes('caixa'))?.name;
  } else {
    const mainSheet = sheets.find(s => s.rowCount > 0); // A sheet with some data
    if (mainSheet) {
      const ws = workbook.getWorksheet(mainSheet.name);
      const headerRowCell1Text = ws.getCell('A1').text?.toString().trim().toLowerCase();
      if (headerRowCell1Text && HEADER_PATTERNS.some(pattern => headerRowCell1Text.includes(pattern.toLowerCase()))) {
        structure.type = TEMPLATE_TYPES.BASIC_DRIVERS;
        structure.version = '1.0'; // Legacy basic
        structure.sheetPaths.mainData = mainSheet.name;
      } else {
        console.warn('Formato de template não totalmente reconhecido. Tentando parse genérico na primeira planilha com dados.');
        structure.type = TEMPLATE_TYPES.BASIC_DRIVERS; // Fallback to attempt basic parse
        structure.sheetPaths.mainData = mainSheet.name || workbook.worksheets[0]?.name;
        if (!structure.sheetPaths.mainData) {
          throw new Error('Nenhuma planilha com dados encontrada no arquivo Excel.');
        }
      }
    } else {
      throw new Error('Arquivo Excel não contém planilhas com dados.');
    }
  }
  return structure;
}

async function detectSmartPeriodInfo(workbook, templateStructure, expectedPeriodType) {
  const periodInfo = { headerColumnsCount: 0, actualDataColCount: 0, detectedPeriodTypeFromFile: null, periodHeaders: [] };
  const dataSheetName = templateStructure.sheetPaths.drivers || templateStructure.sheetPaths.mainData;
  if (!dataSheetName) return periodInfo;

  const mainSheet = workbook.getWorksheet(dataSheetName);
  if (!mainSheet) return periodInfo;

  const headerRow = mainSheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (cell.text && typeof cell.text === 'string' && cell.text.toLowerCase().startsWith('período ')) {
      periodInfo.headerColumnsCount++;
      periodInfo.periodHeaders.push({ text: cell.text, columnIndex: colNumber });
    }
  });
  
  // Fallback if no "Período X" headers
  if (periodInfo.headerColumnsCount === 0) {
    const firstDataRow = mainSheet.getRow(2); // Check for data in row 2
    let potentialPeriods = 0;
    // Column D or E is usually where period data starts in our templates
    const startColCheck = (templateStructure.type === TEMPLATE_TYPES.SMART_ADAPTIVE) ? 5 : 3;
    for (let i = startColCheck; i < startColCheck + MAX_PERIODS; i++) {
      if (firstDataRow.getCell(i).value !== null && typeof firstDataRow.getCell(i).value !== 'undefined') {
        potentialPeriods++;
      } else {
        break; // Stop at first empty column
      }
    }
    periodInfo.headerColumnsCount = potentialPeriods > 0 ? potentialPeriods : DEFAULT_PERIODS_EXCEL;
    // Populate dummy periodHeaders if needed
    if (periodInfo.periodHeaders.length === 0 && periodInfo.headerColumnsCount > 0) {
      for (let i = 0; i < periodInfo.headerColumnsCount; i++) {
        periodInfo.periodHeaders.push({text: `Período ${i+1} (Inferido)`, columnIndex: startColCheck + i });
      }
    }
  }
  periodInfo.headerColumnsCount = Math.min(periodInfo.headerColumnsCount, MAX_PERIODS);

  // Analyze actual data in detected period columns to find last period with data
  if (periodInfo.headerColumnsCount > 0) {
    let lastPeriodWithAnyData = 0;
    for (let periodIdx = 0; periodIdx < periodInfo.headerColumnsCount; periodIdx++) {
      const currentPeriodColIndex = periodInfo.periodHeaders[periodIdx].columnIndex;
      let hasDataInThisPeriodColumn = false;
      // Check a few rows for actual data
      for (let rowIdx = 2; rowIdx <= Math.min(mainSheet.actualRowCount, 20); rowIdx++) {
        const cell = mainSheet.getCell(rowIdx, currentPeriodColIndex);
        const value = cell.value;
        if (value !== null && value !== undefined && String(value).trim() !== '' && value !== '[N/A]' && value !== '[Não Aplicável]') {
          const numValue = Number(value.result !== undefined ? value.result : value); // Handle formula results
          if (!isNaN(numValue)) { // Allow 0 as valid data
            hasDataInThisPeriodColumn = true;
            break;
          }
        }
      }
      if (hasDataInThisPeriodColumn) {
        lastPeriodWithAnyData = periodIdx + 1;
      }
    }
    periodInfo.actualDataColCount = lastPeriodWithAnyData > 0 ? lastPeriodWithAnyData : (periodInfo.headerColumnsCount > 0 ? 1 : 0) ;
  }
  
  // Try to detect period type from instructions sheet
  if (templateStructure.sheetPaths.instructions) {
    const instructionSheet = workbook.getWorksheet(templateStructure.sheetPaths.instructions);
    if (instructionSheet) {
      const cellValue = instructionSheet.getCell('C8').text?.toString().toLowerCase(); // Where we write it in template
      if (cellValue) {
        if (cellValue.includes('anos')) periodInfo.detectedPeriodTypeFromFile = 'anos';
        else if (cellValue.includes('trimestres')) periodInfo.detectedPeriodTypeFromFile = 'trimestres';
        else if (cellValue.includes('meses')) periodInfo.detectedPeriodTypeFromFile = 'meses';
      }
    }
  }
  if (!periodInfo.detectedPeriodTypeFromFile) periodInfo.detectedPeriodTypeFromFile = expectedPeriodType;

  return periodInfo;
}

function parseSheetDataIntoPeriods(sheet, periodsData, numPeriodsToParse, relevantFieldKeys, firstDataColumnIndex, warnings) {
  if (!sheet) return;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    const fieldKey = row.getCell(1).text?.toString().trim();
    if (!fieldKey || !relevantFieldKeys.includes(fieldKey)) return;

    const fieldDef = fieldDefinitions[fieldKey];
    for (let periodIdx = 0; periodIdx < numPeriodsToParse; periodIdx++) {
      if (fieldDef.firstPeriodOnly && periodIdx > 0) {
        if (periodsData[periodIdx][fieldKey] === undefined) periodsData[periodIdx][fieldKey] = null;
        continue;
      }
      const dataCell = row.getCell(firstDataColumnIndex + periodIdx);
      const cellValueRaw = dataCell.value;
      if (cellValueRaw === '[N/A]' || cellValueRaw === '[Não Aplicável]') {
        if (periodsData[periodIdx][fieldKey] === undefined) periodsData[periodIdx][fieldKey] = null;
        continue;
      }
      let actualValue = null;
      if (typeof cellValueRaw === 'object' && cellValueRaw !== null && cellValueRaw.result !== undefined) actualValue = cellValueRaw.result;
      else if (cellValueRaw !== null && typeof cellValueRaw !== 'undefined' && String(cellValueRaw).trim() !== '') actualValue = cellValueRaw;
            
      if (actualValue !== null) {
        const numValue = Number(String(actualValue).replace(',','')); // Handle if ExcelJS returns formatted number as string
        if (!isNaN(numValue)) {
          // Overwrite only if current value is null (first sheet with data for this field wins)
          // Or implement specific override logic (e.g. override sheets always win over driver sheets)
          if (periodsData[periodIdx][fieldKey] === null || typeof periodsData[periodIdx][fieldKey] === 'undefined' || fieldDef.isOverride) {
            periodsData[periodIdx][fieldKey] = numValue;
          }
        } else {
          if (periodsData[periodIdx][fieldKey] === undefined) periodsData[periodIdx][fieldKey] = null;
        }
      } else {
        if (periodsData[periodIdx][fieldKey] === undefined) periodsData[periodIdx][fieldKey] = null;
      }
    }
  });
}

async function parseAdvancedStrategy(workbook, templateInfo, periodInfo) {
  const { actualDataColCount } = periodInfo;
  const allAppFieldKeys = getFieldKeys();
  const periodsData = Array(actualDataColCount).fill(null).map(() => {
    const p = {}; allAppFieldKeys.forEach(k => p[k] = null); return p;
  });
  const warnings = [];

  // Data column in "Smart Template" sheets start at column E (index 5)
  // Key(A), Desc(B), Type(C), Req(D), P1(E)...
  const smartTemplateDataStartColumn = 5; 

  // 1. Parse Drivers
  const driversSheet = workbook.getWorksheet(templateInfo.sheetPaths.drivers);
  if (driversSheet) {
    parseSheetDataIntoPeriods(driversSheet, periodsData, actualDataColCount, getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]), smartTemplateDataStartColumn, warnings);
  } else {
    warnings.push('Planilha de Drivers Essenciais não encontrada.');
  }

  // 2. Parse Overrides (Override values will replace driver-based values if not null)
  const overrideSheetsConfig = [
    { sheetPath: templateInfo.sheetPaths.overridePL, category: FIELD_CATEGORIES.OVERRIDE_PL },
    { sheetPath: templateInfo.sheetPaths.overrideBS, category: FIELD_CATEGORIES.OVERRIDE_BS },
    { sheetPath: templateInfo.sheetPaths.overrideCF, category: FIELD_CATEGORIES.OVERRIDE_CF },
  ];

  overrideSheetsConfig.forEach(config => {
    if (config.sheetPath) {
      const wsOverride = workbook.getWorksheet(config.sheetPath);
      if (wsOverride) {
        parseSheetDataIntoPeriods(wsOverride, periodsData, actualDataColCount, getFieldKeys(config.category), smartTemplateDataStartColumn, warnings);
      } else {
        // Optional, so no major warning if missing
        console.log(`Optional override sheet "${config.sheetPath}" not found.`);
      }
    }
  });

  return { periods: periodsData, actualPeriods: actualDataColCount, periodType: periodInfo.detectedPeriodTypeFromFile, warnings };
}

async function parseBasicStrategy(workbook, templateInfo, periodInfo) {
  const { actualDataColCount } = periodInfo;
  const allAppFieldKeys = getFieldKeys();
  const periodsData = Array(actualDataColCount).fill(null).map(() => {
    const p = {}; allAppFieldKeys.forEach(k => p[k] = null); return p;
  });
  const warnings = [];
  const basicSheet = workbook.getWorksheet(templateInfo.sheetPaths.mainData);
    
  if (basicSheet) {
    // In basic templates, data might start at column C (index 3)
    // Key(A), Description(B), P1(C)...
    parseSheetDataIntoPeriods(basicSheet, periodsData, actualDataColCount, getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]), 3, warnings);
  } else {
    warnings.push('Planilha de dados principal não encontrada para template básico.');
  }
  return { periods: periodsData, actualPeriods: actualDataColCount, periodType: periodInfo.detectedPeriodTypeFromFile, warnings };
}

function analyzeDataQuality(parsedDataResult) {
  const { periods, actualPeriods } = parsedDataResult;
  if (!periods || periods.length === 0) return { requiredCompleteness: 0, optionalCompleteness: 0, overrideCount: 0, totalDataPoints: 0, qualityScore:0 };

  let totalRequiredFields = 0, filledRequiredFields = 0;
  let totalOptionalFields = 0, filledOptionalFields = 0;
  let overrideCount = 0;

  const requiredDriverKeys = getFieldKeys(FIELD_CATEGORIES.DRIVER_REQUIRED);
  const optionalDriverKeys = getFieldKeys(FIELD_CATEGORIES.DRIVER_OPTIONAL);
  const allOverrideKeys = getFieldKeys().filter(k => fieldDefinitions[k].isOverride);

  periods.forEach((period, periodIdx) => {
    requiredDriverKeys.forEach(key => {
      const def = fieldDefinitions[key];
      if (def.firstPeriodOnly && periodIdx > 0) return;
      totalRequiredFields++;
      if (period[key] !== null && period[key] !== undefined && period[key] !== '') filledRequiredFields++;
    });
    optionalDriverKeys.forEach(key => {
      const def = fieldDefinitions[key];
      if (def.firstPeriodOnly && periodIdx > 0) return;
      totalOptionalFields++;
      if (period[key] !== null && period[key] !== undefined && period[key] !== '') filledOptionalFields++;
    });
    allOverrideKeys.forEach(key => {
      if (period[key] !== null && period[key] !== undefined && period[key] !== '') overrideCount++;
    });
  });
  
  const requiredCompleteness = totalRequiredFields > 0 ? (filledRequiredFields / totalRequiredFields) * 100 : 100;
  const optionalCompleteness = totalOptionalFields > 0 ? (filledOptionalFields / totalOptionalFields) * 100 : 0;
  const score = requiredCompleteness * 0.6 + optionalCompleteness * 0.2 + Math.min(overrideCount * 1.5, 20);

  return {
    requiredCompleteness: Math.round(requiredCompleteness),
    optionalCompleteness: Math.round(optionalCompleteness),
    overrideCount,
    totalDataPoints: filledRequiredFields + filledOptionalFields + overrideCount,
    qualityScore: Math.min(Math.round(score), 100),
  };
}

function generateSmartRecommendations(qualityAnalysis, parsedData) {
  const recommendations = [];
  
  if (qualityAnalysis.requiredCompleteness < 80) {
    recommendations.push({
      type: 'warning',
      title: 'Dados obrigatórios incompletos',
      message: `${qualityAnalysis.requiredCompleteness}% dos campos obrigatórios foram preenchidos. Considere completar os dados essenciais para melhor precisão.`,
    });
  }
  
  if (qualityAnalysis.optionalCompleteness < 30) {
    recommendations.push({
      type: 'info',
      title: 'Campos opcionais podem melhorar análise',
      message: 'Preencher campos opcionais como D&A, impostos e CAPEX pode aumentar a precisão dos cálculos.',
    });
  }
  
  if (qualityAnalysis.overrideCount > 0) {
    recommendations.push({
      type: 'success',
      title: 'Overrides detectados',
      message: `${qualityAnalysis.overrideCount} valores reais foram fornecidos e serão priorizados sobre os cálculos automáticos.`,
    });
  }
  
  return recommendations;
}

export function useSmartExcelParser(ExcelJSInstance) {
  const [parsingState, setParsingState] = useState({ isParsing: false, error: null, progress: 0, currentStep: '' });

  const parseFile = useCallback(async (file, expectedPeriodType = 'anos') => {
    setParsingState({ isParsing: true, error: null, progress: 0, currentStep: 'Carregando arquivo...' });

    if (!ExcelJSInstance) {
      const err = new Error('Biblioteca ExcelJS não carregada.');
      setParsingState({ isParsing: false, error: err, progress: 0, currentStep: 'Erro' });
      throw err;
    }

    try {
      const wb = new ExcelJSInstance.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      setParsingState(prev => ({ ...prev, progress: 15, currentStep: 'Arquivo carregado, detectando estrutura...' }));
      
      const templateStructure = await detectAdvancedTemplateStructure(wb);
      setParsingState(prev => ({ ...prev, progress: 30, currentStep: `Template "${templateStructure.type}" detectado. Analisando períodos...` }));
      
      const periodInfo = await detectSmartPeriodInfo(wb, templateStructure, expectedPeriodType);
      setParsingState(prev => ({ ...prev, progress: 50, currentStep: `${periodInfo.actualDataColCount}/${periodInfo.headerColumnsCount} períodos com dados. Extraindo...` }));
      
      const parsingStrategyFn = templateStructure.type === TEMPLATE_TYPES.SMART_ADAPTIVE 
        ? parseAdvancedStrategy 
        : parseBasicStrategy; // Fallback or specific for others
        
      const parsedDataResult = await parsingStrategyFn(wb, templateStructure, periodInfo);
      setParsingState(prev => ({ ...prev, progress: 75, currentStep: 'Analisando qualidade dos dados...' }));
      
      const qualityAnalysis = await analyzeDataQuality(parsedDataResult);
      setParsingState(prev => ({ ...prev, progress: 90, currentStep: 'Gerando recomendações...' }));
      
      const recommendations = generateSmartRecommendations(qualityAnalysis, parsedDataResult);
      
      const finalResult = {
        data: parsedDataResult.periods,
        detectedPeriods: parsedDataResult.actualPeriods,
        detectedPeriodType: parsedDataResult.periodType || expectedPeriodType,
        templateInfo: templateStructure, // Includes type and version
        qualityAnalysis,
        recommendations,
        warnings: parsedDataResult.warnings || [],
      };
      
      setParsingState({ isParsing: false, error: null, progress: 100, currentStep: 'Concluído!' });
      return finalResult;
      
    } catch (error) {
      console.error('Advanced Excel parsing error:', error);
      setParsingState({ isParsing: false, error, progress: 0, currentStep: 'Erro no Parse' });
      throw error;
    }
  }, [ExcelJSInstance]);

  const resetParser = useCallback(() => {
    setParsingState({ isParsing: false, error: null, progress: 0, currentStep: '' });
  },[]);

  return { parseFile, ...parsingState, resetParser };
}