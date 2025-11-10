// src/components/AIPanel/EnhancedAIPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useEnhancedAiService } from '../../hooks/useEnhancedAiService';
import { AIProviderType, AnalysisType } from '../../services/ai/types';
import AiProviderSelector from '../InputPanel/AiProviderSelector';
import Button from '../ui/Button';

/**
 * Enhanced AI Panel with provider abstraction
 */
const EnhancedAIPanel = ({ 
  financialData, 
  companyInfo,
  onAnalysisComplete,
  className = '', 
}) => {
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [apiKeys, setApiKeys] = useState({});
  const [selectedProvider, setSelectedProvider] = useState(AIProviderType.GEMINI);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState('analysis');

  const aiService = useEnhancedAiService({
    defaultProvider: selectedProvider,
    autoInitialize: false,
  });

  // Initialize AI service when API keys are provided
  useEffect(() => {
    if (Object.keys(apiKeys).length > 0) {
      const providerConfigs = {};
      
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key) {
          providerConfigs[provider] = { apiKey: key };
        }
      });

      aiService.initialize(providerConfigs);
    }
  }, [apiKeys]);

  // Get recommendations when financial data changes
  const recommendations = aiService.getRecommendedAnalyses({ 
    calculatedData: financialData, 
    companyInfo, 
  });

  /**
   * Handle provider change
   */
  const handleProviderChange = useCallback((provider) => {
    setSelectedProvider(provider);
    if (aiService.isInitialized) {
      aiService.switchProvider(provider);
    }
  }, [aiService]);

  /**
   * Handle API key update
   */
  const handleApiKeyUpdate = useCallback((provider, key) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
  }, []);

  /**
   * Run selected analyses
   */
  const runAnalyses = useCallback(async () => {
    if (!aiService.isInitialized || selectedAnalyses.length === 0) return;

    const financialDataBundle = {
      calculatedData: financialData,
      companyInfo,
    };

    try {
      const result = await aiService.batchAnalyze(
        selectedAnalyses,
        financialDataBundle,
        { language: 'pt-BR' },
      );

      setResults(result.results);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.results);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [aiService, selectedAnalyses, financialData, companyInfo, onAnalysisComplete]);

  /**
   * Generate custom insights
   */
  const generateInsights = useCallback(async (focusAreas) => {
    if (!aiService.isInitialized) return;

    const financialDataBundle = {
      calculatedData: financialData,
      companyInfo,
    };

    try {
      const insights = await aiService.generateInsights(
        financialDataBundle,
        focusAreas,
      );

      setResults(prev => ({
        ...prev,
        insights,
      }));
    } catch (error) {
      console.error('Insight generation failed:', error);
    }
  }, [aiService, financialData, companyInfo]);

  /**
   * Toggle analysis selection
   */
  const toggleAnalysis = (analysisType) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisType)
        ? prev.filter(t => t !== analysisType)
        : [...prev, analysisType],
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          AI Financial Analysis
        </h2>
        <p className="text-gray-600">
          Powered by advanced AI for comprehensive financial insights
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-2 px-4 ${
            activeTab === 'analysis'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-4 ${
            activeTab === 'settings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2 px-4 ${
            activeTab === 'results'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Results
        </button>
      </div>

      {/* Content */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Provider Status */}
          {aiService.isInitialized && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✓ AI Service initialized with {Object.keys(aiService.providerStatus).length} providers
              </p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Recommended Analyses
              </h3>
              <div className="space-y-2">
                {recommendations.map(rec => (
                  <div
                    key={rec.type}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAnalyses.includes(rec.type)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleAnalysis(rec.type)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{rec.type}</p>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Types */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              All Analysis Types
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(AnalysisType).map(type => (
                <label
                  key={type}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAnalyses.includes(type)}
                    onChange={() => toggleAnalysis(type)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div className="flex justify-end">
            <Button
              onClick={runAnalyses}
              disabled={!aiService.isInitialized || selectedAnalyses.length === 0 || aiService.isLoading}
              variant="primary"
            >
              {aiService.isLoading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              AI Provider
            </h3>
            <AiProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={handleProviderChange}
              onApiKeyChange={handleApiKeyUpdate}
              currentApiKey={apiKeys[selectedProvider]}
            />
          </div>

          {/* Provider Capabilities */}
          {aiService.isInitialized && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Provider Capabilities
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  const capabilities = aiService.getProviderCapabilities(selectedProvider);
                  if (!capabilities) return <p>No capabilities available</p>;
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <p>Max Tokens: {capabilities.maxTokens}</p>
                      <p>Streaming: {capabilities.supportsStreaming ? '✓' : '✗'}</p>
                      <p>Vision: {capabilities.supportsVision ? '✓' : '✗'}</p>
                      <p>Models: {capabilities.models.join(', ')}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Provider Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Provider Performance
            </h3>
            <div className="space-y-2">
              {Object.entries(aiService.getProviderMetrics()).map(([provider, metrics]) => (
                <div key={provider} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium">{provider}</p>
                  <div className="text-sm text-gray-600">
                    <p>Total: {metrics.total}</p>
                    <p>Success Rate: {(metrics.successRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          {Object.entries(results).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No analysis results yet. Run an analysis to see results here.
            </p>
          ) : (
            Object.entries(results).map(([type, result]) => (
              <div key={type} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">{type}</h3>
                <div className="prose max-w-none">
                  {typeof result.content === 'string' ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: result.content }}
                      className="whitespace-pre-wrap"
                    />
                  ) : (
                    <pre className="bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Error Display */}
      {aiService.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {aiService.error.message}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIPanel;