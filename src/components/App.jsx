// src/components/App.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useFinancialCalculator } from '../hooks/useFinancialCalculator';
import { useExcelParser } from '../hooks/useExcelParser';
import { usePdfParser } from '../hooks/usePdfParser';
import { useAiAnalysis } from '../hooks/useAiAnalysis'; 
import { useAiService } from '../hooks/useAiService'; // Import the useAiService hook
import ReportGeneratorApp from './ReportGeneratorApp';
import ErrorBoundary from './ErrorBoundary';

function App() {
  const [appState, setAppState] = useState('input'); // 'input' or 'report'
  const [companyInfo, setCompanyInfo] = useState({ 
    name: '', 
    reportTitle: 'Financial Analysis', 
    periodType: 'QUARTERLY'  // Default to quarterly analysis
  });
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [userUploadedData, setUserUploadedData] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [html2pdfInstance, setHtml2pdfInstance] = useState(null);
  const [html2pdfError, setHtml2pdfError] = useState(null);
  const [loadingState, setLoadingState] = useState({
    loadingData: false,
    calculatingData: false,
  });
  
  // Initialize API keys (add state for apiKeys if needed)
  const [apiKeys, setApiKeys] = useState({});
  
  // Initialize the AI service hook first
  const aiService = useAiService(selectedProvider);
  
  // Then initialize our centralized AI analysis hook with proper parameters
  const aiAnalysisManager = useAiAnalysis(aiService, apiKeys, selectedProvider);
  
  // Excel Parser for handling Excel file uploads
  const { parseExcel, excelParsingStatus } = useExcelParser();
  
  // PDF Parser for extracting tables from PDF files
  const { parsePdf, pdfParsingStatus } = usePdfParser();
  
  // Financial Calculator Hook - fixed variable names to match what the hook returns
  const { calculate, isCalculating } = useFinancialCalculator();
  
  // Handle dynamic import for html2pdf library
  const loadHtml2Pdf = useCallback(async () => {
    try {
      if (html2pdfInstance) return html2pdfInstance;
      
      const html2pdf = await import('html2pdf.js');
      setHtml2pdfInstance(() => html2pdf.default);
      return html2pdf.default;
    } catch (error) {
      console.error("Failed to load HTML2PDF library:", error);
      setHtml2pdfError(error);
      return null;
    }
  }, [html2pdfInstance]);
  
  // Process uploaded excel file to get the data
  const handleExcelDataUpload = async (file) => {
    setLoadingState(prev => ({ ...prev, loadingData: true }));
    setErrorMessage('');
    
    try {
      const data = await parseExcel(file);
      setUserUploadedData(data);
      
      // Auto-proceed to calculate
      handleCalculateFinancials(data);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      setErrorMessage(`Error parsing Excel file: ${error.message}`);
      setLoadingState(prev => ({ ...prev, loadingData: false }));
    }
  };
  
  // Process uploaded PDF file to extract tables
  const handlePdfDataUpload = async (file) => {
    setLoadingState(prev => ({ ...prev, loadingData: true }));
    setErrorMessage('');
    
    try {
      const data = await parsePdf(file);
      setUserUploadedData(data);
      
      // Auto-proceed to calculate
      handleCalculateFinancials(data);
    } catch (error) {
      console.error("Error parsing PDF file:", error);
      setErrorMessage(`Error parsing PDF file: ${error.message}`);
      setLoadingState(prev => ({ ...prev, loadingData: false }));
    }
  };
  
  // Handle manual data entry
  const handleManualDataEntry = (data) => {
    setUserUploadedData(data);
    
    // Auto-proceed to calculate
    handleCalculateFinancials(data);
  };
  
  // Process raw financial data to calculate metrics and ratios
  const handleCalculateFinancials = async (data = userUploadedData) => {
    if (!data || data.length === 0) {
      setErrorMessage('No data available to process.');
      return;
    }
    
    setLoadingState(prev => ({ ...prev, calculatingData: true }));
    setErrorMessage('');
    
    try {
      const calculatedResults = await calculate(data, companyInfo); // Fixed function name to match hook
      setCalculatedData(calculatedResults);
      setAppState('report'); // Auto-switch to report view when calculation is done
    } catch (error) {
      console.error("Calculation error:", error);
      setErrorMessage(`Error calculating financials: ${error.message}`);
    } finally {
      setLoadingState(prev => ({ ...prev, calculatingData: false, loadingData: false }));
    }
  };
  
  // Reset app to initial state
  const handleReset = () => {
    setAppState('input');
    setUserUploadedData([]);
    setCalculatedData([]);
    setErrorMessage('');
    
    // Also reset AI analysis states
    aiAnalysisManager.clearAllAnalyses();
  };
  
  // Update company info from user inputs
  const updateCompanyInfo = (info) => {
    setCompanyInfo(prev => ({
      ...prev,
      ...info,
    }));
  };
  
  // Set the AI provider
  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
  };
  
  // Update API keys
  const updateApiKey = (provider, key) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: key
    }));
  };
  
  // Loading states (combined from various sources)
  const isLoading = useMemo(() => {
    return loadingState.loadingData || 
           loadingState.calculatingData || 
           excelParsingStatus?.loading ||
           pdfParsingStatus?.loading ||
           isCalculating; // Fixed to use isCalculating from hook
  }, [
    loadingState, 
    excelParsingStatus?.loading, 
    pdfParsingStatus?.loading, 
    isCalculating // Fixed dependency array
  ]);
  
  return (
    <ErrorBoundary>
      <div className="app-container">
        <ReportGeneratorApp
          appState={appState}
          setAppState={setAppState}
          companyInfo={companyInfo}
          updateCompanyInfo={updateCompanyInfo}
          userUploadedData={userUploadedData}
          calculatedData={calculatedData}
          onExcelUpload={handleExcelDataUpload}
          onPdfUpload={handlePdfDataUpload}
          onManualDataEntry={handleManualDataEntry}
          onCalculateFinancials={handleCalculateFinancials}
          onLoadHtml2pdf={loadHtml2Pdf}
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
          onUpdateApiKey={updateApiKey}
          apiKeys={apiKeys}
          onReset={handleReset}
          isLoading={isLoading}
          errorMessage={errorMessage}
          html2pdfError={html2pdfError}
          aiAnalysisManager={aiAnalysisManager} // Pass the AI analysis manager to child components
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;