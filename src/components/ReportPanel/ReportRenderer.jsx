// src/components/ReportPanel/ReportRenderer.jsx
import React, { useState, useRef } from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import ReportControls from './ReportControls';
import AiSummarySection from '../AIPanel/AiSummarySection';
import AiVarianceSection from '../AIPanel/AiVarianceSection';
import { AI_PROVIDERS } from '../../utils/aiProviders';
import AIPanel from '../AIPanel/AIPanel';

// Import chart components
import MarginTrendChart from '../Charts/MarginTrendChart';
import PnlVisualChart from '../Charts/PnlVisualChart';
import WorkingCapitalDaysTrendChart from '../Charts/WorkingCapitalDaysTrendChart';
import CashFlowComponentsChart from '../Charts/CashFlowComponentsChart';
import CashFlowKeyMetricsTrendChart from '../Charts/CashFlowKeyMetricsTrendChart';
import AssetCompositionChart from '../Charts/AssetCompositionChart';
import FundingStructureChart from '../Charts/FundingStructureChart';
import BalanceSheetDifferenceTrendChart from '../Charts/BalanceSheetDifferenceTrendChart';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * companyInfo: import('../../types/financial').CompanyInfo;
 * onLoadHtml2pdf: () => Promise<any | null>;
 * html2pdfError: Error | null;
 * aiService: {
 *   callAi: (prompt: string, options?: import('../../utils/aiProviders').AiRequestOptions, currentApiKey?: string) => Promise<string>;
 *   isLoading: boolean;
 *   error: Error | null;
 *   resetError: () => void;
 *   currentProviderConfig: import('../../utils/aiProviders').AiProviderConfig | undefined;
 * };
 * apiKeys: Record<string, string>;
 * }} props
 */
