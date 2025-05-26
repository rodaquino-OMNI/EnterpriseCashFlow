// src/hooks/useSmartExcelParser.js
import { useState, useCallback } from 'react';
import { HEADER_PATTERNS } from '../utils/constants';
import { fieldDefinitions, getFieldKeys, FIELD_CATEGORIES } from '../utils/fieldDefinitions';
import { TEMPLATE_TYPES } from '../utils/excelTemplateGenerator'; // FIXED: Import from correct location

/**
 * @typedef {import('../types/financial').PeriodInputData} PeriodInputData
 * @typedef {import('../utils/excelTemplateGenerator').TemplateTypeKeys} TemplateTypeKeys
 */

/**
 * @typedef {Object} TemplateInfo
 * @property {TemplateTypeKeys} type
 * @property {string} version
 * @property {string[]} sheets
 * @property {number} detectedPeriods
 */

/**
 * @typedef {Object} ParsedExcelData
 * @property {PeriodInputData[]} periods
 * @property {number} periodCount
 * @property {string[]} warnings
 */

// Helper to detect template type and basic structure
async function detectTemplateStructure(workbook) {
    const sheetNames = workbook.worksheets.map(ws => ws.name.toLowerCase());
    let type = TEMPLATE_TYPES.BASIC_DRIVERS; // Default
    let version = '1.0'; // Legacy or basic
    let detectedPeriods = 0;

    // Smart Adaptive Template Detection (highest priority)
    if (sheetNames.includes('📋 instruções') && sheetNames.includes('✅ drivers')) {
        type = TEMPLATE_TYPES.SMART_ADAPTIVE;
        version = '2.0'; // Current smart template version
        const driversSheet = workbook.getWorksheet('✅ Drivers');
        if (driversSheet) {
            const headerRow = driversSheet.getRow(1).values || [];
            headerRow.forEach(cell => {
                if (typeof cell === 'string' && cell.toLowerCase().startsWith('período ')) detectedPeriods++;
            });
        }
    }
    // TODO: Add detection logic for ADVANCED and COMPLETE if they have distinct sheet names or structures
    else { // Fallback to basic/legacy detection based on common header patterns
        const firstSheet = workbook.worksheets[0];
        if (firstSheet) {
            const headerRow = firstSheet.getRow(1).values || [];
            if (headerRow.some(cell => typeof cell === 'string' && HEADER_PATTERNS.some(p => cell.toLowerCase().includes(p.toLowerCase())))) {
                type = TEMPLATE_TYPES.BASIC_DRIVERS; // Could be our older 2-period template
                headerRow.forEach(cellValue => {
                    if (typeof cellValue === 'string' && cellValue.toLowerCase().startsWith('período ')) {
                        detectedPeriods++;
                    }
                });
            } else {
                // Could be an unknown format, or one of the "COMPLETE" statement types
                // For now, if not SMART or clearly BASIC, might need user to specify or throw error.
                // Let's assume it might be a simple list if no other clues
                type = TEMPLATE_TYPES.BASIC_DRIVERS;
                console.warn("Template não reconhecido como 'Smart'. Tentando parse básico.");
            }
        } else {
            throw new Error("Nenhuma planilha encontrada no arquivo Excel.");
        }
    }
    if(detectedPeriods === 0) detectedPeriods = 2; // Default if period columns not explicitly named "Período X"

    return { type, version, sheets: sheetNames, detectedPeriods: Math.min(6, Math.max(1, detectedPeriods)) };
}

