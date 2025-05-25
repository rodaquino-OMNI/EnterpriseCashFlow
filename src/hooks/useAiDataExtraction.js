// src/hooks/useAiDataExtraction.js
import { useState, useCallback } from 'react';
import { ANALYSIS_TYPES } from '../utils/aiAnalysisTypes';
import { getFieldKeys, fieldDefinitions } from '../utils/fieldDefinitions';

/**
 * Hook for extracting structured financial data from PDF text using AI
 * @param {Object} aiService - The AI service with callAiAnalysis method
 * @returns {{
 *   extractFinancialData: (pdfText: string, periodType: string, numberOfPeriods: number, apiKey: string, providerKey: string) => Promise<{data: Array<Object>, detectedPeriods: number}>;
 *   isExtracting: boolean;
 *   extractionError: Error | null;
 *   setExtractionError: React.Dispatch<React.SetStateAction<Error | null>>;
 * }}
 */
export function useAiDataExtraction(aiService) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);

  /**
   * Extract financial data from PDF text
   * @param {string} pdfText - The extracted text from a PDF file
   * @param {string} periodType - The type of periods (meses, anos, etc.)
   * @param {number} numberOfPeriods - The number of periods to extract data for
   * @param {string} apiKey - The API key for the AI service
   * @param {string} providerKey - The provider key (gemini, openai, etc.)
   * @returns {Promise<{data: Array<Object>, detectedPeriods: number}>}
   */
  const extractFinancialData = useCallback(async (
    pdfText,
    periodType, 
    numberOfPeriods, 
    apiKey,
    providerKey
  ) => {
    if (!pdfText || typeof pdfText !== 'string' || pdfText.trim().length < 100) {
      const error = new Error('Texto do PDF muito curto, vazio ou inválido para extração.');
      setExtractionError(error);
      throw error;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Prepare financial data bundle for AI analysis
      const financialDataBundle = {
        pdfText: pdfText.slice(0, 50000), // Limit text size to avoid token limits
        companyInfo: {
          name: "Empresa em Análise", // Generic name
          reportTitle: "Extração de Dados Financeiros",
          periodType: periodType,
          numberOfPeriods: numberOfPeriods
        }
      };

      // Call AI to extract financial data
      const extractionResult = await aiService.callAiAnalysis(
        ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION,
        financialDataBundle,
        {
          temperature: 0.1, // Lower temperature for more deterministic extraction
          maxTokens: 4000 // Allow enough tokens for structured data
        },
        apiKey
      );

      // Process and validate the extracted data
      let extractedData = [];
      let detectedPeriods = numberOfPeriods;

      // Handle different response formats - the AI might return JSON directly or as a string
      if (typeof extractionResult === 'string') {
        try {
          // Try to parse JSON from the response text
          const jsonMatch = extractionResult.match(/\[[\s\S]*\]/); // Match array in JSON
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Formato de resposta da IA não contém JSON válido.');
          }
        } catch (jsonError) {
          console.error('Erro ao interpretar JSON da resposta da IA:', jsonError);
          throw new Error(`Erro ao interpretar dados extraídos: ${jsonError.message}`);
        }
      } else if (Array.isArray(extractionResult)) {
        extractedData = extractionResult;
      } else if (extractionResult.extractedData && Array.isArray(extractionResult.extractedData)) {
        extractedData = extractionResult.extractedData;
      } else {
        throw new Error('Formato de resposta da IA não suportado para extração de dados.');
      }

      // Validate and process the extracted data
      if (extractedData.length === 0) {
        throw new Error('A IA não conseguiu extrair dados financeiros do PDF.');
      }

      detectedPeriods = Math.min(extractedData.length, numberOfPeriods);

      // Transform extracted data into the expected format for our app
      const fieldKeys = getFieldKeys();
      const processedData = extractedData.slice(0, detectedPeriods).map((period) => {
        const dataObj = {};
        const periodData = period.data || period; // Handle both formats

        // Process each field, attempting to convert to numbers where appropriate
        fieldKeys.forEach(key => {
          const fieldDef = fieldDefinitions[key];
          let value = periodData[key];
          
          // Try to convert string values to numbers if they should be numbers
          if (value !== null && value !== undefined && typeof value === 'string') {
            // Remove currency symbols, commas and convert to number
            const cleanValue = value.replace(/[^-\d.,]/g, '').replace(/,/g, '.');
            const numValue = parseFloat(cleanValue);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
          
          dataObj[key] = value;
        });

        return dataObj;
      });

      setIsExtracting(false);
      return {
        data: processedData,
        detectedPeriods: detectedPeriods
      };
    } catch (err) {
      console.error('Erro na extração de dados via IA:', err);
      setExtractionError(err);
      setIsExtracting(false);
      throw err;
    }
  }, [aiService]);

  return {
    extractFinancialData,
    isExtracting,
    extractionError,
    setExtractionError
  };
}