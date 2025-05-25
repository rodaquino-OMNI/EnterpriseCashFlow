// src/components/AIPanel/AiVarianceSection.jsx
import React from 'react';
import AiAnalysisSection from './AiAnalysisSection';

/**
 * Legacy component that now uses the unified AiAnalysisSection
 * @param {{ 
 * analysisText: string; 
 * isLoading: boolean; 
 * error: any;
 * titleOverride?: string;
 * onRetry?: Function;
 * }} props
 */
export default function AiVarianceSection({ analysisText, isLoading, error, titleOverride, onRetry }) {
  const displayTitle = titleOverride || "Análise de Variações Chave (Análise IA) ✨";
  
  // Logging for debugging during transition
  if (analysisText) {
    console.log('[AiVarianceSection] Received text:', {
      length: analysisText.length,
      firstChars: analysisText.substring(0, 50) + '...',
      type: typeof analysisText
    });
  }

  // Use the unified component
  return (
    <AiAnalysisSection
      title={displayTitle}
      content={analysisText} // Note the prop name difference (analysisText vs content)
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className="ai-variance-section"
    />
  );
}