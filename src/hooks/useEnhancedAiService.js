// src/hooks/useEnhancedAiService.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { AIService } from '../services/ai/AIService';
import { AIProviderType, AnalysisType } from '../services/ai/types';
import { useAiService } from './useAiService';

/**
 * Enhanced AI Service Hook with abstraction layer
 * @param {Object} config - Configuration options
 * @returns {Object} Enhanced AI service interface
 */
export function useEnhancedAiService(config = {}) {
  const [aiService, setAiService] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [providerStatus, setProviderStatus] = useState({});
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Keep reference to current provider configs
  const providerConfigs = useRef({});
  
  // Use existing hook for backward compatibility
  const legacyService = useAiService(config.defaultProvider);

  /**
   * Initialize AI service with provider configurations
   */
  const initialize = useCallback(async (providers = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create AI service instance
      const service = new AIService({
        defaultProvider: config.defaultProvider || AIProviderType.GEMINI,
        cacheTimeout: config.cacheTimeout,
        providers,
      });

      // Store provider configs
      providerConfigs.current = providers;

      // Perform health check
      const healthStatus = await service.healthCheck();
      setProviderStatus(healthStatus);

      setAiService(service);
      setIsInitialized(true);
    } catch (err) {
      setError(err);
      console.error('Failed to initialize AI service:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config.defaultProvider, config.cacheTimeout]);

  /**
   * Switch AI provider
   */
  const switchProvider = useCallback((providerType) => {
    if (!aiService) {
      setError(new Error('AI service not initialized'));
      return;
    }

    try {
      aiService.setProvider(providerType);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Failed to switch provider:', err);
    }
  }, [aiService]);

  /**
   * Perform financial analysis
   */
  const analyzeFinancial = useCallback(async (
    analysisType,
    financialData,
    options = {},
  ) => {
    if (!aiService) {
      // Fallback to legacy service
      return legacyService.callAiAnalysis(
        analysisType,
        financialData,
        options,
        providerConfigs.current[legacyService.selectedProviderKey]?.apiKey,
      );
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.analyzeFinancial(
        analysisType,
        financialData,
        options,
      );

      // Update history
      setAnalysisHistory(prev => [...prev.slice(-19), {
        type: analysisType,
        provider: aiService.currentProvider,
        timestamp: new Date().toISOString(),
        success: true,
      }]);

      return result;
    } catch (err) {
      setError(err);
      
      // Update history with failure
      setAnalysisHistory(prev => [...prev.slice(-19), {
        type: analysisType,
        provider: aiService.currentProvider,
        timestamp: new Date().toISOString(),
        success: false,
        error: err.message,
      }]);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aiService, legacyService]);

  /**
   * Extract data from documents
   */
  const extractData = useCallback(async (
    content,
    documentType,
    schema,
    options = {},
  ) => {
    if (!aiService) {
      setError(new Error('AI service not initialized'));
      throw new Error('AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.extractData(
        content,
        documentType,
        schema,
        options,
      );

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aiService]);

  /**
   * Generate insights
   */
  const generateInsights = useCallback(async (
    financialData,
    focusAreas = [],
    options = {},
  ) => {
    if (!aiService) {
      setError(new Error('AI service not initialized'));
      throw new Error('AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.generateInsights(
        financialData,
        focusAreas,
        options,
      );

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aiService]);

  /**
   * Batch analyze multiple types
   */
  const batchAnalyze = useCallback(async (
    analysisTypes,
    financialData,
    options = {},
  ) => {
    if (!aiService) {
      setError(new Error('AI service not initialized'));
      throw new Error('AI service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.batchAnalyze(
        analysisTypes,
        financialData,
        options,
      );

      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aiService]);

  /**
   * Get provider capabilities
   */
  const getProviderCapabilities = useCallback((providerType) => {
    if (!aiService) return null;

    try {
      const provider = aiService.providers[providerType];
      return provider ? provider.getCapabilities() : null;
    } catch (err) {
      console.error('Failed to get provider capabilities:', err);
      return null;
    }
  }, [aiService]);

  /**
   * Clear analysis cache
   */
  const clearCache = useCallback(() => {
    if (aiService) {
      aiService.clearCache();
    }
  }, [aiService]);

  /**
   * Get analysis recommendations based on data
   */
  const getRecommendedAnalyses = useCallback((financialData) => {
    const recommendations = [];
    
    if (!financialData?.calculatedData?.length) {
      return recommendations;
    }

    const latestPeriod = financialData.calculatedData[financialData.calculatedData.length - 1];
    
    // Always recommend executive summary
    recommendations.push({
      type: AnalysisType.EXECUTIVE_SUMMARY,
      priority: 'high',
      reason: 'Provides comprehensive overview',
    });

    // Recommend variance analysis if multiple periods
    if (financialData.calculatedData.length >= 2) {
      recommendations.push({
        type: AnalysisType.VARIANCE_ANALYSIS,
        priority: 'high',
        reason: 'Multiple periods available for comparison',
      });
    }

    // Recommend cash flow analysis if cash issues detected
    if (latestPeriod.closingCash < 0 || latestPeriod.operatingCashFlow < 0) {
      recommendations.push({
        type: AnalysisType.CASH_FLOW_ANALYSIS,
        priority: 'critical',
        reason: 'Cash flow concerns detected',
      });
    }

    // Recommend risk assessment if high debt or low margins
    const debtToEquity = latestPeriod.totalBankLoans / latestPeriod.equity;
    if (debtToEquity > 2 || latestPeriod.netProfitPct < 0.05) {
      recommendations.push({
        type: AnalysisType.RISK_ASSESSMENT,
        priority: 'high',
        reason: 'Financial risk indicators detected',
      });
    }

    return recommendations;
  }, []);

  /**
   * Get provider performance metrics
   */
  const getProviderMetrics = useCallback(() => {
    const metrics = {};
    
    // Group by provider
    analysisHistory.forEach(entry => {
      if (!metrics[entry.provider]) {
        metrics[entry.provider] = {
          total: 0,
          successful: 0,
          failed: 0,
          averageResponseTime: 0,
        };
      }
      
      metrics[entry.provider].total++;
      if (entry.success) {
        metrics[entry.provider].successful++;
      } else {
        metrics[entry.provider].failed++;
      }
    });

    // Calculate success rates
    Object.keys(metrics).forEach(provider => {
      const m = metrics[provider];
      m.successRate = m.total > 0 ? m.successful / m.total : 0;
    });

    return metrics;
  }, [analysisHistory]);

  // Auto-initialize if config provided
  useEffect(() => {
    if (config.autoInitialize && config.providers) {
      initialize(config.providers);
    }
  }, [config.autoInitialize, config.providers, initialize]);

  return {
    // Initialization
    initialize,
    isInitialized,
    providerStatus,
    
    // Provider management
    switchProvider,
    currentProvider: aiService?.currentProvider || legacyService.selectedProviderKey,
    getProviderCapabilities,
    
    // Analysis functions
    analyzeFinancial,
    extractData,
    generateInsights,
    batchAnalyze,
    
    // Recommendations
    getRecommendedAnalyses,
    
    // State
    isLoading: isLoading || legacyService.isLoading,
    error: error || legacyService.error,
    
    // History and metrics
    analysisHistory,
    getProviderMetrics,
    
    // Cache management
    clearCache,
    
    // Legacy compatibility
    legacyService,
  };
}