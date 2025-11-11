// src/utils/excelTemplateGenerator.js
import { 
  fieldDefinitions, 
  getFieldKeys, 
  FIELD_CATEGORIES, 
} from './fieldDefinitions';
import { 
  PERIOD_TYPES, 
  MAX_PERIODS,
  MAIN_HEADER_COLOR,
  DRIVER_INPUT_FILL, 
  OVERRIDE_INPUT_FILL,
  LIGHT_GREY_NA_FILL, 
  GREY_TEXT_NA,
  INSTRUCTION_SHEET_COLOR,
} from './constants';

export const TEMPLATE_TYPES = {
  SMART_ADAPTIVE: 'smart_adaptive',
  BASIC_DRIVERS: 'basic_drivers',
};

export const TEMPLATE_CONFIGS = {
  [TEMPLATE_TYPES.SMART_ADAPTIVE]: {
    name: 'Template Inteligente (Drivers + Overrides Opcionais)',
    description: 'Recomendado. Permite entrada de drivers e, opcionalmente, valores reais para substituir cálculos.',
    sheets: ['📋 Instruções', '✅ Drivers Principais', '🔧 Overrides DRE', '🔧 Overrides Balanço', '🔧 Overrides Caixa'],
    complexity: 'Adaptável', // Changed from "Recomendado" to a complexity level
    default: true,
  },
  [TEMPLATE_TYPES.BASIC_DRIVERS]: {
    name: 'Template Básico (Apenas Drivers)',
    description: 'Para entrada rápida focada nos principais direcionadores financeiros. O sistema calculará o restante.',
    sheets: ['✅ Drivers Principais'],
    complexity: 'Simples',
  },
};

// Helper to style the main header row of data sheets
function styleMainHeaderRow(row, headerFillColor = MAIN_HEADER_COLOR) {
  row.height = 35;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFillColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF7F7F7F' } },
      left: { style: 'thin', color: { argb: 'FF7F7F7F' } },
      bottom: { style: 'medium', color: { argb: 'FF7F7F7F' } },
      right: { style: 'thin', color: { argb: 'FF7F7F7F' } },
    };
  });
}

