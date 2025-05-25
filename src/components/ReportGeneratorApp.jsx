// src/components/ReportGeneratorApp.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; 

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
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { useAiDataExtraction } from '../hooks/useAiDataExtraction';

// Utils
import { fieldDefinitions, getFieldKeys, validateAllFields } from '../utils/fieldDefinitions';
import { DEFAULT_PERIODS_MANUAL, DEFAULT_PERIODS_EXCEL, DEFAULT_AI_PROVIDER } from '../utils/constants';
import { ANALYSIS_TYPES } from '../utils/aiAnalysisTypes';

export default function ReportGeneratorApp() {
  const [inputMethod, setInputMethod] = useState('manual');
  const [companyName, setCompanyName] = useState('Empresa Exemplo S.A.');
  const [reportTitle, setReportTitle] = useState('Análise Financeira Multimodal com IA');

  const [numberOfPeriods, setNumberOfPeriods] = useState(DEFAULT_PERIODS_MANUAL);
  const [periodType, setPeriodType] = useState('anos');

  const [pdfNumberOfPeriods, setPdfNumberOfPeriods] = useState(2);
  const [pdfPeriodType, setPdfPeriodType] = useState('anos');

  const [currentInputData, setCurrentInputData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);

  const [selectedAiProviderKey, setSelectedAiProviderKey] = useState(DEFAULT_AI_PROVIDER);
  const [apiKeys, setApiKeys] = useState(() => {
    try { const saved = localStorage.getItem('aiApiKeys_ReportGen_v3'); return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; }
  });
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [appError, setAppError] = useState(null);
  const [validationErrorDetails, setValidationErrorDetails] = useState(null);

  // --- Initialize Hooks ---
  const { library: ExcelJS, loadLibrary: loadExcelJS, isLoading: isLoadingExcelJS, error: excelJsErrorHook } = useLibrary('ExcelJS');
  const { library: html2pdf, loadLibrary: loadHtml2pdf, isLoading: isLoadingHtml2pdf, error: html2pdfErrorHook } = useLibrary('html2pdf');
  const { library: pdfjsLibInstance, loadLibrary: loadPdfjsLib, isLoading: isLoadingPdfjs, error: pdfjsErrorHook } = useLibrary('pdfjsLib');

  const { calculate, isCalculating, calculationError: calcErrorHook } = useFinancialCalculator();
  const { parseFile: parseExcelFile, isParsing: isExcelParsing, parsingError: excelParsingErrorHook, setParsingError: clearExcelParsingError } = useExcelParser(ExcelJS);

  // Main AI service hook (for making calls)
  const aiService = useAiService(selectedAiProviderKey);
  // Centralized AI analysis state hook (for storing results, loading, errors of specific analyses)
  const aiAnalysisManager = useAiAnalysis(aiService, apiKeys, selectedAiProviderKey);

  const { extractTextFromPdf, isParsing: isPdfTextParsing, parsingError: pdfTextParsingErrorHook, setParsingError: clearPdfTextParsingError } = usePdfParser();
  const { extractFinancialData, isExtracting: isAiExtracting, extractionError: aiExtractionErrorHook, setExtractionError: clearAiExtractionError } = useAiDataExtraction(aiService);

  // Initialize/reset currentInputData
  useEffect(() => {
    const fieldKeys = getFieldKeys();
    let numPeriodsToInit = inputMethod === 'manual' ? numberOfPeriods :
      inputMethod === 'excel' ? DEFAULT_PERIODS_EXCEL :
      pdfNumberOfPeriods;

    // Only re-initialize if inputMethod actually changes or if in manual mode and numberOfPeriods changes
    if (inputMethod === 'manual' || inputMethod === 'excel') {
      const newBlankInputData = Array(numPeriodsToInit).fill(null).map((_, periodIndex) => {
        const newPeriod = {};
        // Preserve existing manual data if number of periods changes within manual mode
        const existingPeriodForManual = (inputMethod === 'manual' && currentInputData && currentInputData[periodIndex]) ? currentInputData[periodIndex] : {};
        fieldKeys.forEach(fieldKey => {
          const def = fieldDefinitions[fieldKey];
          newPeriod[fieldKey] = (def.firstPeriodOnly && periodIndex > 0) ? null :
            (existingPeriodForManual[fieldKey] === undefined ? null : existingPeriodForManual[fieldKey]);
        });
        return newPeriod;
      });
      setCurrentInputData(newBlankInputData);
    } else if (inputMethod === 'pdf') {
      // For PDF, currentInputData is populated by AI extraction.
      // We might want to initialize with empty structure based on pdfNumberOfPeriods
      // or wait for extraction. For now, let useEffect for numberOfPeriods handle it.
      const newBlankInputData = Array(pdfNumberOfPeriods).fill(null).map((_, periodIndex) => {
        const newPeriod = {};
        fieldKeys.forEach(fieldKey => {
          const def = fieldDefinitions[fieldKey];
          newPeriod[fieldKey] = (def.firstPeriodOnly && periodIndex > 0) ? null : null;
        });
        return newPeriod;
      });
      setCurrentInputData(newBlankInputData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfPeriods, inputMethod, pdfNumberOfPeriods]); // Removed currentInputData from dependencies

  const isProcessingSomething = isLoadingExcelJS || isExcelParsing || isCalculating || isLoadingHtml2pdf || isLoadingPdfjs || isPdfTextParsing || isAiExtracting || aiService.isLoading || Object.values(ANALYSIS_TYPES).some(type => aiAnalysisManager.isLoading(type));

  // Aggregate errors from various hooks into a single appError state
  useEffect(() => {
    const hookErrors = [
      excelJsErrorHook, html2pdfErrorHook, pdfjsErrorHook,
      excelParsingErrorHook, pdfTextParsingErrorHook,
      calcErrorHook, aiExtractionErrorHook, aiService.error,
      ...Object.values(aiAnalysisManager.errors).filter(Boolean)
    ].filter(Boolean);

    if (hookErrors.length > 0) {
      const combinedMessage = hookErrors.map(e => e.message).join('; \n');
      if (appError?.message !== combinedMessage) { // Avoid setting same error repeatedly
        setAppError(new Error(combinedMessage || "Ocorreu um erro desconhecido."));
      }
    } else if (!validationErrorDetails && appError) {
      setAppError(null); // Clear general appError if no hook errors and no validation errors
    }
  }, [excelJsErrorHook, html2pdfErrorHook, pdfjsErrorHook, excelParsingErrorHook,
      pdfTextParsingErrorHook, calcErrorHook, aiExtractionErrorHook,
      aiService.error, aiAnalysisManager.errors, validationErrorDetails, appError]);

  useEffect(() => {
    try { localStorage.setItem('aiApiKeys_ReportGen_v3', JSON.stringify(apiKeys)); }
    catch (e) { console.warn("Não foi possível salvar chaves API no localStorage:", e); }
  }, [apiKeys]);

  const handleApiKeyChange = useCallback((providerKey, key) => {
    setApiKeys(prev => ({ ...prev, [providerKey]: key }));
  }, []);

  const handleSelectedAiProviderChange = useCallback((providerKey) => {
    setSelectedAiProviderKey(providerKey);
    aiService.setSelectedProviderKey(providerKey); // Ensure aiService hook also updates its internal state
    aiAnalysisManager.clearAllAnalyses();
  }, [aiService, aiAnalysisManager]);

  const handleInputMethodChange = useCallback((method) => {
    setInputMethod(method);
    setCalculatedData([]);
    setAppError(null); setValidationErrorDetails(null); setExtractionProgress(null);
    aiAnalysisManager.clearAllAnalyses();
    if (method === 'manual') { setNumberOfPeriods(DEFAULT_PERIODS_MANUAL); }
    else if (method === 'excel') { setNumberOfPeriods(DEFAULT_PERIODS_EXCEL); }
    else if (method === 'pdf') {
      setNumberOfPeriods(pdfNumberOfPeriods);
    }
  }, [pdfNumberOfPeriods, aiAnalysisManager]);

  const handleManualInputChange = useCallback((periodIndex, fieldKey, value) => {
    setCurrentInputData(prevData =>
      prevData.map((pd, idx) =>
        idx === periodIndex ? { ...pd, [fieldKey]: value === '' ? null : Number(value) } : pd
      )
    );
    if (validationErrorDetails) setValidationErrorDetails(null);
    if (appError?.message.includes("validação")) setAppError(null);
  }, [validationErrorDetails, appError]);

  const handleManualSubmit = async () => {
    setAppError(null); setValidationErrorDetails(null); setCalculatedData([]);
    aiAnalysisManager.clearAllAnalyses();
    const validationErrs = validateAllFields(currentInputData);
    if (validationErrs.length > 0) {
      setValidationErrorDetails(validationErrs);
      setAppError(new Error("Erros de validação nos dados de entrada manual. Corrija os campos destacados."));
      return;
    }
    try {
      const result = await calculate(currentInputData, periodType);
      setCalculatedData(result);
    } catch (err) { /* Error handled by calculationError state & useEffect */ }
  };

  // Template download functionality implementation
  const handleTemplateDownload = async () => {
    if (!ExcelJS) {
      await loadExcelJS();
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Dados Financeiros');
      
      // Add headers based on field definitions
      const headers = ['Período', ...getFieldKeys().map(key => fieldDefinitions[key].label)];
      sheet.addRow(headers);
      
      // Add example rows with empty cells for input
      const periodsToGenerate = numberOfPeriods || DEFAULT_PERIODS_EXCEL;
      for (let i = 0; i < periodsToGenerate; i++) {
        sheet.addRow([`Período ${i + 1}`, ...Array(headers.length - 1).fill('')]);
      }
      
      // Format cells
      sheet.getRow(1).font = { bold: true };
      
      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'template_dados_financeiros.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar template Excel:", error);
      setAppError(new Error(`Erro ao gerar template Excel: ${error.message}`));
    }
  };
  
  // Excel file upload implementation
  const handleExcelFileUpload = async (file) => {
    if (!ExcelJS) {
      await loadExcelJS();
      return;
    }
    
    clearExcelParsingError();
    setAppError(null);
    setValidationErrorDetails(null);
    setCalculatedData([]);
    aiAnalysisManager.clearAllAnalyses();
    
    try {
      const parsedResult = await parseExcelFile(file);
      // Fix: The useExcelParser returns an object with a 'data' property, not an array directly
      if (parsedResult && parsedResult.data && parsedResult.data.length > 0) {
        // Use parsedResult.data instead of parsedData directly
        setCurrentInputData(parsedResult.data);
        
        // Auto-proceed to calculate
        const result = await calculate(parsedResult.data, periodType);
        setCalculatedData(result);
      } else {
        throw new Error("Não foi possível extrair dados do arquivo Excel");
      }
    } catch (error) {
      console.error("Erro ao processar arquivo Excel:", error);
      // Error will be handled by the error aggregation effect
    }
  };
  
  // PDF file upload implementation
  const handlePdfFileUpload = async (file) => {
    if (!pdfjsLibInstance) {
      await loadPdfjsLib();
      return;
    }
    
    clearPdfTextParsingError();
    clearAiExtractionError();
    setAppError(null);
    setValidationErrorDetails(null);
    setCalculatedData([]);
    aiAnalysisManager.clearAllAnalyses();
    setExtractionProgress({ stage: "Extraindo texto", progress: 0 });
    
    try {
      // First extract text from the PDF
      const extractedText = await extractTextFromPdf(file);
      setExtractionProgress({ stage: "Analisando dados com IA", progress: 50 });
      
      if (!extractedText) {
        throw new Error("Não foi possível extrair texto do PDF");
      }
      
      // Then use AI to extract structured financial data
      const apiKey = apiKeys[selectedAiProviderKey] || '';
      const extractedData = await extractFinancialData(
        extractedText, 
        pdfNumberOfPeriods, 
        pdfPeriodType,
        apiKey
      );
      
      setExtractionProgress({ stage: "Calculando indicadores", progress: 80 });
      
      if (extractedData && extractedData.length > 0) {
        setCurrentInputData(extractedData);
        
        // Auto-proceed to calculate
        const result = await calculate(extractedData, pdfPeriodType);
        setCalculatedData(result);
        setExtractionProgress({ stage: "Concluído", progress: 100 });
        setTimeout(() => setExtractionProgress(null), 1500);
      } else {
        throw new Error("Não foi possível extrair dados financeiros do PDF");
      }
    } catch (error) {
      console.error("Erro ao processar arquivo PDF:", error);
      setExtractionProgress(null);
      // Error will be handled by the error aggregation effect
    }
  };

  // Memoize companyInfo to prevent unnecessary re-renders of ReportRenderer if only other state changes
  const companyInfoMemo = useMemo(() => ({
    name: companyName,
    reportTitle,
    periodType,
    // Pass the actual number of periods from calculatedData if available, else from input settings
    numberOfPeriods: calculatedData.length > 0 ? calculatedData.length : numberOfPeriods
  }), [companyName, reportTitle, periodType, calculatedData, numberOfPeriods]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
          Gerador de Relatório Diretoria Multimodal com IA ✨
        </h1>
      </header>

      <AiProviderSelector
        selectedProviderKey={selectedAiProviderKey}
        onProviderChange={handleSelectedAiProviderChange}
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
          excelJsError={excelJsErrorHook}
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
          isLoading={isPdfTextParsing || isAiExtracting || isLoadingPdfjs}
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
          <p className="font-bold">Ocorreu um Erro na Aplicação:</p>
          <pre className="whitespace-pre-wrap text-sm mt-1">{appError.message}</pre>
        </div>
      )}

      {isProcessingSomething && (
        <div className="my-6 p-6 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-slate-600">Processando dados...</p>
        </div>
      )}

      {calculatedData.length > 0 && !isCalculating && !isExcelParsing && !isPdfTextParsing && !isAiExtracting && !appError && (
        <ReportRenderer
          calculatedData={calculatedData}
          companyInfo={companyInfoMemo} // Use memoized version
          onLoadHtml2pdf={loadHtml2pdf}
          html2pdfError={html2pdfErrorHook}
          // Pass the entire aiAnalysisManager hook's return
          // This allows ReportRenderer to access analyses, isLoading(type), errors[type], and performAnalysis
          aiAnalysisManager={aiAnalysisManager}
        />
      )}

    </div>
  );
}