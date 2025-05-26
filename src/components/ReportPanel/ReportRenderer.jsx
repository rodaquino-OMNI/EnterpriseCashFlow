// src/components/ReportPanel/ReportRenderer.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react'; // Added useMemo
import ReportControls from './ReportControls';
import ExecutiveSummaryCards from './ExecutiveSummaryCards'; 
import WorkingCapitalTimeline from './Charts/WorkingCapitalTimeline';
import FundingReconciliation from './FundingReconciliation';
import BalanceSheetEquation from './BalanceSheetEquation';
import PowerOfOneAnalysis from './PowerOfOneAnalysis'; 
import FinancialTables from './FinancialTables'; 
import AiAnalysisSection from '../AIPanel/AiAnalysisSection'; // Your unified component

// Chart Imports
import MarginTrendChart from '../Charts/MarginTrendChart';
import PnlWaterfallChart from './Charts/PnlWaterfallChart';
import WorkingCapitalDaysTrendChart from '../Charts/WorkingCapitalDaysTrendChart';
import CashFlowWaterfallChart from './Charts/CashFlowWaterfallChart'; 
import CashFlowKeyMetricsTrendChart from '../Charts/CashFlowKeyMetricsTrendChart';
import AssetCompositionChart from '../Charts/AssetCompositionChart';
import FundingStructureChart from '../Charts/FundingStructureChart';
import BalanceSheetDifferenceTrendChart from '../Charts/BalanceSheetDifferenceTrendChart';
import KpiCards from './KpiCards';

import { PERIOD_TYPES } from '../../utils/constants';
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from '../../utils/aiAnalysisTypes';
import { runAllValidations, ValidationAlerts } from '../../utils/dataValidation';
import { formatCurrency, formatDays } from '../../utils/formatters';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * companyInfo: import('../../types/financial').CompanyInfo;
 * onLoadHtml2pdf: () => Promise<any | null>;
 * html2pdfError: Error | null;
 * aiAnalysisManager: ReturnType<typeof import('../../hooks/useAiAnalysis').useAiAnalysis>;
 * }} props
 */
