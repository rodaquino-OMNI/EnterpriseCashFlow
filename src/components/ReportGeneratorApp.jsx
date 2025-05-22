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
import { DEFAULT_PERIODS_MANUAL, DEFAULT_PERIODS_EXCEL, GREY_RGB_FILL, BLUE_HEADER_FILL, DEFAULT_AI_PROVIDER } from '../utils/constants';
import { AI_PROVIDERS } from '../utils/aiProviders';

export default function ReportGeneratorApp() {
  // UI State & Global App Info
  const [inputMethod, setInputMethod] = useState('manual');
  const [companyName, setCompanyName] = useState('Empresa Exemplo S.A.');
  const [reportTitle, setReportTitle] = useState('Análise Financeira com Fluxo de Caixa');

  // Data State
  const [numberOfPeriods, setNumberOfPeriods] = useState(DEFAULT_PERIODS_MANUAL);
  const [periodType, setPeriodType] = useState('anos');
  const [manualInputData, setManualInputData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);

  // Error State
  const [appError, setAppError] = useState(null);

  // AI State
  const [selectedAiProvider, setSelectedAiProvider] = useState(DEFAULT_AI_PROVIDER);
  const [apiKeys, setApiKeys] = useState(() => {
    const savedKeys = localStorage.getItem('aiApiKeys');
    try {
      return savedKeys ? JSON.parse(savedKeys) : {};
    } catch (e) {
      console.error("Error loading API keys:", e);
      return {};
    }
  });

  // Extraction Progress State
  const [extractionProgress, setExtractionProgress] = useState(null);

  // Hooks
  const { library: ExcelJS, loadLibrary: loadExcelJS, isLoading: isLoadingExcelJS, error: excelJsError } = useLibrary('ExcelJS');
  const { library: html2pdf, loadLibrary: loadHtml2pdf, isLoading: isLoadingHtml2pdf, error: html2pdfError } = useLibrary('html2pdf');
  const { calculate, isCalculating, calculationError } = useFinancialCalculator();
  const { parseFile: parseExcelFile, isParsing: isParsingExcel, parsingError: excelParsingError } = useExcelParser();

  // New hooks for AI and PDF support
  const aiService = useAiService(selectedAiProvider);
  const { extractTextFromPdf, isParsing: isParsingPdf, parsingError: pdfParsingError } = usePdfParser();
  const { extractFinancialData, isExtracting, extractionError } = useAiDataExtraction(aiService);

  // Initialize/reset manualInputData when numberOfPeriods or inputMethod changes
  useEffect(() => {
    if (inputMethod === 'manual' || inputMethod === 'pdf') {
      const currentNumPeriods = numberOfPeriods;
      const fieldKeys = getFieldKeys();
      const newInputData = Array(currentNumPeriods).fill(null).map((_, periodIndex) => {
        const existingPeriod = manualInputData[periodIndex] || {};
        const newPeriod = {};
        fieldKeys.forEach(fieldKey => {
          const def = fieldDefinitions[fieldKey];
          if (def.firstPeriodOnly && periodIndex > 0) {
            newPeriod[fieldKey] = null;
          } else {
            newPeriod[fieldKey] = existingPeriod[fieldKey] === undefined ? null : existingPeriod[fieldKey];
          }
        });
        return newPeriod;
      });
      setManualInputData(newInputData);
    } else { // Excel mode
      setNumberOfPeriods(DEFAULT_PERIODS_EXCEL);
      setManualInputData([]);
    }
  }, [numberOfPeriods, inputMethod]);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiApiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Combined loading state
  const isProcessing = isLoadingExcelJS || isParsingExcel || isCalculating || isParsingPdf || isExtracting;

  // Clear errors when main inputs change
  useEffect(() => {
    setAppError(null);
  }, [companyName, reportTitle, inputMethod, selectedAiProvider]);

  // Aggregate errors for display
  useEffect(() => {
    if (excelJsError) setAppError(excelJsError);
    else if (html2pdfError) setAppError(html2pdfError);
    else if (excelParsingError) setAppError(excelParsingError);
    else if (calculationError) setAppError(calculationError);
    else if (pdfParsingError) setAppError(pdfParsingError);
    else if (extractionError) setAppError(extractionError);
    else if (aiService.error) setAppError(aiService.error);
    else setAppError(null);
  }, [excelJsError, html2pdfError, excelParsingError, calculationError, pdfParsingError, extractionError, aiService.error]);

  const handleInputMethodChange = useCallback((method) => {
    setInputMethod(method);
    setCalculatedData([]);
    setAppError(null);
    setExtractionProgress(null);

    if (method === 'manual') {
      setNumberOfPeriods(DEFAULT_PERIODS_MANUAL);
    } else if (method === 'excel') {
      setNumberOfPeriods(DEFAULT_PERIODS_EXCEL);
      setManualInputData([]);
    } else if (method === 'pdf') {
      setNumberOfPeriods(DEFAULT_PERIODS_MANUAL);
    }
  }, []);

  const handleManualInputChange = useCallback((periodIndex, fieldKey, value) => {
    setManualInputData(prevData => {
      const updatedData = [...prevData];
      const numericValue = value === '' ? null : Number(value);
      updatedData[periodIndex] = {
        ...updatedData[periodIndex],
        [fieldKey]: numericValue
      };
      return updatedData;
    });
  }, []);

  const handleManualSubmit = async () => {
    setAppError(null);
    setCalculatedData([]);
    const validationErrors = validateAllFields(manualInputData);
    if (validationErrors.length > 0) {
      let errorMsg = "Erros de validação nos dados de entrada:\n";
      validationErrors.forEach(pErr => {
        errorMsg += `Período ${pErr.period}:\n`;
        Object.entries(pErr.fields).forEach(([fKey, errMsg]) => {
          errorMsg += `- ${fieldDefinitions[fKey]?.label || fKey}: ${errMsg}\n`;
        });
      });
      setAppError(new Error(errorMsg));
      return;
    }
    try {
      const result = await calculate(manualInputData, periodType);
      setCalculatedData(result);
    } catch (err) {
      setAppError(err);
    }
  };

  const handleTemplateDownload = async () => {
    setAppError(null);
    try {
      const excel = await loadExcelJS();
      if (!excel) {
        setAppError(excelJsError || new Error("Falha ao carregar ExcelJS para download do template."));
        return;
      }
      const periodsForTemplate = inputMethod === 'manual' ? numberOfPeriods : DEFAULT_PERIODS_EXCEL;
      const wb = new excel.Workbook();
      const sheetName = `Dados Entrada (${periodsForTemplate} Períodos)`;
      const ws = wb.addWorksheet(sheetName);
      const headers = ['Item (Chave Interna)', 'Descrição (Português)'];
      for (let i = 1; i <= periodsForTemplate; i++) {
        headers.push(`Período ${i}`);
      }
      headers.push('Nota');
      ws.addRow(headers);
      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_HEADER_FILL } };
      });
      getFieldKeys().forEach(fieldKey => {
        const def = fieldDefinitions[fieldKey];
        const rowValues = [fieldKey, def.label];
        for (let i = 0; i < periodsForTemplate; i++) {
          rowValues.push('');
        }
        rowValues.push(def.note || (def.firstPeriodOnly ? "Apenas para o 1º período da série" : ''));
        const row = ws.addRow(rowValues);
        for (let i = 0; i < periodsForTemplate; i++) {
          const cell = row.getCell(3 + i); 
          if (def.firstPeriodOnly && i > 0) {
            cell.value = "[Não Aplicável]"; 
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; 
            cell.font = { italic: true, color: { argb: 'FF888888'} };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY_RGB_FILL } };
          }
        }
      });
      const columnWidths = [{ width: 35 }, { width: 55 }];
      for (let i = 0; i < periodsForTemplate; i++) { columnWidths.push({ width: 20 }); }
      columnWidths.push({width: 45});
      ws.columns = columnWidths;
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Template_Relatorio_${periodsForTemplate}_Periodos.xlsx`;
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    } catch (err) {
      setAppError(err);
    }
  };

  const handleExcelFileUpload = async (file) => {
    setAppError(null);
    setCalculatedData([]);
    try {
      const excel = await loadExcelJS();
      if (!excel) {
        setAppError(excelJsError || new Error("Falha ao carregar ExcelJS para upload."));
        return;
      }
      const { data: parsedInputData, detectedPeriods } = await parseExcelFile(file, excel);
      setNumberOfPeriods(detectedPeriods);
      setManualInputData(parsedInputData);
      const result = await calculate(parsedInputData, periodType);
      setCalculatedData(result);
    } catch (err) {
      setAppError(err);
    }
  };

  const handlePdfUpload = async (file) => {
    setAppError(null);
    setCalculatedData([]);
    setExtractionProgress({ step: 'Extraindo texto do PDF...', progress: 10 });

    try {
      const pdfResult = await extractTextFromPdf(file);
      setExtractionProgress({ step: 'Texto extraído. Analisando dados com IA...', progress: 40 });

      const currentApiKey = apiKeys[selectedAiProvider] || '';
      const extractionResult = await extractFinancialData(
        pdfResult.text,
        periodType,
        numberOfPeriods,
        currentApiKey,
        selectedAiProvider // Pass the selected provider key to use its specific token limits
      );

      setExtractionProgress({ step: 'Dados extraídos. Calculando métricas...', progress: 70 });

      if (extractionResult.data && extractionResult.data.length > 0) {
        setManualInputData(extractionResult.data);

        const result = await calculate(extractionResult.data, periodType);
        setCalculatedData(result);
        setExtractionProgress({ step: 'Processamento completo!', progress: 100 });

        setTimeout(() => setExtractionProgress(null), 1500);
      } else {
        throw new Error('Não foi possível extrair dados financeiros do PDF. Verifique se o documento contém tabelas financeiras.');
      }
    } catch (err) {
      setAppError(err);
      setExtractionProgress(null);
    }
  };

  const handleApiKeyChange = (providerKey, apiKey) => {
    setApiKeys(prev => ({
      ...prev,
      [providerKey]: apiKey
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700">
          Gerador de Relatório Diretoria Avançado ✨
        </h1>
      </header>

      <InputMethodSelector
        inputMethod={inputMethod}
        onInputMethodChange={handleInputMethodChange}
        companyName={companyName}
        onCompanyNameChange={setCompanyName}
        reportTitle={reportTitle}
        onReportTitleChange={setReportTitle}
        supportsPdf={true}
      />

      <AiProviderSelector
        selectedProvider={selectedAiProvider}
        onProviderChange={setSelectedAiProvider}
        apiKeys={apiKeys}
        onApiKeyChange={handleApiKeyChange}
        className="mb-8"
      />

      {inputMethod === 'excel' && (
        <ExcelUploader
          onTemplateDownload={handleTemplateDownload}
          onFileUpload={handleExcelFileUpload}
          isLoading={isProcessing}
          error={appError}
          numberOfPeriods={numberOfPeriods}
        />
      )}

      {inputMethod === 'manual' && (
        <ManualDataEntry
          numberOfPeriods={numberOfPeriods}
          onNumberOfPeriodsChange={setNumberOfPeriods}
          periodType={periodType}
          onPeriodTypeChange={setPeriodType}
          inputData={manualInputData}
          onInputChange={handleManualInputChange}
          onSubmit={handleManualSubmit}
          isLoading={isCalculating}
        />
      )}

      {inputMethod === 'pdf' && (
        <PdfUploader
          onPdfUpload={handlePdfUpload}
          isLoading={isParsingPdf || isExtracting || isCalculating}
          aiProviderConfig={aiService.currentProviderConfig}
          periodType={periodType}
          setPeriodType={setPeriodType}
          numberOfPeriods={numberOfPeriods}
          setNumberOfPeriods={setNumberOfPeriods}
          extractionProgress={extractionProgress}
        />
      )}

      {appError && !isProcessing && (
        <div className="my-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <p className="font-bold">Ocorreu um Erro:</p>
          <pre className="whitespace-pre-wrap text-sm mt-1">{appError.message}</pre>
        </div>
      )}

      {isCalculating && !isParsingPdf && !isExtracting && !extractionProgress && (
        <div className="text-center my-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-slate-600">Processando cálculos financeiros...</p>
        </div>
      )}

      {calculatedData.length > 0 && !isCalculating && (
        <ReportRenderer
          calculatedData={calculatedData}
          companyInfo={{ name: companyName, reportTitle, periodType, numberOfPeriods: calculatedData.length }}
          onLoadHtml2pdf={loadHtml2pdf}
          html2pdfError={html2pdfError}
          aiService={aiService}
          apiKeys={apiKeys}
        />
      )}
    </div>
  );
}