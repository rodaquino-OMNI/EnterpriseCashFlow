// src/components/AIPanel/AiSummarySection.jsx
import React from 'react';

/**
 * Component for displaying AI-generated summaries of financial data
 */
export default function AiSummarySection({ summary, isLoading, financialData }) {
  const isEmpty = !Array.isArray(financialData) || financialData.length === 0;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <h3 className="text-slate-800 font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Sumário Financeiro
        </h3>
      </div>
      <div className="p-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Gerando sumário financeiro...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Clique em "Gerar Análise" para criar um sumário dos dados financeiros.</p>
          </div>
        ) : summary ? (
          <div className="prose prose-sm max-w-none text-slate-700">
            {summary.split('\n').map((paragraph, index) => {
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
            <p>Nenhum sumário disponível. Clique em "Gerar Análise" para criar um.</p>
          </div>
        )}
      </div>
    </div>
  );
}