// Parsing strategy for the "SMART_ADAPTIVE" template
async function parseSmartAdaptiveTemplate(workbook, templateInfo, ExcelJS) {
    const { detectedPeriods } = templateInfo;
    const allFieldKeys = getFieldKeys();
    const periodsData = Array(detectedPeriods).fill(null).map(() => ({}));
    const warnings = [];

    const sheetsToParse = [
        { name: '✅ Drivers', categoryPrefix: null }, // No prefix for driver keys
        { name: '🔧 Overrides DRE', categoryPrefix: FIELD_CATEGORIES.OVERRIDE_PL},
        { name: '🔧 Overrides Balanço', categoryPrefix: FIELD_CATEGORIES.OVERRIDE_BS},
        { name: '🔧 Overrides Caixa', categoryPrefix: FIELD_CATEGORIES.OVERRIDE_CF},
    ];

    sheetsToParse.forEach(sheetConfig => {
        const ws = workbook.getWorksheet(sheetConfig.name);
        if (!ws) {
            // It's okay if override sheets are missing for a smart template
            if(sheetConfig.name.includes("Override")) return;
            warnings.push(`Planilha esperada "${sheetConfig.name}" não encontrada.`);
            return;
        }

        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const fieldKeyFromFile = row.getCell(1).text?.toString().trim();
            if (!fieldKeyFromFile || !allFieldKeys.includes(fieldKeyFromFile)) return;

            const fieldDef = fieldDefinitions[fieldKeyFromFile];
            // Ensure we only process fields relevant to this sheet's category (if applicable)
            if (sheetConfig.categoryPrefix && fieldDef.category !== sheetConfig.categoryPrefix && !sheetConfig.name.includes('Drivers')) {
                return;
            }

            for (let periodIdx = 0; periodIdx < detectedPeriods; periodIdx++) {
                // In SMART template, data for periods is in Col E, F, G, H, I, J (indices 5 to 5 + numPeriods -1)
                // Col A: Key, Col B: Desc, Col C: Type, Col D: Required
                const dataCell = row.getCell(5 + periodIdx);

                if (fieldDef.firstPeriodOnly && periodIdx > 0) {
                    if (periodsData[periodIdx][fieldKeyFromFile] === undefined) periodsData[periodIdx][fieldKeyFromFile] = null;
                    continue;
                }
                if (dataCell.text === "[N/A]") {
                    if (periodsData[periodIdx][fieldKeyFromFile] === undefined) periodsData[periodIdx][fieldKeyFromFile] = null;
                    continue;
                }

                const cellValue = dataCell.value;
                let actualValue = null;
                if (typeof cellValue === 'object' && cellValue !== null && cellValue.result !== undefined) {
                    actualValue = cellValue.result;
                } else if (cellValue !== null && typeof cellValue !== 'undefined' && String(cellValue).trim() !== "") {
                    actualValue = cellValue;
                }

                if (actualValue !== null) {
                    const numValue = Number(actualValue);
                    if (!isNaN(numValue)) {
                        periodsData[periodIdx][fieldKeyFromFile] = numValue;
                    } else {
                        if (periodsData[periodIdx][fieldKeyFromFile] === undefined) periodsData[periodIdx][fieldKeyFromFile] = null;
                    }
                } else {
                    if (periodsData[periodIdx][fieldKeyFromFile] === undefined) periodsData[periodIdx][fieldKeyFromFile] = null;
                }
            }
        });
    });
    return { periods: periodsData, periodCount: detectedPeriods, warnings };
}

// Basic/Legacy parser (adapts the previous parser)
async function parseLegacyOrBasicTemplate(workbook, templateInfo, ExcelJS) {
    const ws = workbook.worksheets[0]; // Assume first sheet
    const detectedNumPeriods = templateInfo.detectedPeriods;
    const extractedDataForPeriods = Array(detectedNumPeriods).fill(null).map(() => ({}));
    const allFieldKeys = getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]); // Basic only has drivers
    let foundAnyData = false;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const fieldKeyFromFile = row.getCell(1).text?.toString().trim();
        if (!fieldKeyFromFile || !allFieldKeys.includes(fieldKeyFromFile)) return;
        const fieldDef = fieldDefinitions[fieldKeyFromFile];
        for (let periodIdx = 0; periodIdx < detectedNumPeriods; periodIdx++) {
            const dataCell = row.getCell(3 + periodIdx); // Assume Col C onwards for periods in basic
            if (fieldDef.firstPeriodOnly && periodIdx > 0) { extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null; continue; }
            if (dataCell.text === "[Não Aplicável]") { extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null; continue; }

            const cellValue = dataCell.value;
            let actualValue = null;
            if (typeof cellValue === 'object' && cellValue !== null && cellValue.result !== undefined) actualValue = cellValue.result;
            else if (cellValue !== null && typeof cellValue !== 'undefined' && String(cellValue).trim() !== "") actualValue = cellValue;
            
            if (actualValue !== null) {
                const numValue = Number(actualValue);
                if (!isNaN(numValue)) { extractedDataForPeriods[periodIdx][fieldKeyFromFile] = numValue; foundAnyData = true;}
                else { extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null; }
            } else { extractedDataForPeriods[periodIdx][fieldKeyFromFile] = null; }
        }
    });
    if (!foundAnyData) console.warn("Nenhum dado numérico encontrado (Template Básico).");
    const finalData = extractedDataForPeriods.map(period => {
        const completePeriod = {};
        allFieldKeys.forEach(key => { completePeriod[key] = period[key] === undefined ? null : period[key]; });
        return completePeriod;
    });
    return { periods: finalData, periodCount: detectedNumPeriods, warnings: [] };
}

