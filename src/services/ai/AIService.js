// src/services/ai/AIService.js
import { AIProviderFactory } from './providers/AIProviderFactory';
import { PromptTemplateFactory } from './templates/PromptTemplates';
import { ResponseParser } from './utils/ResponseParser';
import { AnalysisType, AIProviderType } from './types';

/**
 * Main AI Service for financial analysis
 */
export class AIService {
  constructor(config = {}) {
    this.providers = {};
    this.currentProvider = config.defaultProvider || AIProviderType.GEMINI;
    this.templates = {};
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 15 * 60 * 1000; // 15 minutes
    
    // Initialize providers if config provided
    if (config.providers) {
      this.initializeProviders(config.providers);
    }
  }

  /**
   * Initialize AI providers
   * @param {Object} providerConfigs - Configuration for each provider
   */
  initializeProviders(providerConfigs) {
    Object.entries(providerConfigs).forEach(([type, config]) => {
      try {
        this.providers[type] = AIProviderFactory.create(type, config);
      } catch (error) {
        console.warn(`Failed to initialize provider ${type}:`, error);
      }
    });
  }

  /**
   * Set current provider
   * @param {string} providerType - Provider type from AIProviderType
   */
  setProvider(providerType) {
    if (!this.providers[providerType]) {
      throw new Error(`Provider ${providerType} not initialized`);
    }
    this.currentProvider = providerType;
  }

  /**
   * Get current provider instance
   * @returns {import('./providers/BaseProvider').BaseProvider}
   */
  getCurrentProvider() {
    const provider = this.providers[this.currentProvider];
    if (!provider) {
      throw new Error(`No provider available for ${this.currentProvider}`);
    }
    return provider;
  }

  /**
   * Perform financial analysis
   * @param {string} analysisType - Type of analysis from AnalysisType
   * @param {Object} financialData - Financial data bundle
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeFinancial(analysisType, financialData, options = {}) {
    const cacheKey = this.getCacheKey(analysisType, financialData, options);
    
    // Check cache
    if (!options.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      // Get provider
      const provider = this.getCurrentProvider();
      
      // Generate prompt using template
      const template = PromptTemplateFactory.create(analysisType, {
        language: options.language || 'pt-BR'
      });
      
      const prompt = template.generate(
        financialData,
        financialData.companyInfo,
        options.focusAreas
      );

      // Make AI request
      const response = await provider.complete({
        prompt,
        parameters: {
          temperature: options.temperature || 0.3,
          maxTokens: options.maxTokens || 4000,
          ...options.parameters
        }
      });

      // Parse and structure response
      const result = this.structureAnalysisResult(
        response,
        analysisType,
        financialData
      );

      // Cache result
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`Financial analysis failed for ${analysisType}:`, error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract data from document
   * @param {string} content - Document content
   * @param {string} documentType - Type of document (pdf, excel, etc)
   * @param {Object} schema - Expected data schema
   * @param {Object} options - Extraction options
   * @returns {Promise<import('./types').ExtractionResult>}
   */
  async extractData(content, documentType, schema, options = {}) {
    try {
      const provider = this.getCurrentProvider();
      
      // Use extraction template
      const template = PromptTemplateFactory.create('data_extraction');
      const prompt = template.generate(content, schema, documentType, options);

      // Perform extraction
      const result = await provider.extractData(content, schema, {
        ...options,
        documentType
      });

      return result;
    } catch (error) {
      console.error('Data extraction failed:', error);
      return {
        success: false,
        data: [],
        confidence: 0,
        error: error.message,
        metadata: { provider: this.currentProvider }
      };
    }
  }

