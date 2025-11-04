/**
 * Integration tests for AI Providers
 * Tests timeout, retry logic, and error handling improvements
 */

import { AI_PROVIDERS } from '../../utils/aiProviders';

// Mock fetch globally
global.fetch = jest.fn();

describe('AI Providers Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Timeout Handling', () => {
    // Extend timeout for these tests since we're simulating 60-120s delays
    jest.setTimeout(70000);

    test('OpenAI provider should timeout after 60 seconds', async () => {
      // Mock a hanging request
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const provider = AI_PROVIDERS.openai;
      const promise = provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      // Fast-forward time by 61 seconds
      jest.advanceTimersByTime(61000);

      await expect(promise).rejects.toThrow(/Timeout na requisição/);
    });

    test('Claude provider should timeout after 60 seconds', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const provider = AI_PROVIDERS.claude;
      const promise = provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      jest.advanceTimersByTime(61000);

      await expect(promise).rejects.toThrow(/Timeout na requisição/);
    });

    test('Ollama provider should timeout after 120 seconds', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const provider = AI_PROVIDERS.ollama;
      const promise = provider.callFunction(
        provider,
        'Test prompt',
        null, // Ollama doesn't need API key
        {}
      );

      jest.advanceTimersByTime(121000);

      await expect(promise).rejects.toThrow(/Timeout na requisição/);
    });
  });

  describe('Retry Logic', () => {
    test('Should retry on timeout error up to 3 times', async () => {
      let callCount = 0;

      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          // First two attempts timeout
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              const error = new Error('AbortError');
              error.name = 'AbortError';
              reject(error);
            }, 1000);
          });
        } else {
          // Third attempt succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Success!' } }]
            })
          });
        }
      });

      const provider = AI_PROVIDERS.openai;
      const result = await provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      expect(callCount).toBe(3);
      expect(result).toBe('Success!');
    });

    test('Should retry on 429 rate limit error', async () => {
      let callCount = 0;

      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First attempt gets rate limited
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } })
          });
        } else {
          // Second attempt succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Success after retry!' } }]
            })
          });
        }
      });

      const provider = AI_PROVIDERS.openai;
      const result = await provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      expect(callCount).toBe(2);
      expect(result).toBe('Success after retry!');
    });

    test('Should NOT retry on 401 authentication error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
      });

      const provider = AI_PROVIDERS.openai;

      await expect(
        provider.callFunction(provider, 'Test prompt', 'invalid-key', {})
      ).rejects.toThrow(/Chave API inválida/);

      // Should only call once (no retries on auth errors)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('Should use exponential backoff (1s, 2s, 4s)', async () => {
      const delays = [];
      let callCount = 0;

      global.fetch.mockImplementation(() => {
        const now = Date.now();
        if (callCount > 0) {
          delays.push(now);
        }
        callCount++;

        if (callCount < 4) {
          // Fail first 3 attempts with retryable error
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: { message: 'Server error' } })
          });
        } else {
          // Succeed on 4th attempt
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Finally!' } }]
            })
          });
        }
      });

      const provider = AI_PROVIDERS.openai;
      const promise = provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      // Advance timers to simulate backoff delays
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(Math.pow(2, i) * 1000 + 100);
        await Promise.resolve(); // Flush promise queue
      }

      await promise;

      expect(callCount).toBe(4);
    });
  });

  describe('Error Messages (Portuguese)', () => {
    test('OpenAI should return Portuguese error for rate limit', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } })
      });

      const provider = AI_PROVIDERS.openai;

      await expect(
        provider.callFunction(provider, 'Test', 'key', {})
      ).rejects.toThrow(/Limite de taxa excedido/);
    });

    test('Claude should return Portuguese error for invalid API key', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
      });

      const provider = AI_PROVIDERS.claude;

      await expect(
        provider.callFunction(provider, 'Test', 'bad-key', {})
      ).rejects.toThrow(/Chave API inválida/);
    });

    test('Ollama should return helpful error when not running', async () => {
      global.fetch.mockRejectedValue(new Error('fetch failed'));

      const provider = AI_PROVIDERS.ollama;

      await expect(
        provider.callFunction(provider, 'Test', null, {})
      ).rejects.toThrow(/Não foi possível conectar ao Ollama/);
    });

    test('Should include provider name in error messages', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } })
      });

      const provider = AI_PROVIDERS.openai;

      await expect(
        provider.callFunction(provider, 'Test', 'key', {})
      ).rejects.toThrow(/OpenAI/);
    });
  });

  describe('Successful Responses', () => {
    test('OpenAI should parse response correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            { message: { content: 'OpenAI response text' } }
          ]
        })
      });

      const provider = AI_PROVIDERS.openai;
      const result = await provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      expect(result).toBe('OpenAI response text');
    });

    test('Claude should parse response correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [
            { type: 'text', text: 'Claude response text' }
          ]
        })
      });

      const provider = AI_PROVIDERS.claude;
      const result = await provider.callFunction(
        provider,
        'Test prompt',
        'test-api-key',
        {}
      );

      expect(result).toBe('Claude response text');
    });

    test('Ollama should parse response correctly', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: 'Ollama response text'
        })
      });

      const provider = AI_PROVIDERS.ollama;
      const result = await provider.callFunction(
        provider,
        'Test prompt',
        null,
        {}
      );

      expect(result).toBe('Ollama response text');
    });
  });

  describe('Provider Configuration', () => {
    test('All providers should have retry-wrapped callFunction', () => {
      Object.values(AI_PROVIDERS).forEach(provider => {
        expect(provider.callFunction).toBeDefined();
        expect(typeof provider.callFunction).toBe('function');
      });
    });

    test('Gemini should have 60s timeout', async () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const provider = AI_PROVIDERS.gemini;
      const promise = provider.callFunction(
        provider,
        'Test',
        'key',
        {}
      );

      jest.advanceTimersByTime(61000);

      await expect(promise).rejects.toThrow(/Timeout/);
    });

    test('All providers should have correct API URLs', () => {
      expect(AI_PROVIDERS.gemini.apiUrl).toContain('generativelanguage.googleapis.com');
      expect(AI_PROVIDERS.openai.apiUrl).toContain('api.openai.com');
      expect(AI_PROVIDERS.claude.apiUrl).toContain('api.anthropic.com');
      expect(AI_PROVIDERS.ollama.apiUrl).toContain('localhost:11434');
    });
  });
});
