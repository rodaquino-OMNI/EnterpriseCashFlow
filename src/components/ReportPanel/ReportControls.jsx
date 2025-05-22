// src/components/ReportPanel/ReportControls.jsx
import React from 'react';

/**
 * @param {{
 * onGeneratePdf: () => void;
 * onGenerateAiSummary: () => void;
 * onGenerateAiVariance: () => void;
 * isPdfLoading: boolean;
 * isAiSummaryLoading: boolean;
 * isAiVarianceLoading: boolean;
 * html2pdfError: Error | null;
 * aiError: Error | null;
 * canAnalyzeVariances: boolean;
 * }} props
 */
export default function ReportControls({
  onGeneratePdf,
  onGenerateAiSummary,
  onGenerateAiVariance,
  isPdfLoading,
  isAiSummaryLoading,
  isAiVarianceLoading,
  html2pdfError,
  aiError,
  canAnalyzeVariances
}) {
  const isAnyActionLoading = isPdfLoading || isAiSummaryLoading || isAiVarianceLoading;

  return (
    <section className="my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg border border-slate-200 no-print">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Opções do Relatório e Análises IA
      </h2>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
        <button 
          onClick={onGenerateAiSummary} 
          disabled={isAnyActionLoading}
          className="px-6 py-3 bg-sky-500 text-white font-medium rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isAiSummaryLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Gerando Resumo...</span>
            </div>
          ) : 'Resumo Executivo IA ✨'}
        </button>

        <button 
          onClick={onGenerateAiVariance} 
          disabled={isAnyActionLoading || !canAnalyzeVariances}
          className="px-6 py-3 bg-teal-500 text-white font-medium rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
          title={!canAnalyzeVariances ? "Requer pelo menos 2 períodos de dados para análise de variações." : ""}
        >
          {isAiVarianceLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Analisando...</span>
            </div>
           ) : 'Análise de Variações IA ✨'}
        </button>

        <button 
          onClick={onGeneratePdf} 
          disabled={isAnyActionLoading}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isPdfLoading ? (
             <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Gerando PDF...</span>
            </div>
          ): 'Baixar Relatório em PDF 📄'}
        </button>
      </div>

      {html2pdfError && (
        <p className="text-red-600 text-center text-sm mt-3">
          Erro ao carregar biblioteca PDF: {html2pdfError.message}
        </p>
      )}
      {aiError && (
        <p className="text-red-600 text-center text-sm mt-3">
          Erro IA: {aiError.message}
        </p>
      )}
    </section>
  );
}