// src/components/ReportPanel/ReportRenderer.jsx
import React, { useRef, useState, useMemo, useCallback } from 'react'; // Removed unused useEffect
import ReportControls from './ReportControls';
import ExecutiveSummaryCards from './ExecutiveSummaryCards'; 

// New/Enhanced Benchmark-Style Components
import WorkingCapitalTimeline from './Charts/WorkingCapitalTimeline'; // Fixed import name
import FundingReconciliation from './FundingReconciliation';
import BalanceSheetEquation from './BalanceSheetEquation';
import PowerOfOneAnalysis from './PowerOfOneAnalysis'; 
import FinancialTables from './FinancialTables'; 
import AiAnalysisSection from '../AIPanel/AiAnalysisSection';

// Chart Imports - Updated with new components
import MarginTrendChart from '../Charts/MarginTrendChart';
import ProfitWaterfallChart from './Charts/ProfitWaterfallChart'; // NEW waterfall chart
import CashFlowWaterfallChart from './Charts/CashFlowWaterfallChart';
import WorkingCapitalDaysTrendChart from '../Charts/WorkingCapitalDaysTrendChart';
import CashFlowKeyMetricsTrendChart from '../Charts/CashFlowKeyMetricsTrendChart';
import AssetCompositionChart from '../Charts/AssetCompositionChart';
import FundingStructureChart from './Charts/FundingStructureChart'; // Using new version from ReportPanel folder
import BalanceSheetDifferenceTrendChart from '../Charts/BalanceSheetDifferenceTrendChart';

import { PERIOD_TYPES } from '../../utils/constants';
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from '../../utils/aiAnalysisTypes';
// Import VALIDATION utilities - Updated to use new ValidationAlerts structure
import { ValidationAlerts } from '../../utils/dataValidation';
// Import formatters for Debug section
import { formatCurrency, formatDays } from '../../utils/formatters'; 
// Import enhanced DataConsistencyMonitor for SSOT validation with tabs
import DataConsistencyMonitor from '../Debug/DataConsistencyMonitor';

