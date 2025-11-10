// src/services/ai/types.js

/**
 * @typedef {Object} AIServiceConfig
 * @property {string} provider - The AI provider to use
 * @property {string} [apiKey] - API key for the provider
 * @property {Object} [options] - Additional provider-specific options
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {number} [maxRetries] - Maximum number of retry attempts
 * @property {Object} [rateLimiting] - Rate limiting configuration
 */

/**
 * @typedef {Object} AIRequest
 * @property {string} prompt - The prompt to send to the AI
 * @property {Object} [parameters] - Request parameters
 * @property {number} [parameters.temperature] - Temperature setting
 * @property {number} [parameters.maxTokens] - Maximum tokens
 * @property {string} [parameters.model] - Model override
 * @property {string} [systemPrompt] - System prompt for context
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} AIResponse
 * @property {string} content - The AI response content
 * @property {Object} metadata - Response metadata
 * @property {string} metadata.provider - Provider used
 * @property {string} metadata.model - Model used
 * @property {number} metadata.tokensUsed - Tokens consumed
 * @property {number} metadata.responseTime - Response time in ms
 * @property {Object} [metadata.usage] - Usage statistics
 * @property {number} [confidence] - Confidence score (0-1)
 * @property {string} [error] - Error message if any
 */

/**
 * @typedef {Object} AnalysisContext
 * @property {Object} financialData - Financial data bundle
 * @property {string} analysisType - Type of analysis
 * @property {Object} [options] - Analysis options
 * @property {string} [language] - Response language
 */

/**
 * @typedef {Object} ProviderCapabilities
 * @property {number} maxTokens - Maximum tokens supported
 * @property {boolean} supportsStreaming - Streaming support
 * @property {boolean} supportsVision - Vision/image support
 * @property {boolean} supportsFunctionCalling - Function calling support
 * @property {string[]} models - Available models
 * @property {Object} rateLimit - Rate limiting info
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {boolean} success - Whether extraction succeeded
 * @property {Array} data - Extracted data
 * @property {number} confidence - Confidence level (0-1)
 * @property {Object} metadata - Extraction metadata
 * @property {string[]} [warnings] - Any warnings
 * @property {string} [error] - Error if failed
 */

export const AIProviderType = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  CLAUDE: 'claude',
  OLLAMA: 'ollama',
};

export const AnalysisType = {
  EXECUTIVE_SUMMARY: 'executive_summary',
  VARIANCE_ANALYSIS: 'variance_analysis',
  RISK_ASSESSMENT: 'risk_assessment',
  CASH_FLOW_ANALYSIS: 'cash_flow_analysis',
  STRATEGIC_RECOMMENDATIONS: 'strategic_recommendations',
  FINANCIAL_DATA_EXTRACTION: 'financial_data_extraction',
  DOCUMENT_PARSING: 'document_parsing',
  INSIGHT_GENERATION: 'insight_generation',
};

export const ResponseFormat = {
  TEXT: 'text',
  JSON: 'json',
  MARKDOWN: 'markdown',
  STRUCTURED: 'structured',
};

export const ExtractionSource = {
  PDF: 'pdf',
  EXCEL: 'excel',
  IMAGE: 'image',
  TEXT: 'text',
};