// Helper to add field rows with input cell styling and Excel validation
function addFieldRowsToSheetExcel(ws, fieldKeys, numberOfPeriods, isOverrideSheet = false) {
  fieldKeys.forEach(fieldKey => {
    const def = fieldDefinitions[fieldKey];
    if (!def) return;

    // Determine value sign requirements
    let signRequirement = '';
    if (def.validation) {
      const validationStr = def.validation.toString();
      if (validationStr.includes('negativo')) {
        signRequirement = ' ➕ Apenas valores positivos (≥ 0)';
      } else if (fieldKey.includes('netInterest') || fieldKey.includes('extraordinaryItems')) {
        signRequirement = ' ➕➖ Aceita valores positivos ou negativos';
      } else if (def.type === 'currency' || def.type === 'days') {
        signRequirement = ' ➕ Apenas valores positivos (≥ 0)';
      }
    } else if (def.type === 'percentage') {
      signRequirement = ' ➕➖ Aceita valores positivos ou negativos';
    }

    const inputTypeDescription =
        def.type === 'currency' ? `💵 Moeda (ex: 1000000 = R$ 1.000.000)${signRequirement}` :
          def.type === 'percentage' ? `📊 Percentual (ex: 40 = 40%)${signRequirement}` :
            `📅 Dias (ex: 30, 60, 90)${signRequirement}`;

    const requiredStatus = def.required && !isOverrideSheet ? '⚠️ SIM (Obrigatório)' : '✅ Não (Opcional)';

    const rowData = [
      fieldKey, def.label, inputTypeDescription, requiredStatus,
      ...Array(numberOfPeriods).fill(null), // Placeholders for period data
      def.note || (isOverrideSheet ? 'Preencha para substituir cálculo automático.' : 'Driver para cálculo automático.'),
    ];
    const row = ws.addRow(rowData);
    row.height = 25; // Set default row height for data rows

    // Style static cells
    row.getCell(1).font = { bold: true, name: 'Calibri', size: 10 }; // Field Key
    row.getCell(1).alignment = { vertical: 'middle' };
    row.getCell(2).alignment = { wrapText: true, vertical: 'middle' }; // Description
    row.getCell(3).alignment = { vertical: 'middle', wrapText: true }; // Type
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // Required
    row.getCell(5 + numberOfPeriods).alignment = { wrapText: true, vertical: 'top', indent: 1 }; // Note
    row.getCell(5 + numberOfPeriods).font = { italic: true, size: 9, color: { argb: 'FF4B5563'} }; // Note font

    for (let i = 0; i < numberOfPeriods; i++) {
      const cell = row.getCell(5 + i); // Period data cells start at column E
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.protection = { locked: false };

      if (def.firstPeriodOnly && i > 0) {
        cell.value = '[N/A]';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREY_NA_FILL } };
        cell.font = { italic: true, color: { argb: GREY_TEXT_NA }, size: 9 };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOverrideSheet ? OVERRIDE_INPUT_FILL : DRIVER_INPUT_FILL } };
        
        // Excel Data Validation
        if (def.validation) { // Assuming validation can be translated to Excel rules
          if (def.type === 'percentage') {
            cell.dataValidation = { type: 'decimal', operator: 'between', allowBlank: true, showErrorMessage: true,
              formulae: [def.validation?.min ?? -100, def.validation?.max ?? 100], 
              errorTitle: 'Valor Percentual Inválido', error: `Insira um número entre ${def.validation?.min ?? -100} e ${def.validation?.max ?? 100}.` };
            cell.numFmt = '0.00"%"'; // Input as number, display as %
          } else if (def.type === 'currency' || def.type === 'days') {
            const minVal = def.validation?.min ?? (def.type === 'days' ? 0 : -Infinity); // Days usually >= 0
            cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, showErrorMessage: true,
              formulae: [minVal], errorTitle: 'Valor Numérico Inválido', error: `Insira um número maior ou igual a ${minVal}.`};
            cell.numFmt = def.type === 'currency' ? '"_R$"* #,##0.00_);[Red]("_R$"* (#,##0.00);"_R$"* "-"??_);_(@_)' : '0.0';
          }
        } else { // Generic number format if no specific validation
          cell.numFmt = def.type === 'percentage' ? '0.00"%"' : (def.type === 'currency' ? '"_R$"* #,##0.00_);[Red]("_R$"* (#,##0.00);"_R$"* "-"??_);_(@_)' : '0.0');
        }
      }
      // Add borders to all cells in the row
      row.eachCell({ includeEmpty: true }, (cellInRow, colNumber) => {
        if (colNumber <= 5 + numberOfPeriods) { // Apply to data columns and info columns
          cellInRow.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
        }
      });
    }
  });
}

