// src/hooks/useAiDocumentExtraction.js
import { useState, useCallback, useRef } from 'react';
import { useEnhancedAiService } from './useEnhancedAiService';
import { DocumentExtractor } from '../services/ai/DocumentExtractor';
import { AIProviderType } from '../services/ai/types';

/**
 * Hook for AI-powered document extraction
 * @param {Object} options - Configuration options
 * @returns {Object} Document extraction interface
 */
export function useAiDocumentExtraction(options = {}) {
  const [extractionResults, setExtractionResults] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);
  
  const extractorRef = useRef(null);
  
  // Use enhanced AI service
  const aiService = useEnhancedAiService({
    defaultProvider: options.provider || AIProviderType.GEMINI,
    autoInitialize: true,
    providers: options.providers || {}
  });

  /**
   * Initialize document extractor
   */
  const initializeExtractor = useCallback(() => {
    if (!extractorRef.current && aiService.isInitialized) {
      extractorRef.current = new DocumentExtractor(aiService.aiService);
    }
  }, [aiService.isInitialized, aiService.aiService]);

  /**
   * Extract from Excel content
   */
  const extractFromExcel = useCallback(async (excelContent, extractionOptions = {}) => {
    initializeExtractor();
    if (!extractorRef.current) {
      throw new Error('Document extractor not initialized');
    }

    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractorRef.current.extractFromExcel(
        excelContent,
        extractionOptions
      );

      // Validate extracted data
      const validation = extractorRef.current.validateExtractedData(result.data);
      setValidationResult(validation);

      // Enhance data if valid
      if (validation.isValid) {
        result.data = extractorRef.current.enhanceExtractedData(result.data);
      }

      setExtractionResults(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, [initializeExtractor]);

  /**
   * Extract from PDF text
   */
  const extractFromPDF = useCallback(async (pdfText, extractionOptions = {}) => {
    initializeExtractor();
    if (!extractorRef.current) {
      throw new Error('Document extractor not initialized');
    }

    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractorRef.current.extractFromPDF(
        pdfText,
        extractionOptions
      );

      // Validate extracted data
      const validation = extractorRef.current.validateExtractedData(result.data);
      setValidationResult(validation);

      // Enhance data if valid
      if (validation.isValid) {
        result.data = extractorRef.current.enhanceExtractedData(result.data);
      }

      setExtractionResults(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, [initializeExtractor]);

  /**
   * Smart extraction with format detection
   */
  const smartExtract = useCallback(async (content, extractionOptions = {}) => {
    initializeExtractor();
    if (!extractorRef.current) {
      throw new Error('Document extractor not initialized');
    }

    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractorRef.current.smartExtract(
        content,
        extractionOptions
      );

      // Validate extracted data
      const validation = extractorRef.current.validateExtractedData(result.data);
      setValidationResult(validation);

      // Enhance data if valid
      if (validation.isValid) {
        result.data = extractorRef.current.enhanceExtractedData(result.data);
      }

      setExtractionResults(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, [initializeExtractor]);

  /**
   * Extract and analyze in one step
   */
  const extractAndAnalyze = useCallback(async (
    content,
    documentType,
    analysisTypes,
    options = {}
  ) => {
    try {
      // First extract data
      let extractionResult;
      if (documentType === 'excel') {
        extractionResult = await extractFromExcel(content, options.extraction);
      } else if (documentType === 'pdf') {
        extractionResult = await extractFromPDF(content, options.extraction);
      } else {
        extractionResult = await smartExtract(content, options.extraction);
      }

      if (!extractionResult.success || !extractionResult.data.length) {
        throw new Error('No data extracted from document');
      }

      // Convert extracted data to financial data format
      const financialData = convertExtractedToFinancialData(extractionResult.data);

      // Run analyses
      const analysisResults = await aiService.batchAnalyze(
        analysisTypes,
        financialData,
        options.analysis
      );

      return {
        extraction: extractionResult,
        analysis: analysisResults,
        validation: validationResult
      };
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [extractFromExcel, extractFromPDF, smartExtract, aiService, validationResult]);

  /**
   * Get extraction quality metrics
   */
  const getQualityMetrics = useCallback(() => {
    if (!extractionResults || !validationResult) {
      return null;
    }

    return {
      confidence: extractionResults.confidence,
      completeness: validationResult.completeness,
      dataQuality: validationResult.dataQuality,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      provider: extractionResults.metadata?.provider
    };
  }, [extractionResults, validationResult]);

  /**
   * Fix common extraction issues
   */
  const applyAutoFixes = useCallback((data) => {
    if (!data || !Array.isArray(data)) return data;

    return data.map(period => {
      const fixed = { ...period };
      const fixedData = { ...period.data };

      // Fix common number parsing issues
      Object.entries(fixedData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Try to parse as number
          const parsed = parseFinancialNumber(value);
          if (!isNaN(parsed)) {
            fixedData[key] = parsed;
          }
        }
      });

      // Fix negative values that should be positive
      ['revenue', 'totalAssets', 'equity'].forEach(key => {
        if (fixedData[key] < 0) {
          fixedData[key] = Math.abs(fixedData[key]);
        }
      });

      fixed.data = fixedData;
      return fixed;
    });
  }, []);

  return {
    // Extraction functions
    extractFromExcel,
    extractFromPDF,
    smartExtract,
    extractAndAnalyze,
    
    // Results and validation
    extractionResults,
    validationResult,
    getQualityMetrics,
    
    // Data fixing
    applyAutoFixes,
    
    // State
    isExtracting: isExtracting || aiService.isLoading,
    error: error || aiService.error,
    
    // AI service access
    aiService,
    isReady: aiService.isInitialized
  };
}

/**
 * Convert extracted data to financial data format
 * @private
 */
function convertExtractedToFinancialData(extractedData) {
  const calculatedData = extractedData.map((period, index) => ({
    periodNumber: index + 1,
    ...period.data
  }));

  return {
    calculatedData,
    companyInfo: {
      name: 'Extracted Company',
      reportTitle: 'AI Extracted Financial Data',
      periodType: 'monthly',
      numberOfPeriods: extractedData.length
    }
  };
}

/**
 * Parse financial number from string
 * @private
 */
function parseFinancialNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return NaN;

  // Remove currency symbols and spaces
  let cleaned = str.toString().replace(/[R$€£¥\s]/g, '');
  
  // Handle Brazilian format (1.234,56)
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Handle standard format (1,234.56)
    cleaned = cleaned.replace(/,/g, '');
  }
  
  // Handle parentheses for negative numbers
  if (cleaned.includes('(') && cleaned.includes(')')) {
    cleaned = '-' + cleaned.replace(/[()]/g, '');
  }
  
  return parseFloat(cleaned);
}