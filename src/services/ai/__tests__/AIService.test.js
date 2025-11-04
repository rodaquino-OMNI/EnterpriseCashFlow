// src/services/ai/__tests__/AIService.test.js
import { AIService } from '../AIService';
import { AIProviderFactory } from '../providers/AIProviderFactory';
import { PromptTemplateFactory } from '../templates/PromptTemplates';
import { ResponseParser } from '../utils/ResponseParser';
import { AIProviderType } from '../types';

// Mock dependencies
jest.mock('../providers/AIProviderFactory');
jest.mock('../templates/PromptTemplates');
jest.mock('../utils/ResponseParser');

describe('AIService', () => {
  let mockProvider;
  let mockTemplate;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock provider
    mockProvider = {
      complete: jest.fn(),
      extractData: jest.fn(),
      healthCheck: jest.fn()
    };

    // Mock template
    mockTemplate = {
      generate: jest.fn().mockReturnValue('Generated prompt')
    };

    AIProviderFactory.create = jest.fn().mockReturnValue(mockProvider);
    PromptTemplateFactory.create = jest.fn().mockReturnValue(mockTemplate);

    // Mock ResponseParser
    ResponseParser.parseMarkdownSections = jest.fn().mockReturnValue({
      introduction: 'Intro text',
      analysis: 'Analysis text'
    });
    ResponseParser.extractFinancialMetrics = jest.fn().mockReturnValue([]);
    ResponseParser.extractNumberedList = jest.fn().mockReturnValue([]);
    ResponseParser.extractBulletPoints = jest.fn().mockReturnValue([]);
  });

  describe('constructor', () => {
    it('should create service with default config', () => {
      const service = new AIService();
      expect(service.currentProvider).toBe(AIProviderType.GEMINI);
      expect(service.cache).toBeInstanceOf(Map);
      expect(service.cacheTimeout).toBe(15 * 60 * 1000);
    });

    it('should create service with custom config', () => {
      const config = {
        defaultProvider: AIProviderType.OPENAI,
        cacheTimeout: 30 * 60 * 1000
      };
      const service = new AIService(config);
      expect(service.currentProvider).toBe(AIProviderType.OPENAI);
      expect(service.cacheTimeout).toBe(30 * 60 * 1000);
    });

    it('should initialize providers when provided in config', () => {
      const config = {
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      };
      const service = new AIService(config);
      expect(AIProviderFactory.create).toHaveBeenCalledWith(AIProviderType.GEMINI, { apiKey: 'test-key' });
    });
  });

  describe('initializeProviders', () => {
    it('should initialize multiple providers', () => {
      const service = new AIService();
      const configs = {
        [AIProviderType.GEMINI]: { apiKey: 'gemini-key' },
        [AIProviderType.OPENAI]: { apiKey: 'openai-key' }
      };

      service.initializeProviders(configs);

      expect(AIProviderFactory.create).toHaveBeenCalledTimes(2);
      expect(AIProviderFactory.create).toHaveBeenCalledWith(AIProviderType.GEMINI, { apiKey: 'gemini-key' });
      expect(AIProviderFactory.create).toHaveBeenCalledWith(AIProviderType.OPENAI, { apiKey: 'openai-key' });
    });

    it('should handle provider initialization errors gracefully', () => {
      const service = new AIService();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      AIProviderFactory.create.mockImplementationOnce(() => {
        throw new Error('Provider init failed');
      });

      const configs = {
        [AIProviderType.GEMINI]: { apiKey: 'test-key' }
      };

      service.initializeProviders(configs);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('setProvider', () => {
    it('should set current provider', () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'key1' },
          [AIProviderType.OPENAI]: { apiKey: 'key2' }
        }
      });

      service.setProvider(AIProviderType.OPENAI);
      expect(service.currentProvider).toBe(AIProviderType.OPENAI);
    });

    it('should throw error if provider not initialized', () => {
      const service = new AIService();

      expect(() => {
        service.setProvider(AIProviderType.CLAUDE);
      }).toThrow('Provider claude not initialized');
    });
  });

  describe('getCurrentProvider', () => {
    it('should return current provider instance', () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const provider = service.getCurrentProvider();
      expect(provider).toBe(mockProvider);
    });

    it('should throw error if no provider available', () => {
      const service = new AIService();

      expect(() => {
        service.getCurrentProvider();
      }).toThrow(`No provider available for ${AIProviderType.GEMINI}`);
    });
  });

  describe('analyzeFinancial', () => {
    it('should perform financial analysis successfully', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [
          { netProfit: 100000 },
          { netProfit: 120000 }
        ]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: { provider: 'gemini' }
      });

      const result = await service.analyzeFinancial('profitability', financialData);

      expect(PromptTemplateFactory.create).toHaveBeenCalledWith('profitability', { language: 'pt-BR' });
      expect(mockTemplate.generate).toHaveBeenCalled();
      expect(mockProvider.complete).toHaveBeenCalled();
      expect(result).toHaveProperty('type', 'profitability');
      expect(result).toHaveProperty('content', 'Analysis result');
    });

    it('should use cache when available', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      // First call - not cached
      await service.analyzeFinancial('profitability', financialData);
      expect(mockProvider.complete).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.analyzeFinancial('profitability', financialData);
      expect(mockProvider.complete).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should skip cache when requested', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      // First call
      await service.analyzeFinancial('profitability', financialData);
      // Second call with skipCache
      await service.analyzeFinancial('profitability', financialData, { skipCache: true });

      expect(mockProvider.complete).toHaveBeenCalledTimes(2);
    });

    it('should handle analysis errors', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockRejectedValue(new Error('API Error'));

      await expect(
        service.analyzeFinancial('profitability', financialData)
      ).rejects.toThrow('Analysis failed: API Error');
    });

    it('should use custom temperature and maxTokens', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      await service.analyzeFinancial('profitability', financialData, {
        temperature: 0.7,
        maxTokens: 5000
      });

      expect(mockProvider.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            temperature: 0.7,
            maxTokens: 5000
          })
        })
      );
    });
  });

  describe('extractData', () => {
    it('should extract data from document successfully', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      mockProvider.extractData.mockResolvedValue({
        success: true,
        data: [{ revenue: 1000000 }],
        confidence: 0.95
      });

      const result = await service.extractData('Document content', 'pdf', { fields: ['revenue'] });

      expect(PromptTemplateFactory.create).toHaveBeenCalledWith('data_extraction');
      expect(mockProvider.extractData).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle extraction errors gracefully', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      mockProvider.extractData.mockRejectedValue(new Error('Extraction failed'));

      const result = await service.extractData('Document content', 'pdf', { fields: ['revenue'] });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Extraction failed');
      expect(result.confidence).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Generated insights',
        metadata: { provider: 'gemini' }
      });

      const result = await service.generateInsights(financialData, ['profitability', 'growth']);

      expect(PromptTemplateFactory.create).toHaveBeenCalledWith('insight_generation');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('focusAreas');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle insight generation errors', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockRejectedValue(new Error('Generation failed'));

      await expect(
        service.generateInsights(financialData)
      ).rejects.toThrow('Insight generation failed: Generation failed');
    });
  });

  describe('batchAnalyze', () => {
    it('should analyze multiple types successfully', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      const result = await service.batchAnalyze(
        ['profitability', 'liquidity'],
        financialData
      );

      expect(result.results).toHaveProperty('profitability');
      expect(result.results).toHaveProperty('liquidity');
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should handle partial failures in batch analysis', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete
        .mockResolvedValueOnce({ content: 'Result 1', metadata: {} })
        .mockRejectedValueOnce(new Error('Analysis 2 failed'));

      const result = await service.batchAnalyze(
        ['profitability', 'liquidity'],
        financialData
      );

      expect(result.results).toHaveProperty('profitability');
      expect(result.errors).toHaveProperty('liquidity');
    });
  });

  describe('categorizeInsight', () => {
    it('should categorize risk insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('This is a critical risk')).toBe('risk');
      expect(service.categorizeInsight('Identificamos um risco significativo')).toBe('risk');
    });

    it('should categorize opportunity insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('Great opportunity for growth')).toBe('opportunity');
      expect(service.categorizeInsight('Existe uma oportunidade potencial')).toBe('opportunity');
    });

    it('should categorize efficiency insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('Optimize operations for efficiency')).toBe('efficiency');
      expect(service.categorizeInsight('Melhorar a eficiência operacional')).toBe('efficiency');
    });

    it('should categorize growth insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('Significant growth potential')).toBe('growth');
      expect(service.categorizeInsight('Oportunidade de crescimento')).toBe('growth');
    });

    it('should categorize cost insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('Reduce costs significantly')).toBe('cost');
      expect(service.categorizeInsight('Controle de custos e despesas')).toBe('cost');
    });

    it('should return general for uncategorized insights', () => {
      const service = new AIService();
      expect(service.categorizeInsight('Some general observation')).toBe('general');
    });
  });

  describe('prioritizeInsight', () => {
    it('should identify high priority insights', () => {
      const service = new AIService();
      expect(service.prioritizeInsight('This is critical and urgent')).toBe('high');
      expect(service.prioritizeInsight('Ação imediata necessária')).toBe('high');
    });

    it('should identify medium priority insights', () => {
      const service = new AIService();
      expect(service.prioritizeInsight('This is important to address')).toBe('medium');
      expect(service.prioritizeInsight('Ponto significativo a considerar')).toBe('medium');
    });

    it('should identify low priority insights', () => {
      const service = new AIService();
      expect(service.prioritizeInsight('Minor observation')).toBe('low');
      expect(service.prioritizeInsight('Considerar no futuro')).toBe('low');
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        }
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      // Create cached item
      await service.analyzeFinancial('profitability', financialData);
      expect(service.cache.size).toBeGreaterThan(0);

      // Clear cache
      service.clearCache();
      expect(service.cache.size).toBe(0);
    });

    it('should expire cached items after timeout', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'test-key' }
        },
        cacheTimeout: 100 // 100ms for testing
      });

      const financialData = {
        companyInfo: { name: 'Test Company' },
        calculatedData: [{ netProfit: 100000 }]
      };

      mockProvider.complete.mockResolvedValue({
        content: 'Analysis result',
        metadata: {}
      });

      // First call - creates cache
      await service.analyzeFinancial('profitability', financialData);
      expect(mockProvider.complete).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call - cache expired, should make new request
      await service.analyzeFinancial('profitability', financialData);
      expect(mockProvider.complete).toHaveBeenCalledTimes(2);
    });
  });

  describe('healthCheck', () => {
    it('should check health of all providers', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'key1' },
          [AIProviderType.OPENAI]: { apiKey: 'key2' }
        }
      });

      mockProvider.healthCheck.mockResolvedValue(true);

      const status = await service.healthCheck();

      expect(status).toHaveProperty(AIProviderType.GEMINI);
      expect(status).toHaveProperty(AIProviderType.OPENAI);
    });

    it('should handle provider health check failures', async () => {
      const service = new AIService({
        providers: {
          [AIProviderType.GEMINI]: { apiKey: 'key1' }
        }
      });

      mockProvider.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const status = await service.healthCheck();

      expect(status[AIProviderType.GEMINI]).toBe(false);
    });
  });
});
