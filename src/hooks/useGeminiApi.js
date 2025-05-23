// src/hooks/useGeminiApi.js
import { useState, useCallback } from 'react';
import { GENAI_API_KEY_PLACEHOLDER } from '../utils/constants';

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

    const model = options.model || 'gemini-2.0-flash'; // Default to latest model
    const temperature = options.temperature || 0.4; // Default temperature
    const maxOutputTokens = options.maxTokens || 2000; // Default token limit
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
      console.log(`Calling Gemini API with model: ${model}, temperature: ${temperature}, maxOutputTokens: ${maxOutputTokens}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `Erro Gemini API: ${errorData.error.message || errorData.error.code || response.statusText}`;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Log the structure of the response for debugging
      console.debug('Gemini API response structure:', JSON.stringify(result).substring(0, 200) + '...');

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0 &&
          typeof result.candidates[0].content.parts[0].text === 'string') {
        const text = result.candidates[0].content.parts[0].text;
        setIsLoading(false);
        return text;
      } else if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason) {
        // Handle cases where generation might be blocked or finish for other reasons
        const reason = result.candidates[0].finishReason;
        const safetyRatings = result.candidates[0].safetyRatings;
        let message = `Geração de conteúdo pela IA finalizada com motivo: ${reason}.`;
        
        if (safetyRatings) {
          message += ` Classificações de segurança: ${JSON.stringify(safetyRatings)}`;
        }
        
        console.warn(message);
        throw new Error(message);
      }
      else {
        console.warn("Resposta da API Gemini em formato inesperado:", result);
        throw new Error("Resposta da API Gemini em formato inesperado ou sem conteúdo de texto.");
      }
    } catch (err) {
      console.error('Erro na chamada da API Gemini:', err);
      setError(err);
      setIsLoading(false);
      return `Erro ao comunicar com a IA: ${err.message}`;
    } finally {
      setIsLoading(false);
    }
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