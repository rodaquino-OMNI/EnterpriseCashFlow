// src/services/ai/providers/AIProviderFactory.js
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { OllamaProvider } from './OllamaProvider';
import { AIProviderType } from '../types';

export class AIProviderFactory {
  static providers = {
    [AIProviderType.OPENAI]: OpenAIProvider,
    [AIProviderType.GEMINI]: GeminiProvider,
    [AIProviderType.CLAUDE]: ClaudeProvider,
    [AIProviderType.OLLAMA]: OllamaProvider
  };

  /**
   * Create an AI provider instance
   * @param {string} type - Provider type from AIProviderType
   * @param {Object} config - Provider configuration
   * @returns {import('./BaseProvider').BaseProvider}
   */
  static create(type, config = {}) {
    const ProviderClass = this.providers[type];
    
    if (!ProviderClass) {
      throw new Error(`Unknown AI provider type: ${type}`);
    }

    return new ProviderClass(config);
  }

  /**
   * Register a custom provider
   * @param {string} type - Provider type identifier
   * @param {typeof import('./BaseProvider').BaseProvider} providerClass - Provider class
   */
  static registerProvider(type, providerClass) {
    this.providers[type] = providerClass;
  }

  /**
   * Get all available provider types
   * @returns {string[]}
   */
  static getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Create multiple providers at once
   * @param {Object<string, Object>} configs - Provider configurations by type
   * @returns {Object<string, import('./BaseProvider').BaseProvider>}
   */
  static createMultiple(configs) {
    const providers = {};
    
    Object.entries(configs).forEach(([type, config]) => {
      try {
        providers[type] = this.create(type, config);
      } catch (error) {
        console.warn(`Failed to create provider ${type}:`, error);
      }
    });

    return providers;
  }
}