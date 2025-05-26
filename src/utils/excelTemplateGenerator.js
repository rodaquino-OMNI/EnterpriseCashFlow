// src/utils/excelTemplateGenerator.js
import { 
    fieldDefinitions, 
    getFieldKeys, 
    FIELD_CATEGORIES 
} from './fieldDefinitions.js';
import { 
    PERIOD_TYPES, 
} from './constants.js';

// Define constants for colors directly used in template generation
const LIGHT_GREY_NA_FILL = 'FFF5F5F5'; // For N/A cells
const GREY_TEXT_NA = 'FF888888'; // Grey text for N/A
const DRIVER_INPUT_FILL = 'FFD9E8FB'; // A light blue for driver inputs
const OVERRIDE_INPUT_FILL = 'FFFFF0CB'; // A light yellow for override inputs
const MAIN_HEADER_COLOR = 'FF1E40AF'; // Darker blue for main headers

export const TEMPLATE_TYPES = {
    SMART_ADAPTIVE: 'smart_adaptive', // Recommended: Drivers + Overrides in separate, clear sheets
    BASIC_DRIVERS: 'basic_drivers',    // Simpler: Only core driver fields, single sheet
    // COMPLETE_STATEMENTS: 'complete_statements', // Future: For users uploading full pre-made DRE/BS
};

export const TEMPLATE_CONFIGS = {
    [TEMPLATE_TYPES.SMART_ADAPTIVE]: {
        name: 'Template Inteligente (Drivers + Overrides Opcionais)',
        description: 'Recomendado. Permite entrada de drivers principais e, opcionalmente, valores reais para substituir cálculos.',
        sheets: ['📋 Instruções', '✅ Drivers Essenciais', '🔧 Overrides DRE', '🔧 Overrides Balanço', '🔧 Overrides Caixa'],
        complexity: 'Adaptável (Iniciante a Avançado)',
        default: true,
    },
    [TEMPLATE_TYPES.BASIC_DRIVERS]: {
        name: 'Template Básico (Apenas Drivers)',
        description: 'Para entrada rápida focada nos principais direcionadores financeiros. O sistema calculará o restante.',
        sheets: ['✅ Drivers Essenciais'],
        complexity: 'Simples',
    },
    // Future template type
    // [TEMPLATE_TYPES.COMPLETE_STATEMENTS]: {
    //   name: 'Template Completo (Demonstrações Prontas)',
    //   description: 'Para usuários que possuem DRE e Balanço completos e formatados para upload direto.',
    //   sheets: ['DRE Completa', 'Balanço Completo', /* 'Fluxo Caixa Direto (Opcional)' */],
    //   complexity: 'Avançado (Requer Formato Específico)',
    // }
};

// Helper to add common header row styling
function styleHeaderRow(row, fillColor = MAIN_HEADER_COLOR) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }; // White text
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.height = 30;
    row.eachCell(cell => {
        cell.border = { bottom: {style: 'medium', color: {argb: 'FF777777'}} };
    });
}