export default function ReportRenderer({ 
  calculatedData, 
  companyInfo, 
  onLoadHtml2pdf, 
  html2pdfError,
  aiAnalysisManager // This now comes from ReportGeneratorApp
}) {
  const reportRef = useRef(null);
  const { periodType } = companyInfo;
  const financialDataBundle = { calculatedData, companyInfo };
  
  // Perform data validation using useMemo to avoid re-calculating on every render
  const validationResults = useMemo(() => {
    if (calculatedData && calculatedData.length > 0) {
      return runAllValidations(calculatedData);
    }
    return null;
  }, [calculatedData]);

  // Destructure from aiAnalysisManager
  const { analyses, isLoading: isAiAnalysisTypeLoading, errors: aiAnalysisErrors, performAnalysis } = aiAnalysisManager;

  // For PDF generation, we still need to know which content is available
  const getAiContentForPdf = (analysisType) => {
    const content = analyses[analysisType];
    const error = aiAnalysisErrors[analysisType];
    const isLoading = isAiAnalysisTypeLoading(analysisType);

    if (isLoading || error || !content) return null;
    if (typeof content === 'string' && (content.toLowerCase().includes("erro:") || content.toLowerCase().includes("falha"))) return null;
    return content;
  }

  const [isPdfGeneratingInternal, setIsPdfGeneratingInternal] = useState(false);
  const handleGeneratePdf = async () => { 
    setIsPdfGeneratingInternal(true);
    // Initialize originalDisplays array at the beginning of the function
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

      const opt = { /* ... PDF options as before ... */ };
      await html2pdfInstance().set(opt).from(reportElement).save();
      originalDisplays.forEach(state => { state.element.style.display = state.display; });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error); alert(`Erro ao gerar PDF: ${error.message}`);
      // Restore display state on error
      const reportElement = reportRef.current;
      if (reportElement && originalDisplays && originalDisplays.length > 0) {
         originalDisplays.forEach(state => { if (state.element) state.element.style.display = state.display; });
      }
    } finally {
      setIsPdfGeneratingInternal(false);
    }
  };
  
  // Debug render count
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    // console.log(`[ReportRenderer] Component rendered ${renderCount.current} times`);
    // console.log('[ReportRenderer] Received analyses:', analyses);
    // console.log('[ReportRenderer] Received errors:', aiAnalysisErrors);
  });

  // Enhanced Debug Section Component
  const DebugSection = () => {
    const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    if (!isDevelopment || !calculatedData || calculatedData.length === 0) return null;
    const latestPeriod = calculatedData[calculatedData.length - 1];
    if (!latestPeriod) return null;
    
    return (
      <section className="mb-8 p-6 bg-yellow-100 border-2 border-yellow-400 rounded-lg no-print text-xs">
        <h3 className="text-md font-bold text-yellow-800 mb-3">
          🔧 Debug Mode - Detalhes do Cálculo (Último Período)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Componentes do Balanço</h4>
            <div className="space-y-0.5">
              <div>Total Ativos (Final): {formatCurrency(latestPeriod.estimatedTotalAssets)}</div>
              <div>Total Passivos (Final): {formatCurrency(latestPeriod.estimatedTotalLiabilities)}</div>
              <div>Patrimônio Líquido (Final): {formatCurrency(latestPeriod.equity)}</div>
              <div className="font-bold border-t border-slate-200 pt-1 mt-1">Diferença Balanço: {formatCurrency(latestPeriod.balanceSheetDifference)}</div>
              <div className="text-slate-500">Checagem: {formatCurrency(latestPeriod.estimatedTotalAssets - (latestPeriod.estimatedTotalLiabilities + latestPeriod.equity))}</div>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Prazos de Capital de Giro (Derivados)</h4>
            <div className="space-y-0.5">
              <div>PMR: {formatDays(latestPeriod.arDaysDerived)} (Valor CR Médio: {formatCurrency(latestPeriod.accountsReceivableValueAvg)})</div>
              <div>PME: {formatDays(latestPeriod.inventoryDaysDerived)} (Valor Estq. Médio: {formatCurrency(latestPeriod.inventoryValueAvg)})</div>
              <div>PMP: {formatDays(latestPeriod.apDaysDerived)} (Valor CP Médio: {formatCurrency(latestPeriod.accountsPayableValueAvg)})</div>
              <div className="font-bold border-t border-slate-200 pt-1 mt-1">Ciclo de Caixa: {formatDays(latestPeriod.wcDays)}</div>
              <div className="text-slate-500">Checagem Ciclo: {formatDays(latestPeriod.arDaysDerived + latestPeriod.inventoryDaysDerived - latestPeriod.apDaysDerived)}</div>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-1.5 text-sm">Lógica do Fluxo de Caixa</h4>
            <div className="space-y-0.5">
              <div>FCO: {formatCurrency(latestPeriod.operatingCashFlow)}</div>
              <div>Variação CG: {formatCurrency(latestPeriod.workingCapitalChange)}</div>
              <div>CAPEX: {formatCurrency(latestPeriod.capitalExpenditures)}</div>
              <div className="font-bold border-t border-slate-200 pt-1 mt-1">FCL (antes Fin.): {formatCurrency(latestPeriod.netCashFlowBeforeFinancing)}</div>
              <div className="font-bold text-red-600">Necessidade(+)/Exc.(-): {formatCurrency(latestPeriod.fundingGapOrSurplus)}</div>
              <div className="text-slate-500">Checagem (Gap = -FCL): {formatCurrency(-latestPeriod.netCashFlowBeforeFinancing)}</div>
            </div>
          </div>
        </div>
      </section>
    );
  };

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

      <div ref={reportRef} className="report-container bg-white min-h-screen">
        <header className="text-center mb-10 print:mb-6 no-print">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">
            {companyInfo.reportTitle || `Relatório Financeiro - ${companyInfo.name}`}
          </h1>
          <p className="text-slate-600">
            Análise de {calculatedData.length} período(s) • {PERIOD_TYPES[periodType]?.label || periodType}
          </p>
        </header>

        <ValidationAlerts validationResults={validationResults} />
        <ExecutiveSummaryCards calculatedData={calculatedData} companyInfo={companyInfo} />
        
        <div id="aiExecutiveSummarySectionToPrint" className="print-only-ai-section">
           <AiAnalysisSection 
             title={ANALYSIS_METADATA[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]?.name || "Resumo Executivo IA"} 
             content={analyses[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]}
             isLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.EXECUTIVE_SUMMARY)}
             error={aiAnalysisErrors[ANALYSIS_TYPES.EXECUTIVE_SUMMARY]}
             onRetry={() => performAnalysis(ANALYSIS_TYPES.EXECUTIVE_SUMMARY, financialDataBundle)}
             analysisTypeForRetry={ANALYSIS_TYPES.EXECUTIVE_SUMMARY}
            />
        </div>

        {/* KPI Cards Section */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Indicadores Chave de Performance</h3>
          <KpiCards calculatedData={calculatedData} />
        </section>

        {/* Balance Sheet Components */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Estrutura Patrimonial</h3>
          <BalanceSheetEquation calculatedData={calculatedData} />
        </section>

        {/* Working Capital Timeline */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Evolução do Capital de Giro</h3>
          <WorkingCapitalTimeline calculatedData={calculatedData} periodType={periodType} />
        </section>

        {/* Charts Grid */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Análise Gráfica</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MarginTrendChart calculatedData={calculatedData} periodType={periodType} />
            <CashFlowKeyMetricsTrendChart calculatedData={calculatedData} periodType={periodType} />
            <AssetCompositionChart calculatedData={calculatedData} periodType={periodType} />
            <FundingStructureChart calculatedData={calculatedData} periodType={periodType} />
            <WorkingCapitalDaysTrendChart calculatedData={calculatedData} periodType={periodType} />
            <BalanceSheetDifferenceTrendChart calculatedData={calculatedData} periodType={periodType} />
          </div>
        </section>

        {/* Waterfall Charts */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Análise Waterfall</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PnlWaterfallChart calculatedData={calculatedData} periodType={periodType} />
            <CashFlowWaterfallChart calculatedData={calculatedData} periodType={periodType} />
          </div>
        </section>

        {/* Financial Tables */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Demonstrações Financeiras</h3>
          <FinancialTables calculatedData={calculatedData} periodType={periodType} />
        </section>

        {/* Power of One Analysis */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Análise Power of One</h3>
          <PowerOfOneAnalysis calculatedData={calculatedData} periodType={periodType} />
        </section>

        {/* Funding Reconciliation */}
        <section className="mb-8 page-break-after">
          <h3 className="report-section-title">Reconciliação de Financiamentos</h3>
          <FundingReconciliation calculatedData={calculatedData} />
        </section>

        {/* AI Analysis Sections */}
        <div id="aiVarianceAnalysisSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.VARIANCE_ANALYSIS]?.name || "Análise de Variações IA"}
            content={analyses[ANALYSIS_TYPES.VARIANCE_ANALYSIS]}
            isLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.VARIANCE_ANALYSIS)}
            error={aiAnalysisErrors[ANALYSIS_TYPES.VARIANCE_ANALYSIS]}
            onRetry={() => performAnalysis(ANALYSIS_TYPES.VARIANCE_ANALYSIS, financialDataBundle)}
            analysisTypeForRetry={ANALYSIS_TYPES.VARIANCE_ANALYSIS}
          />
        </div>

        <div id="aiRiskAssessmentSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.RISK_ASSESSMENT]?.name || "Avaliação de Riscos IA"}
            content={analyses[ANALYSIS_TYPES.RISK_ASSESSMENT]}
            isLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.RISK_ASSESSMENT)}
            error={aiAnalysisErrors[ANALYSIS_TYPES.RISK_ASSESSMENT]}
            onRetry={() => performAnalysis(ANALYSIS_TYPES.RISK_ASSESSMENT, financialDataBundle)}
            analysisTypeForRetry={ANALYSIS_TYPES.RISK_ASSESSMENT}
          />
        </div>

        <div id="aiCashFlowDeepDiveSectionToPrint" className="print-only-ai-section">
         <AiAnalysisSection 
            title={ANALYSIS_METADATA[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]?.name || "Análise Profunda de Fluxo de Caixa IA"}
            content={analyses[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
            isLoading={isAiAnalysisTypeLoading(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS)}
            error={aiAnalysisErrors[ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]}
            onRetry={() => performAnalysis(ANALYSIS_TYPES.CASH_FLOW_ANALYSIS, financialDataBundle)}
            analysisTypeForRetry={ANALYSIS_TYPES.CASH_FLOW_ANALYSIS}
          />
        </div>

        {process.env.NODE_ENV === 'development' && <DebugSection />}

        <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500">
          <p>Relatório gerado automaticamente • {new Date().toLocaleDateString('pt-BR')}</p>
        </footer>
      </div>
      <style>{`/* Add any custom styles here if needed */`}</style>
    </>
  );
}