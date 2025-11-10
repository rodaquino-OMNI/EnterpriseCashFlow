// src/components/ReportPanel/ReportControls.jsx
import React, { useState } from 'react';

/**
 * @param {{
 * onGeneratePdf: () => void;
 * onGenerateAiSummary: () => void;
 * onGenerateAiVariance: () => void;
 * onGenerateAiRisk: () => void; // New
 * onGenerateAiCFDeepDive: () => void; // New
 * isPdfLoading: boolean;
 * isAiSummaryLoading: boolean;
 * isAiVarianceLoading: boolean;
 * isAiRiskLoading: boolean; // New
 * isAiCFDeepDiveLoading: boolean; // New
 * html2pdfError: Error | null;
 * aiError: Error | null;
 * canAnalyzeVariances: boolean;
 * }} props
 */
export default function ReportControls({
  onGeneratePdf,
  onGenerateAiSummary,
  onGenerateAiVariance,
  onGenerateAiRisk,
  onGenerateAiCFDeepDive,
  isPdfLoading,
  isAiSummaryLoading,
  isAiVarianceLoading,
  isAiRiskLoading,
  isAiCFDeepDiveLoading,
  html2pdfError,
  aiError,
  canAnalyzeVariances,
}) {
  const isAnyAiLoading = isAiSummaryLoading || isAiVarianceLoading || isAiRiskLoading || isAiCFDeepDiveLoading;
  const isAnyActionLoading = isPdfLoading || isAnyAiLoading;
  const [showAiHelpInfo, setShowAiHelpInfo] = useState(false);

  const commonButtonClasses = 'px-5 py-2.5 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto text-sm';
  const spinner = (
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>Gerando...</span>
    </div>
  );

  // Helper function to handle button click with feedback
  const handleAiButtonClick = (action) => {
    // If there's an error already, clear console to make new errors more visible
    if (aiError) {
      console.clear();
      console.log('Starting new AI request, previous errors cleared');
    }

    // Track button press in console for debugging
    console.log('AI report button clicked:', action);
    
    // Call the appropriate action function
    action();
  };

  return (
    <section className="my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg border border-slate-200 no-print">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Opções do Relatório e Análises com Inteligência Artificial
      </h2>
      
      {showAiHelpInfo && (
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h3 className="text-blue-700 font-medium mb-1">Como configurar a API de IA:</h3>
          <ol className="list-decimal pl-5 text-blue-800 space-y-1">
            <li>Selecione um provedor de IA nas configurações acima</li>
            <li>Cadastre-se no site do provedor escolhido para obter uma chave API</li>
            <li>Configure a chave API nas configurações do aplicativo</li>
            <li>Gere seus relatórios com IA!</li>
          </ol>
          <button 
            onClick={() => setShowAiHelpInfo(false)}
            className="mt-2 text-blue-700 text-sm hover:underline"
          >
            Ocultar ajuda
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => handleAiButtonClick(onGenerateAiSummary)}
          disabled={isAnyActionLoading}
          className={`${commonButtonClasses} bg-sky-500 hover:bg-sky-600 focus:ring-sky-500`}
        >
          {isAiSummaryLoading ? spinner : 'Resumo Executivo IA ✨'}
        </button>

        <button 
          onClick={() => handleAiButtonClick(onGenerateAiVariance)} 
          disabled={isAnyActionLoading || !canAnalyzeVariances}
          className={`${commonButtonClasses} bg-teal-500 hover:bg-teal-600 focus:ring-teal-500`}
          title={!canAnalyzeVariances ? 'Requer pelo menos 2 períodos de dados.' : ''}
        >
          {isAiVarianceLoading ? spinner : 'Análise de Variações IA 📈'}
        </button>

        <button 
          onClick={() => handleAiButtonClick(onGenerateAiRisk)} 
          disabled={isAnyActionLoading}
          className={`${commonButtonClasses} bg-amber-500 hover:bg-amber-600 focus:ring-amber-500`}
        >
          {isAiRiskLoading ? spinner : 'Avaliação de Riscos IA 🛡️'}
        </button>

        <button 
          onClick={() => handleAiButtonClick(onGenerateAiCFDeepDive)}
          disabled={isAnyActionLoading}
          className={`${commonButtonClasses} bg-purple-500 hover:bg-purple-600 focus:ring-purple-500`}
        >
          {isAiCFDeepDiveLoading ? spinner : 'Análise Fluxo Caixa IA 🌊'}
        </button>

        <button 
          onClick={onGeneratePdf} 
          disabled={isAnyActionLoading}
          className={`${commonButtonClasses} bg-green-600 hover:bg-green-700 focus:ring-green-500 lg:col-span-1`}
        >
          {isPdfLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Gerando PDF...</span>
            </div>
          ): 'Baixar Relatório PDF 📄'}
        </button>
        
        {!showAiHelpInfo && (
          <button
            onClick={() => setShowAiHelpInfo(true)}
            className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 focus:outline-none lg:col-span-2"
          >
            Problemas com relatórios de IA? Clique para ajuda
          </button>
        )}
      </div>

      {html2pdfError && (
        <p className="text-red-600 text-center text-sm mt-3">
          Erro ao carregar biblioteca PDF: {html2pdfError.message}
        </p>
      )}
      
      {aiError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            <strong>Erro IA:</strong> {aiError.message}
          </p>
          <p className="text-red-600 text-xs mt-1">
            Verifique se sua chave API está configurada corretamente nas configurações.
          </p>
        </div>
      )}
    </section>
  );
}