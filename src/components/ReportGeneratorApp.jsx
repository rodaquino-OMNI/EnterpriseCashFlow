// src/components/ReportGeneratorApp.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Components
import InputMethodSelector from './InputPanel/InputMethodSelector';
import ManualDataEntry from './InputPanel/ManualDataEntry';
import ExcelUploader from './InputPanel/ExcelUploader';
import PdfUploader from './InputPanel/PdfUploader';
import AiProviderSelector from './InputPanel/AiProviderSelector';
import ReportRenderer from './ReportPanel/ReportRenderer';
// Hooks
import { useLibrary } from '../hooks/useLibrary';
import { useFinancialCalculator } from '../hooks/useFinancialCalculator';
import { useExcelParser } from '../hooks/useExcelParser';
import { usePdfParser } from '../hooks/usePdfParser';
import { useAiService } from '../hooks/useAiService';
import { useAiDataExtraction } from '../hooks/useAiDataExtraction';
// Utils
import { fieldDefinitions, getFieldKeys, validateAllFields } from '../utils/fieldDefinitions';
import { DEFAULT_PERIODS_MANUAL, DEFAULT_PERIODS_EXCEL, PERIOD_TYPES, GREY_RGB_FILL, BLUE_HEADER_FILL, DEFAULT_AI_PROVIDER } from '../utils/constants';
import { ANALYSIS_TYPES } from '../utils/aiAnalysisTypes';

/**
 * @typedef {import('../types/financial').PeriodInputData} PeriodInputData
 * @typedef {import('../types/financial').CalculatedPeriodData} CalculatedPeriodData
 * @typedef {import('../types/financial').InputMethodOption} InputMethodOption
 * @typedef {import('../types/financial').PeriodTypeOption} PeriodTypeOption
 * @typedef {import('../utils/aiProviders').AiProviderKey} AiProviderKey
 */

