// src/hooks/useAiService.js
import { useState, useEffect, useCallback } from 'react';
import { AI_PROVIDERS } from '../utils/aiProviders';

/**
 * Custom hook for communicating with different AI service providers
 * 
 * @param {string} defaultProviderKey - The key of the default AI provider to use
 * @returns {{
 *   callAi: (prompt: string, options?: import('../utils/aiProviders').AiRequestOptions, currentApiKey?: string) => Promise<string>;
 *   isLoading: boolean;
 *   error: Error | null;
 *   resetError: () => void;
 *   currentProviderConfig: import('../utils/aiProviders').AiProviderConfig | undefined;
 * }} The AI service API
 */
export function useAiService(defaultProviderKey = 'gemini') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProviderKey, setCurrentProviderKey] = useState(defaultProviderKey);

  // Update current provider key when defaultProviderKey changes
  useEffect(() => {
    setCurrentProviderKey(defaultProviderKey);
  }, [defaultProviderKey]);

  // Get the current provider configuration
  const currentProviderConfig = AI_PROVIDERS[currentProviderKey];

  // Reset any errors
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Call the AI service with a prompt
   * 
   * @param {string} prompt - The prompt to send to the AI
   * @param {import('../utils/aiProviders').AiRequestOptions} options - Options for the AI request
   * @param {string} currentApiKey - The API key to use for this call
   * @returns {Promise<string>} The generated text response
   */
  const callAi = useCallback(async (prompt, options = {}, currentApiKey = '') => {
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // For providers that require an API key, check if one is provided
    if (currentProviderConfig.name !== 'Ollama (Local)' && !currentApiKey) {
      throw new Error(`API key is required for ${currentProviderConfig.name}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the provider's callFunction method defined in aiProviders.js
      if (!currentProviderConfig || typeof currentProviderConfig.callFunction !== 'function') {
        throw new Error(`Provider ${currentProviderKey} is not configured correctly or missing callFunction implementation`);
      }

      const response = await currentProviderConfig.callFunction(
        currentProviderConfig, 
        prompt, 
        currentApiKey, 
        options
      );

      return response;
    } catch (err) {
      console.error(`Error calling ${currentProviderConfig?.name || currentProviderKey} AI:`, err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProviderKey, currentProviderConfig]);

  return {
    callAi,
    isLoading,
    error,
    resetError,
    currentProviderConfig
  };
}