// Helper to add field rows with input cell styling
function addFieldRowsToSheet(ws, fieldKeys, numberOfPeriods, isOverrideSheet = false) {
    fieldKeys.forEach(fieldKey => {
        const def = fieldDefinitions[fieldKey];
        if (!def) return;

        const rowData = [
            fieldKey,
            def.label,
            def.type === 'currency' ? 'Valor Monetário (R$)' : def.type === 'percentage' ? 'Percentual (%)' : 'Número de Dias',
            def.required && !isOverrideSheet ? 'SIM' : 'Não', // Overrides are never "required" in the same way
            ...Array(numberOfPeriods).fill(''), // Placeholders for period data
            def.note || (isOverrideSheet ? 'Preencha se desejar substituir o cálculo automático.' : '')
        ];
        const row = ws.addRow(rowData);

        // Style input cells
        row.getCell(1).font = { bold: true, size: 10 }; // Field Key
        row.getCell(2).alignment = { wrapText: true, vertical: 'middle' }; // Description
        row.getCell(3).alignment = { vertical: 'middle' }; // Type
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }; // Required
        row.getCell(5 + numberOfPeriods).alignment = { wrapText: true, vertical: 'top', indent: 1 }; // Note

        for (let i = 0; i < numberOfPeriods; i++) {
            const cell = row.getCell(5 + i); // Period data cells start at column E
            cell.alignment = { horizontal: 'right', vertical: 'middle'};
            if (def.firstPeriodOnly && i > 0) {
                cell.value = "[N/A]";
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREY_NA_FILL } };
                cell.font = { italic: true, color: { argb: GREY_TEXT_NA }, size: 9 };
            } else {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOverrideSheet ? OVERRIDE_INPUT_FILL : DRIVER_INPUT_FILL } };
                // Add Excel Data Validation
                if (def.type === 'percentage') {
                    cell.dataValidation = { type: 'decimal', operator: 'between', showErrorMessage: true, allowBlank: true,
                        formulae: [-100, 100], errorTitle: 'Valor Inválido', error: 'Percentual deve estar entre -100 e 100 (ex: 40 para 40%).'
                    };
                    cell.numFmt = '0.00"%"'; // Display as percentage in Excel
                } else if (def.type === 'currency') {
                    cell.numFmt = '#,##0.00;[Red]-#,##0.00'; // Standard currency format
                } else if (def.type === 'days') {
                    cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', showErrorMessage: true, allowBlank: true,
                        formulae: [0], errorTitle: 'Valor Inválido', error: 'Dias não podem ser negativos.'
                    };
                    cell.numFmt = '0.0';
                }
            }
            cell.protection = { locked: false };
        }
    });
}

function setupInstructionSheet(ws, numberOfPeriods, periodTypeLabel) {
    ws.mergeCells('A1:E1');
    ws.getCell('A1').value = 'Instruções - Template Financeiro Adaptativo';
    ws.getCell('A1').font = { size: 16, bold: true, color: { argb: MAIN_HEADER_COLOR } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.addRow([]);
    ws.addRow(['Bem-vindo(a) à Plataforma Enterprise CashFlow Analytics!']);
    ws.addRow(['Este template inteligente permite flexibilidade na entrada dos seus dados financeiros.']);
    ws.addRow([]);
    ws.addRow(['Configuração Atual do Relatório:']);
    ws.addRow(['Número de Períodos:', numberOfPeriods]);
    ws.addRow(['Tipo de Período:', PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel]);
    ws.getRow(ws.rowCount - 2).font = { bold: true };
    ws.getRow(ws.rowCount - 1).font = { bold: true };
    ws.getRow(ws.rowCount).font = { bold: true };

    ws.addRow([]);
    ws.addRow(['Como Usar:']);
    ws.getCell('A' + ws.rowCount).font = { bold: true, size: 12 };
    ws.addRow(['1.', '✅ Dados Principais (Drivers): Preencha esta planilha com os direcionadores financeiros chave. O sistema usará estes dados para calcular as demonstrações completas. Campos marcados como "SIM" na coluna "Obrigatório" são fortemente recomendados.']);
    ws.addRow(['2.', '🔧 Overrides (Opcional): Se você possui valores reais para linhas específicas da DRE, Balanço ou Fluxo de Caixa e deseja que o sistema os utilize no lugar dos cálculos automáticos, preencha as planilhas "Overrides DRE", "Overrides Balanço" ou "Overrides Caixa".']);
    ws.addRow(['   ', 'Valores preenchidos nas planilhas de Override terão prioridade.']);
    ws.addRow(['3.', 'Períodos: Os dados devem ser inseridos para cada um dos', numberOfPeriods, `${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}.`]);
    ws.addRow(['4.', 'Formatos: Use números para valores monetários e dias. Para percentuais, insira o valor (ex: 40 para 40%). O Excel formatará como % mas o sistema lerá o número.']);
    ws.addRow(['5.', 'Chaves Internas (Coluna A): Não altere os valores da Coluna A ("Campo (Chave)"), pois são usados pelo sistema para identificar os dados.']);
    ws.addRow(['6.', 'Upload: Após preencher, salve o arquivo e faça o upload na plataforma.']);
    ws.addRow([]);
    ws.addRow(['Legenda de Cores (Células de Input):']);
    const legendRow1 = ws.addRow(['', 'Células Azuis Claras (nesta planilha):', 'Input de Drivers Principais/Opcionais']);
    legendRow1.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: DRIVER_INPUT_FILL } };
    const legendRow2 = ws.addRow(['', 'Células Amarelas Claras (nas planilhas "Override"):', 'Input de Overrides (Valores Reais)']);
    legendRow2.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: OVERRIDE_INPUT_FILL } };

    ws.columns = [{ width: 3 }, { width: 40 }, { width: 60 } ];
    ws.eachRow(row => row.alignment = { vertical: 'top', wrapText: true });
}

