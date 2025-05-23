// src/hooks/useAiService.js
import { useState, useCallback, useEffect } from 'react';
import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from '../utils/aiProviders';
import { createFinancialAnalysisPrompt, validateAiResponse, standardizeResponse } from '../utils/aiPromptEngine';
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from '../utils/aiAnalysisTypes';

/**
 * Universal AI service hook that supports multiple providers.
 * @param {import('../utils/aiProviders').AiProviderKey} initialProviderKey - The initial AI provider key.
 * @returns {{
 * callAiAnalysis: (
 * analysisType: keyof typeof ANALYSIS_TYPES,
 * financialDataBundle: { calculatedData: import('../types/financial').CalculatedPeriodData[], companyInfo: import('../types/financial').CompanyInfo, pdfText?: string },
 * options?: import('../utils/aiProviders').AiRequestOptions,
 * currentApiKey?: string
 * ) => Promise<string>;
 * isLoading: boolean;
 * error: Error | null;
 * resetError: () => void;
 * currentProviderConfig: import('../utils/aiProviders').AiProviderConfig | undefined;
 * selectedProviderKey: import('../utils/aiProviders').AiProviderKey;
 * setSelectedProviderKey: React.Dispatch<React.SetStateAction<import('../utils/aiProviders').AiProviderKey>>;
 * analysisHistory: any[];
 * getProviderInsights: () => { totalAnalysesForProvider: number; averageRecentQuality: string | number; recommendedProviderForGeneral: string; };
 * }}
 */
export function useAiService(initialProviderKey = DEFAULT_AI_PROVIDER) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Stores Error objects
  const [selectedProviderKey, setSelectedProviderKey] = useState(initialProviderKey);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const currentProviderConfig = AI_PROVIDERS[selectedProviderKey];

  const enhanceOptionsForProvider = useCallback((options, providerConfig, analysisType) => {
    const enhanced = { ...options };
    
    const defaultTemp =
      analysisType === ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION ? 0.1 : 
      providerConfig.name.toLowerCase().includes('claude') ? 0.3 :
      providerConfig.name.toLowerCase().includes('gemini') ? 0.4 :
      0.35;
    
    enhanced.temperature = options.temperature ?? defaultTemp;
    
    let defaultMaxTokens = providerConfig.maxTokens || providerConfig.defaultRequestConfig?.maxOutputTokens || 2000;
    const analysisMeta = ANALYSIS_METADATA[analysisType];
    if (analysisMeta?.defaultOutputTokens) {
      defaultMaxTokens = analysisMeta.defaultOutputTokens;
    }
    
    enhanced.maxTokens = Math.min(
      options.maxTokens || defaultMaxTokens,
      providerConfig.maxTokens || 8000
    );
    
    if (!enhanced.model && providerConfig.defaultRequestConfig?.model) {
      enhanced.model = providerConfig.defaultRequestConfig.model;
    }
    return enhanced;
  }, []);

  const callAiAnalysis = useCallback(async (
    analysisType,
    financialDataBundle, // { calculatedData, companyInfo, pdfText? }
    options = {},
    currentApiKey = '' // API key for the selected provider
  ) => {
    if (!currentProviderConfig) {
      const err = new Error(`Provedor AI não configurado ou inválido: ${selectedProviderKey}`);
      console.error("[AI Service Error]", err.message);
      setError(err); // Set Error object
      throw err; // Re-throw for the caller to also handle if needed
    }
    
    // Check if this provider requires an API key
    if (currentProviderConfig.requiresKey && (!currentApiKey || currentApiKey.trim() === '')) {
      const errMessage = `Chave API necessária para ${currentProviderConfig.name} mas não fornecida. Por favor, configure-a na seção "Configuração de IA".`;
      console.warn("[AI Service Warning]", errMessage);
      setError(new Error(errMessage));
      throw new Error(errMessage); // Throw for consistency
    }
    
    setIsLoading(true);
    setError(null);
    console.log(`[AI Service] Iniciando análise: ${analysisType} com ${currentProviderConfig.name}`);
    
    try {
      const standardizedPrompt = createFinancialAnalysisPrompt(
        analysisType,
        financialDataBundle,
        selectedProviderKey,
        options
      );
      
      const enhancedOptions = enhanceOptionsForProvider(options, currentProviderConfig, analysisType);
      
      // This call might return a string (success) or throw an error / return an error string.
      const rawResponseOrErrorString = await currentProviderConfig.callFunction(
        currentProviderConfig,
        standardizedPrompt,
        currentApiKey,
        enhancedOptions
      );
      
      // Check if callFunction returned an error string (our convention)
      if (typeof rawResponseOrErrorString === 'string' &&
         (rawResponseOrErrorString.startsWith("Erro:") || 
          rawResponseOrErrorString.startsWith("Falha") || 
          rawResponseOrErrorString.includes("API Key"))) {
        throw new Error(rawResponseOrErrorString);
      }
      
      const validatedResponse = validateAiResponse(rawResponseOrErrorString, analysisType);
      const finalStandardizedResponse = standardizeResponse(validatedResponse, analysisType, selectedProviderKey);
      
      setAnalysisHistory(prev => [...prev.slice(-19), {
        provider: selectedProviderKey, 
        analysisType, 
        timestamp: new Date().toISOString(),
        qualityScore: finalStandardizedResponse.qualityScore || 'desconhecida',
        promptLength: standardizedPrompt.length, 
        responseLength: rawResponseOrErrorString.length,
      }]);
      
      console.log(`[AI Service] Análise ${analysisType} concluída com sucesso com ${currentProviderConfig.name}.`);
      return finalStandardizedResponse.content;
      
    } catch (err) { // This catches errors thrown by callFunction or subsequent processing
      console.error(`[AI Service] ERRO FINAL durante análise ${analysisType} com ${currentProviderConfig.name}:`, err);
      setError(err); // Set the Error object
      throw err; // Re-throw the error object
    } finally {
      setIsLoading(false);
    }
  }, [currentProviderConfig, selectedProviderKey, enhanceOptionsForProvider]);

  const resetError = useCallback(() => setError(null), []);

  useEffect(() => { 
    setError(null); 
  }, [selectedProviderKey]);

  const getProviderInsights = useCallback(() => {
    const recentAnalyses = analysisHistory.filter(a => a.provider === selectedProviderKey).slice(-5);
    const qualityScores = recentAnalyses.map(a => a.qualityScore).filter(qs => typeof qs === 'number');
    const avgQuality = qualityScores.length > 0 ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length : 'N/A';
    return {
      totalAnalysesForProvider: analysisHistory.filter(a => a.provider === selectedProviderKey).length,
      averageRecentQuality: avgQuality,
      recommendedProviderForGeneral: DEFAULT_AI_PROVIDER
    };
  }, [analysisHistory, selectedProviderKey]);

  return {
    callAiAnalysis,
    isLoading,
    error, // This will be an Error object or null
    resetError,
    currentProviderConfig,
    selectedProviderKey,
    setSelectedProviderKey,
    analysisHistory,
    getProviderInsights
  };
}