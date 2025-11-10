// src/components/ReportGeneratorApp.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; 

// Components
import InputMethodSelector from './InputPanel/InputMethodSelector';
import ManualDataEntry from './InputPanel/ManualDataEntry';
import ExcelUploader from './InputPanel/ExcelUploader';
import PdfUploader from './InputPanel/PdfUploader';
import AiProviderSelector from './InputPanel/AiProviderSelector';
import PeriodTypeConfirmation from './InputPanel/PeriodTypeConfirmation';
import ExcelUploadProgress from './InputPanel/ExcelUploadProgress';
import ReportRenderer from './ReportPanel/ReportRenderer';

// Hooks
import { useLibrary } from '../hooks/useLibrary';
import { useFinancialCalculator } from '../hooks/useFinancialCalculator';
import { useSmartExcelParser } from '../hooks/useSmartExcelParser';
import { usePdfParser } from '../hooks/usePdfParser';
import { useAiService } from '../hooks/useAiService';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { useAiDataExtraction } from '../hooks/useAiDataExtraction';

// Utils
import { fieldDefinitions, getFieldKeys, validateAllFields } from '../utils/fieldDefinitions';
import { DEFAULT_PERIODS_MANUAL, DEFAULT_PERIODS_EXCEL, DEFAULT_AI_PROVIDER } from '../utils/constants';
import { ANALYSIS_TYPES } from '../utils/aiAnalysisTypes';
import { generateSmartTemplate, generateBasicDriversTemplate, TEMPLATE_TYPES } from '../utils/excelTemplateGenerator';

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

  // New state for Excel upload flow
  const [pendingExcelParseResult, setPendingExcelParseResult] = useState(null);
  const [showPeriodTypeConfirmation, setShowPeriodTypeConfirmation] = useState(false);

  // --- Initialize Hooks --- with fallbacks for test environment
  const excelLibResult = useLibrary('ExcelJS') || {};
  const html2pdfResult = useLibrary('html2pdf') || {};
  const pdfjsLibResult = useLibrary('pdfjsLib') || {};

  const ExcelJS = excelLibResult.library;
  const loadExcelJS = excelLibResult.loadLibrary || (() => Promise.resolve(null));
  const isLoadingExcelJS = excelLibResult.isLoading || false;
  const excelJsErrorHook = excelLibResult.error;

  const loadHtml2pdf = html2pdfResult.loadLibrary || (() => Promise.resolve(null));
  const isLoadingHtml2pdf = html2pdfResult.isLoading || false;
  const html2pdfErrorHook = html2pdfResult.error;

  const pdfjsLibInstance = pdfjsLibResult.library;
  const loadPdfjsLib = pdfjsLibResult.loadLibrary || (() => Promise.resolve(null));
  const isLoadingPdfjs = pdfjsLibResult.isLoading || false;
  const pdfjsErrorHook = pdfjsLibResult.error;

  const financialCalcResult = useFinancialCalculator() || {};
  const calculate = financialCalcResult.calculate || (() => Promise.resolve([]));
  const isCalculating = financialCalcResult.isCalculating || false;
  const calcErrorHook = financialCalcResult.calculationError;

  const excelParserResult = useSmartExcelParser(ExcelJS) || {};
  const parseSmartExcelFile = excelParserResult.parseFile || (() => Promise.resolve({ data: [], detectedPeriods: 0 }));
  const isExcelParsing = excelParserResult.isParsing || false;
  const excelParsingErrorHook = excelParserResult.error;
  const excelParsingProgress = excelParserResult.progress || 0;
  const excelParsingCurrentStep = excelParserResult.currentStep || '';
  const resetExcelParser = excelParserResult.resetParser || (() => {});

  const pdfParserResult = usePdfParser() || {};
  const extractTextFromPdf = pdfParserResult.extractTextFromPdf || (() => Promise.resolve(''));
  const isPdfTextParsing = pdfParserResult.isParsing || false;
  const pdfTextParsingErrorHook = pdfParserResult.parsingError;
  const clearPdfTextParsingError = pdfParserResult.setParsingError || (() => {});

  const aiService = useAiService(selectedAiProviderKey) || { 
    isLoading: false, 
    error: null, 
    currentProviderConfig: {},
    setSelectedProviderKey: () => {},
  };

  const aiAnalysisManager = useAiAnalysis(aiService, apiKeys, selectedAiProviderKey) || {
    isLoading: () => false,
    errors: {},
    clearAllAnalyses: () => {},
  };

  const aiExtractResult = useAiDataExtraction(aiService) || {};
  const extractFinancialData = aiExtractResult.extractFinancialData || (() => Promise.resolve([]));
  const isAiExtracting = aiExtractResult.isExtracting || false;
  const aiExtractionErrorHook = aiExtractResult.extractionError;
  const clearAiExtractionError = aiExtractResult.setExtractionError || (() => {});

  // Initialize/reset currentInputData when numberOfPeriods changes
  useEffect(() => {
    const fieldKeys = getFieldKeys();
    const numPeriodsToInit = numberOfPeriods;
    
    // Initialize with the correct number of periods
    setCurrentInputData(prevData => {
      // Only update if the length has actually changed
      if (prevData.length === numPeriodsToInit) {
        return prevData;
      }
      
      return Array(numPeriodsToInit).fill(null).map((_, periodIndex) => {
        const newPeriod = {};
        const existingDataForPeriod = prevData[periodIndex] || {};
        fieldKeys.forEach(fieldKey => {
          const def = fieldDefinitions[fieldKey];
          newPeriod[fieldKey] = (def.firstPeriodOnly && periodIndex > 0) ? null :
            (existingDataForPeriod[fieldKey] === undefined ? null : existingDataForPeriod[fieldKey]);
        });
        return newPeriod;
      });
    });
  }, [numberOfPeriods]); // Only depend on numberOfPeriods since we use functional setState

  const isProcessingSomething = isLoadingExcelJS || isExcelParsing || isCalculating || isLoadingHtml2pdf || isLoadingPdfjs || isPdfTextParsing || isAiExtracting || aiService.isLoading || Object.values(ANALYSIS_TYPES).some(type => aiAnalysisManager.isLoading(type));

  // Aggregate errors from various hooks into a single appError state
  useEffect(() => {
    const hookErrors = [
      excelJsErrorHook, html2pdfErrorHook, pdfjsErrorHook,
      excelParsingErrorHook, pdfTextParsingErrorHook,
      calcErrorHook, aiExtractionErrorHook, aiService.error,
      ...Object.values(aiAnalysisManager.errors || {}).filter(Boolean),
    ].filter(Boolean);

    if (hookErrors.length > 0) {
      const combinedMessage = hookErrors.map(e => e.message).join('; \n');
      if (appError?.message !== combinedMessage) {
        setAppError(new Error(combinedMessage || 'Ocorreu um erro desconhecido.'));
      }
    } else if (!validationErrorDetails && appError) {
      setAppError(null);
    }
  }, [excelJsErrorHook, html2pdfErrorHook, pdfjsErrorHook, excelParsingErrorHook,
    pdfTextParsingErrorHook, calcErrorHook, aiExtractionErrorHook,
    aiService.error, aiAnalysisManager.errors, validationErrorDetails, appError]);

  useEffect(() => {
    try { localStorage.setItem('aiApiKeys_ReportGen_v3', JSON.stringify(apiKeys)); }
    catch (e) { console.warn('Não foi possível salvar chaves API no localStorage:', e); }
  }, [apiKeys]);

  const handleApiKeyChange = useCallback((providerKey, key) => {
    setApiKeys(prev => ({ ...prev, [providerKey]: key }));
  }, []);

  const handleSelectedAiProviderChange = useCallback((providerKey) => {
    setSelectedAiProviderKey(providerKey);
    aiService.setSelectedProviderKey(providerKey);
    aiAnalysisManager.clearAllAnalyses();
  }, [aiService, aiAnalysisManager]);

  const handleInputMethodChange = useCallback((method) => {
    setInputMethod(method);
    setCalculatedData([]);
    setAppError(null); setValidationErrorDetails(null); setExtractionProgress(null);
    setPendingExcelParseResult(null); setShowPeriodTypeConfirmation(false);
    resetExcelParser();
    aiAnalysisManager.clearAllAnalyses();
    if (method === 'manual') setNumberOfPeriods(DEFAULT_PERIODS_MANUAL);
    else if (method === 'excel') {
      setNumberOfPeriods(DEFAULT_PERIODS_EXCEL);
      // Automatically load ExcelJS when Excel method is selected
      loadExcelJS().catch(err => {
        console.error('Failed to load ExcelJS:', err);
        setAppError(err);
      });
    }
    else if (method === 'pdf') setNumberOfPeriods(2);
  }, [aiAnalysisManager, resetExcelParser, loadExcelJS]);

  const handleManualInputChange = useCallback((periodIndex, fieldKey, value) => {
    setCurrentInputData(prevData =>
      prevData.map((pd, idx) =>
        idx === periodIndex ? { ...pd, [fieldKey]: value === '' ? null : Number(value) } : pd,
      ),
    );
    if (validationErrorDetails) setValidationErrorDetails(null);
    if (appError?.message.includes('validação')) setAppError(null);
  }, [validationErrorDetails, appError]);

  const handleManualSubmit = async () => {
    setAppError(null); setValidationErrorDetails(null); setCalculatedData([]);
    aiAnalysisManager.clearAllAnalyses();
    const validationErrs = validateAllFields(currentInputData);
    if (validationErrs.length > 0) {
      setValidationErrorDetails(validationErrs);
      setAppError(new Error('Erros de validação nos dados de entrada manual. Corrija os campos destacados.'));
      return;
    }
    try {
      const result = await calculate(currentInputData, periodType);
      setCalculatedData(result);
    } catch (err) { /* Error handled by calculationError state & useEffect */ }
  };

  const handleTemplateDownloadRequest = async (templateTypeKey) => {
    setAppError(null);
    try {
      const excel = await loadExcelJS();
      if (!excel) { setAppError(new Error(excelJsErrorHook?.message || 'ExcelJS não carregado.')); return; }

      let wb;
      let fileName = 'Template_Financeiro_Personalizado.xlsx';

      const currentNumP = numberOfPeriods;
      const currentPTypeLabel = periodType;

      switch (templateTypeKey) {
        case TEMPLATE_TYPES.SMART_ADAPTIVE:
          wb = await generateSmartTemplate(currentNumP, currentPTypeLabel, excel);
          fileName = `Template_Inteligente_${currentNumP}_Periodos.xlsx`;
          break;
        case TEMPLATE_TYPES.BASIC_DRIVERS:
          wb = await generateBasicDriversTemplate(currentNumP, currentPTypeLabel, excel);
          fileName = `Template_Basico_Drivers_${currentNumP}_Periodos.xlsx`;
          break;
        default:
          throw new Error('Tipo de template não suportado para download.');
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();

    } catch (err) { console.error('Error downloading template:', err); setAppError(err); }
  };

  const handleExcelFileUpload = async (file) => {
    setAppError(null);
    setValidationErrorDetails(null); setCalculatedData([]);
    setPendingExcelParseResult(null); setShowPeriodTypeConfirmation(false);
    aiAnalysisManager.clearAllAnalyses();
    
    try {
      const parseResult = await parseSmartExcelFile(file, periodType);
      console.log('Smart Parser Result:', parseResult);
      
      // Check if there's a period type mismatch
      if (parseResult.detectedPeriodType && parseResult.detectedPeriodType !== periodType) {
        setPendingExcelParseResult(parseResult);
        setShowPeriodTypeConfirmation(true);
        return;
      }
      
      // No period type conflict, proceed directly
      await processParsedExcelData(parseResult);
      
    } catch (err) {
      console.error('Error in handleExcelFileUpload:', err);
    }
  };

  const processParsedExcelData = async (parseResult) => {
    const {
      data: parsedInputData,
      detectedPeriods,
      detectedPeriodType,
      warnings: parseWarnings,
    } = parseResult;

    if (parseWarnings && parseWarnings.length > 0) {
      console.warn('Parse warnings:', parseWarnings);
    }

    // Update app state
    setNumberOfPeriods(detectedPeriods);
    if (detectedPeriodType && detectedPeriodType !== periodType) {
      setPeriodType(detectedPeriodType);
    }
    setCurrentInputData(parsedInputData);

    // Validate and calculate
    const validationErrs = validateAllFields(parsedInputData);
    if (validationErrs.length > 0) {
      setValidationErrorDetails(validationErrs);
      setAppError(new Error('Dados do Excel carregados, mas contêm erros de validação. Verifique os campos destacados.'));
      return;
    }

    const result = await calculate(parsedInputData, detectedPeriodType || periodType);
    setCalculatedData(result);
  };

  const handlePeriodTypeConfirmation = async (confirmedPeriodType) => {
    setShowPeriodTypeConfirmation(false);
    
    if (pendingExcelParseResult) {
      // Update the period type in the parse result
      const updatedParseResult = {
        ...pendingExcelParseResult,
        detectedPeriodType: confirmedPeriodType,
      };
      
      await processParsedExcelData(updatedParseResult);
    }
    
    setPendingExcelParseResult(null);
  };

  const handlePeriodTypeConfirmationCancel = () => {
    setShowPeriodTypeConfirmation(false);
    setPendingExcelParseResult(null);
    resetExcelParser();
  };

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
    setExtractionProgress({ stage: 'Extraindo texto', progress: 0 });
    
    try {
      const extractedText = await extractTextFromPdf(file);
      setExtractionProgress({ stage: 'Analisando dados com IA', progress: 50 });
      
      if (!extractedText) {
        throw new Error('Não foi possível extrair texto do PDF');
      }
      
      const apiKey = apiKeys[selectedAiProviderKey] || '';
      const extractedData = await extractFinancialData(
        extractedText, 
        pdfNumberOfPeriods, 
        pdfPeriodType,
        apiKey,
      );
      
      setExtractionProgress({ stage: 'Calculando indicadores', progress: 80 });
      
      if (extractedData && extractedData.length > 0) {
        setCurrentInputData(extractedData);
        const result = await calculate(extractedData, pdfPeriodType);
        setCalculatedData(result);
        setExtractionProgress({ stage: 'Concluído', progress: 100 });
        setTimeout(() => setExtractionProgress(null), 1500);
      } else {
        throw new Error('Não foi possível extrair dados financeiros do PDF');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo PDF:', error);
      setExtractionProgress(null);
    }
  };

  const companyInfoMemo = useMemo(() => ({
    name: companyName,
    reportTitle,
    periodType,
    numberOfPeriods: calculatedData.length > 0 ? calculatedData.length : numberOfPeriods,
  }), [companyName, reportTitle, periodType, calculatedData, numberOfPeriods]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-100 text-slate-900 p-4 md:p-8 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
          Auditor Financeiro com IA ✨
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
          onTemplateDownloadRequest={handleTemplateDownloadRequest}
          onFileUpload={handleExcelFileUpload}
          isLoading={isProcessingSomething}
          isExcelJsLoading={isLoadingExcelJS}
          excelJsError={excelJsErrorHook}
          currentAppNumberOfPeriods={numberOfPeriods}
          currentAppPeriodType={periodType}
          onNumberOfPeriodsChange={setNumberOfPeriods}
          onPeriodTypeChange={setPeriodType}
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

      {/* Excel Upload Progress Modal */}
      <ExcelUploadProgress
        isVisible={isExcelParsing}
        progress={excelParsingProgress}
        currentStep={excelParsingCurrentStep}
        qualityAnalysis={pendingExcelParseResult?.qualityAnalysis}
        recommendations={pendingExcelParseResult?.recommendations}
      />

      {/* Period Type Confirmation Modal */}
      <PeriodTypeConfirmation
        isVisible={showPeriodTypeConfirmation}
        detectedPeriodType={pendingExcelParseResult?.detectedPeriodType}
        expectedPeriodType={periodType}
        onConfirm={handlePeriodTypeConfirmation}
        onCancel={handlePeriodTypeConfirmationCancel}
      />

      {appError && !isProcessingSomething && (
        <div className="my-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
          <p className="font-bold">Ocorreu um Erro na Aplicação:</p>
          <pre className="whitespace-pre-wrap text-sm mt-1">{appError.message}</pre>
        </div>
      )}
      {isProcessingSomething && !isExcelParsing && (
        <div className="my-6 p-6 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-slate-600">Processando dados...</p>
        </div>
      )}

      {calculatedData.length > 0 && !isProcessingSomething && !appError && (
        <ReportRenderer
          calculatedData={calculatedData}
          companyInfo={companyInfoMemo}
          onLoadHtml2pdf={loadHtml2pdf}
          html2pdfError={html2pdfErrorHook}
          aiAnalysisManager={aiAnalysisManager}
        />
      )}
    </div>
  );
}