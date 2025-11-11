// src/services/ai/providers/__tests__/GeminiProvider.test.js
import { GeminiProvider } from '../GeminiProvider';

global.fetch = jest.fn();

describe('GeminiProvider', () => {
  let provider;
  const mockApiKey = 'test-gemini-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GeminiProvider({ apiKey: mockApiKey });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(provider.apiKey).toBe(mockApiKey);
      expect(provider.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta/models');
      expect(provider.defaultModel).toBe('gemini-1.5-pro-latest');
      expect(provider.useProxy).toBe(false);
    });

    it('should support proxy configuration', () => {
      const proxyProvider = new GeminiProvider({
        apiKey: mockApiKey,
        useProxy: true,
        proxyUrl: 'https://my-proxy.com/?',
      });

      expect(proxyProvider.useProxy).toBe(true);
      expect(proxyProvider.proxyUrl).toBe('https://my-proxy.com/?');
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities).toEqual({
        maxTokens: 8192,
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: true,
        models: expect.arrayContaining([
          'gemini-1.5-pro-latest',
          'gemini-1.5-pro',
          'gemini-pro',
          'gemini-pro-vision',
        ]),
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 1000000,
        },
      });
    });
  });

  describe('complete', () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: 'Gemini financial analysis',
          }],
          role: 'model',
        },
        finishReason: 'STOP',
        safetyRatings: [],
      }],
      usageMetadata: {
        promptTokenCount: 90,
        candidatesTokenCount: 70,
        totalTokenCount: 160,
      },
    };

    it('should make successful API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.complete({
        prompt: 'Analyze data',
        parameters: {
          temperature: 0.4,
          maxTokens: 4096,
        },
      });

      expect(result).toEqual({
        content: 'Gemini financial analysis',
        metadata: {
          provider: 'gemini',
          model: 'gemini-1.5-pro-latest',
          tokensUsed: 160,
          responseTime: expect.any(Number),
          usage: mockResponse.usageMetadata,
          finishReason: 'STOP',
          safetyRatings: [],
        },
      });
    });

    it('should combine system prompt with user prompt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'User message',
        systemPrompt: 'System context',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.contents[0].parts[0].text).toContain('System context');
      expect(callBody.contents[0].parts[0].text).toContain('User message');
    });

    it('should handle content filtering', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          promptFeedback: {
            blockReason: 'SAFETY',
          },
        }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('Content blocked by Gemini: SAFETY');
    });

    it('should handle finish reason errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            finishReason: 'MAX_TOKENS',
          }],
        }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('Generation stopped: MAX_TOKENS');
    });

    it('should include safety settings in request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.safetySettings).toBeDefined();
      expect(callBody.safetySettings).toHaveLength(4);
    });

    it('should build API URL correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const apiUrl = global.fetch.mock.calls[0][0];
      expect(apiUrl).toContain('gemini-1.5-pro-latest:generateContent');
      expect(apiUrl).toContain(`key=${mockApiKey}`);
    });

    it('should use proxy URL when configured', async () => {
      const proxyProvider = new GeminiProvider({
        apiKey: mockApiKey,
        useProxy: true,
        proxyUrl: 'https://proxy.io/?',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await proxyProvider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const apiUrl = global.fetch.mock.calls[0][0];
      expect(apiUrl).toContain('https://proxy.io/?');
    });

    it('should validate API key', async () => {
      const noKeyProvider = new GeminiProvider({ apiKey: '' });

      await expect(noKeyProvider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('API key is required');
    });
  });

  describe('extractData', () => {
    const mockSchema = {
      revenue: 'number',
      costs: 'number',
      profit: 'number',
    };

    it('should extract JSON data successfully', async () => {
      const jsonData = {
        revenue: 1000000,
        costs: 600000,
        profit: 400000,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(jsonData),
              }],
            },
            finishReason: 'STOP',
          }],
          usageMetadata: { totalTokenCount: 200 },
        }),
      });

      const result = await provider.extractData(
        'Revenue: R$ 1.000.000',
        mockSchema,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract from markdown code blocks', async () => {
      const jsonData = { revenue: 750000 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: '```json\n' + JSON.stringify(jsonData) + '\n```',
              }],
            },
            finishReason: 'STOP',
          }],
          usageMetadata: { totalTokenCount: 150 },
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
    });

    it('should handle extraction failures', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API error'));

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should calculate confidence with fill rate and validation', async () => {
      const partialData = {
        revenue: 1000000,
        costs: null,
        profit: 400000,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(partialData) }],
            },
            finishReason: 'STOP',
          }],
          usageMetadata: { totalTokenCount: 150 },
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      // 2 of 3 fields filled = 66% fill rate
      // Weighted: 70% fill + 30% valid = confidence
      expect(result.confidence).toBeGreaterThan(0.4);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('getSafetySettings', () => {
    it('should return all safety categories', () => {
      const settings = provider.getSafetySettings();

      expect(settings).toHaveLength(4);
      expect(settings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
          }),
          expect.objectContaining({
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          }),
        ]),
      );
    });
  });

  describe('buildApiUrl', () => {
    it('should build URL without proxy', () => {
      const url = provider.buildApiUrl('gemini-pro');

      expect(url).toBe(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${mockApiKey}`,
      );
    });

    it('should build URL with proxy', () => {
      const proxyProvider = new GeminiProvider({
        apiKey: mockApiKey,
        useProxy: true,
        proxyUrl: 'https://cors.io/?',
      });

      const url = proxyProvider.buildApiUrl('gemini-pro');

      expect(url).toContain('https://cors.io/?');
      expect(url).toContain('gemini-pro:generateContent');
    });
  });

  describe('Error Handling', () => {
    it('should retry on retryable errors', async () => {
      // Reduce retries to 1 for this test to avoid timeout
      const quickProvider = new GeminiProvider({
        apiKey: mockApiKey,
        maxRetries: 1,
        retryDelay: 10,
      });

      global.fetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: { parts: [{ text: 'Success after retry' }] },
              finishReason: 'STOP',
            }],
            usageMetadata: { totalTokenCount: 100 },
          }),
        });

      const result = await quickProvider.complete({
        prompt: 'Test',
        parameters: {},
      });

      expect(result.content).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
