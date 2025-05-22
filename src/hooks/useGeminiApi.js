// src/hooks/useGeminiApi.js
import { useState, useCallback } from 'react';
import { GENAI_API_KEY_PLACEHOLDER } from '../utils/constants';

export function useGeminiApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Allow API Key to be passed or use a placeholder/env variable
  const callApi = useCallback(async (prompt, apiKey = GENAI_API_KEY_PLACEHOLDER) => {
    if (!apiKey || apiKey === GENAI_API_KEY_PLACEHOLDER) {
      const err = new Error('API key para Gemini não configurada.');
      console.error(err.message);
      setError(err);
      // You might want to return a specific message or throw,
      // instead of letting the fetch fail later.
      // For now, we'll display this error to the user.
      // Returning a string here that indicates the error.
      return "Erro: API Key não configurada. Verifique as configurações da aplicação.";
    }

    setIsLoading(true);
    setError(null);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } })); // Try to parse JSON, fallback to statusText
        const errorMessage = errorData.error?.message || `Erro HTTP ${response.status}`;
        throw new Error(`API Gemini (${response.status}): ${errorMessage}`);
      }

      const result = await response.json();

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
          message += `Classificações de segurança: ${JSON.stringify(safetyRatings)}`;
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
      // Return the error message to be displayed, or rethrow if the component handles it
      return `Erro ao comunicar com a IA: ${err.message}`;
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