export default function ReportRenderer({ 
  calculatedData, 
  companyInfo, 
  onLoadHtml2pdf, 
  html2pdfError,
  aiService,
  apiKeys
}) {
  const reportRef = useRef(null);
  const [reportViewMode, setReportViewMode] = useState('general'); // 'general', 'detailed', 'ai', 'dashboard'
  const [printingPdf, setPrintingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  
  // AI states
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiVarianceText, setAiVarianceText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingVariance, setIsGeneratingVariance] = useState(false);
  const [currentAiError, setCurrentAiError] = useState(null);

  const { name: companyName, reportTitle, periodType } = companyInfo;
  const periodLabel = PERIOD_TYPES[periodType]?.shortLabel || periodType;
  const selectedProviderKey = aiService.currentProviderConfig ? 
    Object.keys(AI_PROVIDERS).find(key => AI_PROVIDERS[key].name === aiService.currentProviderConfig.name) : null;

  const generatePeriodHeaders = (withTrend = true) => {
    // Generate header cells for periods and trend if needed
    return (
      <>
        {calculatedData.map((_, idx) => (
          <th key={`period-${idx}`} className="border p-2 text-center whitespace-nowrap bg-blue-50">
            P{idx + 1} ({periodLabel})
          </th>
        ))}
        {withTrend && calculatedData.length > 1 && (
          <th className="border p-2 text-center whitespace-nowrap bg-blue-100">
            Tendência
          </th>
        )}
      </>
    );
  };

  // Handle generating AI summary
  const handleGenerateAiSummary = async () => {
    aiService.resetError(); // Reset general AI service error
    setCurrentAiError(null);
    setAiSummaryText('');
    if (!calculatedData.length) {
      setAiSummaryText("Gere o relatório com dados primeiro para obter o resumo IA.");
      return;
    }
    setIsGeneratingSummary(true);
    setReportViewMode('ai'); // Switch to AI view mode

    let dataSummaryForPrompt = calculatedData.map((p, i) => `
Período ${i + 1} (${PERIOD_TYPES[periodType]?.shortLabel || periodType}):
  - Receita: ${formatCurrency(p.revenue)}
  - Lucro Líquido: ${formatCurrency(p.netProfit)} (Margem: ${formatPercentage(p.netProfitPct)})
  - Fluxo de Caixa Operacional: ${formatCurrency(p.operatingCashFlow)}
  - Investimento em Capital de Giro: ${formatCurrency(p.workingCapitalChange)} (${p.workingCapitalChange > 0 ? "Uso de Caixa" : "Geração de Caixa"})
  - CAPEX: ${formatCurrency(p.capitalExpenditures)}
  - Fluxo de Caixa Livre (antes Fin.): ${formatCurrency(p.netCashFlowBeforeFinancing)}
  - Saldo Final de Caixa (Calculado): ${formatCurrency(p.closingCash)}
  - Diferença de Balanço: ${formatCurrency(p.balanceSheetDifference)}`
    ).join('\n');

    const prompt = `Você é um consultor financeiro experiente. Analise os seguintes dados financeiros para a empresa ${companyName} (${reportTitle}) abrangendo ${calculatedData.length} períodos.
    Dados por período:
    ${dataSummaryForPrompt}

Escreva um resumo executivo conciso (3-5 parágrafos) em português do Brasil. Destaque as principais tendências observadas ao longo dos períodos, pontos positivos, áreas de atenção (especialmente se a "Diferença de Balanço" for significativa, e a natureza do "Funding Gap/Surplus") e implicações para a empresa. Use um tom profissional e direto. Se a diferença de balanço for relevante, sugira que os inputs sejam revisados para maior precisão.`;

    try {
      const summary = await aiService.callAi(prompt, {}, apiKeys[selectedProviderKey]);
      setAiSummaryText(summary);
    } catch (e) {
      console.error("Falha ao gerar Resumo IA:", e);
      setCurrentAiError(e); // Set local error for this action
      setAiSummaryText(e.message || "Falha ao gerar resumo IA. Tente novamente.");
    }
    setIsGeneratingSummary(false);
  };

  // Handle generating AI variance analysis
  const handleGenerateAiVariance = async () => {
    aiService.resetError();
    setCurrentAiError(null);
    setAiVarianceText('');
    if (calculatedData.length < 2) {
      setAiVarianceText("Análise de variações requer pelo menos 2 períodos de dados.");
      return;
    }
    setIsGeneratingVariance(true);
    setReportViewMode('ai'); // Switch to AI view mode

    let varianceSummaryForPrompt = "";
    for (let i = 1; i < calculatedData.length; i++) {
      const cp = calculatedData[i];
      const pp = calculatedData[i-1];
      varianceSummaryForPrompt += `

Comparação Período ${i+1} (${PERIOD_TYPES[periodType]?.shortLabel || periodType}) vs Período ${i}:

  - Variação Receita: ${formatCurrency(cp.revenue - pp.revenue, false)} (${formatPercentage(pp.revenue ? ((cp.revenue - pp.revenue)/pp.revenue)*100 : null)})

  - Variação Lucro Líquido: ${formatCurrency(cp.netProfit - pp.netProfit, false)}

  - Variação Saldo Final de Caixa: ${formatCurrency(cp.closingCash - pp.closingCash, false)}

  - Variação Fluxo de Caixa Livre (antes Fin.): ${formatCurrency(cp.netCashFlowBeforeFinancing - pp.netCashFlowBeforeFinancing, false)}
    `;
    }

    const prompt = `Você é um analista financeiro sênior. Para ${companyName} (${reportTitle}), analise as variações financeiras entre períodos consecutivos:
    ${varianceSummaryForPrompt}
    Forneça 3-4 insights chave sobre tendências e variações, possíveis causas (positivas ou negativas) e sugira 2-3 perguntas que o conselho deveria fazer para entender melhor o desempenho. Apresente em português do Brasil, em formato de lista (bullet points).`;

    try {
      const analysis = await aiService.callAi(prompt, {}, apiKeys[selectedProviderKey]);
      setAiVarianceText(analysis);
    } catch (e) {
      console.error("Falha ao gerar Análise de Variações IA:", e);
      setCurrentAiError(e);
      setAiVarianceText(e.message || "Falha ao gerar análise de variações IA. Tente novamente.");
    }
    setIsGeneratingVariance(false);
  };

  // Handle export PDF
  const handleExportPdf = async () => {
    setPrintingPdf(true);
    setPdfError(null);
    try {
      const html2pdf = await onLoadHtml2pdf();
      if (!html2pdf) {
        throw new Error('Biblioteca html2pdf não pôde ser carregada.');
      }
      
      // Set view mode to 'detailed' for export to ensure all content is included
      const previousViewMode = reportViewMode;
      setReportViewMode('detailed');
      
      setTimeout(() => {
        // Allow time for React to update the DOM with detailed view
        const element = reportRef.current;
        if (!element) {
          throw new Error('Elemento do relatório não encontrado.');
          setPrintingPdf(false);
          return;
        }
        
        // Include AI sections if they have content
        const aiSummaryEl = element.querySelector('#aiExecutiveSummarySectionToPrint');
        const aiVarianceEl = element.querySelector('#aiVarianceAnalysisSectionToPrint');

        const originalDisplaySummary = aiSummaryEl ? aiSummaryEl.style.display : '';
        const originalDisplayVariance = aiVarianceEl ? aiVarianceEl.style.display : '';

        // Show AI sections in PDF if they have content
        if (aiSummaryEl && aiSummaryText && !aiSummaryText.startsWith("Falha") && !aiSummaryText.startsWith("Erro:")) {
          aiSummaryEl.style.display = 'block';
        } else if (aiSummaryEl) {
          aiSummaryEl.style.display = 'none';
        }
        
        if (aiVarianceEl && aiVarianceText && !aiVarianceText.startsWith("Falha") && !aiVarianceText.startsWith("Erro:")) {
          aiVarianceEl.style.display = 'block';
        } else if (aiVarianceEl) {
          aiVarianceEl.style.display = 'none';
        }
        
        // Apply PDF export specific styling
        document.body.classList.add('printing');
        
        // Configure html2pdf options
        const opt = {
          margin: 10,
          filename: `${companyName.replace(/\s+/g, '_')}_Relatorio_Financeiro.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, // Better quality
            useCORS: true,
            scrollY: -window.scrollY, // Important to avoid scrolling issues
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        html2pdf()
          .from(element)
          .set(opt)
          .save()
          .then(() => {
            document.body.classList.remove('printing');
            setReportViewMode(previousViewMode);
            
            // Restore original display settings
            if (aiSummaryEl) aiSummaryEl.style.display = originalDisplaySummary;
            if (aiVarianceEl) aiVarianceEl.style.display = originalDisplayVariance;
            
            setPrintingPdf(false);
          })
          .catch(error => {
            console.error('Erro na geração do PDF:', error);
            setPdfError(error);
            document.body.classList.remove('printing');
            setReportViewMode(previousViewMode);
            
            // Restore original display settings
            if (aiSummaryEl) aiSummaryEl.style.display = originalDisplaySummary;
            if (aiVarianceEl) aiVarianceEl.style.display = originalDisplayVariance;
            
            setPrintingPdf(false);
          });
      }, 150); // Increased timeout for DOM update
      
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      setPdfError(error);
      setPrintingPdf(false);
    }
  };

  // Translate field key to Portuguese display label
  const getColumnLabel = (key) => {
    switch(key) {
      case 'revenue': return 'Receita';
      case 'cogs': return 'Custo de Vendas';
      case 'grossProfit': return 'Lucro Bruto';
      case 'gmPct': return 'Margem Bruta (%)';
      case 'operatingExpenses': return 'Despesas Operacionais';
      case 'ebitda': return 'EBITDA';
      case 'depreciationAndAmortisation': return 'Depreciação e Amortização';
      case 'ebit': return 'EBIT (Res. Operacional)';
      case 'netInterestExpenseIncome': return 'Despesas/Receitas Financeiras';
      case 'extraordinaryItems': return 'Itens Extraordinários';
      case 'pbt': return 'Lucro Antes dos Impostos';
      case 'incomeTax': return 'Impostos s/ Lucro';
      case 'netProfit': return 'Lucro Líquido';
      case 'netProfitPct': return 'Margem Líquida (%)';
      // Balance Sheet
      case 'openingCash': return 'Saldo Inicial de Caixa';
      case 'closingCash': return 'Saldo Final de Caixa';
      case 'accountsReceivableValueAvg': return 'Contas a Receber';
      case 'inventoryValueAvg': return 'Estoque';
      case 'accountsPayableValueAvg': return 'Contas a Pagar';
      case 'workingCapitalValue': return 'Capital de Giro';
      case 'workingCapitalChange': return 'Variação do Capital de Giro';
      case 'netFixedAssets': return 'Ativo Imobilizado';
      case 'totalBankLoans': return 'Empréstimos Bancários';
      case 'equity': return 'Patrimônio Líquido';
      // Cash Flow
      case 'operatingCashFlow': return 'Fluxo de Caixa Operacional';
      case 'cashFromOpsAfterWC': return 'Fluxo Operacional após WC';
      case 'capitalExpenditures': return 'CAPEX';
      case 'netCashFlowBeforeFinancing': return 'Fluxo antes de Financiamentos';
      case 'changeInDebt': return 'Variação de Empréstimos';
      case 'dividendsPaid': return 'Dividendos Pagos';
      case 'cashFlowFromFinancing': return 'Fluxo de Financiamentos';
      case 'netChangeInCash': return 'Variação Líquida de Caixa';
      case 'fundingGapOrSurplus': return 'Gap de Financiamento';
      default: return key;
    }
  };
  
  // Determine if a value should be shown as a percentage
  const isPercentageField = (key) => {
    return key.toLowerCase().includes('pct') || 
           key.toLowerCase().includes('margin') || 
           key === 'incomeTaxRatePercentageActual';
  };
  
  // Determine if a value should use currency formatting
  const isCurrencyField = (key) => {
    // Fields that contain time/day metrics shouldn't be formatted as currency
    const notCurrency = ['days', 'arDaysDerived', 'apDaysDerived', 'wcDays', 
                         'inventoryDaysDerived', 'incomeTaxRatePercentageActual'];
    
    if (notCurrency.some(fragment => key.includes(fragment)) || isPercentageField(key)) {
      return false;
    }
    
    // Most values in finance contexts are currency, unless specified otherwise
    return true;
  };
  
  // Format cell value according to its type
  const formatCellValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    if (isPercentageField(key)) return formatPercentage(value);
    if (key.includes('days') || key === 'arDaysDerived' || key === 'apDaysDerived' || key === 'wcDays') {
      return value.toFixed(1) + ' dias';
    }
    if (isCurrencyField(key)) return formatCurrency(value);
    return value.toFixed(2);
  };
  
  // Calculate simple trend indicator for a series of values
  const getTrendIndicator = (values) => {
    if (values.length < 2) return '—';
    
    const firstValid = values.find(v => v !== null && v !== undefined);
    const lastValid = [...values].reverse().find(v => v !== null && v !== undefined);
    
    if (firstValid === undefined || lastValid === undefined) return '—';
    
    const diff = lastValid - firstValid;
    if (Math.abs(diff) < 0.001) return '→';
    
    return diff > 0 ? '↗' : '↘';
  };
  
  const renderProfitLossTable = () => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr>
          <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center">
            Demonstração de Resultados
          </th>
        </tr>
        <tr>
          <th className="border p-2 text-left bg-blue-50">Item</th>
          {generatePeriodHeaders()}
        </tr>
      </thead>
      <tbody>
        {[
          'revenue', 'cogs', 'grossProfit', 'gmPct', 'operatingExpenses', 
          'ebitda', 'depreciationAndAmortisation', 'ebit', 'netInterestExpenseIncome', 
          'extraordinaryItems', 'pbt', 'incomeTax', 'netProfit', 'netProfitPct'
        ].map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 font-medium">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  
  const renderCashFlowTable = () => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr>
          <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center">
            Fluxo de Caixa
          </th>
        </tr>
        <tr>
          <th className="border p-2 text-left bg-blue-50">Item</th>
          {generatePeriodHeaders()}
        </tr>
      </thead>
      <tbody>
        {[
          'openingCash', 'operatingCashFlow', 'workingCapitalChange', 'cashFromOpsAfterWC',
          'capitalExpenditures', 'netCashFlowBeforeFinancing', 'changeInDebt',
          'dividendsPaid', 'cashFlowFromFinancing', 'netChangeInCash', 'closingCash'
        ].map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 font-medium">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  
  const renderWorkingCapitalTable = () => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr>
          <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center">
            Análise de Capital de Giro
          </th>
        </tr>
        <tr>
          <th className="border p-2 text-left bg-blue-50">Item</th>
          {generatePeriodHeaders()}
        </tr>
      </thead>
      <tbody>
        {[
          'accountsReceivableValueAvg', 'arDaysDerived',
          'inventoryValueAvg', 'inventoryDaysDerived',
          'accountsPayableValueAvg', 'apDaysDerived',
          'workingCapitalValue', 'wcDays', 'workingCapitalChange'
        ].map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 font-medium">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  
  const renderBalanceSheetTable = () => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr>
          <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center">
            Balanço Patrimonial (Simplificado)
          </th>
        </tr>
        <tr>
          <th className="border p-2 text-left bg-blue-50">Item</th>
          {generatePeriodHeaders()}
        </tr>
      </thead>
      <tbody>
        <tr className="bg-blue-50 font-medium">
          <td className="border p-2">Total Ativos</td>
          {calculatedData.map((period, idx) => (
            <td key={idx} className="border p-2 text-right">
              {formatCurrency(period.estimatedTotalAssets)}
            </td>
          ))}
          {calculatedData.length > 1 && (
            <td className="border p-2 text-center">
              {getTrendIndicator(calculatedData.map(p => p.estimatedTotalAssets))}
            </td>
          )}
        </tr>
        {[
          'closingCash', 'accountsReceivableValueAvg', 'inventoryValueAvg', 'netFixedAssets'
        ].map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 pl-4 font-normal">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
        
        <tr className="bg-blue-50 font-medium">
          <td className="border p-2">Total Passivos + Patrimônio</td>
          {calculatedData.map((period, idx) => (
            <td key={idx} className="border p-2 text-right">
              {formatCurrency(period.estimatedTotalLiabilities + period.equity)}
            </td>
          ))}
          {calculatedData.length > 1 && (
            <td className="border p-2 text-center">
              {getTrendIndicator(calculatedData.map(p => p.estimatedTotalLiabilities + p.equity))}
            </td>
          )}
        </tr>
        {[
          'accountsPayableValueAvg', 'totalBankLoans', 'equity'
        ].map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 pl-4 font-normal">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
        
        <tr className="bg-yellow-50">
          <td className="border p-2">Diferença de Balanço</td>
          {calculatedData.map((period, idx) => (
            <td key={idx} className="border p-2 text-right">
              {formatCurrency(period.balanceSheetDifference)}
            </td>
          ))}
          <td className="border p-2"></td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <section className="mt-12">
      <ReportControls
        onGeneratePdf={handleExportPdf}
        onGenerateAiSummary={handleGenerateAiSummary}
        onGenerateAiVariance={handleGenerateAiVariance}
        isPdfLoading={printingPdf}
        isAiSummaryLoading={isGeneratingSummary}
        isAiVarianceLoading={isGeneratingVariance}
        html2pdfError={html2pdfError}
        aiError={currentAiError || aiService.error}
        canAnalyzeVariances={calculatedData.length >= 2}
      />
      
      {pdfError && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>Erro ao gerar PDF: {pdfError.message}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-800 mb-3 md:mb-0">
          Relatório Gerado
        </h2>
        
        <div className="flex flex-wrap justify-center gap-2">
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium 
              ${reportViewMode === 'general' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            onClick={() => setReportViewMode('general')}
          >
            Visão Geral
          </button>
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium 
              ${reportViewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            onClick={() => setReportViewMode('detailed')}
          >
            Visão Detalhada
          </button>
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium 
              ${reportViewMode === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            onClick={() => setReportViewMode('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`px-3 py-1.5 rounded text-sm font-medium 
              ${reportViewMode === 'ai' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            onClick={() => setReportViewMode('ai')}
          >
            Resumo IA
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-6 bg-white rounded-xl shadow-lg" ref={reportRef}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-3 text-blue-800">{companyName}</h1>
          <h2 className="text-xl">{reportTitle}</h2>
          <p className="text-slate-500 mt-2">
            {calculatedData.length} {calculatedData.length === 1 ? PERIOD_TYPES[periodType]?.shortLabel : PERIOD_TYPES[periodType]?.label}
          </p>
        </div>

        {/* AI Summary Section - Hidden by default, shown when in AI view mode or for PDF */}
        <div id="aiExecutiveSummarySectionToPrint" style={{display: reportViewMode === 'ai' ? 'block' : 'none'}}>
          {reportViewMode === 'ai' && (
            <AiSummarySection 
              summaryText={aiSummaryText || "Clique no botão 'Resumo Executivo IA' para gerar uma análise automática dos dados."}
              isLoading={isGeneratingSummary}
            />
          )}
        </div>

        {/* AI Variance Section - Hidden by default, shown when in AI view mode or for PDF */}
        <div id="aiVarianceAnalysisSectionToPrint" style={{display: reportViewMode === 'ai' ? 'block' : 'none'}}>
          {reportViewMode === 'ai' && calculatedData.length >= 2 && (
            <AiVarianceSection 
              analysisText={aiVarianceText || "Clique no botão 'Análise de Variações IA' para gerar uma análise das variações entre períodos."}
              isLoading={isGeneratingVariance}
            />
          )}
        </div>

        {/* Report content changes based on selected view mode */}
        {reportViewMode === 'ai' ? (
          <div className="mt-8">
            {/* AI view already shown above */}
            {(!aiSummaryText && !aiVarianceText && !isGeneratingSummary && !isGeneratingVariance) && (
              <div className="p-4 bg-blue-50 rounded-lg text-blue-800">
                <p className="text-center">
                  Utilize os botões acima para gerar análises com IA {aiService.currentProviderConfig?.icon || ''}.
                </p>
              </div>
            )}
          </div>
        ) : reportViewMode === 'dashboard' ? (
          // Dashboard view with visualizations
          <div className="dashboard-container">
            <h3 className="text-xl font-bold text-blue-700 mb-6 pb-2 border-b-2 border-blue-200">Painel Visual de Análises</h3>
            
            {/* Margins and Profitability Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-slate-700 mb-4">Lucratividade</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <MarginTrendChart calculatedData={calculatedData} periodType={periodType} />
                <PnlVisualChart calculatedData={calculatedData} periodType={periodType} />
              </div>
            </div>
            
            {/* Working Capital and Cash Flow Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-slate-700 mb-4">Capital de Giro e Fluxo de Caixa</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WorkingCapitalDaysTrendChart calculatedData={calculatedData} periodType={periodType} />
                <CashFlowComponentsChart calculatedData={calculatedData} periodType={periodType} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CashFlowKeyMetricsTrendChart calculatedData={calculatedData} periodType={periodType} />
                <BalanceSheetDifferenceTrendChart calculatedData={calculatedData} periodType={periodType} />
              </div>
            </div>
            
            {/* Balance Sheet Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-slate-700 mb-4">Composição Patrimonial</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssetCompositionChart calculatedData={calculatedData} periodType={periodType} />
                <FundingStructureChart calculatedData={calculatedData} periodType={periodType} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* General or Detailed mode */}
            {renderProfitLossTable()}
            {renderCashFlowTable()}
            {(reportViewMode === 'detailed') && renderWorkingCapitalTable()}
            {(reportViewMode === 'detailed') && renderBalanceSheetTable()}
          </>
        )}
        
        {/* Footer with date stamp */}
        <div className="mt-8 pt-4 border-t text-center text-slate-500 text-sm">
          Relatório gerado em {new Date().toLocaleDateString('pt-BR', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
          {aiService.currentProviderConfig && (
            <p className="text-xs text-slate-400 mt-1">
              Análises IA: {aiService.currentProviderConfig.name} {aiService.currentProviderConfig.icon}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}