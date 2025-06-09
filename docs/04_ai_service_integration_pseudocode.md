# EnterpriseCashFlow - AI Service Integration Pseudocode

## 1. Module Overview

The AI Service Integration module manages multi-provider AI analysis for financial data, implementing intelligent provider selection, quality scoring, and fallback mechanisms. It abstracts the complexity of different AI providers behind a unified interface.

### 1.1 Module Dependencies
- Domain Models: [`AiAnalysisResult`](docs/02_domain_model_specification.md:155), [`CalculatedFinancialData`](docs/02_domain_model_specification.md:120)
- Provider Adapters: Gemini, GPT-4, Claude, Ollama
- Quality Assessment: Content validation and scoring
- Rate Limiting: Request throttling and queue management

### 1.2 Core Responsibilities
- Multi-provider AI service orchestration
- Intelligent provider selection based on analysis type
- Quality scoring and validation of AI responses
- Fallback and retry mechanisms
- Rate limiting and request optimization
- Analysis history and caching

## 2. AiServiceManager Class

```typescript
class AiServiceManager {
  private providers: Map<AiProvider, AiProviderAdapter>
  private qualityAssessor: QualityAssessor
  private rateLimiter: RateLimiter
  private analysisCache: AnalysisCache
  private configManager: AiConfigManager
  
  // TEST: Manager initializes with all required providers
  // TEST: Validates provider configurations on startup
  constructor(config: AiServiceConfig) {
    this.providers = new Map()
    this.qualityAssessor = new QualityAssessor()
    this.rateLimiter = new RateLimiter(config.rateLimits)
    this.analysisCache = new AnalysisCache(config.cacheConfig)
    this.configManager = new AiConfigManager(config)
    
    // Initialize provider adapters
    this.initializeProviders(config.providers)
  }
  
  // TEST: Generates analysis with optimal provider selection
  // TEST: Handles provider failures gracefully with fallbacks
  // TEST: Returns cached results when appropriate
  async generateAnalysis(
    analysisType: AnalysisType,
    financialData: CalculatedFinancialData[],
    options: AnalysisOptions = {}
  ): Promise<AiAnalysisResult> {
    
    // Check cache first
    // TEST: Cache lookup uses correct key generation
    cacheKey = this.generateCacheKey(analysisType, financialData, options)
    cachedResult = await this.analysisCache.get(cacheKey)
    
    if cachedResult && !options.forceRefresh:
      // TEST: Returns cached result with updated timestamp
      return this.refreshCachedResult(cachedResult)
    
    // Select optimal provider for analysis type
    // TEST: Provider selection follows configured preferences
    selectedProvider = this.selectProvider(analysisType, options.preferredProvider)
    
    // Check rate limits
    // TEST: Rate limiting prevents excessive API calls
    await this.rateLimiter.checkLimit(selectedProvider)
    
    // Generate analysis with retry logic
    // TEST: Retry mechanism handles transient failures
    analysisResult = await this.generateWithRetry(
      selectedProvider,
      analysisType,
      financialData,
      options
    )
    
    // Cache successful result
    // TEST: Successful results are cached with appropriate TTL
    if analysisResult.qualityScore >= MIN_CACHE_QUALITY_SCORE:
      await this.analysisCache.set(cacheKey, analysisResult)
    
    // TEST: Returns complete analysis result
    return analysisResult
  }
  
  // TEST: Provider selection follows configured rules
  // TEST: Falls back to available providers when preferred unavailable
  private selectProvider(
    analysisType: AnalysisType,
    preferredProvider?: AiProvider
  ): AiProvider {
    
    // Use preferred provider if specified and available
    if preferredProvider && this.isProviderAvailable(preferredProvider):
      return preferredProvider
    
    // Get optimal providers for analysis type
    // TEST: Provider preferences are correctly configured
    optimalProviders = this.configManager.getOptimalProviders(analysisType)
    
    // Select first available provider from optimal list
    for provider in optimalProviders:
      if this.isProviderAvailable(provider):
        return provider
    
    // Fallback to any available provider
    // TEST: Fallback mechanism ensures service availability
    availableProviders = this.getAvailableProviders()
    if availableProviders.length > 0:
      return availableProviders[0]
    
    // TEST: Throws appropriate error when no providers available
    throw new NoProvidersAvailableError("All AI providers are currently unavailable")
  }
  
  // TEST: Retry mechanism handles different failure types appropriately
  // TEST: Exponential backoff prevents API abuse
  // TEST: Quality threshold enforcement works correctly
  private async generateWithRetry(
    provider: AiProvider,
    analysisType: AnalysisType,
    financialData: CalculatedFinancialData[],
    options: AnalysisOptions,
    attempt: number = 1
  ): Promise<AiAnalysisResult> {
    
    try {
      // Generate prompt for analysis
      // TEST: Prompt generation includes all relevant financial data
      prompt = await this.generatePrompt(analysisType, financialData, options)
      
      // Call AI provider
      // TEST: Provider adapter handles API communication correctly
      providerAdapter = this.providers.get(provider)
      rawResponse = await providerAdapter.generateAnalysis(prompt, options)
      
      // Process and validate response
      // TEST: Response processing handles various response formats
      analysisResult = await this.processResponse(
        rawResponse,
        analysisType,
        provider,
        financialData
      )
      
      // Assess quality
      // TEST: Quality assessment uses appropriate criteria
      qualityScore = await this.qualityAssessor.assessQuality(
        analysisResult,
        analysisType,
        financialData
      )
      
      analysisResult.qualityScore = qualityScore
      
      // Check if quality meets threshold
      // TEST: Quality threshold checking works correctly
      if qualityScore >= this.configManager.getQualityThreshold(analysisType):
        return analysisResult
      
      // Quality too low, retry with different provider if attempts remain
      if attempt < MAX_RETRY_ATTEMPTS:
        // TEST: Provider switching on quality failure
        nextProvider = this.selectAlternativeProvider(provider, analysisType)
        return await this.generateWithRetry(
          nextProvider,
          analysisType,
          financialData,
          options,
          attempt + 1
        )
      
      // TEST: Returns low-quality result when max attempts reached
      return analysisResult
      
    } catch (error) {
      // Handle different error types
      // TEST: Error handling distinguishes between recoverable and fatal errors
      if this.isRecoverableError(error) && attempt < MAX_RETRY_ATTEMPTS:
        // Wait with exponential backoff
        await this.waitWithBackoff(attempt)
        
        // Try with same or different provider
        retryProvider = this.shouldSwitchProvider(error) 
          ? this.selectAlternativeProvider(provider, analysisType)
          : provider
        
        return await this.generateWithRetry(
          retryProvider,
          analysisType,
          financialData,
          options,
          attempt + 1
        )
      
      // TEST: Fatal errors are properly propagated
      throw new AiAnalysisError(`Failed to generate analysis: ${error.message}`, error)
    }
  }
}
```

