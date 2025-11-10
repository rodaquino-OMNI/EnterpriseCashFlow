// src/components/AIPanel/AiSummarySection.jsx
import React from 'react';
import AiAnalysisSection from './AiAnalysisSection';

/**
 * Legacy component that now uses the unified AiAnalysisSection
 * @param {Object} props - Component props
 * @param {string} [props.titleOverride] - Optional title override
 * @param {string} [props.content] - AI-generated content to display
 * @param {boolean} [props.isLoading] - Loading state
 * @param {Error} [props.error] - Error state if applicable
 * @param {Function} [props.onRetry] - Retry function
 */
export default function AiSummarySection(props) {
  const { titleOverride, content, isLoading, error, onRetry } = props;
  const displayTitle = titleOverride || 'Resumo Executivo (Análise IA) ✨';
  
  // For debugging during transition
  console.log('[AiSummarySection] Render state:', { 
    hasContent: !!content, 
    isLoading, 
    hasError: !!error,
    contentLength: content?.length,
    contentPreview: content?.substring?.(0, 50),
  });

  // Use the unified component
  return (
    <AiAnalysisSection
      title={displayTitle}
      content={content}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      className="ai-summary-section"
    />
  );
}