function setupDataSheet(ws, title, fieldKeys, numberOfPeriods, isOverrideSheet) {
    ws.views = [ { state: 'frozen', xSplit: 4, ySplit: 1, activeCell: 'E2' } ]; // Freeze first 4 columns
    const headers = [
        'Campo (Chave Interna)', 'Descrição (Português)', 'Tipo', 'Obrigatório/Opcional',
        ...Array.from({length: numberOfPeriods}, (_, i) => `Período ${i+1}`),
        'Notas/Instruções Adicionais'
    ];
    const headerRow = ws.addRow(headers);
    styleHeaderRow(headerRow);
    addFieldRowsToSheet(ws, fieldKeys, numberOfPeriods, isOverrideSheet);

    const columnWidths = [{width:30},{width:45},{width:15},{width:20}];
    for(let i=0; i<numberOfPeriods; i++) columnWidths.push({width:18});
    columnWidths.push({width:50});
    ws.columns = columnWidths;
    ws.getCell('A1').note = title; // Add title as a note to cell A1 for context
}

/**
 * Generates the "Smart" Excel template with multiple sheets.
 * @param {number} numberOfPeriods - Number of period columns to generate.
 * @param {import('../types/financial').PeriodTypeOption} periodTypeLabel - Label for the period type.
 * @param {object} ExcelJS - The loaded ExcelJS library instance.
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function generateSmartTemplate(numberOfPeriods, periodTypeLabel, ExcelJS) {
    if (!ExcelJS) throw new Error("ExcelJS library instance is required.");
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Enterprise CashFlow Platform';
    wb.lastModifiedBy = 'Enterprise CashFlow Platform';
    wb.created = new Date();
    wb.modified = new Date();

    setupInstructionSheet(wb.addWorksheet('📋 Instruções'), numberOfPeriods, periodTypeLabel);

    setupDataSheet(wb.addWorksheet('✅ Drivers'),
        'Dados Principais / Drivers Essenciais e Opcionais',
        getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]),
        numberOfPeriods,
        false
    );
    setupDataSheet(wb.addWorksheet('🔧 Overrides DRE'),
        'Overrides (Valores Reais) para Demonstração do Resultado',
        getFieldKeys(FIELD_CATEGORIES.OVERRIDE_PL),
        numberOfPeriods,
        true
    );
    setupDataSheet(wb.addWorksheet('🔧 Overrides Balanço'),
        'Overrides (Valores Reais) para Balanço Patrimonial',
        getFieldKeys(FIELD_CATEGORIES.OVERRIDE_BS),
        numberOfPeriods,
        true
    );
    setupDataSheet(wb.addWorksheet('🔧 Overrides Caixa'),
        'Overrides (Valores Reais) para Fluxo de Caixa',
        getFieldKeys(FIELD_CATEGORIES.OVERRIDE_CF),
        numberOfPeriods,
        true
    );

    // Optionally add a validation/summary sheet later if needed
    // setupValidationSheet(wb.addWorksheet('📊 Resumo de Dados'), numberOfPeriods);

    return wb;
}

/**
 * Generates a Basic (Drivers Only) Excel template.
 * @param {number} numberOfPeriods
 * @param {import('../types/financial').PeriodTypeOption} periodTypeLabel
 * @param {object} ExcelJS
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function generateBasicDriversTemplate(numberOfPeriods, periodTypeLabel, ExcelJS) {
    if (!ExcelJS) throw new Error("ExcelJS library instance is required.");
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Enterprise CashFlow Platform';
    wb.lastModifiedBy = 'Enterprise CashFlow Platform';
    wb.created = new Date();
    wb.modified = new Date();

    setupDataSheet(wb.addWorksheet('✅ Drivers Essenciais'),
        'Dados Principais / Drivers Essenciais e Opcionais',
        getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]),
        numberOfPeriods,
        false
    );
    return wb;
}