## 3. Prompt Generation System

```typescript
class PromptGenerator {
  private templateManager: PromptTemplateManager
  private dataFormatter: FinancialDataFormatter
  
  // TEST: Generates appropriate prompts for each analysis type
  // TEST: Includes all relevant financial data in prompts
  // TEST: Handles missing data gracefully
  async generatePrompt(
    analysisType: AnalysisType,
    financialData: CalculatedFinancialData[],
    options: AnalysisOptions
  ): Promise<string> {
    
    // Get template for analysis type
    // TEST: Template selection works for all analysis types
    template = this.templateManager.getTemplate(analysisType)
    
    // Format financial data for prompt
    // TEST: Data formatting preserves important financial relationships
    formattedData = this.dataFormatter.formatForPrompt(financialData)
    
    // Generate context information
    // TEST: Context generation includes relevant business information
    contextInfo = this.generateContextInfo(financialData, options)
    
    // Build prompt from template
    // TEST: Template interpolation handles all required variables
    prompt = template.interpolate({
      financialData: formattedData,
      contextInfo: contextInfo,
      analysisType: analysisType,
      companyInfo: financialData[0]?.companyInfo,
      periodCount: financialData.length,
      currency: financialData[0]?.companyInfo?.currency || "BRL",
      language: options.language || "Portuguese"
    })
    
    // Validate prompt length and content
    // TEST: Prompt validation ensures appropriate length and content
    this.validatePrompt(prompt, analysisType)
    
    // TEST: Returns well-formed prompt string
    return prompt
  }
  
  // TEST: Context generation includes relevant business insights
  // TEST: Handles edge cases like single period or missing data
  private generateContextInfo(
    financialData: CalculatedFinancialData[],
    options: AnalysisOptions
  ): string {
    
    contextParts = []
    
    // Company information
    if financialData.length > 0:
      companyInfo = financialData[0].companyInfo
      contextParts.push(`Company: ${companyInfo.name}`)
      contextParts.push(`Industry: ${companyInfo.industry || "Not specified"}`)
      contextParts.push(`Period Type: ${companyInfo.periodType}`)
    
    // Data quality information
    // TEST: Data quality context helps AI understand limitations
    dataQualityInfo = this.assessDataQuality(financialData)
    contextParts.push(`Data Quality: ${dataQualityInfo}`)
    
    // Trend information
    // TEST: Trend context provides valuable analysis direction
    if financialData.length > 1:
      trendInfo = this.generateTrendContext(financialData)
      contextParts.push(`Trends: ${trendInfo}`)
    
    // Special focus areas
    // TEST: Focus areas guide AI attention to important aspects
    if options.focusAreas && options.focusAreas.length > 0:
      contextParts.push(`Focus Areas: ${options.focusAreas.join(", ")}`)
    
    return contextParts.join("\n")
  }
  
  // TEST: Prompt validation catches common issues
  // TEST: Length validation prevents token limit exceeded errors
  private validatePrompt(prompt: string, analysisType: AnalysisType): void {
    
    // Check minimum length
    if prompt.length < MIN_PROMPT_LENGTH:
      throw new PromptValidationError("Prompt too short for meaningful analysis")
    
    // Check maximum length (token estimation)
    estimatedTokens = this.estimateTokenCount(prompt)
    maxTokens = this.getMaxTokensForAnalysisType(analysisType)
    
    if estimatedTokens > maxTokens:
      throw new PromptValidationError(`Prompt too long: ${estimatedTokens} tokens (max: ${maxTokens})`)
    
    // Check required content
    // TEST: Content validation ensures prompt completeness
    requiredElements = this.getRequiredElements(analysisType)
    for element in requiredElements:
      if !prompt.includes(element):
        throw new PromptValidationError(`Missing required element: ${element}`)
  }
}
```

