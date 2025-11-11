// src/services/ai/providers/__tests__/AIProviderFactory.test.js
import { AIProviderFactory } from '../AIProviderFactory';
import { OpenAIProvider } from '../OpenAIProvider';
import { GeminiProvider } from '../GeminiProvider';
import { ClaudeProvider } from '../ClaudeProvider';
import { OllamaProvider } from '../OllamaProvider';
import { AIProviderType } from '../../types';

describe('AIProviderFactory', () => {
  describe('create', () => {
    it('should create OpenAI provider', () => {
      const provider = AIProviderFactory.create(AIProviderType.OPENAI, {
        apiKey: 'test-key',
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.apiKey).toBe('test-key');
    });

    it('should create Gemini provider', () => {
      const provider = AIProviderFactory.create(AIProviderType.GEMINI, {
        apiKey: 'gemini-key',
      });

      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.apiKey).toBe('gemini-key');
    });

    it('should create Claude provider', () => {
      const provider = AIProviderFactory.create(AIProviderType.CLAUDE, {
        apiKey: 'claude-key',
      });

      expect(provider).toBeInstanceOf(ClaudeProvider);
      expect(provider.apiKey).toBe('claude-key');
    });

    it('should create Ollama provider', () => {
      const provider = AIProviderFactory.create(AIProviderType.OLLAMA, {
        baseUrl: 'http://localhost:11434/api',
      });

      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.apiKey).toBe('local');
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        AIProviderFactory.create('unknown-provider', {});
      }).toThrow('Unknown AI provider type: unknown-provider');
    });

    it('should pass configuration to provider', () => {
      const config = {
        apiKey: 'test-key',
        timeout: 90000,
        maxRetries: 5,
      };

      const provider = AIProviderFactory.create(AIProviderType.OPENAI, config);

      expect(provider.apiKey).toBe('test-key');
      expect(provider.timeout).toBe(90000);
      expect(provider.maxRetries).toBe(5);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all available provider types', () => {
      const providers = AIProviderFactory.getAvailableProviders();

      expect(providers).toContain(AIProviderType.OPENAI);
      expect(providers).toContain(AIProviderType.GEMINI);
      expect(providers).toContain(AIProviderType.CLAUDE);
      expect(providers).toContain(AIProviderType.OLLAMA);
      expect(providers).toHaveLength(4);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple providers at once', () => {
      const configs = {
        [AIProviderType.OPENAI]: { apiKey: 'openai-key' },
        [AIProviderType.GEMINI]: { apiKey: 'gemini-key' },
        [AIProviderType.CLAUDE]: { apiKey: 'claude-key' },
      };

      const providers = AIProviderFactory.createMultiple(configs);

      expect(providers[AIProviderType.OPENAI]).toBeInstanceOf(OpenAIProvider);
      expect(providers[AIProviderType.GEMINI]).toBeInstanceOf(GeminiProvider);
      expect(providers[AIProviderType.CLAUDE]).toBeInstanceOf(ClaudeProvider);
      expect(Object.keys(providers)).toHaveLength(3);
    });

    it('should handle provider creation failures gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const configs = {
        [AIProviderType.OPENAI]: { apiKey: 'valid-key' },
        'invalid-type': { apiKey: 'invalid' },
      };

      const providers = AIProviderFactory.createMultiple(configs);

      expect(providers[AIProviderType.OPENAI]).toBeInstanceOf(OpenAIProvider);
      expect(providers['invalid-type']).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create provider'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should return empty object for empty configs', () => {
      const providers = AIProviderFactory.createMultiple({});

      expect(providers).toEqual({});
    });
  });

  describe('registerProvider', () => {
    class CustomProvider {
      constructor(config) {
        this.config = config;
      }
    }

    it('should register custom provider', () => {
      AIProviderFactory.registerProvider('custom', CustomProvider);

      const provider = AIProviderFactory.create('custom', { test: 'config' });

      expect(provider).toBeInstanceOf(CustomProvider);
      expect(provider.config).toEqual({ test: 'config' });
    });

    it('should allow overriding existing providers', () => {
      class CustomOpenAI {
        constructor(config) {
          this.customConfig = config;
        }
      }

      AIProviderFactory.registerProvider(AIProviderType.OPENAI, CustomOpenAI);

      const provider = AIProviderFactory.create(AIProviderType.OPENAI, { key: 'test' });

      expect(provider).toBeInstanceOf(CustomOpenAI);
      expect(provider.customConfig).toEqual({ key: 'test' });

      // Restore original
      AIProviderFactory.registerProvider(AIProviderType.OPENAI, OpenAIProvider);
    });

    it('should include custom providers in available providers list', () => {
      class AnotherCustomProvider {}

      AIProviderFactory.registerProvider('another-custom', AnotherCustomProvider);

      const providers = AIProviderFactory.getAvailableProviders();

      expect(providers).toContain('another-custom');
    });
  });

  describe('Provider Integration', () => {
    it('should create providers with different configurations', () => {
      const openaiProvider = AIProviderFactory.create(AIProviderType.OPENAI, {
        apiKey: 'openai-key',
        organizationId: 'org-123',
      });

      const geminiProvider = AIProviderFactory.create(AIProviderType.GEMINI, {
        apiKey: 'gemini-key',
        useProxy: true,
      });

      const ollamaProvider = AIProviderFactory.create(AIProviderType.OLLAMA, {
        baseUrl: 'http://custom:11434/api',
        model: 'mistral',
      });

      expect(openaiProvider.organizationId).toBe('org-123');
      expect(geminiProvider.useProxy).toBe(true);
      expect(ollamaProvider.baseUrl).toBe('http://custom:11434/api');
      expect(ollamaProvider.defaultModel).toBe('mistral');
    });

    it('should create providers with shared timeout configuration', () => {
      const configs = {
        [AIProviderType.OPENAI]: { apiKey: 'key1', timeout: 30000 },
        [AIProviderType.CLAUDE]: { apiKey: 'key2', timeout: 30000 },
      };

      const providers = AIProviderFactory.createMultiple(configs);

      expect(providers[AIProviderType.OPENAI].timeout).toBe(30000);
      expect(providers[AIProviderType.CLAUDE].timeout).toBe(30000);
    });
  });
});
