// src/components/AIPanel/AiVarianceSection.jsx
import React from 'react';

/**
 * Component for displaying AI-generated variance analysis of financial data
 */
export default function AiVarianceSection({ varianceAnalysis, isLoading, financialData }) {
  const isEmpty = !Array.isArray(financialData) || financialData.length < 2;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <h3 className="text-slate-800 font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Análise de Variações
        </h3>
      </div>
      <div className="p-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Gerando análise de variações...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>São necessários dados de pelo menos dois períodos para análise de variações.</p>
          </div>
        ) : varianceAnalysis ? (
          <div className="prose prose-sm max-w-none text-slate-700">
            {varianceAnalysis.split('\n').map((paragraph, index) => {
              // Check if the paragraph appears to be a heading
              if (paragraph.startsWith('##')) {
                return (
                  <h4 key={index} className="text-lg font-medium text-slate-800 mt-4 mb-2">
                    {paragraph.replace(/^##\s*/, '')}
                  </h4>
                );
              } else if (paragraph.startsWith('#')) {
                return (
                  <h3 key={index} className="text-xl font-semibold text-slate-800 mt-5 mb-3">
                    {paragraph.replace(/^#\s*/, '')}
                  </h3>
                );
              } else if (paragraph.trim().length > 0) {
                // Handle bullet points
                if (paragraph.trim().startsWith('*') || paragraph.trim().startsWith('-')) {
                  return (
                    <ul key={index} className="list-disc pl-5 mb-3">
                      <li>{paragraph.trim().substring(1).trim()}</li>
                    </ul>
                  );
                } else {
                  return <p key={index} className="mb-3">{paragraph}</p>;
                }
              } else {
                return null; // Skip empty paragraphs
              }
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Nenhuma análise de variações disponível. Clique em "Gerar Análise" para criar uma.</p>
          </div>
        )}
      </div>
    </div>
  );
}