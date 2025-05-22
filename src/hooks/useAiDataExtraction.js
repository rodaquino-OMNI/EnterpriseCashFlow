// src/hooks/useAiDataExtraction.js
import { useState, useCallback } from 'react';
import { getFieldKeys, fieldDefinitions } from '../utils/fieldDefinitions';
import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from '../utils/aiProviders';

/**
 * Custom hook for extracting financial data from text using AI
 * 
 * @param {Object} aiService - The AI service to use for extraction
 * @returns {{
 *   extractFinancialData: (text: string, periodType: string, numberOfPeriods: number, apiKey: string, providerKey: string) => Promise<{data: any[]}>;
 *   isExtracting: boolean;
 *   extractionError: Error | null;
 *   resetError: () => void;
 * }} Financial data extraction functions and state
 */
export function useAiDataExtraction(aiService) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  
  // Reset any errors
  const resetError = useCallback(() => {
    setExtractionError(null);
  }, []);

  /**
   * Extract financial data from text using AI
   * 
   * @param {string} text - The text to extract data from
   * @param {string} periodType - The type of period (anos, trimestres, etc.)
   * @param {number} numberOfPeriods - The number of periods to extract
   * @param {string} apiKey - The API key to use for the AI service
   * @param {string} providerKey - The key of the AI provider to use
   * @returns {Promise<{data: any[]}>} The extracted financial data
   */
  const extractFinancialData = useCallback(async (text, periodType, numberOfPeriods, apiKey, providerKey = DEFAULT_AI_PROVIDER) => {
    if (!text) {
      throw new Error('Text is required for extraction');
    }
    
    if (!aiService || !aiService.callAi) {
      throw new Error('AI service is required for extraction');
    }
    
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      // Get all field keys and their definitions
      const fieldKeys = getFieldKeys();
      
      // Create a simplified JSON schema for each field to guide the AI
      const fieldsSchema = fieldKeys.map(key => {
        const field = fieldDefinitions[key];
        return {
          key,
          label: field.label,
          description: field.note || '',
          firstPeriodOnly: field.firstPeriodOnly || false,
          type: 'number'
        };
      });

      // Get the provider config
      const providerConfig = AI_PROVIDERS[providerKey] || AI_PROVIDERS[DEFAULT_AI_PROVIDER];
      
      // Determine maximum input size based on provider
      const maxInputChars = providerConfig.recommendedInputChars || 15000;
      
      // Truncate text if necessary, with a warning if it's too long
      const truncatedText = text.length > maxInputChars 
        ? text.substring(0, maxInputChars) + `\n\n... [Texto truncado para caber dentro dos limites de tokens do ${providerConfig.name}. ${text.length - maxInputChars} caracteres omitidos]`
        : text;
      
      // Include text length info for debugging
      console.log(`Using ${providerConfig.name}: Text length ${text.length} chars, truncated to ${Math.min(text.length, maxInputChars)} chars`);
      
      // Build the prompt for the AI
      const prompt = `
Você é um assistente especializado em extrair dados financeiros de documentos. 
Analise cuidadosamente o seguinte texto extraído de um documento financeiro e extraia os valores para ${numberOfPeriods} ${periodType}.

O texto a seguir foi extraído de um PDF:
\`\`\`
${truncatedText}
\`\`\`

Eu preciso que você extraia dados para os seguintes campos financeiros:
${JSON.stringify(fieldsSchema, null, 2)}

Por favor, retorne os dados no seguinte formato JSON (estritamente):
\`\`\`json
[
  {
    // Dados do período 1
    "revenue": [valor numérico],
    "cogs": [valor numérico],
    ...
  },
  {
    // Dados do período 2 - se disponível
    ...
  },
  // Mais períodos, se disponíveis, até ${numberOfPeriods} períodos no total
]
\`\`\`

Considerações importantes:
1. Retorne APENAS o JSON, sem explicações ou outros textos
2. Use valores nulos (null) quando não conseguir encontrar o dado
3. Remova quaisquer formatações de moeda e use apenas valores numéricos
4. Para campos marcados como "firstPeriodOnly: true", inclua o valor apenas para o primeiro período
5. Se não conseguir identificar nenhum dado, retorne uma matriz vazia []
6. Certifique-se de que o JSON seja válido e bem formatado
`;

      // Call the AI service with a lower temperature for more consistent results
      const responseText = await aiService.callAi(prompt, {
        temperature: 0.1, // Lower temperature for more deterministic results
        maxTokens: providerConfig.defaultRequestConfig.maxOutputTokens || 
                  providerConfig.defaultRequestConfig.max_tokens || 
                  4000,
        model: providerConfig.defaultRequestConfig.model, // Use the provider's default model
      }, apiKey);
      
      // Parse the JSON from the response
      // First, we need to extract the JSON part from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error('A IA não conseguiu extrair dados financeiros do PDF em formato JSON válido.');
      }
      
      const jsonStr = jsonMatch[0];
      const extractedData = JSON.parse(jsonStr);
      
      // Validate the extracted data
      if (!Array.isArray(extractedData) || extractedData.length === 0) {
        throw new Error('A IA não conseguiu extrair dados financeiros do PDF.');
      }
      
      // Ensure we have the right number of periods
      const periodsToUse = Math.min(numberOfPeriods, extractedData.length);
      const trimmedData = extractedData.slice(0, periodsToUse);
      
      // If we don't have enough periods, pad with empty objects
      while (trimmedData.length < numberOfPeriods) {
        trimmedData.push({});
      }
      
      // Convert string values to numbers where appropriate
      const cleanedData = trimmedData.map(period => {
        const cleanPeriod = {};
        
        Object.entries(period).forEach(([key, value]) => {
          if (typeof value === 'string' && !isNaN(value.replace(/[,.]/g, ''))) {
            // Convert string numbers to actual numbers
            cleanPeriod[key] = Number(value.replace(/,/g, ''));
          } else {
            cleanPeriod[key] = value;
          }
        });
        
        return cleanPeriod;
      });
      
      return { data: cleanedData };
    } catch (err) {
      console.error('Error extracting financial data:', err);
      setExtractionError(err);
      
      // Provide more helpful error messages for common issues
      if (err.message.includes('context length') || err.message.includes('token limit') || 
          err.message.includes('maximum context') || err.message.includes('too long')) {
        throw new Error(`Falha ao processar o texto: O PDF é muito longo para o modelo de IA do ${AI_PROVIDERS[providerKey]?.name || 'provedor selecionado'}. Tente escolher outro provedor de IA com contexto maior ou reduza o tamanho do PDF.`);
      }
      
      throw new Error(`Falha ao extrair dados do texto: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  }, [aiService]);

  return {
    extractFinancialData,
    isExtracting,
    extractionError,
    resetError
  };
}