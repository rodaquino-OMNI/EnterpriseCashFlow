/**
 * Integration Tests for AI Service
 * Tests the complete flow of AI analysis including multiple providers
 */

import { renderHook, act } from '@testing-library/react';
import { useAiService } from '../../hooks/useAiService';
import { ANALYSIS_TYPES } from '../../utils/aiAnalysisTypes';
import { createMockPeriodData } from '../utils/testDataFactories.comprehensive';

// Mock the AI providers module
jest.mock('../../utils/aiProviders', () => {
  const originalModule = jest.requireActual('../../utils/aiProviders');
  
  const mockCallGemini = jest.fn().mockResolvedValue(
    JSON.stringify({
      summary: 'Test analysis summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1'],
    }),
  );
  
  const mockCallOpenAI = jest.fn().mockResolvedValue(
    JSON.stringify({
      summary: 'Test analysis summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1'],
    }),
  );
  
  const mockCallClaude = jest.fn().mockResolvedValue(
    JSON.stringify({
      summary: 'Test analysis summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1'],
    }),
  );
  
  const mockCallOllama = jest.fn().mockResolvedValue(
    JSON.stringify({
      summary: 'Test analysis summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1'],
    }),
  );

  return {
    ...originalModule,
    AI_PROVIDERS: {
      ...originalModule.AI_PROVIDERS,
      gemini: {
        ...originalModule.AI_PROVIDERS.gemini,
        callFunction: mockCallGemini,
      },
      openai: {
        ...originalModule.AI_PROVIDERS.openai,
        callFunction: mockCallOpenAI,
      },
      claude: {
        ...originalModule.AI_PROVIDERS.claude,
        callFunction: mockCallClaude,
      },
      ollama: {
        ...originalModule.AI_PROVIDERS.ollama,
        callFunction: mockCallOllama,
      },
    },
  };
});

