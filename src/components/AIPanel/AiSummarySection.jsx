// src/components/AIPanel/AiSummarySection.jsx
import React from 'react';

export default function AiSummarySection({ content, isLoading, error }) {
  // Check if content is meaningful using a more robust approach
  const hasMeaningfulContent = content && 
    !error && 
    typeof content === 'string' && 
    content.trim().length > 0 && 
    ![
      "Falha", 
      "Erro:", 
      "Gere o relatório", 
      "API Key", 
      "Chave API", 
      "não configurada", 
      "não está pronto"
    ].some(errorText => content.includes(errorText));

  // Loading state
  if (isLoading) {
    return (
      <section className="ai-section page-break-inside-avoid">
        <h3 className="ai-section-title">Resumo Executivo (Análise IA) ✨</h3>
        <div className="animate-pulse text-slate-600 space-y-2 p-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="ai-section page-break-inside-avoid">
        <h3 className="ai-section-title">Resumo Executivo (Análise IA) ✨</h3>
        <p className="text-red-600 text-sm p-2">Erro ao gerar resumo: {error.message}</p>
      </section>
    );
  }
  
  // Special case for error messages in the content field
  if (!hasMeaningfulContent && content) {
     return (
      <section className="ai-section page-break-inside-avoid">
        <h3 className="ai-section-title">Resumo Executivo (Análise IA) ✨</h3>
        <div className="bg-orange-50 p-3 rounded border border-orange-200">
          <p className="text-orange-600 text-sm">{content}</p>
        </div>
      </section>
    );
  }
  
  // Empty state - no content yet
  if (!hasMeaningfulContent) {
    return null;
  }

  // Success state with meaningful content
  return (
    <section className="ai-section page-break-inside-avoid">
      <h3 className="ai-section-title">Resumo Executivo (Análise IA) ✨</h3>
      <div 
        className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap print:text-xs p-2" 
        dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
      ></div>
    </section>
  );
}