export default function ReportRenderer({ 
  calculatedData, 
  companyInfo, 
  onLoadHtml2pdf, 
  html2pdfError,
  aiAnalysisManager, 
  scenarioSettings 
}) {
  const reportRef = useRef(null);
  const { name: companyName, reportTitle, periodType } = companyInfo;
  
  // Memoize financialDataBundle to prevent unnecessary re-renders
  const financialDataBundle = useMemo(() => ({ 
    calculatedData, 
    companyInfo 
  }), [calculatedData, companyInfo]);
  
  // Optimize validation results aggregation with dependency array
  const aggregatedValidationResults = useMemo(() => {
    if (!calculatedData?.length) return null;
    
    const allErrors = [];
    const allWarnings = [];
    const allInfos = [];
    const allSuccesses = [];
    
    // Process in batches to avoid blocking the main thread
    calculatedData.forEach((period, index) => {
      if (period.validationResults) {
        const periodLabel = `Período ${index + 1}`;
        const source = 'FinancialCalculationEngine';
        
        allErrors.push(...(period.validationResults.errors || []).map(e => ({...e, periodLabel, source})));
        allWarnings.push(...(period.validationResults.warnings || []).map(w => ({...w, periodLabel, source})));
        allInfos.push(...(period.validationResults.infos || []).map(i => ({...i, periodLabel, source})));
        allSuccesses.push(...(period.validationResults.successes || []).map(s => ({...s, periodLabel, source})));
      }
    });
    
    return { 
      isValidOverall: allErrors.length === 0, 
      errors: allErrors, 
      warnings: allWarnings, 
      infos: allInfos, 
      successes: allSuccesses 
    };
  }, [calculatedData]); // Simplified dependency

  // Optimize debug diagnosis with lighter calculation
  const debugLatestPeriodDiagnosis = useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || !calculatedData?.length) {
      return null;
    }
    // Only run diagnosis for the latest period to reduce computation
    return { 
      hasData: true, 
      periodCount: calculatedData.length,
      latestPeriodIndex: calculatedData.length - 1
    };
  }, [calculatedData]);
  
  // Destructure what's needed from aiAnalysisManager
  const { analyses, isLoading: isAiAnalysisTypeLoading, errors: aiAnalysisErrors, performAnalysis } = aiAnalysisManager;
  const [isPdfGeneratingInternal, setIsPdfGeneratingInternal] = useState(false);
  
  const handleGeneratePdf = async () => {
    setIsPdfGeneratingInternal(true);
    let originalDisplays = [];
    
    try {
      const html2pdfInstance = await onLoadHtml2pdf();
      if (!html2pdfInstance) { setIsPdfGeneratingInternal(false); return; }
      if (!calculatedData.length || !reportRef.current) { alert("Gere dados primeiro."); setIsPdfGeneratingInternal(false); return; }
      
      const reportElement = reportRef.current;
      const aiSectionsToPrintConfig = [
        { selector: '#aiExecutiveSummarySectionToPrint', content: getAiContentForPdf(ANALYSIS_TYPES.EXECUTIVE_SUMMARY) },
        { selector: '#aiVarianceAnalysisSectionToPrint', content: getAiContentForPdf(ANALYSIS_TYPES.VARIANCE_ANALYSIS) },
        { selector: '#aiRiskAssessmentSectionToPrint', content: getAiContentForPdf(ANALYSIS_TYPES.RISK_ASSESSMENT) },
        { selector: '#aiCashFlowDeepDiveSectionToPrint', content: getAiContentForPdf(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS) }
      ];
      
      aiSectionsToPrintConfig.forEach(section => {
        const el = reportElement.querySelector(section.selector);
        if (!el) return;
        originalDisplays.push({ element: el, display: el.style.display });
        el.style.display = section.content ? 'block' : 'none';
      });
      
      const opt = {
        margin: [8, 6, 8, 6],
        filename: `${companyName || 'Relatorio'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdfInstance().set(opt).from(reportElement).save();
      originalDisplays.forEach(state => { state.element.style.display = state.display; });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error); 
      alert(`Erro ao gerar PDF: ${error.message}`);
      if (reportRef.current && originalDisplays && originalDisplays.length > 0) {
         originalDisplays.forEach(state => { if (state.element) state.element.style.display = state.display; });
      }
    } finally {
      setIsPdfGeneratingInternal(false);
    }
  };
  
  // For PDF generation, check if AI content is available
  const getAiContentForPdf = (analysisType) => {
    const content = analyses[analysisType];
    const error = aiAnalysisErrors[analysisType];
    const isLoading = isAiAnalysisTypeLoading(analysisType);
    if (isLoading || error || !content) return null;
    if (typeof content === 'string' && (content.toLowerCase().includes("erro:") || content.toLowerCase().includes("falha"))) return null;
    return content;
  };
  
  // Debug Section Sub-Component
  const DebugSection = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment || !calculatedData?.length) {
      return null;
    }
    
    const latestPeriod = calculatedData[calculatedData.length - 1];
    if (!latestPeriod) return null;

    return (
      <section className="mb-8 p-4 md:p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg no-print text-xs">
        <h3 className="text-md font-bold text-yellow-800 mb-3">
          🔧 Debug Mode - Detalhes do Cálculo (Último Período)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Componentes do Balanço</h4>
            <div className="space-y-0.5">
              <div>Total Ativos (Final): {formatCurrency(latestPeriod.estimatedTotalAssets, true, { abbreviate: true })}</div>
              <div>Total Passivos (Final): {formatCurrency(latestPeriod.estimatedTotalLiabilities, true, { abbreviate: true })}</div>
              <div>Patrimônio Líquido (Final): {formatCurrency(latestPeriod.equity, true, { abbreviate: true })}</div>
              <div className="font-bold border-t border-slate-200 pt-1 mt-1">Diferença Balanço: {formatCurrency(latestPeriod.balanceSheetDifference, true, { abbreviate: true })}</div>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Prazos de Capital de Giro</h4>
            <div className="space-y-0.5">
              <div>PMR: {formatDays(latestPeriod.arDaysDerived)}</div>
              <div>PME: {formatDays(latestPeriod.inventoryDaysDerived)}</div>
              <div>PMP: {formatDays(latestPeriod.apDaysDerived)}</div>
              <div className="font-bold border-t border-slate-200 pt-1 mt-1">Ciclo de Caixa: {formatDays(latestPeriod.wcDays)}</div>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Fluxo de Caixa</h4>
            <div className="space-y-0.5">
              <div>FCO: {formatCurrency(latestPeriod.operatingCashFlow, true, { abbreviate: true })}</div>
              <div>FCL: {formatCurrency(latestPeriod.netCashFlowBeforeFinancing, true, { abbreviate: true })}</div>
              <div className="font-bold text-red-600">Gap/Surplus: {formatCurrency(latestPeriod.fundingGapOrSurplus, true, { abbreviate: true })}</div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Memoize AI section props to prevent unnecessary re-renders
  const getAiSectionProps = useCallback((analysisType) => ({
    content: analyses[analysisType],
    isLoading: isAiAnalysisTypeLoading(analysisType),
    error: aiAnalysisErrors[analysisType],
    onRetry: () => performAnalysis(analysisType, financialDataBundle),
    analysisTypeForRetry: analysisType
  }), [analyses, isAiAnalysisTypeLoading, aiAnalysisErrors, performAnalysis, financialDataBundle]);

  return (
    <>
      <ReportControls
        onGeneratePdf={handleGeneratePdf}
        onGenerateAiSummary={() => performAnalysis(ANALYSIS_TYPES.EXECUTIVE_SUMMARY, financialDataBundle)}
        onGenerateAiVariance={() => performAnalysis(ANALYSIS_TYPES.VARIANCE_ANALYSIS, financialDataBundle)}
        onGenerateAiRisk={() => performAnalysis(ANALYSIS_TYPES.RISK_ASSESSMENT, financialDataBundle)}
        onGenerateAiCFDeepDive={() => performAnalysis(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS, financialDataBundle)}
        isPdfLoading={isPdfGeneratingInternal} 
        isAiSummaryLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.EXECUTIVE_SUMMARY)}
        isAiVarianceLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.VARIANCE_ANALYSIS)}
        isAiRiskLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.RISK_ASSESSMENT)}
        isAiCFDeepDiveLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS)}
        html2pdfError={html2pdfError}
        aiError={Object.values(aiAnalysisErrors).find(e => e) || null} 
        canAnalyzeVariances={calculatedData.length >= 2}
      />
      <div ref={reportRef} className="report-container bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-slate-200 w-full max-w-full print:shadow-none print:border-none print:p-0">
        {/* PDF Cover Page (Print Only) */}
        <div className="page-break-after print:block hidden"> 
             <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '270mm' }}>
                <h1 className="text-4xl font-bold text-blue-700 mb-3 print:text-3xl">{companyName}</h1>
                <h2 className="text-2xl text-slate-700 mb-6 print:text-xl">{reportTitle}</h2>
                <p className="text-lg text-slate-500 print:text-base">Períodos: {calculatedData.length} ({PERIOD_TYPES[periodType]?.label || periodType})</p>
                <p className="text-md text-slate-500 mt-2 print:text-sm">Gerado em: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
        
        <header className="text-center mb-10 print:mb-6 no-print"> 
          <h2 className="text-3xl font-bold text-blue-700 print:text-2xl">{companyName}</h2>
          <p className="text-xl text-slate-600 print:text-lg">{reportTitle}</p>
          <p className="text-sm text-slate-500 mt-1 print:text-xs">
            Períodos: {calculatedData.length} ({PERIOD_TYPES[periodType]?.label || periodType}) | 
            Gerado em: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Render Validation Alerts */}
        <ValidationAlerts validationResults={aggregatedValidationResults} />

        {/* Data Consistency Monitor for Development - ENABLED for this check */}
        <DataConsistencyMonitor calculatedData={calculatedData} detailedDiagnosis={debugLatestPeriodDiagnosis} enabled={true} />

        {/* Scenario Analysis Results - Display if any scenario is enabled */}
        {Object.values(scenarioSettings || {}).some(s => s?.enabled) && calculatedData.length > 0 && (
            <section className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg no-print">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Análise de Cenários</h3>
              <p className="text-sm text-blue-600">Cenários habilitados detectados - funcionalidade em desenvolvimento</p>
            </section>
        )}

        <div className="executive-summary-container page-break-after">
            <ExecutiveSummaryCards calculatedData={calculatedData} companyInfo={companyInfo} />
            <div id="aiExecutiveSummarySectionToPrint" className="print-only-ai-section mt-6">
               <AiAnalysisSection 
                 title={ANALYSIS_METADATA[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]?.name || "Resumo Executivo IA"} 
                 {...getAiSectionProps(ANALYSIS_TYPES.EXECUTIVE_SUMMARY)} 
                />
            </div>
        </div>
        
        {/* Add the Working Capital Timeline right after Executive Summary */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Timeline Capital de Giro</h3>
          <div className="chart-container-wrapper">
            <WorkingCapitalTimeline calculatedData={calculatedData} periodType={companyInfo.periodType} />
          </div>
        </section>

        {/* Enhanced Benchmark-Style Visuals - Updated components */}
        <FundingReconciliation calculatedData={calculatedData} companyInfo={companyInfo} />
        <BalanceSheetEquation calculatedData={calculatedData} />
        <FinancialTables calculatedData={calculatedData} periodType={companyInfo.periodType} />
        <PowerOfOneAnalysis calculatedData={calculatedData} periodType={companyInfo.periodType} />
        
        {/* Detailed Visual Dashboards - With updated components */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Painel Visual de Detalhes e Tendências</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="chart-container-wrapper avoid-break"><ProfitWaterfallChart calculatedData={calculatedData} periodType={periodType} /></div>
            <div className="chart-container-wrapper avoid-break"><MarginTrendChart calculatedData={calculatedData} periodType={periodType} /></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="chart-container-wrapper avoid-break"><CashFlowWaterfallChart calculatedData={calculatedData} periodType={periodType} /></div>
            <div className="chart-container-wrapper avoid-break"><WorkingCapitalDaysTrendChart calculatedData={calculatedData} periodType={periodType} /></div>
          </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="chart-container-wrapper avoid-break"><CashFlowKeyMetricsTrendChart calculatedData={calculatedData} periodType={periodType} /></div>
            <div className="chart-container-wrapper avoid-break"><BalanceSheetDifferenceTrendChart calculatedData={calculatedData} periodType={periodType} /></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="chart-container-wrapper avoid-break"><AssetCompositionChart calculatedData={calculatedData} periodType={periodType} /></div>
            <div className="chart-container-wrapper avoid-break"><FundingStructureChart calculatedData={calculatedData} periodType={periodType} /></div>
          </div>
        </section>
        
        <div id="aiVarianceAnalysisSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.VARIANCE_ANALYSIS]?.name || "Análise de Variações IA"}
            {...getAiSectionProps(ANALYSIS_TYPES.VARIANCE_ANALYSIS)} 
          />
        </div>
        <div id="aiRiskAssessmentSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.RISK_ASSESSMENT]?.name || "Avaliação de Riscos IA"}
            {...getAiSectionProps(ANALYSIS_TYPES.RISK_ASSESSMENT)} 
          />
        </div>
        <div id="aiCashFlowDeepDiveSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]?.name || "Análise Fluxo de Caixa IA"}
            {...getAiSectionProps(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS)} 
          />
        </div>
        
        {/* Render Debug Section if in development mode */}
        <DebugSection /> 

        <footer className="mt-12 pt-8 border-t border-slate-300 text-center text-sm text-slate-500 print:mt-6 print:pt-4">
          <p>Relatório gerado por: {companyName} - {reportTitle}</p>
          <p className="no-print">Este é um relatório confidencial. Distribuição restrita.</p>
        </footer>
      </div>
      <style>{`
        .report-container { 
          page-break-inside: avoid; 
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        .page-break-after { page-break-after: always !important; }
        .page-break-inside-avoid, .avoid-break { page-break-inside: avoid !important; }
        .no-print { @media print { display: none !important; } }
        
        /* Chart container styling */
        .chart-container-wrapper {
          width: 100%;
          height: 100%;
          min-height: 280px;
        }
        
        /* Responsive adjustments for mobile */
        @media screen and (max-width: 768px) {
          .report-section-title {
            font-size: 1.25rem;
          }
          
          .financial-value {
            font-size: 0.875rem;
          }
        }
        
        .btn-primary { @apply px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50; }
        .btn-secondary { @apply px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50; }
        .btn-ai { @apply px-5 py-2.5 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto text-sm; }
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
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-size: 9pt !important; }
          @page { size: A4 portrait; margin: 8mm 6mm; }
          .report-container { box-shadow: none !important; border: none !important; }
          .print-only-ai-section.print-visible-block { display: block !important; }
          .executive-summary-container { page-break-after: always !important; }
          .chart-container-wrapper { height: 160mm !important; max-height: 160mm !important; }
           .recharts-wrapper { max-height: 150mm !important; }
           .recharts-text, .recharts-cartesian-axis-tick-value, .recharts-legend-item-text { font-size: 6pt !important; }
        }
      `}</style>
    </>
  );
}