// src/services/ai/providers/BaseProvider.js

/**
 * Base class for AI providers
 * @abstract
 */
export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Get provider capabilities
   * @abstract
   * @returns {import('../types').ProviderCapabilities}
   */
  getCapabilities() {
    throw new Error('getCapabilities must be implemented by subclass');
  }

  /**
   * Make a completion request
   * @abstract
   * @param {import('../types').AIRequest} request
   * @returns {Promise<import('../types').AIResponse>}
   */
  async complete(request) {
    throw new Error('complete must be implemented by subclass');
  }

  /**
   * Extract data from document
   * @abstract
   * @param {string} content - Document content
   * @param {Object} schema - Expected data schema
   * @param {Object} options - Extraction options
   * @returns {Promise<import('../types').ExtractionResult>}
   */
  async extractData(content, schema, options = {}) {
    throw new Error('extractData must be implemented by subclass');
  }

  /**
   * Health check for the provider
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const testRequest = {
        prompt: 'Hello',
        parameters: { maxTokens: 10 }
      };
      const response = await this.complete(testRequest);
      return !!response.content;
    } catch (error) {
      console.error(`Health check failed for ${this.constructor.name}:`, error);
      return false;
    }
  }

  /**
   * Execute request with retry logic
   * @protected
   * @param {Function} requestFn - The request function to execute
   * @param {number} [retries] - Number of retries remaining
   * @returns {Promise<any>}
   */
  async executeWithRetry(requestFn, retries = this.maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`Request failed, retrying... (${retries} attempts left)`);
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.executeWithRetry(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   * @protected
   * @param {Error} error
   * @returns {boolean}
   */
  isRetryableError(error) {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return (
      error.name === 'AbortError' ||
      (error.status && retryableStatuses.includes(error.status)) ||
      error.message?.includes('timeout') ||
      error.message?.includes('ECONNRESET')
    );
  }

  /**
   * Create abort controller with timeout
   * @protected
   * @returns {{controller: AbortController, timeoutId: NodeJS.Timeout}}
   */
  createAbortController() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return { controller, timeoutId };
  }

  /**
   * Delay helper
   * @protected
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse error response
   * @protected
   * @param {Response|Error} error
   * @returns {string}
   */
  parseErrorMessage(error) {
    if (error.response) {
      try {
        const data = error.response.json();
        return data.error?.message || data.message || error.response.statusText;
      } catch {
        return error.response.statusText || 'Unknown error';
      }
    }
    return error.message || 'Unknown error';
  }

  /**
   * Validate API key
   * @protected
   * @throws {Error} If API key is missing or invalid
   */
  validateApiKey() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error(`API key is required for ${this.constructor.name}`);
    }
  }

  /**
   * Format prompt with system context
   * @protected
   * @param {string} prompt
   * @param {string} [systemPrompt]
   * @returns {string}
   */
  formatPromptWithContext(prompt, systemPrompt) {
    if (!systemPrompt) return prompt;
    return `${systemPrompt}\n\n${prompt}`;
  }
}