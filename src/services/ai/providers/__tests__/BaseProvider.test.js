// src/services/ai/providers/__tests__/BaseProvider.test.js
import { BaseProvider } from '../BaseProvider';

// Create concrete implementation for testing
class TestProvider extends BaseProvider {
  async complete(request) {
    return {
      content: 'Test response',
      metadata: { provider: 'test' }
    };
  }

  async extractData(content, schema, options = {}) {
    return {
      success: true,
      data: [],
      confidence: 1.0
    };
  }

  getCapabilities() {
    return {
      supportsStreaming: false,
      maxTokens: 4000,
      supportedModels: ['test-model']
    };
  }
}

describe('BaseProvider', () => {
  describe('constructor', () => {
    it('should create provider with default config', () => {
      const provider = new TestProvider({ apiKey: 'test-key' });
      expect(provider.apiKey).toBe('test-key');
      expect(provider.timeout).toBe(60000);
      expect(provider.maxRetries).toBe(3);
      expect(provider.retryDelay).toBe(1000);
    });

    it('should create provider with custom config', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        timeout: 30000,
        maxRetries: 5,
        retryDelay: 2000
      });
      expect(provider.timeout).toBe(30000);
      expect(provider.maxRetries).toBe(5);
      expect(provider.retryDelay).toBe(2000);
    });

    it('should store full config', () => {
      const config = {
        apiKey: 'test-key',
        customOption: 'value'
      };
      const provider = new TestProvider(config);
      expect(provider.config).toEqual(config);
    });
  });

  describe('abstract methods', () => {
    it('should throw error if getCapabilities not implemented', () => {
      const provider = new BaseProvider({ apiKey: 'test-key' });
      expect(() => provider.getCapabilities()).toThrow('getCapabilities must be implemented by subclass');
    });

    it('should throw error if complete not implemented', async () => {
      const provider = new BaseProvider({ apiKey: 'test-key' });
      await expect(provider.complete({})).rejects.toThrow('complete must be implemented by subclass');
    });

    it('should throw error if extractData not implemented', async () => {
      const provider = new BaseProvider({ apiKey: 'test-key' });
      await expect(provider.extractData('content', {})).rejects.toThrow('extractData must be implemented by subclass');
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy provider', async () => {
      const provider = new TestProvider({ apiKey: 'test-key' });
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when complete fails', async () => {
      class FailingProvider extends BaseProvider {
        async complete() {
          throw new Error('Provider error');
        }
      }

      const provider = new FailingProvider({ apiKey: 'test-key' });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await provider.healthCheck();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return false when complete returns empty content', async () => {
      class EmptyResponseProvider extends BaseProvider {
        async complete() {
          return { content: '' };
        }
      }

      const provider = new EmptyResponseProvider({ apiKey: 'test-key' });
      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('should execute request successfully on first attempt', async () => {
      const provider = new TestProvider({ apiKey: 'test-key' });
      const requestFn = jest.fn().mockResolvedValue('success');

      const result = await provider.executeWithRetry(requestFn);

      expect(result).toBe('success');
      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        maxRetries: 2,
        retryDelay: 10
      });

      const error = new Error('timeout');
      error.status = 503;

      const requestFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await provider.executeWithRetry(requestFn);

      expect(result).toBe('success');
      expect(requestFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const provider = new TestProvider({ apiKey: 'test-key' });
      const error = new Error('Invalid API key');
      error.status = 401;

      const requestFn = jest.fn().mockRejectedValue(error);

      await expect(provider.executeWithRetry(requestFn)).rejects.toThrow('Invalid API key');
      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max retries exceeded', async () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        maxRetries: 2,
        retryDelay: 10
      });

      const error = new Error('timeout');
      error.status = 503;

      const requestFn = jest.fn().mockRejectedValue(error);

      await expect(provider.executeWithRetry(requestFn)).rejects.toThrow('timeout');
      expect(requestFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should increase delay between retries', async () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        maxRetries: 3,
        retryDelay: 100
      });

      const error = new Error('timeout');
      error.status = 503;

      const delays = [];
      const originalDelay = provider.delay.bind(provider);
      jest.spyOn(provider, 'delay').mockImplementation((ms) => {
        delays.push(ms);
        return originalDelay(1); // Speed up test
      });

      const requestFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      await provider.executeWithRetry(requestFn);

      expect(delays[0]).toBe(100); // First retry
      expect(delays[1]).toBe(200); // Second retry
    });
  });

  describe('isRetryableError', () => {
    let provider;

    beforeEach(() => {
      provider = new TestProvider({ apiKey: 'test-key' });
    });

    it('should identify 429 as retryable', () => {
      const error = new Error('Rate limit');
      error.status = 429;
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify 500 as retryable', () => {
      const error = new Error('Server error');
      error.status = 500;
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify 502 as retryable', () => {
      const error = new Error('Bad gateway');
      error.status = 502;
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify 503 as retryable', () => {
      const error = new Error('Service unavailable');
      error.status = 503;
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify 504 as retryable', () => {
      const error = new Error('Gateway timeout');
      error.status = 504;
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify AbortError as retryable', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should identify ECONNRESET as retryable', () => {
      const error = new Error('socket hang up - ECONNRESET');
      expect(provider.isRetryableError(error)).toBe(true);
    });

    it('should not identify 400 as retryable', () => {
      const error = new Error('Bad request');
      error.status = 400;
      expect(provider.isRetryableError(error)).toBe(false);
    });

    it('should not identify 401 as retryable', () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      expect(provider.isRetryableError(error)).toBe(false);
    });

    it('should not identify 404 as retryable', () => {
      const error = new Error('Not found');
      error.status = 404;
      expect(provider.isRetryableError(error)).toBe(false);
    });
  });

  describe('createAbortController', () => {
    it('should create abort controller with timeout', () => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        timeout: 5000
      });

      const { controller, timeoutId } = provider.createAbortController();

      expect(controller).toBeInstanceOf(AbortController);
      expect(timeoutId).toBeDefined();

      clearTimeout(timeoutId);
    });

    it('should abort after timeout', (done) => {
      const provider = new TestProvider({
        apiKey: 'test-key',
        timeout: 50
      });

      const { controller } = provider.createAbortController();

      controller.signal.addEventListener('abort', () => {
        expect(controller.signal.aborted).toBe(true);
        done();
      });
    });
  });

  describe('delay', () => {
    it('should delay for specified milliseconds', async () => {
      const provider = new TestProvider({ apiKey: 'test-key' });
      const start = Date.now();

      await provider.delay(100);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('parseErrorMessage', () => {
    let provider;

    beforeEach(() => {
      provider = new TestProvider({ apiKey: 'test-key' });
    });

    it('should parse error with response and json error', () => {
      const error = {
        response: {
          json: () => ({ error: { message: 'API Error' } }),
          statusText: 'Bad Request'
        }
      };

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('API Error');
    });

    it('should parse error with response and message field', () => {
      const error = {
        response: {
          json: () => ({ message: 'Error message' }),
          statusText: 'Bad Request'
        }
      };

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('Error message');
    });

    it('should use statusText when json parsing fails', () => {
      const error = {
        response: {
          json: () => { throw new Error('Invalid JSON'); },
          statusText: 'Bad Request'
        }
      };

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('Bad Request');
    });

    it('should handle response without statusText', () => {
      const error = {
        response: {
          json: () => { throw new Error('Invalid JSON'); }
        }
      };

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('Unknown error');
    });

    it('should parse plain error message', () => {
      const error = new Error('Simple error');

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('Simple error');
    });

    it('should return unknown error for error without message', () => {
      const error = {};

      const message = provider.parseErrorMessage(error);
      expect(message).toBe('Unknown error');
    });
  });

  describe('validateApiKey', () => {
    it('should not throw for valid API key', () => {
      const provider = new TestProvider({ apiKey: 'valid-key' });
      expect(() => provider.validateApiKey()).not.toThrow();
    });

    it('should throw for missing API key', () => {
      const provider = new TestProvider({});
      expect(() => provider.validateApiKey()).toThrow('API key is required for TestProvider');
    });

    it('should throw for empty API key', () => {
      const provider = new TestProvider({ apiKey: '' });
      expect(() => provider.validateApiKey()).toThrow('API key is required for TestProvider');
    });

    it('should throw for whitespace-only API key', () => {
      const provider = new TestProvider({ apiKey: '   ' });
      expect(() => provider.validateApiKey()).toThrow('API key is required for TestProvider');
    });
  });
});
