/**
 * Integration Tests for AI Service
 * Tests the complete flow of AI analysis including multiple providers
 */

import { renderHook, act } from '@testing-library/react';
import { useAiService } from '../../hooks/useAiService';
import { ANALYSIS_TYPES } from '../../utils/aiAnalysisTypes';
import { createMockPeriodData } from '../utils/testDataFactories.comprehensive';
import * as aiProviders from '../../utils/aiProviders';

// Create mock response helper
const createMockResponse = (overrides = {}) => {
  return JSON.stringify({
    summary: 'Test analysis summary',
    keyInsights: ['Insight 1', 'Insight 2'],
    recommendations: ['Recommendation 1'],
    ...overrides,
  });
};

// Mock provider call functions
const mockGeminiCall = jest.fn();
const mockOpenAICall = jest.fn();
const mockClaudeCall = jest.fn();
const mockOllamaCall = jest.fn();

// Store original call functions for restoration
let originalCallFunctions = {};

// Setup mocks before tests
beforeAll(() => {
  // Store original functions
  originalCallFunctions = {
    gemini: aiProviders.AI_PROVIDERS.gemini.callFunction,
    openai: aiProviders.AI_PROVIDERS.openai.callFunction,
    claude: aiProviders.AI_PROVIDERS.claude.callFunction,
    ollama: aiProviders.AI_PROVIDERS.ollama.callFunction,
  };

  // Replace callFunction properties directly with mocks
  aiProviders.AI_PROVIDERS.gemini.callFunction = mockGeminiCall;
  aiProviders.AI_PROVIDERS.openai.callFunction = mockOpenAICall;
  aiProviders.AI_PROVIDERS.claude.callFunction = mockClaudeCall;
  aiProviders.AI_PROVIDERS.ollama.callFunction = mockOllamaCall;
});

// Restore original functions after all tests
afterAll(() => {
  aiProviders.AI_PROVIDERS.gemini.callFunction = originalCallFunctions.gemini;
  aiProviders.AI_PROVIDERS.openai.callFunction = originalCallFunctions.openai;
  aiProviders.AI_PROVIDERS.claude.callFunction = originalCallFunctions.claude;
  aiProviders.AI_PROVIDERS.ollama.callFunction = originalCallFunctions.ollama;
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

    // Set default mock implementations that return successful responses
    mockGeminiCall.mockResolvedValue(createMockResponse());
    mockOpenAICall.mockResolvedValue(createMockResponse());
    mockClaudeCall.mockResolvedValue(createMockResponse());
    mockOllamaCall.mockResolvedValue(createMockResponse());
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
      // Mock extraction response with proper format
      mockGeminiCall.mockResolvedValueOnce(
        JSON.stringify({
          success: true,
          extractedData: [
            { period: '2024-01', revenue: 1000000, expenses: 800000 },
            { period: '2024-02', revenue: 1100000, expenses: 850000 }
          ],
          confidence: 0.95
        })
      );

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
      // For extraction, response is returned as an object, not a string
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      expect(parsed.success).toBe(true);
      expect(parsed.extractedData).toBeInstanceOf(Array);
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
      mockGeminiCall.mockRejectedValueOnce(new Error('Network error'));

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
      mockGeminiCall.mockResolvedValueOnce('Invalid response');

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
      mockOpenAICall.mockRejectedValueOnce(new Error('Rate limit exceeded'));

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
      mockGeminiCall.mockRejectedValueOnce(new Error('Test error'));

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

      expect(mockGeminiCall).toHaveBeenCalledWith(
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

      expect(mockOpenAICall).toHaveBeenCalledWith(
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

      expect(mockOpenAICall).toHaveBeenCalledWith(
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
      const providers = [
        { key: 'gemini', mock: mockGeminiCall },
        { key: 'openai', mock: mockOpenAICall },
        { key: 'claude', mock: mockClaudeCall },
      ];

      for (const { key, mock } of providers) {
        const { result } = renderHook(() => useAiService(key));

        await act(async () => {
          await result.current.callAiAnalysis(
            ANALYSIS_TYPES.EXECUTIVE_SUMMARY,
            mockFinancialData,
            {},
            'test-api-key',
          );
        });

        expect(mock).toHaveBeenCalled();
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
      // Mock partial response - needs to be at least 50 characters
      mockGeminiCall.mockResolvedValueOnce(
        JSON.stringify({
          summary: 'This is a partial analysis response that contains only summary information without complete details.',
          // Missing keyInsights and recommendations
        })
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
      // Missing fields will be undefined (not defaulted to empty arrays)
      expect(parsed.keyInsights).toBeUndefined();
      expect(parsed.recommendations).toBeUndefined();
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
      expect(mockGeminiCall).toHaveBeenCalledTimes(3);
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