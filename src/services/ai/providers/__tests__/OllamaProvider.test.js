// src/services/ai/providers/__tests__/OllamaProvider.test.js
import { OllamaProvider } from '../OllamaProvider';

global.fetch = jest.fn();

describe('OllamaProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OllamaProvider({});
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(provider.baseUrl).toBe('http://localhost:11434/api');
      expect(provider.defaultModel).toBe('llama2');
      expect(provider.apiKey).toBe('local');
    });

    it('should accept custom configuration', () => {
      const customProvider = new OllamaProvider({
        baseUrl: 'http://custom-ollama:8080/api',
        model: 'mistral',
        timeout: 120000,
      });

      expect(customProvider.baseUrl).toBe('http://custom-ollama:8080/api');
      expect(customProvider.defaultModel).toBe('mistral');
      expect(customProvider.timeout).toBe(120000);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities).toEqual({
        maxTokens: 4096,
        supportsStreaming: true,
        supportsVision: false,
        supportsFunctionCalling: false,
        models: expect.arrayContaining([
          'llama2',
          'mistral',
          'codellama',
          'neural-chat',
          'starling-lm',
          'orca-mini',
        ]),
        rateLimit: {
          requestsPerMinute: 100,
          tokensPerMinute: 50000,
        },
      });
    });
  });

  describe('complete', () => {
    const mockResponse = {
      response: 'Ollama local analysis',
      model: 'llama2',
      prompt_eval_count: 120,
      eval_count: 80,
      context: [1, 2, 3],
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
          maxTokens: 2000,
        },
      });

      expect(result).toEqual({
        content: 'Ollama local analysis',
        metadata: {
          provider: 'ollama',
          model: 'llama2',
          tokensUsed: 200,
          responseTime: expect.any(Number),
          usage: {
            prompt_tokens: 120,
            completion_tokens: 80,
            total_tokens: 200,
          },
          context: [1, 2, 3],
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should combine system prompt with user prompt', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'User question',
        systemPrompt: 'System instructions',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.prompt).toContain('System instructions');
      expect(callBody.prompt).toContain('User question');
    });

    it('should set stream to false', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.stream).toBe(false);
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('Ollama API failed');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow();
    });

    it('should throw error when no content in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ model: 'llama2' }),
      });

      await expect(provider.complete({
        prompt: 'Test',
        parameters: {},
      })).rejects.toThrow('No content in Ollama response');
    });

    it('should use custom model from parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockResponse, model: 'mistral' }),
      });

      await provider.complete({
        prompt: 'Test',
        parameters: { model: 'mistral' },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('mistral');
    });

    it('should configure generation options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await provider.complete({
        prompt: 'Test',
        parameters: {
          temperature: 0.7,
          maxTokens: 3000,
          topP: 0.95,
          topK: 50,
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.options).toEqual({
        temperature: 0.7,
        num_predict: 3000,
        top_p: 0.95,
        top_k: 50,
      });
    });
  });

  describe('extractData', () => {
    const mockSchema = {
      revenue: 'number',
      expenses: 'number',
    };

    it('should extract JSON data successfully', async () => {
      const jsonData = {
        revenue: 800000,
        expenses: 500000,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify(jsonData),
          model: 'llama2',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const result = await provider.extractData(
        'Revenue: 800k, Expenses: 500k',
        mockSchema,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
      expect(result.metadata.provider).toBe('ollama');
    });

    it('should extract JSON from mixed text', async () => {
      const jsonData = { revenue: 600000 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Here is the extracted data: ' + JSON.stringify(jsonData),
          model: 'llama2',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([jsonData]);
    });

    it('should handle extraction failures', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'No valid JSON here',
          model: 'llama2',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should apply 80% confidence ceiling for local models', async () => {
      const completeData = {
        revenue: 1000000,
        expenses: 600000,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify(completeData),
          model: 'llama2',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      // Even with 100% fill rate, confidence capped at 80%
      expect(result.confidence).toBe(0.8);
    });

    it('should handle array responses', async () => {
      const arrayData = [
        { revenue: 100000 },
        { revenue: 200000 },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify(arrayData),
          model: 'llama2',
          prompt_eval_count: 100,
          eval_count: 50,
        }),
      });

      const result = await provider.extractData('Content', mockSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(arrayData);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Ollama is available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama2' },
            { name: 'mistral' },
          ],
        }),
      });

      const result = await provider.healthCheck();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should return false when Ollama is unavailable', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await provider.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when no models available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      const result = await provider.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await provider.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('calculateExtractionConfidence', () => {
    const schema = {
      revenue: 'number',
      costs: 'number',
      profit: 'number',
    };

    it('should calculate confidence for complete data', () => {
      const data = {
        revenue: 1000,
        costs: 600,
        profit: 400,
      };

      const confidence = provider.calculateExtractionConfidence(data, schema);

      // 100% fill rate * 0.8 ceiling = 0.8
      expect(confidence).toBe(0.8);
    });

    it('should calculate confidence for partial data', () => {
      const data = {
        revenue: 1000,
        costs: null,
        profit: null,
      };

      const confidence = provider.calculateExtractionConfidence(data, schema);

      // 33% fill rate * 0.8 = ~0.267
      expect(confidence).toBeCloseTo(0.267, 2);
    });

    it('should return 0 for invalid data', () => {
      const confidence = provider.calculateExtractionConfidence(null, schema);
      expect(confidence).toBe(0);
    });

    it('should handle array data', () => {
      const data = [
        { revenue: 1000, costs: 600, profit: 400 },
        { revenue: 2000, costs: 1200, profit: 800 },
      ];

      const confidence = provider.calculateExtractionConfidence(data, schema);

      expect(confidence).toBe(0.8); // Full data with 80% ceiling
    });
  });

  describe('Error Handling & Retries', () => {
    it('should retry on timeout errors', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Success after retry',
            model: 'llama2',
            prompt_eval_count: 100,
            eval_count: 50,
          }),
        });

      const result = await provider.complete({
        prompt: 'Test',
        parameters: {},
      });

      expect(result.content).toBe('Success after retry');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