function setupInstructionSheet(ws, numberOfPeriods, periodTypeLabel) {
  ws.properties.defaultRowHeight = 20;
  ws.views = [{state: 'normal', showGridLines: false}]; // Cleaner look

  // Header
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '📋 Instruções - Template Financeiro Adaptativo';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; // White text
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INSTRUCTION_SHEET_COLOR } }; // Green
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 40;

  // Welcome Message
  ws.mergeCells('A3:G3'); ws.getCell('A3').value = 'Bem-vindo(a) à Plataforma Enterprise CashFlow Analytics!';
  ws.getCell('A3').font = { size: 12, bold: true, color: {argb: 'FF1E40AF'} };
  ws.mergeCells('A4:G4'); ws.getCell('A4').value = 'Este template inteligente permite flexibilidade na entrada dos seus dados financeiros.';
  ws.getCell('A4').font = { size: 11, italic: true, color: {argb: 'FF4B5563'} };
  
  // Current Report Config
  ws.mergeCells('A6:G6'); ws.getCell('A6').value = 'Configuração Para Este Template (Reflete o estado atual da App):';
  ws.getCell('A6').font = { size: 11, bold: true, color: {argb: 'FF000000'} };
  ws.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE7C3' } }; // Light orange
  ws.getCell('B7').value = 'Número de Períodos:'; ws.getCell('C7').value = numberOfPeriods; ws.getCell('C7').font = {bold: true};
  ws.getCell('B8').value = 'Tipo de Período:'; ws.getCell('C8').value = PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel; ws.getCell('C8').font = {bold: true};
  [ws.getCell('B7'), ws.getCell('B8')].forEach(c => c.font = {bold:true, color: {argb: 'FF4B5563'}});

  // How to Use Section
  ws.mergeCells('A10:G10'); ws.getCell('A10').value = 'Como Usar Este Template:';
  ws.getCell('A10').font = { size: 14, bold: true, color: { argb: MAIN_HEADER_COLOR } };
  ws.getCell('A10').border = { bottom: { style: 'medium', color: {argb: MAIN_HEADER_COLOR}}};

  const instructions = [
    ['1.', '✅ Drivers Principais:', 'Preencha a planilha "✅ Drivers" com os direcionadores financeiros chave. Campos marcados como "⚠️ SIM (Obrigatório)" são essenciais para os cálculos automáticos. O sistema usará estes dados para gerar as demonstrações financeiras completas.'],
    ['2.', '🔧 Overrides (Opcional):', 'Se você possui valores reais para linhas específicas da DRE, Balanço ou Fluxo de Caixa e deseja que o sistema os utilize NO LUGAR dos cálculos automáticos, preencha as planilhas "🔧 Overrides DRE", "🔧 Overrides Balanço" ou "🔧 Overrides Caixa". Valores preenchidos nestas planilhas terão prioridade sobre os cálculos.'],
    ['3.', 'Períodos:', `Os dados devem ser inseridos para cada um dos ${numberOfPeriods} período(s) do tipo "${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}". Certifique-se que a granularidade dos seus dados corresponde ao tipo de período selecionado.` ],
    ['4.', 'Formatos Numéricos:', 'IMPORTANTE: Use apenas números nas células de dados. Para valores monetários, insira o número sem formatação (ex: 1000000 para R$ 1.000.000,00). Para percentuais, insira o número (ex: 40 para 40%, não 0.40). O Excel aplicará formatação visual automaticamente.'],
    ['5.', 'Valores Positivos/Negativos:', 'ATENÇÃO aos sinais! A coluna "Tipo de Dado" indica se o campo aceita apenas valores positivos (➕), negativos (➖), ou ambos (➕➖). Campos financeiros geralmente requerem valores positivos. Use valores negativos APENAS onde indicado (ex: Resultado Financeiro negativo para despesas).'],
    ['6.', 'Campos Obrigatórios:', 'Campos marcados com "⚠️ SIM (Obrigatório)" DEVEM ser preenchidos para que o sistema funcione corretamente. Deixar campos obrigatórios em branco resultará em erros de validação no upload.'],
    ['7.', 'Campos Específicos do 1º Período:', 'Alguns campos (marcados com "🔹 Apenas 1º Período" na plataforma) como "Caixa Inicial" e "Patrimônio Líquido Inicial" devem ser preenchidos APENAS no Período 1. Períodos subsequentes mostrarão "[N/A]" automaticamente.'],
    ['8.', 'Chaves Internas (Coluna A):', '⚠️ CRÍTICO: NÃO ALTERE os valores da Coluna A ("Campo (Chave Interna)"). Estes códigos são usados pelo sistema para identificar cada item financeiro. Alterá-los causará falhas no processamento.'],
    ['9.', 'Colunas de Período:', 'As colunas de período são dinâmicas. Se você precisar de mais ou menos períodos no futuro, baixe um novo template da plataforma com a configuração desejada.'],
    ['10.', 'Upload:', 'Após preencher, salve o arquivo (mantendo o formato .xlsx) e faça o upload na plataforma através da opção "Upload de Arquivo Excel". O sistema validará os dados e exibirá erros detalhados se houver problemas.'],
  ];
  let currentRow = 12;
  instructions.forEach(instr => {
    const row = ws.getRow(currentRow);
    row.getCell('A').value = instr[0]; row.getCell('A').font = { bold: true, color: {argb: INSTRUCTION_SHEET_COLOR}};
    row.getCell('B').value = instr[1]; row.getCell('B').font = { bold: true };
    ws.mergeCells(`C${currentRow}:G${currentRow}`);
    row.getCell('C').value = instr[2];
    row.getCell('C').alignment = { wrapText: true, vertical: 'top' };
    currentRow++;
  });

  // Examples Section
  currentRow += 1;
  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  ws.getCell(`A${currentRow}`).value = '📖 Exemplos Práticos de Preenchimento:';
  ws.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: MAIN_HEADER_COLOR } };
  ws.getCell(`A${currentRow}`).border = { bottom: { style: 'medium', color: {argb: MAIN_HEADER_COLOR}}};
  currentRow++;

  const examples = [
    ['💵', 'Receita Líquida:', 'Digite 1000000 (será exibido como R$ 1.000.000,00) ✅ CORRETO', 'NÃO digite "R$ 1.000.000" ou "1,000,000" ❌ INCORRETO'],
    ['📊', 'Margem Bruta %:', 'Digite 45 (será exibido como 45%) ✅ CORRETO', 'NÃO digite 0.45 ou 45% ❌ INCORRETO'],
    ['📅', 'Prazo Médio de Recebimento:', 'Digite 30 (para 30 dias) ✅ CORRETO', 'NÃO digite "30 dias" ou 30,00 com casas decimais ❌ INCORRETO'],
    ['➕➖', 'Resultado Financeiro:', 'Digite -50000 para despesa financeira ✅ CORRETO', 'Valores positivos = receita financeira, negativos = despesa financeira'],
    ['⚠️', 'Campos Obrigatórios:', 'Receita, Margem Bruta %, Despesas Operacionais são obrigatórios em TODOS os períodos', 'Campos opcionais podem ser deixados em branco'],
    ['🔹', 'Caixa Inicial:', 'Preencha APENAS no Período 1 (ex: 100000) ✅', 'Períodos 2+ mostram [N/A] automaticamente'],
  ];

  examples.forEach(example => {
    const row = ws.getRow(currentRow);
    row.getCell('A').value = example[0];
    row.getCell('A').font = { bold: true, size: 12 };
    row.getCell('B').value = example[1];
    row.getCell('B').font = { bold: true };
    ws.mergeCells(`C${currentRow}:D${currentRow}`);
    row.getCell('C').value = example[2];
    row.getCell('C').alignment = { wrapText: true, vertical: 'top' };
    ws.mergeCells(`E${currentRow}:G${currentRow}`);
    row.getCell('E').value = example[3];
    row.getCell('E').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('E').font = { italic: true, color: {argb: 'FF6B7280'} };
    currentRow++;
  });

  // Legend
  currentRow += 1;
  ws.mergeCells(`A${currentRow}:G${currentRow}`);
  ws.getCell(`A${currentRow}`).value = '🎨 Legenda de Cores (Células de Input):';
  ws.getCell(`A${currentRow}`).font = { size: 12, bold: true, color: {argb: MAIN_HEADER_COLOR}};
  currentRow++;
  const legendRow1 = ws.addRow(['', 'Células Azul Claro (Planilha "✅ Drivers"):', 'Input de Drivers Principais/Opcionais']);
  legendRow1.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: DRIVER_INPUT_FILL } };
  legendRow1.getCell('B').font = { bold: true };
  currentRow++;
  const legendRow2 = ws.addRow(['', 'Células Amarelo Claro (Planilhas "🔧 Overrides..."):', 'Input de Overrides (Valores Reais - Opcional)']);
  legendRow2.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: OVERRIDE_INPUT_FILL } };
  legendRow2.getCell('B').font = { bold: true };
  currentRow++;
  const legendRow3 = ws.addRow(['', 'Células Cinza Claro com "[N/A]":', 'Campo não aplicável para este período - NÃO alterar']);
  legendRow3.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: LIGHT_GREY_NA_FILL } };
  legendRow3.getCell('B').font = { bold: true };

  // Column widths
  ws.columns = [{ width: 5 }, { width: 35 }, { width: 40 }, { width: 15 }, { width: 20 }, { width: 15 }, { width: 15 } ];
  ws.eachRow((row, rowNum) => {
    if (rowNum > 1) { // Skip title row
      row.eachCell((cell) => {
        if (!cell.alignment) cell.alignment = { wrapText: true, vertical: 'top' };
      });
    }
  });
}