const PARSING_STRATEGIES = {
    [TEMPLATE_TYPES.SMART_ADAPTIVE]: { parse: parseSmartAdaptiveTemplate },
    [TEMPLATE_TYPES.BASIC_DRIVERS]: { parse: parseLegacyOrBasicTemplate },
    // [TEMPLATE_TYPES.ADVANCED]: { parse: ... } // Define parser for advanced if different from smart
    // [TEMPLATE_TYPES.COMPLETE]: { parse: ... }
};

/**
 * @param {object | null} ExcelJSInstance
 * @returns {{ parseFile: (file: File) => Promise<import('../types/financial').ExcelParseResult & {templateType?: TemplateTypeKeys, dataInsights?: any, suggestions?: any, warnings?: string[] }>, isParsing: boolean, parsingError: Error | null, setParsingError: (error: Error | null) => void }}
 */
export function useSmartExcelParser(ExcelJSInstance) {
    const [parsingError, setParsingError] = useState(null);
    const [isParsing, setIsParsing] = useState(false);

    const parseFile = useCallback(async (file) => {
        setIsParsing(true);
        setParsingError(null);

        if (!ExcelJSInstance) {
            const err = new Error("Biblioteca ExcelJS não está carregada.");
            setParsingError(err); setIsParsing(false); throw err;
        }

        try {
            const wb = new ExcelJSInstance.Workbook();
            await wb.xlsx.load(await file.arrayBuffer());

            const templateInfo = await detectTemplateStructure(wb); // Renamed from detectTemplateType
            console.log('[SmartExcelParser] Detected template info:', templateInfo);

            const parsingStrategy = PARSING_STRATEGIES[templateInfo.type];
            if (!parsingStrategy) {
                throw new Error(`Estratégia de parsing não encontrada para o tipo de template: ${templateInfo.type}. Verifique se o arquivo é um template suportado.`);
            }

            const parsedResult = await parsingStrategy.parse(wb, templateInfo, ExcelJSInstance);

            // Basic validation and insights (can be expanded)
            const fieldKeys = getFieldKeys();
            const validatedPeriods = parsedResult.periods.map(period => {
                const validatedPeriod = {};
                fieldKeys.forEach(key => {
                    validatedPeriod[key] = period[key] === undefined ? null : period[key];
                });
                return validatedPeriod;
            });

            const completeness = analyzeDataCompleteness(validatedPeriods);

            setIsParsing(false);
            return {
                data: validatedPeriods,
                detectedPeriods: parsedResult.periodCount,
                templateType: templateInfo.type,
                warnings: parsedResult.warnings || [],
                dataInsights: completeness,
                suggestions: generateUserSuggestions(completeness)
            };

        } catch (error) {
            console.error('Erro detalhado ao analisar o arquivo Excel:', error);
            setParsingError(new Error(`Falha ao analisar Excel: ${error.message}`));
            setIsParsing(false);
            throw error;
        }
    }, [ExcelJSInstance]);

    const analyzeDataCompleteness = (periodsData) => {
        let totalFields = 0;
        let filledFields = 0;
        const driverKeys = getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]);
        const overrideKeys = getFieldKeys().filter(k => fieldDefinitions[k].isOverride);

        periodsData.forEach(period => {
            driverKeys.forEach(key => {
                totalFields++;
                if (period[key] !== null && typeof period[key] !== 'undefined') filledFields++;
            });
            overrideKeys.forEach(key => {
                totalFields++;
                if (period[key] !== null && typeof period[key] !== 'undefined') filledFields++;
            })
        });
        const completenessPercentage = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
        return {
            completenessPercentage: completenessPercentage.toFixed(1) + '%',
            filledFields,
            totalExpectedDataPoints: totalFields,
            hasOverrides: periodsData.some(p => overrideKeys.some(ok => p[ok] !== null && typeof p[ok] !== 'undefined'))
        };
    };

    const generateUserSuggestions = (dataInsights) => {
        const suggestions = [];
        if (parseFloat(dataInsights.completenessPercentage) < 50) {
            suggestions.push("Muitos campos de driver estão vazios. Preencha mais drivers para uma análise mais completa.");
        }
        if (!dataInsights.hasOverrides && parseFloat(dataInsights.completenessPercentage) < 80) {
            suggestions.push("Considere preencher campos de Override se tiver os valores reais para maior precisão.");
        }
        return suggestions;
    };

    return { parseFile, isParsing, parsingError, setParsingError };
}