## 4. Provider Adapters

```typescript
// Base adapter interface
abstract class AiProviderAdapter {
  protected config: ProviderConfig
  protected httpClient: HttpClient
  
  // TEST: Adapter initializes with proper configuration
  constructor(config: ProviderConfig) {
    this.config = config
    this.httpClient = new HttpClient(config.httpConfig)
  }
  
  // TEST: Abstract method ensures consistent interface
  abstract async generateAnalysis(
    prompt: string,
    options: AnalysisOptions
  ): Promise<RawAiResponse>
  
  // TEST: Health check validates provider availability
  abstract async healthCheck(): Promise<boolean>
  
  // TEST: Rate limit info helps with request planning
  abstract getRateLimitInfo(): RateLimitInfo
}

// Gemini provider adapter
class GeminiAdapter extends AiProviderAdapter {
  
  // TEST: Gemini API integration works correctly
  // TEST: Handles Gemini-specific response format
  // TEST: Manages API key securely
  async generateAnalysis(
    prompt: string,
    options: AnalysisOptions
  ): Promise<RawAiResponse> {
    
    // Prepare Gemini-specific request
    // TEST: Request formatting follows Gemini API specification
    request = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4000,
        topP: options.topP || 0.8
      }
    }
    
    // Add safety settings
    // TEST: Safety settings prevent inappropriate content
    request.safetySettings = this.getSafetySettings()
    
    // Make API call
    // TEST: API call handles authentication and errors properly
    response = await this.httpClient.post(
      this.config.apiEndpoint,
      request,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    // Process response
    // TEST: Response processing extracts content correctly
    return this.processGeminiResponse(response)
  }
  
  // TEST: Health check validates Gemini service availability
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test request
      testResponse = await this.httpClient.get(
        `${this.config.apiEndpoint}/models`,
        {
          headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
        }
      )
      return testResponse.status === 200
    } catch (error) {
      return false
    }
  }
}

// GPT-4 provider adapter
class Gpt4Adapter extends AiProviderAdapter {
  
  // TEST: OpenAI API integration works correctly
  // TEST: Handles OpenAI-specific response format
  async generateAnalysis(
    prompt: string,
    options: AnalysisOptions
  ): Promise<RawAiResponse> {
    
    // Prepare OpenAI-specific request
    // TEST: Request formatting follows OpenAI API specification
    request = {
      model: this.config.model || "gpt-4",
      messages: [
        {
          role: "system",
          content: this.getSystemPrompt(options.analysisType)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000
    }
    
    // Make API call
    // TEST: API call handles OpenAI authentication correctly
    response = await this.httpClient.post(
      this.config.apiEndpoint,
      request,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    // TEST: Response processing handles OpenAI format
    return this.processOpenAiResponse(response)
  }
}
```