// Main function to generate the "Smart Adaptive" template
export async function generateSmartTemplate(numberOfPeriods, periodTypeLabel, ExcelJS) {
  if (!ExcelJS) throw new Error('Instância da biblioteca ExcelJS é requerida.');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Enterprise CashFlow Platform';
  wb.lastModifiedBy = 'Enterprise CashFlow Platform';
  wb.created = new Date();
  wb.modified = new Date();
  wb.calcProperties.fullCalcOnLoad = true; // Enable Excel calculation on open

  // Ensure number of periods is within bounds
  const numPeriods = Math.min(MAX_PERIODS, Math.max(1, numberOfPeriods));

  setupInstructionSheet(wb.addWorksheet('📋 Instruções'), numPeriods, periodTypeLabel);
  
  const commonHeaders = [
    'Campo (Chave Interna)', 'Descrição (Português)', 'Tipo de Dado', 'Obrigatório/Opcional',
    ...Array.from({length: numPeriods}, (_, i) => `Período ${i+1} (${PERIOD_TYPES[periodTypeLabel]?.shortLabel || ''})`),
    'Notas/Instruções Adicionais',
  ];
  const commonColWidths = [{width:30},{width:45},{width:20},{width:20}];
  for(let i=0; i<numPeriods; i++) commonColWidths.push({width:18});
  commonColWidths.push({width:50});

  const setupSheetWithFields = (sheetName, title, fieldCategories, isOverride) => {
    const ws = wb.addWorksheet(sheetName);
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 1, activeCell: 'E2' }];
    const headerRow = ws.addRow(commonHeaders);
    styleMainHeaderRow(headerRow);
    addFieldRowsToSheetExcel(ws, getFieldKeys(fieldCategories), numPeriods, isOverride);
    ws.columns = commonColWidths;
    ws.getCell('A1').note = title; 
  };

  setupSheetWithFields('✅ Drivers', 
    'Dados Principais / Drivers Essenciais e Opcionais', 
    [FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL], 
    false,
  );
  setupSheetWithFields('🔧 Overrides DRE', 
    'Overrides (Valores Reais) para Demonstração do Resultado', 
    [FIELD_CATEGORIES.OVERRIDE_PL], 
    true,
  );
  setupSheetWithFields('🔧 Overrides Balanço', 
    'Overrides (Valores Reais) para Balanço Patrimonial', 
    [FIELD_CATEGORIES.OVERRIDE_BS], 
    true,
  );
  setupSheetWithFields('🔧 Overrides Caixa', 
    'Overrides (Valores Reais) para Fluxo de Caixa', 
    [FIELD_CATEGORIES.OVERRIDE_CF], 
    true,
  );
  
  return wb;
}