export default function ReportGeneratorApp() {
  // --- UI State & Global App Info ---
  /** @type {[InputMethodOption | 'pdf', React.Dispatch<React.SetStateAction<InputMethodOption | 'pdf'>>]} */
  const [inputMethod, setInputMethod] = useState('manual');
  const [companyName, setCompanyName] = useState('Empresa Exemplo S.A.');
  const [reportTitle, setReportTitle] = useState('Análise Financeira Multimodal com IA');
  
  // --- Data State ---
  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
  const [numberOfPeriods, setNumberOfPeriods] = useState(DEFAULT_PERIODS_MANUAL);
  /** @type {[PeriodTypeOption, React.Dispatch<React.SetStateAction<PeriodTypeOption>>]} */
  const [periodType, setPeriodType] = useState('anos');
  
  // Specific for PDF extraction context, might differ from manual/excel settings
  const [pdfNumberOfPeriods, setPdfNumberOfPeriods] = useState(2);
  const [pdfPeriodType, setPdfPeriodType] = useState('anos');
  
  /** @type {[PeriodInputData[], React.Dispatch<React.SetStateAction<PeriodInputData[]>>]} */
  const [currentInputData, setCurrentInputData] = useState([]);
  /** @type {[CalculatedPeriodData[], React.Dispatch<React.SetStateAction<CalculatedPeriodData[]>>]} */
  const [calculatedData, setCalculatedData] = useState([]);
  
  // --- AI State ---
  /** @type {[AiProviderKey, React.Dispatch<React.SetStateAction<AiProviderKey>>]} */
  const [selectedAiProviderKey, setSelectedAiProviderKey] = useState(DEFAULT_AI_PROVIDER);
  /** @type {[Record<string, string>, React.Dispatch<React.SetStateAction<Record<string, string>>>]} */
  const [apiKeys, setApiKeys] = useState(() => {
    try { 
      const saved = localStorage.getItem('aiApiKeys_ReportGen_v3');
      return saved ? JSON.parse(saved) : {}; 
    } catch (e) { 
      return {}; 
    }
  });
  const [extractionProgress, setExtractionProgress] = useState(null);
  
  // --- Error & Loading State ---
  /** @type {[Error | null, React.Dispatch<React.SetStateAction<Error | null>>]} */
  const [appError, setAppError] = useState(null); // General app errors
  /** @type {[Array<{ period: number, fields: Record<string, string> }> | null, React.Dispatch<React.SetStateAction<Array<{ period: number, fields: Record<string, string> }> | null>>]} */
  const [validationErrorDetails, setValidationErrorDetails] = useState(null);
  
  // --- Initialize Hooks ---
  const { library: ExcelJS, loadLibrary: loadExcelJS, isLoading: isLoadingExcelJS, error: excelJsError } = useLibrary('ExcelJS');
  const { library: html2pdf, loadLibrary: loadHtml2pdf, isLoading: isLoadingHtml2pdf, error: html2pdfError } = useLibrary('html2pdf');
  const { library: pdfjsLibInstance, loadLibrary: loadPdfjsLib, isLoading: isLoadingPdfjs, error: pdfjsError } = useLibrary('pdfjsLib');
  
  const { calculate, isCalculating, calculationError: calcError } = useFinancialCalculator();
  const { parseFile: parseExcelFile, isParsing: isExcelParsing, parsingError: excelParsingError, setParsingError: clearExcelParsingError } = useExcelParser(ExcelJS);
  
  // Use the new AiService hook
  const aiService = useAiService(selectedAiProviderKey); // This hook now manages selectedProviderKey internally via setSelectedProviderKey
  
  const { extractTextFromPdf, isParsing: isPdfTextParsing, parsingError: pdfTextParsingError, setParsingError: clearPdfTextParsingError } = usePdfParser();
  // Pass the aiService instance to useAiDataExtraction
  const { extractFinancialData, isExtracting: isAiExtracting, extractionError: aiExtractionError, setExtractionError: clearAiExtractionError } = useAiDataExtraction(aiService);
  
  useEffect(() => {
    const fieldKeys = getFieldKeys();
    let numPeriodsToInit;
    if (inputMethod === 'manual') {
      numPeriodsToInit = numberOfPeriods;
    } else if (inputMethod === 'excel') {
      numPeriodsToInit = DEFAULT_PERIODS_EXCEL;
    } else if (inputMethod === 'pdf') {
      // For PDF, currentInputData is populated by AI extraction, so initialize based on pdfNumberOfPeriods
      // to set expectations for the extraction prompt. The actual number of periods might change post-extraction.
      numPeriodsToInit = pdfNumberOfPeriods;
    } else {
      numPeriodsToInit = DEFAULT_PERIODS_MANUAL;
    }
    
    // Only re-initialize if inputMethod is manual or excel, or if PDF fields are not yet set
    if (inputMethod === 'manual' || inputMethod === 'excel' || (inputMethod === 'pdf' && currentInputData.length !== numPeriodsToInit)) {
      const newBlankInputData = Array(numPeriodsToInit).fill(null).map((_, periodIndex) => {
        const existingPeriodForManual = inputMethod === 'manual' ? (currentInputData[periodIndex] || {}) : {};
        const newPeriod = {};
        fieldKeys.forEach(fieldKey => {
          const def = fieldDefinitions[fieldKey];
          newPeriod[fieldKey] = (def.firstPeriodOnly && periodIndex > 0) ? null :
            (existingPeriodForManual[fieldKey] === undefined ? null : existingPeriodForManual[fieldKey]);
        });
        return newPeriod;
      });
      setCurrentInputData(newBlankInputData);
    }
  }, [numberOfPeriods, inputMethod, pdfNumberOfPeriods]);
  
  const isProcessingSomething = isLoadingExcelJS || isExcelParsing || isCalculating || isLoadingHtml2pdf || isLoadingPdfjs || isPdfTextParsing || isAiExtracting || aiService.isLoading;
  
  useEffect(() => {
    const activeErrors = [
      excelJsError, html2pdfError, pdfjsError,
      excelParsingError, pdfTextParsingError,
      calcError, aiExtractionError, aiService.error
    ].filter(Boolean);
    
    if (activeErrors.length > 0) {
      const combinedMessage = activeErrors.map(e => e.message).join('; ');
      setAppError(new Error(combinedMessage || "Ocorreu um erro desconhecido."));
    } else if (!validationErrorDetails) {
      setAppError(null);
    }
  }, [
    excelJsError, html2pdfError, pdfjsError, excelParsingError, pdfTextParsingError, calcError, aiExtractionError, aiService.error, validationErrorDetails
  ]);
  
  useEffect(() => {
    try { localStorage.setItem('aiApiKeys_ReportGen_v3', JSON.stringify(apiKeys)); }
    catch (e) { console.warn("Não foi possível salvar chaves API no localStorage:", e); }
  }, [apiKeys]);
  
  const handleApiKeyChange = useCallback((providerKey, key) => {
    setApiKeys(prev => ({ ...prev, [providerKey]: key }));
  }, []);
  
  const handleSelectedAiProviderChange = useCallback((providerKey) => {
    setSelectedAiProviderKey(providerKey); // Update state for ReportGeneratorApp
    aiService.setSelectedProviderKey(providerKey); // Update state within useAiService hook
  }, [aiService]);
  
  const handleInputMethodChange = useCallback((method) => {
    setInputMethod(method);
    setCalculatedData([]);
    setAppError(null); setValidationErrorDetails(null); setExtractionProgress(null);
    if (method === 'manual') { setNumberOfPeriods(DEFAULT_PERIODS_MANUAL); }
    else if (method === 'excel') { setNumberOfPeriods(DEFAULT_PERIODS_EXCEL); }
    else if (method === 'pdf') {
      setNumberOfPeriods(pdfNumberOfPeriods); // This numberOfPeriods is for guiding AI extraction
    }
  }, [pdfNumberOfPeriods]);
  
  const handleManualInputChange = useCallback((periodIndex, fieldKey, value) => {
    setCurrentInputData(prevData => {
      const updatedData = prevData.map((pd, idx) => idx === periodIndex ? {...pd, [fieldKey]: value === '' ? null : Number(value)} : pd);
      return updatedData;
    });
    if (validationErrorDetails) setValidationErrorDetails(null);
    if (appError?.message.includes("validação")) setAppError(null);
  }, [validationErrorDetails, appError]);
  
  const handleManualSubmit = async () => {
    setAppError(null); setValidationErrorDetails(null); setCalculatedData([]);
    const validationErrs = validateAllFields(currentInputData);
    if (validationErrs.length > 0) {
      setValidationErrorDetails(validationErrs);
      setAppError(new Error("Erros de validação nos dados de entrada manual. Corrija os campos destacados."));
      return;
    }
    try {
      const result = await calculate(currentInputData, periodType);
      setCalculatedData(result);
    } catch (err) { /* Error handled by hook & useEffect */ }
  };
  
  const handleTemplateDownload = async () => {
    setAppError(null);
    try {
      const excel = await loadExcelJS();
      if (!excel) return;
      
      const periodsForTemplate = inputMethod === 'manual' ? numberOfPeriods : DEFAULT_PERIODS_EXCEL;
      const wb = new excel.Workbook();
      
      // Create Data Entry Sheet FIRST so parser finds it as the main sheet
      const sheetName = `Dados de Entrada (${periodsForTemplate} Períodos)`;
      const ws = wb.addWorksheet(sheetName);
      
      // Create header with period information
      const headerInfo = ['TEMPLATE DE ENTRADA DE DADOS FINANCEIROS', ''];
      for (let i = 0; i < periodsForTemplate; i++) { headerInfo.push(''); }
      headerInfo.push('');
      const headerInfoRow = ws.addRow(headerInfo);
      headerInfoRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
      
      // Add subheader with instructions
      const subHeader = ['Preencha APENAS as células CINZAS. Não modifique outras células.', ''];
      for (let i = 0; i < periodsForTemplate; i++) { subHeader.push(''); }
      subHeader.push('');
      const subHeaderRow = ws.addRow(subHeader);
      subHeaderRow.getCell(1).font = { italic: true, size: 10, color: { argb: 'FF666666' } };
      
      // Add empty row
      ws.addRow(['']);
      
      // Create main headers
      const headers = ['Item (Chave Interna)', 'Descrição (Português)'];
      for (let i = 1; i <= periodsForTemplate; i++) { headers.push(`Período ${i}`); }
      headers.push('Instruções / Notas');
      
      const headerRow = ws.addRow(headers);
      headerRow.eachCell(cell => { 
        cell.font = { bold: true, color: { argb: 'FF000000'} }; 
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER_FILL } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      
      // Add data rows with enhanced notes
      getFieldKeys().forEach(fieldKey => {
        const def = fieldDefinitions[fieldKey];
        const rowValues = [fieldKey, def.label];
        for (let i = 0; i < periodsForTemplate; i++) { rowValues.push(''); }
        
        // Enhanced notes with examples and validation info
        let enhancedNote = def.note || '';
        if (def.firstPeriodOnly) {
          enhancedNote = "⚠️ Apenas para o 1º período da série";
        } else if (def.validation) {
          // Add validation hints based on field type
          if (fieldKey === 'revenue') {
            enhancedNote = "📈 Obrigatório. Ex: 1000000 (para R$ 1 milhão). Não pode ser negativo.";
          } else if (fieldKey.includes('Percentage')) {
            enhancedNote = "📊 Em %. Ex: 25 (para 25%). Deve estar entre 0 e 100.";
          } else if (fieldKey.includes('margin') || fieldKey.includes('Margin')) {
            enhancedNote = "📊 Em %. Ex: 40 (para 40%). Deve estar entre 0 e 100.";
          } else if (def.type === 'currency') {
            enhancedNote = enhancedNote || "💰 Em Reais. Ex: 500000 (para R$ 500 mil)";
          }
        }
        
        rowValues.push(enhancedNote);
        
        const row = ws.addRow(rowValues);
        
        // Style data cells
        for (let i = 0; i < periodsForTemplate; i++) {
          const cell = row.getCell(3 + i);
          if (def.firstPeriodOnly && i > 0) {
            cell.value = "[Não Aplicável]"; 
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; 
            cell.font = { italic: true, color: { argb: 'FF888888'} };
          } else { 
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY_RGB_FILL } };
            cell.border = {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            };
          }
        }
        
        // Style the notes column
        const notesCell = row.getCell(3 + periodsForTemplate);
        notesCell.font = { size: 9, color: { argb: 'FF666666' } };
        notesCell.alignment = { wrapText: true };
      });
      
      // Set column widths
      const columnWidths = [{ width: 35 }, { width: 45 }];
      for (let i = 0; i < periodsForTemplate; i++) { columnWidths.push({ width: 18 }); }
      columnWidths.push({width: 60}); // Wider for enhanced notes
      ws.columns = columnWidths;
      
      // Freeze panes for better navigation
      ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 4 }];
      
      // Add Instructions Sheet SECOND (so data sheet is found first by parser)
      const instructionsWs = wb.addWorksheet('INSTRUÇÕES - LEIA PRIMEIRO');
      
      // Instructions content
      const instructions = [
        ['📋 INSTRUÇÕES PARA PREENCHIMENTO DO TEMPLATE EXCEL', ''],
        ['', ''],
        ['🔹 IMPORTANTE: Leia estas instruções antes de preencher os dados!', ''],
        ['', ''],
        ['📌 COMO USAR ESTE TEMPLATE:', ''],
        ['1. Este template contém ' + periodsForTemplate + ' períodos para análise financeira abrangente', ''],
        ['2. Preencha APENAS as células com fundo CINZA na planilha "Dados de Entrada"', ''],
        ['3. NÃO modifique as células com fundo branco ou textos de "[Não Aplicável]"', ''],
        ['4. Use valores numéricos (ex: 1000000 para R$ 1.000.000)', ''],
        ['5. Percentuais devem ser inseridos como números (ex: 25 para 25%)', ''],
        ['', ''],
        ['💡 DICAS IMPORTANTES:', ''],
        ['• Mantenha a consistência nas unidades (sempre em Reais)', ''],
        ['• Valores negativos são permitidos quando apropriado', ''],
        ['• Deixe em branco campos que não se aplicam à sua empresa', ''],
        ['• Alguns campos são obrigatórios apenas para o 1º período', ''],
        ['', ''],
        ['🔍 VALIDAÇÕES AUTOMÁTICAS:', ''],
        ['• Receita não pode ser negativa', ''],
        ['• Margens devem estar entre 0% e 100%', ''],
        ['• Caixa inicial não pode ser negativo', ''],
        ['• Empréstimos não podem ser negativos', ''],
        ['', ''],
        ['📊 CAMPOS PRINCIPAIS POR CATEGORIA:', ''],
        ['', ''],
        ['💰 DEMONSTRAÇÃO DE RESULTADOS:', ''],
        ['• Receita (obrigatório)', ''],
        ['• Margem Bruta %', ''],
        ['• Despesas Operacionais', ''],
        ['• Depreciação e Amortização', ''],
        ['• Alíquota de IR %', ''],
        ['• Dividendos Pagos', ''],
        ['', ''],
        ['💸 FLUXO DE CAIXA:', ''],
        ['• Investimentos CAPEX', ''],
        ['• Caixa Inicial (apenas 1º período)', ''],
        ['', ''],
        ['🏦 BALANÇO PATRIMONIAL:', ''],
        ['• Contas a Receber', ''],
        ['• Estoque', ''],
        ['• Contas a Pagar', ''],
        ['• Empréstimos Bancários', ''],
        ['• Patrimônio Líquido Inicial (apenas 1º período)', ''],
        ['', ''],
        ['⚠️ PROBLEMAS COMUNS:', ''],
        ['• "Receita não pode ser negativa" → Verifique se inseriu valor positivo', ''],
        ['• "Margem deve estar entre 0 e 100" → Use apenas o número (ex: 40 para 40%)', ''],
        ['• "Campo obrigatório" → Preencha pelo menos a Receita para cada período', ''],
        ['', ''],
        ['📞 SUPORTE:', ''],
        ['• Após preencher, faça upload na plataforma', ''],
        ['• Em caso de erro, revise os valores conforme as validações acima', ''],
        ['• Utilize a opção "Entrada Manual" para editar dados específicos', ''],
        ['', ''],
        ['✅ CHECKLIST ANTES DO UPLOAD:', ''],
        ['☐ Preenchi apenas células cinzas', ''],
        ['☐ Receita preenchida para todos os períodos', ''],
        ['☐ Percentuais como números (25, não 25%)', ''],
        ['☐ Valores em Reais sem pontos/vírgulas', ''],
        ['☐ Campos do 1º período preenchidos', '']
      ];
      
      // Add instructions to sheet
      instructions.forEach((row, index) => {
        const excelRow = instructionsWs.addRow(row);
        
        // Style headers and important rows
        if (row[0].includes('📋') || row[0].includes('💡') || row[0].includes('🔍') || 
            row[0].includes('📊') || row[0].includes('⚠️') || row[0].includes('📞') || 
            row[0].includes('✅')) {
          excelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
        } else if (row[0].includes('💰') || row[0].includes('💸') || row[0].includes('🏦')) {
          excelRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF009900' } };
        } else if (row[0].startsWith('•') || row[0].startsWith('☐')) {
          excelRow.getCell(1).font = { size: 10 };
        }
      });
      
      // Set column widths for instructions
      instructionsWs.columns = [{ width: 80 }, { width: 20 }];
      
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Template_Relatorio_Financeiro_${periodsForTemplate}_Periodos_v2.xlsx`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    } catch (err) { console.error("Error downloading template:", err); setAppError(err); }
  };
  
  const handleExcelFileUpload = async (file) => {
    setAppError(null); clearExcelParsingError(); setValidationErrorDetails(null); setCalculatedData([]);
    try {
      console.log(`Processing Excel file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      
      const excel = await loadExcelJS();
      if (!excel) return;
      
      const { data: parsedInputData, detectedPeriods } = await parseExcelFile(file);
      console.log(`Excel file parsed successfully: ${detectedPeriods} periods detected`);
      
      // Ensure we have the correct number of periods
      setNumberOfPeriods(detectedPeriods);
      setCurrentInputData(parsedInputData);
      console.log(`Set current input data with ${parsedInputData.length} periods`);
      
      const validationErrs = validateAllFields(parsedInputData);
      if (validationErrs.length > 0) {
        console.warn(`Validation errors found in Excel data: ${validationErrs.length} issues`);
        setValidationErrorDetails(validationErrs);
        setAppError(new Error("Dados do Excel carregados, mas contêm erros de validação. Verifique/edite os dados (pode mudar para Entrada Manual para ver e corrigir)."));
        return;
      }
      
      console.log(`Calculating financial metrics for ${parsedInputData.length} periods...`);
      const result = await calculate(parsedInputData, periodType);
      console.log(`Calculation complete: ${result.length} periods of calculated data ready for report`);
      
      setCalculatedData(result);
    } catch (err) { 
      console.error("Error in Excel file upload:", err);
      /* Errors handled by hooks */ 
    }
  };
  
  const handlePdfFileUpload = async (file) => {
    setAppError(null); clearPdfTextParsingError(); clearAiExtractionError(); setValidationErrorDetails(null); setCalculatedData([]);
    setExtractionProgress({ step: 'Carregando biblioteca PDF.js...', progress: 5 });
    try {
      const pdfLib = await loadPdfjsLib();
      if (!pdfLib) { setExtractionProgress(null); return; }
      
      setExtractionProgress({ step: 'Extraindo texto do PDF...', progress: 20 });
      const { text: pdfText } = await extractTextFromPdf(file);
      
      setExtractionProgress({ step: `Analisando conteúdo com ${aiService.currentProviderConfig?.name || 'IA'}...`, progress: 50 });
      const currentApiKeyForProvider = apiKeys[selectedAiProviderKey] || "";
      
      // Pass the correct financialDataBundle for data extraction
      const financialDataBundleForExtraction = {
        pdfText: pdfText,
        companyInfo: { // Provide minimal company info for the prompt context
          name: companyName,
          reportTitle: `Extração de Dados do PDF: ${file.name}`,
          periodType: pdfPeriodType,
          numberOfPeriods: pdfNumberOfPeriods
        }
      };
      
      const extractionResult = await extractFinancialData(
        financialDataBundleForExtraction, // Pass the bundle
        currentApiKeyForProvider // Pass the API key for the selected provider
      );
      
      setExtractionProgress({ step: 'Processando dados extraídos...', progress: 80 });
      
      if (extractionResult.data && extractionResult.data.length > 0) {
        // Update main state with extracted data for consistency
        setNumberOfPeriods(extractionResult.detectedPeriods);
        setPeriodType(pdfPeriodType); // Sync general periodType
        setCurrentInputData(extractionResult.data);
        
        const validationErrs = validateAllFields(extractionResult.data);
        if (validationErrs.length > 0) {
            setValidationErrorDetails(validationErrs);
            setAppError(new Error("Dados extraídos do PDF pela IA, mas contêm erros de validação. Por favor, revise e edite os dados (mudando para Entrada Manual)."));
            setExtractionProgress(null);
            setInputMethod('manual'); // Switch to manual for user to review/edit
            return; 
        }
        
        setExtractionProgress({ step: 'Calculando métricas financeiras...', progress: 90 });
        const result = await calculate(extractionResult.data, pdfPeriodType);
        setCalculatedData(result);
        setExtractionProgress({ step: 'Concluído!', progress: 100 });
      } else {
        setAppError(new Error("IA não conseguiu extrair dados financeiros estruturados do PDF. Tente um PDF diferente, ajuste as configurações de período, ou verifique a resposta da IA."));
        setExtractionProgress({ step: 'Falha na extração.', progress: 100 });
      }
      setTimeout(() => setExtractionProgress(null), 3000);
      
    } catch (err) {
      console.error("Erro durante processamento do PDF:", err);
      setExtractionProgress(null);
      // Error already set by hooks and propagated via useEffect
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
          Gerador de Relatório Diretoria Multimodal com IA ✨
        </h1>
      </header>
      
      <AiProviderSelector
        selectedProviderKey={selectedAiProviderKey}
        onProviderChange={handleSelectedAiProviderChange} // Use updated handler
        apiKeys={apiKeys}
        onApiKeyChange={handleApiKeyChange}
        className="mb-8"
      />
      
      <InputMethodSelector
        inputMethod={inputMethod}
        onInputMethodChange={handleInputMethodChange}
        companyName={companyName}
        onCompanyNameChange={setCompanyName}
        reportTitle={reportTitle}
        onReportTitleChange={setReportTitle}
        includesPdfOption={true}
      />
      
      {inputMethod === 'excel' && (
        <ExcelUploader
          onTemplateDownload={handleTemplateDownload}
          onFileUpload={handleExcelFileUpload}
          isLoading={isProcessingSomething}
          excelJsLoading={isLoadingExcelJS}
          excelJsError={excelJsError}
          numberOfPeriodsForTemplate={inputMethod === 'manual' ? numberOfPeriods : DEFAULT_PERIODS_EXCEL}
        />
      )}
      
      {inputMethod === 'manual' && (
        <ManualDataEntry
          numberOfPeriods={numberOfPeriods}
          onNumberOfPeriodsChange={setNumberOfPeriods}
          periodType={periodType}
          onPeriodTypeChange={setPeriodType}
          inputData={currentInputData}
          onInputChange={handleManualInputChange}
          onSubmit={handleManualSubmit}
          isLoading={isCalculating}
          validationErrors={validationErrorDetails}
        />
      )}
      
      {inputMethod === 'pdf' && (
        <PdfUploader
          onPdfFileUpload={handlePdfFileUpload}
          isLoading={isPdfTextParsing || isAiExtracting || isLoadingPdfjs} // Combine relevant loadings
          aiProviderConfig={aiService.currentProviderConfig}
          periodTypeForExtraction={pdfPeriodType}
          setPeriodTypeForExtraction={setPdfPeriodType}
          numberOfPeriodsForExtraction={pdfNumberOfPeriods}
          setNumberOfPeriodsForExtraction={setPdfNumberOfPeriods}
          extractionProgress={extractionProgress}
        />
      )}
      
      {appError && !isProcessingSomething && (
        <div className="my-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
          <p className="font-bold">Ocorreu um Erro:</p>
          <pre className="whitespace-pre-wrap text-sm mt-1">{appError.message}</pre>
          
          {/* Show detailed validation errors if they exist */}
          {validationErrorDetails && validationErrorDetails.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">Detalhes dos Erros de Validação:</p>
              {validationErrorDetails.map((periodError, idx) => (
                <div key={idx} className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-800 mb-2">Período {periodError.period}:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(periodError.fields).map(([fieldKey, errorMessage]) => (
                      <li key={fieldKey} className="text-sm">
                        <span className="font-medium">{fieldDefinitions[fieldKey]?.label || fieldKey}:</span> {errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Dica:</strong> Mude para "Entrada Manual" para ver e editar os dados carregados, 
                  ou baixe um novo template Excel e preencha novamente.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {(isProcessingSomething) && (
        <div className="text-center my-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-slate-600">
            {isLoadingExcelJS ? "Carregando ExcelJS..." :
             isExcelParsing ? "Analisando arquivo Excel..." :
             isLoadingPdfjs ? "Carregando PDF.js..." :
             isPdfTextParsing ? "Analisando PDF..." :
             isAiExtracting ? `Extraindo dados com ${aiService.currentProviderConfig?.name || 'IA'}...` :
             isCalculating ? "Processando cálculos financeiros..." :
             isLoadingHtml2pdf ? "Carregando html2pdf..." :
             aiService.isLoading ? `Aguardando ${aiService.currentProviderConfig?.name || 'IA'}...` :
             "Carregando..."}
          </p>
        </div>
      )}
      
      {calculatedData.length > 0 && !isProcessingSomething && !appError && (
        <ReportRenderer
          calculatedData={calculatedData}
          companyInfo={{ name: companyName, reportTitle, periodType, numberOfPeriods: calculatedData.length }}
          onLoadHtml2pdf={loadHtml2pdf}
          html2pdfError={html2pdfError}
          aiService={aiService} // Pass the entire service hook object
          apiKeys={apiKeys}
          selectedAiProviderKey={selectedAiProviderKey} // Pass the selected key for AI calls
        />
      )}
    </div>
  );
}