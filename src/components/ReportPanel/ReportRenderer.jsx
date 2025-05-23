// src/components/ReportPanel/ReportRenderer.jsx
import React, { useRef, useState, useEffect } from 'react';
import ReportControls from './ReportControls';
// Import new executive summary / dashboard components
import ExecutiveSummaryCards from './ExecutiveSummaryCards'; 
import WorkingCapitalTimeline from './Charts/WorkingCapitalTimeline';
import FundingReconciliation from './FundingReconciliation';
import BalanceSheetEquation from './BalanceSheetEquation';
import PowerOfOneAnalysis from './PowerOfOneAnalysis'; 
import FinancialTables from './FinancialTables'; 
import AiSummarySection from '../AIPanel/AiSummarySection';
import AiVarianceSection from '../AIPanel/AiVarianceSection';
// New Waterfall Chart Components
import PnlWaterfallChart from './Charts/PnlWaterfallChart'; 
import CashFlowWaterfallChart from './Charts/CashFlowWaterfallChart'; 
// Chart Imports for general dashboard section
import MarginTrendChart from '../Charts/MarginTrendChart';
import WorkingCapitalDaysTrendChart from '../Charts/WorkingCapitalDaysTrendChart';
import CashFlowKeyMetricsTrendChart from '../Charts/CashFlowKeyMetricsTrendChart';
import AssetCompositionChart from '../Charts/AssetCompositionChart';
import FundingStructureChart from '../Charts/FundingStructureChart';
import BalanceSheetDifferenceTrendChart from '../Charts/BalanceSheetDifferenceTrendChart';

import { PERIOD_TYPES } from '../../utils/constants';
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from '../../utils/aiAnalysisTypes';
import { formatCurrency, formatPercentage, formatDays } from '../../utils/formatters';
import { validateFinancialData, ValidationAlerts } from '../../utils/dataValidation';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * companyInfo: import('../../types/financial').CompanyInfo;
 * onLoadHtml2pdf: () => Promise<any | null>;
 * html2pdfError: Error | null;
 * aiService: any;
 * apiKeys: Record<string, string>;
 * selectedAiProviderKey: string;
 * }} props
 */