// Generates a Basic (Drivers Only) Excel template
export async function generateBasicDriversTemplate(numberOfPeriods, periodTypeLabel, ExcelJS) {
  if (!ExcelJS) throw new Error('ExcelJS library instance is required.');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Enterprise CashFlow Platform';
  wb.lastModifiedBy = 'Enterprise CashFlow Platform';
  wb.created = new Date();
  wb.modified = new Date();
  wb.calcProperties.fullCalcOnLoad = true;
    
  const numPeriods = Math.min(MAX_PERIODS, Math.max(1, numberOfPeriods));
  const ws = wb.addWorksheet('✅ Drivers Essenciais');
  ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 1, activeCell: 'E2' }];
  const headers = [
    'Campo (Chave Interna)', 'Descrição (Português)', 'Tipo de Dado', 'Obrigatório/Opcional',
    ...Array.from({length: numPeriods}, (_, i) => `Período ${i+1} (${PERIOD_TYPES[periodTypeLabel]?.shortLabel || ''})`),
    'Notas/Instruções Adicionais',
  ];
  const headerRow = ws.addRow(headers);
  styleMainHeaderRow(headerRow);
  addFieldRowsToSheetExcel(ws, getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]), numPeriods, false);
    
  const columnWidths = [{width:30},{width:45},{width:20},{width:20}];
  for(let i=0; i<numPeriods; i++) columnWidths.push({width:18});
  columnWidths.push({width:50});
  ws.columns = columnWidths;
  ws.getCell('A1').note = 'Template Básico: Insira os principais direcionadores financeiros.'; 

  return wb;
}