describe('AI Service Integration Tests', () => {
  const mockFinancialData = {
    calculatedData: [
      createMockPeriodData({ periodIndex: 0 }),
      createMockPeriodData({ periodIndex: 1 }),
      createMockPeriodData({ periodIndex: 2 }),
      createMockPeriodData({ periodIndex: 3 }),
    ],
    companyInfo: {
      name: 'Test Company Ltd.',
      industry: 'Technology',
      context: 'B2B SaaS company',
    },
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Provider Configuration', () => {
    it('should initialize with default provider', () => {
      const { result } = renderHook(() => useAiService());
      
      expect(result.current.selectedProviderKey).toBe('gemini');
      expect(result.current.currentProviderConfig).toBeDefined();
      expect(result.current.currentProviderConfig.name).toContain('Gemini');
    });

    it('should allow provider switching', () => {
      const { result } = renderHook(() => useAiService());
      
      act(() => {
        result.current.setSelectedProviderKey('openai');
      });

      expect(result.current.selectedProviderKey).toBe('openai');
      expect(result.current.currentProviderConfig.name).toContain('OpenAI');
    });

    it('should handle invalid provider gracefully', async () => {
      const { result } = renderHook(() => useAiService('invalid-provider'));
      
      await expect(async () => {
        await act(async () => {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
          );
        });
      }).rejects.toThrow('Provedor AI não configurado');
    });
  });

  describe('API Key Validation', () => {
    it('should require API key for providers that need it', async () => {
      const { result } = renderHook(() => useAiService('openai'));
      
      await expect(async () => {
        await act(async () => {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            '', // Empty API key
          );
        });
      }).rejects.toThrow('Chave API necessária');
    });

    it('should not require API key for local providers', async () => {
      const { result } = renderHook(() => useAiService('ollama'));

      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
        );
      });

      expect(response).toBeTruthy();
      expect(response).toContain('summary');
    });
  });

  describe('Analysis Types', () => {
    it('should handle executive summary analysis', async () => {
      const { result } = renderHook(() => useAiService('gemini'));
      
      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      expect(response).toContain('summary');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle variance analysis', async () => {
      const { result } = renderHook(() => useAiService('gemini'));
      
      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.VARIANCE_ANALYSIS,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      expect(response).toBeTruthy();
      expect(response).toContain('summary');
    });

    it('should handle financial data extraction from PDF', async () => {
      const { result } = renderHook(() => useAiService('gemini'));
      
      const dataWithPdf = {
        ...mockFinancialData,
        pdfText: 'Revenue: $1,000,000\nExpenses: $800,000\nNet Income: $200,000',
      };

      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION,
          dataWithPdf,
          { temperature: 0.1 },
          'test-api-key',
        );
      });

      expect(response).toBeTruthy();
      expect(response).toContain('summary');
    });

    it('should handle risk assessment analysis', async () => {
      const { result } = renderHook(() => useAiService('gemini'));
      
      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.RISK_ASSESSMENT,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      expect(response).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock the provider function to reject
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      AI_PROVIDERS.gemini.callFunction.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAiService('gemini'));

      await act(async () => {
        try {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toContain('Falha na análise executive_summary');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle malformed API responses', async () => {
      // Mock the provider function to return invalid response
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      AI_PROVIDERS.gemini.callFunction.mockResolvedValueOnce('Invalid response');

      const { result } = renderHook(() => useAiService('gemini'));

      await act(async () => {
        try {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle rate limiting', async () => {
      // Mock the provider function to return rate limit error
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      AI_PROVIDERS.openai.callFunction.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const { result } = renderHook(() => useAiService('openai'));

      await act(async () => {
        try {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error.message).toContain('Falha na análise executive_summary');
    });

    it('should reset error state', async () => {
      // Create an error first
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      AI_PROVIDERS.gemini.callFunction.mockRejectedValueOnce(new Error('Test error'));
      
      const { result } = renderHook(() => useAiService('gemini'));
      
      await act(async () => {
        try {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Reset error
      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Request Options', () => {
    it('should apply temperature settings correctly', async () => {
      const { result } = renderHook(() => useAiService('gemini'));

      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          { temperature: 0.8 },
          'test-api-key',
        );
      });

      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      expect(AI_PROVIDERS.gemini.callFunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'test-api-key',
        expect.objectContaining({ temperature: 0.8 }),
      );
    });

    it('should respect max tokens limit', async () => {
      const { result } = renderHook(() => useAiService('openai'));

      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          { maxTokens: 1000 },
          'test-api-key',
        );
      });

      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      expect(AI_PROVIDERS.openai.callFunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'test-api-key',
        expect.objectContaining({ maxTokens: 1000 }),
      );
    });

    it('should use provider-specific model when specified', async () => {
      const { result } = renderHook(() => useAiService('openai'));

      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          { model: 'gpt-4' },
          'test-api-key',
        );
      });

      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      expect(AI_PROVIDERS.openai.callFunction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'test-api-key',
        expect.objectContaining({ model: 'gpt-4' }),
      );
    });
  });

  describe('Analysis History', () => {
    it('should track analysis history', async () => {
      const { result } = renderHook(() => useAiService('gemini'));

      // Perform multiple analyses
      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.VARIANCE_ANALYSIS,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      expect(result.current.analysisHistory).toHaveLength(2);
      expect(result.current.analysisHistory[0].analysisType).toBe(ANALYSIS_TYPES.EXECUTIVE_SUMMARY);
      expect(result.current.analysisHistory[1].analysisType).toBe(ANALYSIS_TYPES.VARIANCE_ANALYSIS);
    });

    it('should provide provider insights', async () => {
      const { result } = renderHook(() => useAiService('gemini'));

      // Perform analysis
      await act(async () => {
        await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      const insights = result.current.getProviderInsights();
      
      expect(insights.totalAnalysesForProvider).toBeGreaterThan(0);
      expect(insights.recommendedProviderForGeneral).toBeTruthy();
    });
  });

  describe('Multi-Provider Support', () => {
    it('should format requests correctly for different providers', async () => {
      const providers = ['gemini', 'openai', 'claude'];
      
      for (const provider of providers) {
        const { result } = renderHook(() => useAiService(provider));

        await act(async () => {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        });

        const { AI_PROVIDERS } = require('../../utils/aiProviders');
        expect(AI_PROVIDERS[provider].callFunction).toHaveBeenCalled();
      }
    });
  });

  describe('Response Validation', () => {
    it('should validate and standardize AI responses', async () => {
      const { result } = renderHook(() => useAiService('gemini'));

      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      const parsed = JSON.parse(response);
      expect(parsed.summary).toBeTruthy();
      expect(parsed.keyInsights).toBeInstanceOf(Array);
      expect(parsed.recommendations).toBeInstanceOf(Array);
    });

    it('should handle responses with missing fields', async () => {
      // Mock partial response
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      AI_PROVIDERS.gemini.callFunction.mockResolvedValueOnce(
        JSON.stringify({
          summary: 'Partial analysis',
          // Missing keyInsights and recommendations
        }),
      );

      const { result } = renderHook(() => useAiService('gemini'));

      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          mockFinancialData,
          {},
          'test-api-key',
        );
      });

      const parsed = JSON.parse(response);
      expect(parsed.summary).toBeTruthy();
      // Should have default empty arrays for missing fields
      expect(parsed.keyInsights).toEqual([]);
      expect(parsed.recommendations).toEqual([]);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent requests', async () => {
      const { result } = renderHook(() => useAiService('gemini'));

      // Launch multiple concurrent requests
      const promises = [];
      await act(async () => {
        promises.push(
          result.current.callAiAnalysis(ANALYSIS_TYPES.EXECUTIVE_SUMMARY, mockFinancialData, {}, 'key'),
          result.current.callAiAnalysis(ANALYSIS_TYPES.VARIANCE_ANALYSIS, mockFinancialData, {}, 'key'),
          result.current.callAiAnalysis(ANALYSIS_TYPES.RISK_ASSESSMENT, mockFinancialData, {}, 'key'),
        );
      });

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      const { AI_PROVIDERS } = require('../../utils/aiProviders');
      expect(AI_PROVIDERS.gemini.callFunction).toHaveBeenCalledTimes(3);
    });

    it('should handle large financial datasets', async () => {
      const { result } = renderHook(() => useAiService('gemini'));
      
      // Create large dataset
      const largeDataset = {
        calculatedData: Array.from({ length: 100 }, (_, i) => 
          createMockPeriodData({ periodIndex: i }),
        ),
        companyInfo: mockFinancialData.companyInfo,
      };

      const startTime = Date.now();
      
      let response;
      await act(async () => {
        response = await result.current.callAiAnalysis(
          ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
          largeDataset,
          {},
          'test-api-key',
        );
      });

      const endTime = Date.now();
      
      expect(response).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});