## 5. Quality Assessment System

```typescript
class QualityAssessor {
  private contentValidator: ContentValidator
  private structureAnalyzer: StructureAnalyzer
  private relevanceChecker: RelevanceChecker
  
  // TEST: Quality assessment covers all important dimensions
  // TEST: Scoring is consistent and reproducible
  // TEST: Different analysis types have appropriate quality criteria
  async assessQuality(
    analysisResult: AiAnalysisResult,
    analysisType: AnalysisType,
    financialData: CalculatedFinancialData[]
  ): Promise<number> {
    
    qualityScores = []
    
    // Content quality assessment
    // TEST: Content quality checks for completeness and accuracy
    contentScore = await this.contentValidator.validateContent(
      analysisResult.content,
      analysisType
    )
    qualityScores.push({ dimension: "content", score: contentScore, weight: 0.4 })
    
    // Structure quality assessment
    // TEST: Structure analysis ensures proper organization
    structureScore = this.structureAnalyzer.analyzeStructure(
      analysisResult.content,
      analysisType
    )
    qualityScores.push({ dimension: "structure", score: structureScore, weight: 0.3 })
    
    // Relevance assessment
    // TEST: Relevance checking ensures analysis addresses financial data
    relevanceScore = await this.relevanceChecker.checkRelevance(
      analysisResult.content,
      financialData,
      analysisType
    )
    qualityScores.push({ dimension: "relevance", score: relevanceScore, weight: 0.3 })
    
    // Calculate weighted average
    // TEST: Weighted scoring produces meaningful quality scores
    totalScore = 0
    totalWeight = 0
    
    for scoreInfo in qualityScores:
      totalScore += scoreInfo.score * scoreInfo.weight
      totalWeight += scoreInfo.weight
    
    finalScore = totalWeight > 0 ? totalScore / totalWeight : 0
    
    // TEST: Quality score is within expected range (0-100)
    return Math.max(0, Math.min(100, finalScore))
  }
  
  // TEST: Content validation checks for required elements
  // TEST: Handles different analysis types appropriately
  private async validateContent(
    content: string,
    analysisType: AnalysisType
  ): Promise<number> {
    
    score = 100
    
    // Check minimum length
    // TEST: Length validation is appropriate for analysis type
    minLength = this.getMinimumLength(analysisType)
    if content.length < minLength:
      score -= 20
    
    // Check for required sections
    // TEST: Section validation ensures comprehensive analysis
    requiredSections = this.getRequiredSections(analysisType)
    missingSections = 0
    
    for section in requiredSections:
      if !this.containsSection(content, section):
        missingSections++
    
    score -= (missingSections / requiredSections.length) * 30
    
    // Check for financial terminology
    // TEST: Financial terminology validation ensures domain relevance
    financialTerms = this.extractFinancialTerms(content)
    expectedTermCount = this.getExpectedTermCount(analysisType)
    
    if financialTerms.length < expectedTermCount:
      score -= 15
    
    // Check for specific insights
    // TEST: Insight validation ensures actionable content
    insightScore = this.assessInsightQuality(content, analysisType)
    score = score * (insightScore / 100)
    
    return Math.max(0, score)
  }
}
```

## 6. Rate Limiting and Caching

