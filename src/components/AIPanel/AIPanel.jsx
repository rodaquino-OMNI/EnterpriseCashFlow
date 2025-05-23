// src/components/AIPanel/AIPanel.jsx
import React from 'react';
import AiSummarySection from './AiSummarySection';
import AiVarianceSection from './AiVarianceSection';

/**
 * The main AI Panel component that renders AI-generated content
 */
export default function AIPanel({
  financialData,
  isGenerating,
  handleGenerateAiContent,
  aiSummary,
  aiVarianceAnalysis,
  showAiPanel,
  toggleAiPanel,
  canGenerateContent,
  currentProviderName
}) {
  if (!showAiPanel) {
    return (
      <div className="mb-8">
        <button
          onClick={toggleAiPanel}
          className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Exibir Painel de IA
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-between items-center">
          <h2 className="text-xl text-white font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Análise Inteligente
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleGenerateAiContent}
              disabled={!canGenerateContent || isGenerating}
              className={`px-4 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors 
                ${canGenerateContent && !isGenerating 
                  ? 'bg-white text-blue-700 hover:bg-blue-50' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Gerar Análise
                </>
              )}
            </button>
            
            <button
              onClick={toggleAiPanel}
              className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white"
              title="Fechar painel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!canGenerateContent && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Configuração necessária</h3>
                  <p className="mt-1 text-sm">
                    Para utilizar a análise com IA, por favor configure sua chave de API do {currentProviderName} nas configurações.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AiSummarySection 
              content={aiSummary} 
              isLoading={isGenerating} 
            />
            
            <AiVarianceSection 
              analysisText={aiVarianceAnalysis} 
              isLoading={isGenerating} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}