  /**
   * Generate insights from financial data
   * @param {Object} financialData - Financial data bundle
   * @param {Array<string>} focusAreas - Areas to focus on
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Insights
   */
  async generateInsights(financialData, focusAreas = [], options = {}) {
    try {
      const template = PromptTemplateFactory.create('insight_generation');
      const prompt = template.generate(
        financialData,
        financialData.companyInfo,
        focusAreas,
        options
      );

      const provider = this.getCurrentProvider();
      const response = await provider.complete({
        prompt,
        parameters: {
          temperature: options.temperature || 0.5,
          maxTokens: options.maxTokens || 3000,
          ...options.parameters
        }
      });

      // Parse insights
      const insights = this.parseInsights(response.content);
      
      return {
        insights,
        metadata: response.metadata,
        focusAreas,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Insight generation failed:', error);
      throw new Error(`Insight generation failed: ${error.message}`);
    }
  }

  /**
   * Batch analyze multiple types
   * @param {Array<string>} analysisTypes - Types to analyze
   * @param {Object} financialData - Financial data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Results by type
   */
  async batchAnalyze(analysisTypes, financialData, options = {}) {
    const results = {};
    const errors = {};

    await Promise.all(
      analysisTypes.map(async (type) => {
        try {
          results[type] = await this.analyzeFinancial(type, financialData, options);
        } catch (error) {
          errors[type] = error.message;
        }
      })
    );

    return { results, errors };
  }

  /**
   * Structure analysis result
   * @private
   */
  structureAnalysisResult(response, analysisType, financialData) {
    const sections = ResponseParser.parseMarkdownSections(response.content);
    const metrics = ResponseParser.extractFinancialMetrics(response.content);
    
    return {
      type: analysisType,
      content: response.content,
      sections,
      metrics,
      metadata: {
        ...response.metadata,
        company: financialData.companyInfo.name,
        periods: financialData.calculatedData.length,
        analysisDate: new Date().toISOString()
      }
    };
  }

  /**
   * Parse insights from response
   * @private
   */
  parseInsights(content) {
    const sections = ResponseParser.parseMarkdownSections(content);
    const insights = [];

    // Extract from numbered lists
    Object.values(sections).forEach(section => {
      const numberedItems = ResponseParser.extractNumberedList(section);
      numberedItems.forEach(item => {
        insights.push({
          text: item.text,
          category: this.categorizeInsight(item.text),
          priority: this.prioritizeInsight(item.text)
        });
      });
    });

    // Extract from bullet points
    Object.values(sections).forEach(section => {
      const bullets = ResponseParser.extractBulletPoints(section);
      bullets.forEach(bullet => {
        insights.push({
          text: bullet,
          category: this.categorizeInsight(bullet),
          priority: this.prioritizeInsight(bullet)
        });
      });
    });

    return insights;
  }

  /**
   * Categorize insight
   * @private
   */
  categorizeInsight(text) {
    const categories = {
      risk: ['risk', 'risco', 'threat', 'ameaça'],
      opportunity: ['opportunity', 'oportunidade', 'potential', 'potencial'],
      efficiency: ['efficiency', 'eficiência', 'optimize', 'otimizar'],
      growth: ['growth', 'crescimento', 'expansion', 'expansão'],
      cost: ['cost', 'custo', 'expense', 'despesa']
    };

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Prioritize insight
   * @private
   */
  prioritizeInsight(text) {
    const highPriorityKeywords = ['critical', 'crítico', 'urgent', 'urgente', 'immediate', 'imediato'];
    const mediumPriorityKeywords = ['important', 'importante', 'significant', 'significativo'];
    
    const lowerText = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    }
    
    if (mediumPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get cache key
   * @private
   */
  getCacheKey(analysisType, financialData, options) {
    const dataHash = JSON.stringify({
      type: analysisType,
      company: financialData.companyInfo.name,
      periods: financialData.calculatedData.length,
      lastPeriod: financialData.calculatedData[financialData.calculatedData.length - 1]?.netProfit
    });
    
    return `${analysisType}_${this.currentProvider}_${dataHash}`;
  }

  /**
   * Get from cache
   * @private
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache
   * @private
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Health check all providers
   * @returns {Promise<Object>} Health status by provider
   */
  async healthCheck() {
    const status = {};
    
    await Promise.all(
      Object.entries(this.providers).map(async ([type, provider]) => {
        try {
          status[type] = await provider.healthCheck();
        } catch (error) {
          status[type] = false;
        }
      })
    );
    
    return status;
  }
}