```typescript
class RateLimiter {
  private limits: Map<AiProvider, RateLimit>
  private usage: Map<AiProvider, UsageTracker>
  
  // TEST: Rate limiter initializes with proper limits
  constructor(rateLimits: RateLimitConfig) {
    this.limits = new Map()
    this.usage = new Map()
    
    for provider in rateLimits.providers:
      this.limits.set(provider.name, provider.limits)
      this.usage.set(provider.name, new UsageTracker())
  }
  
  // TEST: Rate limit checking prevents API abuse
  // TEST: Handles different time windows correctly
  async checkLimit(provider: AiProvider): Promise<void> {
    
    limit = this.limits.get(provider)
    tracker = this.usage.get(provider)
    
    if !limit || !tracker:
      return // No limits configured
    
    // Check requests per minute
    // TEST: Per-minute rate limiting works correctly
    currentMinuteRequests = tracker.getRequestsInLastMinute()
    if currentMinuteRequests >= limit.requestsPerMinute:
      waitTime = tracker.getTimeUntilNextMinute()
      throw new RateLimitExceededError(`Rate limit exceeded for ${provider}. Wait ${waitTime}ms`)
    
    // Check requests per hour
    // TEST: Per-hour rate limiting works correctly
    currentHourRequests = tracker.getRequestsInLastHour()
    if currentHourRequests >= limit.requestsPerHour:
      waitTime = tracker.getTimeUntilNextHour()
      throw new RateLimitExceededError(`Hourly rate limit exceeded for ${provider}. Wait ${waitTime}ms`)
    
    // Record the request
    // TEST: Request recording updates usage correctly
    tracker.recordRequest()
  }
}

class AnalysisCache {
  private cache: Map<string, CachedAnalysis>
  private ttlManager: TTLManager
  
  // TEST: Cache operations work correctly
  // TEST: TTL management expires old entries
  async get(key: string): Promise<AiAnalysisResult | null> {
    
    cached = this.cache.get(key)
    
    if !cached:
      return null
    
    // Check if expired
    // TEST: TTL checking prevents stale data usage
    if this.ttlManager.isExpired(cached.timestamp, cached.ttl):
      this.cache.delete(key)
      return null
    
    // TEST: Cache hit returns valid analysis result
    return cached.analysisResult
  }
  
  // TEST: Cache storage respects TTL and size limits
  async set(key: string, analysisResult: AiAnalysisResult): Promise<void> {
    
    // Calculate TTL based on analysis type
    // TEST: TTL calculation is appropriate for different analysis types
    ttl = this.calculateTTL(analysisResult.analysisType)
    
    // Store in cache
    this.cache.set(key, {
      analysisResult: analysisResult,
      timestamp: Date.now(),
      ttl: ttl
    })
    
    // Cleanup expired entries if cache is full
    // TEST: Cache cleanup maintains size limits
    if this.cache.size > MAX_CACHE_SIZE:
      this.cleanupExpiredEntries()
    }
  }
}
```

## 7. Configuration and Constants

```typescript
// Provider configuration
const PROVIDER_CONFIGS = {
  GEMINI: {
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    model: "gemini-pro",
    maxTokens: 4000,
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  },
  GPT4: {
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4",
    maxTokens: 4000,
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 500
    }
  }
}

// Quality thresholds by analysis type
const QUALITY_THRESHOLDS = {
  EXECUTIVE_SUMMARY: 75,
  VARIANCE_ANALYSIS: 80,
  RISK_ASSESSMENT: 85,
  CASH_FLOW_ANALYSIS: 80,
  STRATEGIC_RECOMMENDATIONS: 75,
  DETAILED_AUDIT: 90
}

// Cache TTL by analysis type (in milliseconds)
const CACHE_TTL = {
  EXECUTIVE_SUMMARY: 24 * 60 * 60 * 1000,    // 24 hours
  VARIANCE_ANALYSIS: 12 * 60 * 60 * 1000,    // 12 hours
  RISK_ASSESSMENT: 6 * 60 * 60 * 1000,       // 6 hours
  CASH_FLOW_ANALYSIS: 12 * 60 * 60 * 1000,   // 12 hours
  STRATEGIC_RECOMMENDATIONS: 24 * 60 * 60 * 1000, // 24 hours
  DETAILED_AUDIT: 6 * 60 * 60 * 1000         // 6 hours
}

// General constants
const MAX_RETRY_ATTEMPTS = 3
const MIN_CACHE_QUALITY_SCORE = 70
const MAX_CACHE_SIZE = 1000
const MIN_PROMPT_LENGTH = 500
const BACKOFF_BASE_DELAY = 1000  // milliseconds
```

---

**Document Version:** 1.0  
**Dependencies:** [`02_domain_model_specification.md`](docs/02_domain_model_specification.md), [`03_financial_calculation_engine_pseudocode.md`](docs/03_financial_calculation_engine_pseudocode.md)  
**Next Module:** Data Input Processing Pseudocode  
**TDD Coverage:** 50+ test anchors covering AI service integration, quality assessment, and error handling