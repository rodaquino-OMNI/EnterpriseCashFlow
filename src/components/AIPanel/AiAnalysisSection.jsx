// src/components/AIPanel/AiAnalysisSection.jsx
import React from 'react';

function formatAiContentForDisplay(content) {
  if (typeof content !== 'string') return '';

  let formatted = content;
  // More robust Markdown-like to HTML conversion
  // Headings
  formatted = formatted.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold my-4 print:text-xl">$1</h1>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold my-3 print:text-lg">$1</h2>');
  formatted = formatted.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-medium my-2 print:text-base">$1</h3>');
  formatted = formatted.replace(/^#### (.*?)$/gm, '<h4 class="text-md font-medium my-1 print:text-sm">$1</h4>');

  // Bold and Italics
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Unordered Lists (simple version, handles lines starting with * or -)
  let hasUnorderedList = false;
  formatted = formatted.replace(/(?:^|\n)\s*[\*\-]\s+(.+)/gm, (match, itemContent) => {
    hasUnorderedList = true;
    return `<li>${itemContent.trim()}</li>`;
  });
  
  if (hasUnorderedList) {
    formatted = formatted.replace(/(<li>.*?<\/li>)(?!<li>)/gs, '$1</ul>'); // Close <ul> after last <li>
    formatted = formatted.replace(/<\/ul>\s*<ul/gs, ''); // Remove redundant ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ul class="list-disc list-inside my-2 pl-4 print:pl-2">$&');
  }

  // Ordered Lists (simple version)
  let hasOrderedList = false;
  formatted = formatted.replace(/(?:^|\n)\s*\d+\.\s+(.+)/gm, (match, itemContent) => {
    hasOrderedList = true;
    return `<li>${itemContent.trim()}</li>`;
  });
  
  if (hasOrderedList) {
    formatted = formatted.replace(/(<li>.*?<\/li>)(?!<li>)/gs, '$1</ol>');
    formatted = formatted.replace(/<\/ol>\s*<ol/gs, '');
    formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ol class="list-decimal list-inside my-2 pl-4 print:pl-2">$&');
  }

  // Final pass for remaining newlines to <br>
  formatted = formatted.replace(/\n/g, '<br />');
  // Clean up <br /> inside list items created by the list regex
  formatted = formatted.replace(/<li><br \/>/g, '<li>');

  return formatted;
}

/**
 * Unified component to display AI analysis content, loading, and error states.
 * @param {{
 * title: string;
 * content: string | null | undefined;
 * isLoading: boolean;
 * error: Error | null | undefined;
 * onRetry?: (analysisType?: string) => void;
 * analysisTypeForRetry?: string;
 * className?: string;
 * }} props
 */
export default function AiAnalysisSection({
  title,
  content,
  isLoading,
  error,
  onRetry,
  analysisTypeForRetry,
  className = ""
}) {
  if (isLoading) {
    return (
      <section className={`ai-section page-break-inside-avoid ${className}`}>
        <h3 className="ai-section-title">{title}</h3>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-slate-600">Processando análise com IA...</span>
        </div>
        {onRetry && analysisTypeForRetry && (
          <div className="mt-2 text-center">
            {/* Cancel might not be directly implemented in useAiAnalysis hook, but good for future */}
            {/* <button onClick={() => onRetry(analysisTypeForRetry)} className="text-sm text-blue-600 hover:text-blue-700 underline">Cancelar</button> */}
          </div>
        )}
      </section>
    );
  }

  if (error) {
    return (
      <section className={`ai-section page-break-inside-avoid ${className}`}>
        <h3 className="ai-section-title">{title}</h3>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Erro ao Gerar Análise</p>
              <p className="text-sm break-words">{error.message || 'Ocorreu um erro desconhecido.'}</p>
              {onRetry && (
                <button
                  onClick={() => onRetry(analysisTypeForRetry)}
                  className="mt-3 text-sm bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // Check if content itself is an error/placeholder message (from useAiService fallback or initial state)
  const isContentIndicatingIssue = typeof content === 'string' &&
    (content.toLowerCase().includes("erro:") ||
     content.toLowerCase().includes("falha") ||
     content.toLowerCase().includes("api key") ||
     content.toLowerCase().includes("não configurada") ||
     content.toLowerCase().includes("gere o relatório com dados primeiro") ||
     content.toLowerCase().includes("requer pelo menos 2 períodos"));

  if (!content || content.trim() === '') {
    return null; // Don't render anything if no content, not loading, and no explicit error prop
  }

  if (isContentIndicatingIssue) {
    return (
      <section className={`ai-section page-break-inside-avoid ${className}`}>
        <h3 className="ai-section-title">{title}</h3>
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-amber-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Aviso</p>
              <p className="text-sm">{content}</p>
              {onRetry && content.toLowerCase().includes("tente novamente") && (
                <button
                  onClick={() => onRetry(analysisTypeForRetry)}
                  className="mt-3 text-sm bg-amber-600 text-white px-4 py-1.5 rounded-md hover:bg-amber-700 transition focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                >
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Render valid content
  return (
    <section className={`ai-section page-break-inside-avoid ${className}`}>
      <h3 className="ai-section-title">{title}</h3>
      <div
        className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap print:text-xs p-2"
        dangerouslySetInnerHTML={{ __html: formatAiContentForDisplay(content) }}
      />
    </section>
  );
}