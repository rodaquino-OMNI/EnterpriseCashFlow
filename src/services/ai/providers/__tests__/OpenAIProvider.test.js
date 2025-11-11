// src/services/ai/providers/__tests__/OpenAIProvider.test.js
import { OpenAIProvider } from '../OpenAIProvider';
import { ResponseFormat } from '../../types';

global.fetch = jest.fn();

describe('OpenAIProvider', () => {
  let provider;
  const mockApiKey = 'test-openai-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider({ apiKey: mockApiKey });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(provider.apiKey).toBe(mockApiKey);
      expect(provider.baseUrl).toBe('https://api.openai.com/v1');
      expect(provider.defaultModel).toBe('gpt-4-turbo');
    });

    it('should accept organization ID', () => {
      const orgProvider = new OpenAIProvider({
        apiKey: mockApiKey,
        organizationId: 'org-123',
      });

      expect(orgProvider.organizationId).toBe('org-123');
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities).toEqual({
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: true,
        supportsFunctionCalling: true,
        models: expect.arrayContaining([
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-4-vision-preview',
        ]),
        rateLimit: {
          requestsPerMinute: 500,
          tokensPerMinute: 150000,
        },
      });
    });
  });

  describe('complete', () => {
    const mockResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: 'OpenAI financial analysis',
        },
        finish_reason: 'stop',
      }],
      model: 'gpt-4-turbo',
      usage: {
        prompt_tokens: 80,
        completion_tokens: 60,
        total_tokens: 140,
      },
    };

    it('should make successful API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await provider.complete({
        prompt: 'Analyze financial data',
        parameters: {
          temperature: 0.3,
          maxTokens: 4000,
        },
      });

      expect(result).toEqual({
        content: 'OpenAI financial analysis',
        metadata: {
          provider: 'openai',
          model: 'gpt-4-turbo',
          tokensUsed: 140,
          responseTime: expect.any(Number),
          usage: mockResponse.usage,
          finishReason: 'stop',
        },
      });
    });

    it('should format messages correctly with system prompt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'User message',
        systemPrompt: 'Custom system prompt',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.messages).toHaveLength(2);
      expect(callBody.messages[0].role).toBe('system');
      expect(callBody.messages[0].content).toBe('Custom system prompt');
      expect(callBody.messages[1].role).toBe('user');
      expect(callBody.messages[1].content).toBe('User message');
    });

    it('should use default system prompt when not provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('financial analyst');
    });

    it('should handle JSON response format', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Extract data',
        parameters: {
          responseFormat: ResponseFormat.JSON,
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.response_format).toEqual({ type: 'json_object' });
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
          },
        }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('OpenAI API failed');
    });

    it('should validate API key', async () => {
      const noKeyProvider = new OpenAIProvider({ apiKey: '' });

      await expect(noKeyProvider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('API key is required');
    });

    it('should include organization header when configured', async () => {
      const orgProvider = new OpenAIProvider({
        apiKey: mockApiKey,
        organizationId: 'org-test',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await orgProvider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const headers = global.fetch.mock.calls[0][1].headers;
      expect(headers['OpenAI-Organization']).toBe('org-test');
    });
  });

  describe('extractData', () => {
    const mockSchema = {
      revenue: 'number',
      expenses: 'number',
    };

    it('should extract JSON data successfully', async () => {
      const jsonData = {
        revenue: 500000,
        expenses: 300000,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(jsonData),
            },
            finish_reason: 'stop',
          }],
          model: 'gpt-4-turbo',
          usage: { total_tokens: 200 },
        }),
      });

      const result = await provider.extractData(
        'Revenue: $500k, Expenses: $300k',
        mockSchema,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
      expect(result.metadata.provider).toBe('openai');
    });

    it('should handle extraction errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should calculate confidence based on field completion', async () => {
      const partialData = {
        revenue: 500000,
        expenses: null,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: JSON.stringify(partialData) },
          }],
          model: 'gpt-4-turbo',
          usage: { total_tokens: 150 },
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.confidence).toBe(0.5); // 1 of 2 fields filled
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers without organization', () => {
      const headers = provider.getHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockApiKey}`,
      });
    });

    it('should include organization header when set', () => {
      const orgProvider = new OpenAIProvider({
        apiKey: mockApiKey,
        organizationId: 'org-456',
      });

      const headers = orgProvider.getHeaders();

      expect(headers['OpenAI-Organization']).toBe('org-456');
    });
  });

  describe('formatMessages', () => {
    it('should format messages with system and user roles', () => {
      const messages = provider.formatMessages({
        prompt: 'User prompt',
        systemPrompt: 'System instructions',
      });

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        role: 'system',
        content: 'System instructions',
      });
      expect(messages[1]).toEqual({
        role: 'user',
        content: 'User prompt',
      });
    });
  });

  describe('Error Handling', () => {
    it('should retry on 429 rate limit', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }],
            model: 'gpt-4-turbo',
            usage: { total_tokens: 100 },
          }),
        });

      const result = await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      expect(result.content).toBe('Success');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