export default function ReportRenderer({ 
  calculatedData, 
  companyInfo, 
  onLoadHtml2pdf, 
  html2pdfError,
  aiService,
  apiKeys,
  selectedAiProviderKey
}) {
  const reportRef = useRef(null);
  
  // Unified state for AI content and errors, keyed by analysisType
  const [aiAnalyses, setAiAnalyses] = useState({});
  const [aiLoadingStates, setAiLoadingStates] = useState({});
  const [aiErrorStates, setAiErrorStates] = useState({});

  const { name: companyName, reportTitle, periodType } = companyInfo;
  const financialDataBundle = { calculatedData, companyInfo };
  const validationResults = React.useMemo(() => validateFinancialData(calculatedData), [calculatedData]);

  const handleGenericAiAnalysis = async (analysisType) => {
    // Pre-flight checks
    if (!calculatedData.length && analysisType !== ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION) {
      setAiErrorStates(prev => ({ ...prev, [analysisType]: new Error("Gere o relatório com dados primeiro.") }));
      setAiAnalyses(prev => ({...prev, [analysisType]: "Gere o relatório com dados primeiro."}));
      return;
    }
    
    if (analysisType === ANALYSIS_TYPES.VARIANCE_ANALYSIS && calculatedData.length < 2) {
      setAiErrorStates(prev => ({ ...prev, [analysisType]: new Error("Análise de variações requer pelo menos 2 períodos.") }));
      setAiAnalyses(prev => ({...prev, [analysisType]: "Análise de variações requer pelo menos 2 períodos de dados."}));
      return;
    }

    aiService.resetError();
    setAiErrorStates(prev => ({ ...prev, [analysisType]: null }));
    setAiAnalyses(prev => ({...prev, [analysisType]: ''})); // Clear previous content
    setAiLoadingStates(prev => ({ ...prev, [analysisType]: true }));

    try {
      const result = await aiService.callAiAnalysis(
        analysisType,
        financialDataBundle,
        { maxTokens: ANALYSIS_METADATA[analysisType]?.defaultOutputTokens },
        apiKeys[selectedAiProviderKey] || ''
      );
      
      setAiAnalyses(prev => ({...prev, [analysisType]: result})); // result is content or error string
      
      if (typeof result === 'string' && (
        result.startsWith("Erro:") || 
        result.startsWith("Falha") || 
        result.includes("API Key") || 
        result.includes("Chave API")
      )) {
        setAiErrorStates(prev => ({...prev, [analysisType]: new Error(result)}));
      }
    } catch (e) { // Catch errors thrown by useAiService
      console.error(`Falha ao gerar ${ANALYSIS_METADATA[analysisType]?.name || analysisType} IA:`, e);
      setAiErrorStates(prev => ({ ...prev, [analysisType]: e }));
      setAiAnalyses(prev => ({
        ...prev, 
        [analysisType]: e.message || `Falha ao gerar ${ANALYSIS_METADATA[analysisType]?.name || analysisType}. Tente novamente.`
      }));
    } finally {
      setAiLoadingStates(prev => ({ ...prev, [analysisType]: false }));
    }
  };

  // For backward compatibility with existing component props
  const handleGenerateAiSummary = () => handleGenericAiAnalysis(ANALYSIS_TYPES.EXECUTIVE_SUMMARY);
  const handleGenerateAiVariance = () => handleGenericAiAnalysis(ANALYSIS_TYPES.VARIANCE_ANALYSIS);
  const handleGenerateAiRisk = () => handleGenericAiAnalysis(ANALYSIS_TYPES.RISK_ASSESSMENT);
  const handleGenerateAiCFDeepDive = () => handleGenericAiAnalysis(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS);

  const [isPdfGeneratingInternal, setIsPdfGeneratingInternal] = useState(false);
  const handleGeneratePdf = async () => { 
    setIsPdfGeneratingInternal(true);
    const html2pdfInstance = await onLoadHtml2pdf(); 
    if (!html2pdfInstance) {
      console.error("html2pdf library not loaded for PDF generation.");
      setIsPdfGeneratingInternal(false);
      return;
    }
    if (!calculatedData.length || !reportRef.current) {
      alert("Gere o relatório com dados primeiro."); 
      setIsPdfGeneratingInternal(false);
      return;
    }
    
    const reportElement = reportRef.current;
    
    const sectionsToPrint = [
      { selector: '#aiExecutiveSummarySectionToPrint', content: aiAnalyses[ANALYSIS_TYPES.EXECUTIVE_SUMMARY], error: aiErrorStates[ANALYSIS_TYPES.EXECUTIVE_SUMMARY] },
      { selector: '#aiVarianceAnalysisSectionToPrint', content: aiAnalyses[ANALYSIS_TYPES.VARIANCE_ANALYSIS], error: aiErrorStates[ANALYSIS_TYPES.VARIANCE_ANALYSIS] },
      { selector: '#aiRiskAssessmentSectionToPrint', content: aiAnalyses[ANALYSIS_TYPES.RISK_ASSESSMENT], error: aiErrorStates[ANALYSIS_TYPES.RISK_ASSESSMENT] },
      { selector: '#aiCashFlowDeepDiveSectionToPrint', content: aiAnalyses[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS], error: aiErrorStates[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS] },
    ];
    
    const originalDisplays = [];

    sectionsToPrint.forEach(s => {
      const el = reportElement.querySelector(s.selector);
      if (el) {
        originalDisplays.push({el, display: el.style.display});
        
        const hasErrorInContent = typeof s.content === 'string' && (
          s.content.startsWith("Falha") || 
          s.content.startsWith("Erro:") ||
          s.content.includes("API Key") ||
          s.content.includes("Chave API")
        );
        
        // Only show sections with valid content
        el.style.display = (s.content && !s.error && !hasErrorInContent) ? 'block' : 'none';
      }
    });

    html2pdfInstance().set({
      margin: [0.4, 0.25, 0.4, 0.25], 
      filename: `Relatorio_${companyName.replace(/\s+/g, '_')}_${reportTitle.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 }, 
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        scrollY: -window.scrollY, 
        windowWidth: reportElement.scrollWidth, 
        windowHeight: reportElement.scrollHeight 
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy', 'avoid-all'] } 
    }).from(reportElement).save().then(() => { 
      // Restore original display settings after PDF generation
      originalDisplays.forEach(item => item.el.style.display = item.display);
      setIsPdfGeneratingInternal(false);
    }).catch(err => { 
      console.error("Erro ao gerar PDF:", err);
      // Also restore display settings on error
      originalDisplays.forEach(item => item.el.style.display = item.display);
      setIsPdfGeneratingInternal(false);
      alert(`Erro ao gerar PDF: ${err.message}`);
    });
  };

  // Determine overall AI error to pass to ReportControls if any AI operation failed
  const combinedAiError = Object.values(aiErrorStates).find(e => e) || aiService.error;

  return (
    <>
      <ReportControls
        onGeneratePdf={handleGeneratePdf}
        onGenerateAiSummary={handleGenerateAiSummary}
        onGenerateAiVariance={handleGenerateAiVariance}
        onGenerateAiRisk={handleGenerateAiRisk}
        onGenerateAiCFDeepDive={handleGenerateAiCFDeepDive}
        isPdfLoading={isPdfGeneratingInternal} 
        isAiSummaryLoading={aiLoadingStates[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]}
        isAiVarianceLoading={aiLoadingStates[ANALYSIS_TYPES.VARIANCE_ANALYSIS]}
        isAiRiskLoading={aiLoadingStates[ANALYSIS_TYPES.RISK_ASSESSMENT]}
        isAiCFDeepDiveLoading={aiLoadingStates[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
        html2pdfError={html2pdfError}
        aiError={combinedAiError} 
        canAnalyzeVariances={calculatedData.length >= 2}
      />
      
      {/* Debug info panel - only visible during development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 text-xs border border-gray-300 rounded no-print">
          <h4 className="font-bold">Debug Info (Dev Only)</h4>
          <p>Provider: {aiService?.currentProviderConfig?.name || selectedAiProviderKey}</p>
          <p>API Key Configured: {apiKeys[selectedAiProviderKey] ? 'Yes' : 'No'}</p>
          {combinedAiError && <p className="text-red-600">Last Error: {combinedAiError.message || 'Unknown error'}</p>}
        </div>
      )}
      
      <div ref={reportRef} className="report-container bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        <header className="text-center mb-10 print:mb-6">
          <h2 className="text-3xl font-bold text-blue-700 print:text-2xl">{companyName}</h2>
          <p className="text-xl text-slate-600 print:text-lg">{reportTitle}</p>
          <p className="text-sm text-slate-500 mt-1 print:text-xs">
            Períodos: {calculatedData.length} ({PERIOD_TYPES[periodType]?.label || periodType}) | 
            Gerado em: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        
        {/* Data Validation Alerts */}
        <ValidationAlerts validationResults={validationResults} />
        
        {/* Executive Summary Cards */}
        <ExecutiveSummaryCards calculatedData={calculatedData} companyInfo={companyInfo} />
        
        {/* AI Executive Summary (both for viewing and printing) */}
        <div id="aiExecutiveSummarySectionToPrint">
          <AiSummarySection 
            content={aiAnalyses[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]} 
            isLoading={aiLoadingStates[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]} 
            error={aiErrorStates[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]} 
          />
        </div>
        
        {/* New Specialized Benchmark-Style Components */}
        <WorkingCapitalTimeline calculatedData={calculatedData} periodType={periodType} />
        <FundingReconciliation calculatedData={calculatedData} companyInfo={companyInfo} />
        <BalanceSheetEquation calculatedData={calculatedData} />
        
        {/* Detailed Financial Tables (DRE, BS, CF) */}
        <FinancialTables calculatedData={calculatedData} periodType={periodType} />
        {/* Enhanced Power of One */}
        <PowerOfOneAnalysis calculatedData={calculatedData} periodType={periodType} />
        
        {/* New Waterfall Charts Section */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Gráficos Waterfall de P&L e Fluxo de Caixa</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PnlWaterfallChart calculatedData={calculatedData} periodType={periodType} />
            <CashFlowWaterfallChart calculatedData={calculatedData} periodType={periodType} />
          </div>
        </section>
        
        {/* General Visual Dashboard Section (can include other charts) */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Painel Visual de Tendências Adicionais</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MarginTrendChart calculatedData={calculatedData} periodType={periodType} />
            <WorkingCapitalDaysTrendChart calculatedData={calculatedData} periodType={periodType} />
          </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CashFlowKeyMetricsTrendChart calculatedData={calculatedData} periodType={periodType} />
            <BalanceSheetDifferenceTrendChart calculatedData={calculatedData} periodType={periodType} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetCompositionChart calculatedData={calculatedData} periodType={periodType} />
            <FundingStructureChart calculatedData={calculatedData} periodType={periodType} />
          </div>
        </section>
        
        {/* AI Variance Analysis (both for viewing and printing) */}
        <div id="aiVarianceAnalysisSectionToPrint">
          <AiVarianceSection 
            content={aiAnalyses[ANALYSIS_TYPES.VARIANCE_ANALYSIS]} 
            isLoading={aiLoadingStates[ANALYSIS_TYPES.VARIANCE_ANALYSIS]} 
            error={aiErrorStates[ANALYSIS_TYPES.VARIANCE_ANALYSIS]} 
          />
        </div>
        
        {/* AI Risk Assessment (both for viewing and printing) */}
        <div id="aiRiskAssessmentSectionToPrint">
          <AiSummarySection
            titleOverride="Avaliação de Riscos (Análise IA) ✨"
            content={aiAnalyses[ANALYSIS_TYPES.RISK_ASSESSMENT]}
            isLoading={aiLoadingStates[ANALYSIS_TYPES.RISK_ASSESSMENT]}
            error={aiErrorStates[ANALYSIS_TYPES.RISK_ASSESSMENT]}
          />
        </div>
        
        {/* AI Cash Flow Deep Dive (both for viewing and printing) */}
        <div id="aiCashFlowDeepDiveSectionToPrint">
          <AiSummarySection
            titleOverride="Análise Aprofundada do Fluxo de Caixa (IA) ✨"
            content={aiAnalyses[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
            isLoading={aiLoadingStates[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
            error={aiErrorStates[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
          />
        </div>
        
        <footer className="mt-12 pt-8 border-t border-slate-300 text-center text-sm text-slate-500 print:mt-6 print:pt-4">
          <p>Relatório gerado por: {companyName} - {reportTitle}</p>
          <p className="no-print">Este é um relatório confidencial. Distribuição restrita.</p>
        </footer>
      </div>
      
      {/* Global styles (ensure these are correctly scoped or moved to a global CSS file) */}
      <style jsx global>{`
        .report-container { page-break-inside: avoid; }
        .page-break-after { page-break-after: always !important; }
        .no-print { @media print { display: none !important; } }
        
        .btn-primary { @apply px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50; }
        .btn-secondary { @apply px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50; }
        .btn-ai { @apply px-5 py-2.5 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto; }
        .btn-ai-summary { @apply btn-ai bg-sky-500 hover:bg-sky-600 focus:ring-sky-500; }
        .btn-ai-variance { @apply btn-ai bg-teal-500 hover:bg-teal-600 focus:ring-teal-500; }
        .btn-ai-risk { @apply btn-ai bg-amber-500 hover:bg-amber-600 focus:ring-amber-500; }
        .btn-ai-cfdeepdive { @apply btn-ai bg-purple-500 hover:bg-purple-600 focus:ring-purple-500; }
        .btn-pdf { @apply px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-60; }
        .report-section-title { @apply text-xl font-semibold text-slate-800 border-b-2 border-blue-500 pb-1 mb-4 print:text-lg print:pb-0.5 print:mb-2; }
        .ai-section { @apply mb-6 p-4 bg-sky-50 border-l-4 border-sky-500 rounded-md print:mb-4 print:p-3 print:shadow-none print:border-sky-300; }
        .ai-section-title { @apply text-lg font-semibold text-sky-700 mb-2 print:text-base print:mb-1; }
        
        .report-table-styles { @apply min-w-full border-collapse border border-slate-300 print:text-xs; }
        .report-table-styles th, .report-table-styles td { @apply p-1.5 md:p-2 border border-slate-300 text-xs md:text-sm; }
        .report-table-styles th { @apply bg-slate-100 font-semibold text-slate-700 text-left print:bg-slate-50; }
        .report-table-styles .th-sticky { @apply sticky left-0 bg-slate-100 z-20 print:static print:bg-slate-50; }
        .report-table-styles .td-sticky { @apply sticky left-0 bg-white z-10 print:static print:bg-white; } 
        .report-table-styles .th-period { @apply text-center; }
        .report-table-styles .th-variance { @apply text-right; }
        .report-table-styles .td-value { @apply text-right; }
        .report-table-styles .td-variance-val { @apply text-right; }
        .report-table-styles .td-variance-pct { @apply text-right; }
        .prose { max-width: none; } 
        .prose ul { margin-left: 1.25rem; list-style-type: disc;}
        .prose li { margin-bottom: 0.25rem; }
        .prose p { margin-bottom: 0.5rem; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </>
  );
}