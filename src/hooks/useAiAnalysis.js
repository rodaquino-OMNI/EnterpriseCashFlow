// src/hooks/useAiAnalysis.js
import { useState, useCallback, useEffect } from 'react';
import { ANALYSIS_TYPES } from '../utils/aiAnalysisTypes';

/**
 * Custom hook for managing AI analysis state, requests and responses.
 * Centralizes all AI analysis state and operations in one place.
 * 
 * @param {Object} aiService - The useAiService hook instance
 * @param {Object} apiKeys - API keys for different AI providers
 * @param {string} selectedAiProviderKey - The currently selected AI provider
 * @returns {Object} The AI analysis state and functions
 */
export function useAiAnalysis(aiService, apiKeys, selectedAiProviderKey) {
  // State for all analyses indexed by type
  const [analyses, setAnalyses] = useState({});
  // State for all loading states indexed by type
  const [loadingStates, setLoadingStates] = useState({});
  // State for all errors indexed by type
  const [errors, setErrors] = useState({});

  /**
   * Clear all analyses
   */
  const clearAllAnalyses = useCallback(() => {
    setAnalyses({});
    setLoadingStates({});
    setErrors({});
  }, []);

  // Reset analyses when provider changes
  useEffect(() => {
    clearAllAnalyses();
  }, [selectedAiProviderKey, clearAllAnalyses]);

  /**
   * Check if a specific analysis is loading
   * @param {string} analysisType - The type of analysis to check
   * @returns {boolean} True if the analysis is loading
   */
  const isLoading = useCallback((analysisType) => {
    return !!loadingStates[analysisType];
  }, [loadingStates]);

  /**
   * Clear a specific analysis
   * @param {string} analysisType - The type of analysis to clear
   */
  const clearAnalysis = useCallback((analysisType) => {
    setAnalyses(prev => ({ ...prev, [analysisType]: null }));
    setLoadingStates(prev => ({ ...prev, [analysisType]: false }));
    setErrors(prev => ({ ...prev, [analysisType]: null }));
  }, []);

  /**
   * Perform an AI analysis
   * @param {string} analysisType - The type of analysis to perform
   * @param {Object} financialDataBundle - The financial data to analyze
   */
  const performAnalysis = useCallback(async (analysisType, financialDataBundle) => {
    // Skip if no data to analyze
    if (!financialDataBundle?.calculatedData?.length) {
      setErrors(prev => ({ 
        ...prev, 
        [analysisType]: new Error("Gere o relatório com dados financeiros primeiro para esta análise.")
      }));
      return;
    }

    // Special check for variance analysis
    if (analysisType === ANALYSIS_TYPES.VARIANCE_ANALYSIS && financialDataBundle.calculatedData.length < 2) {
      setErrors(prev => ({ 
        ...prev, 
        [analysisType]: new Error("Análise de variações requer pelo menos 2 períodos de dados.")
      }));
      return;
    }

    try {
      // Start loading
      setLoadingStates(prev => ({ ...prev, [analysisType]: true }));
      setErrors(prev => ({ ...prev, [analysisType]: null }));

      // Get current API key for selected provider
      const apiKey = apiKeys[selectedAiProviderKey] || '';

      // Use the universal callAiAnalysis method from aiService
      const result = await aiService.callAiAnalysis(
        analysisType,
        financialDataBundle,
        {}, // options - can be empty object for default settings
        apiKey
      );

      // Update the analysis result
      setAnalyses(prev => ({ ...prev, [analysisType]: result }));
    } catch (error) {
      console.error(`Error in ${analysisType} analysis:`, error);
      setErrors(prev => ({ ...prev, [analysisType]: error }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [analysisType]: false }));
    }
  }, [aiService, apiKeys, selectedAiProviderKey]);

  return {
    analyses,
    loadingStates,
    errors,
    isLoading,
    performAnalysis,
    clearAnalysis,
    clearAllAnalyses
  };
}