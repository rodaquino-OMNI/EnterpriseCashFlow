// src/hooks/useGeminiApi.js
import { useState, useCallback } from 'react';
import { GENAI_API_KEY_PLACEHOLDER } from '../utils/constants';
import { AI_PROVIDERS } from '../utils/aiProviders';

export function useGeminiApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Allow API Key to be passed or use a placeholder/env variable
  const callApi = useCallback(async (prompt, apiKey = GENAI_API_KEY_PLACEHOLDER, options = {}) => {
    if (!apiKey || apiKey === GENAI_API_KEY_PLACEHOLDER) {
      const err = new Error('API key para Gemini não configurada.');
      console.error(err.message);
      setError(err);
      return "Erro: API Key não configurada. Verifique as configurações da aplicação.";
    }

    setIsLoading(true);
    setError(null);
    
    const model = options.model || 'gemini-pro'; // Using a more compatible model
    const temperature = options.temperature || 0.4; // Default temperature
    const maxOutputTokens = options.maxTokens || 2000; // Default token limit
    const timeoutMs = options.timeoutMs || 30000; // Default timeout (30 seconds)
    
    // Primary API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    // Get alternative URLs from config
    const alternativeUrls = AI_PROVIDERS.gemini?.alternativeUrls || [];
    
    // Combine primary and alternative URLs to try
    const urlsToTry = [
      apiUrl,
      ...alternativeUrls.map(baseUrl => `${baseUrl}/${model}:generateContent?key=${apiKey}`)
    ];
    
    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        topP: 0.95,
        topK: 40
      }
    };
    
    // Log abbreviated request information (without exposing the full prompt)
    console.log(`Calling Gemini API with model: ${model}, temperature: ${temperature}, maxOutputTokens: ${maxOutputTokens}`);
    console.log(`Will try ${urlsToTry.length} different endpoints, including proxied alternatives`);
    
    // Try each URL in sequence
    let lastError = null;
    for (let i = 0; i < urlsToTry.length; i++) {
      const currentUrl = urlsToTry[i];
      const isProxy = i > 0;
      
      try {
        console.log(`Attempt #${i+1}: ${isProxy ? 'Using proxy URL' : 'Using direct API URL'}`);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        console.log("Starting fetch request...");
        const response = await fetch(currentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId); // Clear the timeout if request completed
        
        console.log(`Fetch completed with status: ${response.status}`);
        
        if (!response.ok) {
          let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            
            if (errorData.error) {
              errorMessage = `Erro Gemini API (${response.status}): ${errorData.error.message || errorData.error.code || response.statusText}`;
            }
          } catch (parseError) {
            console.warn('Could not parse error response:', parseError);
          }
          
          // Save error but try next URL
          lastError = new Error(errorMessage);
          console.warn(`Attempt #${i+1} failed: ${errorMessage}`);
          continue;
        }
        
        console.log("Parsing JSON response...");
        const result = await response.json();
        console.log("JSON response parsed successfully");
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0 &&
            typeof result.candidates[0].content.parts[0].text === 'string') {
          const text = result.candidates[0].content.parts[0].text;
          console.log(`Successfully extracted text from API response (${text.length} chars)`);
          setIsLoading(false);
          return text;
        } else if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason) {
          const reason = result.candidates[0].finishReason;
          console.warn(`Response finished with reason ${reason} but no valid text content`);
          lastError = new Error(`Geração de conteúdo pela IA finalizada com motivo: ${reason}.`);
          continue;
        } else {
          console.warn("Unexpected response format:", result);
          lastError = new Error("Resposta da API Gemini em formato inesperado ou sem conteúdo de texto.");
          continue;
        }
      } catch (fetchError) {
        // Handle specific fetch errors
        if (fetchError.name === 'AbortError') {
          console.error(`Attempt #${i+1} timed out after ${timeoutMs}ms`);
          lastError = new Error(`Tempo limite excedido ao chamar a API Gemini (${timeoutMs/1000}s).`);
        } else {
          console.error(`Attempt #${i+1} failed with error:`, fetchError);
          lastError = fetchError;
        }
      }
    }
    
    // If we get here, all attempts failed
    setError(lastError || new Error("Falha ao comunicar com a API Gemini por todos os métodos disponíveis."));
    setIsLoading(false);
    return `Erro ao comunicar com a IA Gemini: ${lastError?.message || 'Erro desconhecido'}. Tente uma alternativa como OpenAI ou Claude.`;
    
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    callApi,
    isLoading,
    error,
    resetError
  };
}