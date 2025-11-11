// src/services/ai/providers/__tests__/ClaudeProvider.test.js
import { ClaudeProvider } from '../ClaudeProvider';
import { ResponseFormat } from '../../types';

// Mock global fetch
global.fetch = jest.fn();

describe('ClaudeProvider', () => {
  let provider;
  const mockApiKey = 'test-claude-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new ClaudeProvider({ apiKey: mockApiKey });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(provider.apiKey).toBe(mockApiKey);
      expect(provider.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(provider.defaultModel).toBe('claude-3-5-sonnet-20241022'); // Updated to 2025 model
      expect(provider.anthropicVersion).toBe('2023-06-01');
    });

    it('should accept custom configuration', () => {
      const customProvider = new ClaudeProvider({
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        model: 'claude-3-opus-20240229',
        anthropicVersion: '2024-01-01',
        timeout: 120000,
        maxRetries: 5,
      });

      expect(customProvider.apiKey).toBe('custom-key');
      expect(customProvider.baseUrl).toBe('https://custom.api.com');
      expect(customProvider.defaultModel).toBe('claude-3-opus-20240229');
      expect(customProvider.anthropicVersion).toBe('2024-01-01');
      expect(customProvider.timeout).toBe(120000);
      expect(customProvider.maxRetries).toBe(5);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities).toEqual({
        maxTokens: 200000,
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: false,
        models: expect.arrayContaining([
          'claude-3-5-sonnet-20241022', // 2025 model
          'claude-3-5-sonnet-20240620',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ]),
        rateLimit: {
          requestsPerMinute: 50,
          tokensPerMinute: 100000,
        },
      });
    });
  });

  describe('complete', () => {
    const mockResponse = {
      content: [{
        type: 'text',
        text: 'Financial analysis response',
      }],
      model: 'claude-3-opus-20240229',
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
      },
      stop_reason: 'end_turn',
    };

    it('should make successful API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.complete({
        prompt: 'Analyze this financial data',
        parameters: {
          temperature: 0.3,
          maxTokens: 4000,
        },
      });

      expect(result).toEqual({
        content: 'Financial analysis response',
        metadata: {
          provider: 'claude',
          model: 'claude-3-opus-20240229',
          tokensUsed: 150,
          responseTime: expect.any(Number),
          usage: mockResponse.usage,
          stopReason: 'end_turn',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': mockApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: expect.stringContaining('Analyze this financial data'),
        }),
      );
    });

    it('should use custom system prompt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test prompt',
        systemPrompt: 'Custom system instructions',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('Custom system instructions');
    });

    it('should use default system prompt when not provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test prompt',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.system).toContain('financial analyst assistant');
    });

    it('should handle API errors with status code', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            type: 'rate_limit_error',
            message: 'Rate limit exceeded',
          },
        }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('Claude API failed');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow();
    });

    it('should throw error when no content in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [] }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('No content in Claude response');
    });

    it('should validate API key before request', async () => {
      const noKeyProvider = new ClaudeProvider({ apiKey: '' });

      await expect(noKeyProvider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('API key is required');
    });

    it('should use custom model from parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: { model: 'claude-3-haiku-20240307' },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('claude-3-haiku-20240307');
    });
  });

  describe('extractData', () => {
    const mockSchema = {
      revenue: 'number',
      profit: 'number',
      margin: 'number',
    };

    it('should extract structured data successfully', async () => {
      const extractedJson = {
        revenue: 1000000,
        profit: 200000,
        margin: 0.20,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify(extractedJson),
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 200 },
        }),
      });

      const result = await provider.extractData(
        'Revenue: R$ 1.000.000, Profit: R$ 200.000',
        mockSchema,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([extractedJson]);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata.provider).toBe('claude');
    });

    it('should extract JSON from markdown code blocks', async () => {
      const jsonData = { revenue: 500000 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: '```json\n' + JSON.stringify(jsonData) + '\n```',
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 150 },
        }),
      });

      const result = await provider.extractData('Test content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
    });

    it('should find JSON in mixed text response', async () => {
      const jsonData = { revenue: 750000 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: 'Here is the data: ' + JSON.stringify(jsonData) + ' extracted successfully',
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 180 },
        }),
      });

      const result = await provider.extractData('Test content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
    });

    it('should handle extraction failures gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: 'No JSON data here',
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 100 },
        }),
      });

      const result = await provider.extractData('Bad content', mockSchema);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should calculate extraction confidence accurately', async () => {
      const partialData = {
        revenue: 1000000,
        profit: null,
        margin: 0.15,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify(partialData),
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 150 },
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1);
    });

    it('should handle array responses', async () => {
      const arrayData = [
        { revenue: 1000 },
        { revenue: 2000 },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify(arrayData),
          }],
          model: 'claude-3-opus-20240229',
          usage: { total_tokens: 150 },
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(arrayData);
    });
  });

  describe('calculateExtractionConfidence', () => {
    const schema = {
      revenue: 'number',
      profit: 'number',
      name: 'string',
      margin: 'number',
    };

    it('should return high confidence for complete data', () => {
      const data = {
        revenue: 1000000,
        profit: 200000,
        name: 'Test Company',
        margin: 0.20,
      };

      const confidence = provider.calculateExtractionConfidence(data, schema);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should return medium confidence for partial data', () => {
      const data = {
        revenue: 1000000,
        profit: null,
        name: 'Test Company',
        margin: null,
      };

      const confidence = provider.calculateExtractionConfidence(data, schema);
      expect(confidence).toBeGreaterThan(0.3);
      expect(confidence).toBeLessThanOrEqual(0.7);
    });

    it('should return zero confidence for invalid data', () => {
      const confidence = provider.calculateExtractionConfidence(null, schema);
      expect(confidence).toBe(0);
    });

    it('should handle nested schema', () => {
      const nestedSchema = {
        company: {
          name: 'string',
          revenue: 'number',
        },
      };

      const data = {
        company: {
          name: 'Test',
          revenue: 5000,
        },
      };

      const confidence = provider.calculateExtractionConfidence(data, nestedSchema);
      expect(confidence).toBeGreaterThan(0);
    });
  });

  describe('Error Handling & Retries', () => {
    it('should retry on retryable errors', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [{ text: 'Success after retry' }],
            model: 'claude-3-opus-20240229',
            usage: { total_tokens: 100 },
          }),
        });

      const result = await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      expect(result.content).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect timeout configuration', async () => {
      const shortTimeoutProvider = new ClaudeProvider({
        apiKey: mockApiKey,
        timeout: 100,
      });

      global.fetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 200)),
      );

      await expect(shortTimeoutProvider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow();
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers', () => {
      const headers = provider.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-api-key': mockApiKey,
        'anthropic-version': '2023-06-01',
      });
    });
  });
});
