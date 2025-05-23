// src/components/AIPanel/AiVarianceSection.jsx
import React, { useEffect } from 'react';

// Helper function for formatting AI text with lists
function formatAiListText(text) {
  if (!text) return '';
  
  // Handle paragraphs and line breaks
  let html = text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<p>')) {
    html = `<p>${html}</p>`;
  }
  
  // Handle markdown-like headings (## Heading)
  html = html.replace(/<p>#+\s+(.*?)<\/p>/g, (match, heading) => {
    const headingLevel = match.trim().startsWith('<p>###') ? 3 : 
                        match.trim().startsWith('<p>##') ? 2 : 
                        match.trim().startsWith('<p>#') ? 1 : 4;
    
    return `<h${headingLevel} class="text-${headingLevel === 1 ? 'xl' : headingLevel === 2 ? 'lg' : 'base'} font-semibold text-slate-800 mt-4 mb-2">${heading}</h${headingLevel}>`;
  });
  
  // Convert lines starting with bullet symbols to list items
  html = html.replace(/<p>\s*[*\-•]\s+(.*?)<\/p>/g, '<li>$1</li>');
  
  // Group consecutive list items into a list
  html = html.replace(/(<li>.*?<\/li>)+/g, match => {
    return `<ul class="list-disc pl-5 my-2">${match}</ul>`;
  });
  
  return html;
}

/**
 * @param {{ analysisText: string; isLoading: boolean; error: any }} props
 */
export default function AiVarianceSection({ analysisText, isLoading, error }) {
  // Debug logging to help identify issues
  useEffect(() => {
    if (analysisText) {
      console.log('AiVarianceSection received text:', {
        length: analysisText.length,
        firstChars: analysisText.substring(0, 50) + '...',
        type: typeof analysisText
      });
    }
  }, [analysisText]);
  
  if (isLoading) {
    return (
      <section className="ai-section page-break-after"> 
        <h3 className="ai-section-title">Análise de Variações Chave (Análise IA) ✨</h3>
        <div className="animate-pulse text-slate-600 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </section>
    );
  }
  
  // More permissive check for content - just make sure something exists
  if (!analysisText || analysisText.trim() === '') {
    return null; // Only return null if there's truly no content
  }
  // Check if content appears to be an error message
  const isErrorMessage = analysisText && (
    analysisText.startsWith("Falha") || 
    analysisText.startsWith("Erro:") || 
    analysisText.startsWith("Análise de variações requer") ||
    (analysisText.includes("API") && analysisText.includes("erro")) ||
    (analysisText.includes("API") && analysisText.includes("falha"))
  );
  // Always display the content, but style differently if it's an error
  return (
    <section className="ai-section page-break-after">
      <h3 className="ai-section-title">Análise de Variações Chave (Análise IA) ✨</h3>
      
      {isErrorMessage ? (
        <div className="bg-orange-50 p-3 rounded border border-orange-200">
          <p className="text-orange-600 text-sm">{analysisText}</p>
        </div>
      ) : (
        <div
          className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap print:text-xs"
          dangerouslySetInnerHTML={{ __html: formatAiListText(analysisText) }}
        ></div>
      )}
    </section>
  );
}