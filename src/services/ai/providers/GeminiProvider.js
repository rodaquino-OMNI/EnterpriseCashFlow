// src/services/ai/providers/GeminiProvider.js
import { BaseProvider } from './BaseProvider';
import { ResponseFormat } from '../types';

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.defaultModel = config.model || 'gemini-1.5-pro-latest';
    this.useProxy = config.useProxy || false;
    this.proxyUrl = config.proxyUrl || 'https://corsproxy.io/?';
  }

  getCapabilities() {
    return {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      models: [
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-pro-vision',
      ],
      rateLimit: {
        requestsPerMinute: 60,
        tokensPerMinute: 1000000,
      },
    };
  }

  async complete(request) {
    this.validateApiKey();
    const startTime = Date.now();

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: this.formatPromptWithContext(request.prompt, request.systemPrompt) }],
      }],
      generationConfig: {
        temperature: request.parameters?.temperature ?? 0.4,
        topK: request.parameters?.topK ?? 40,
        topP: request.parameters?.topP ?? 0.95,
        maxOutputTokens: request.parameters?.maxTokens || 4096,
        candidateCount: 1,
      },
      safetySettings: this.getSafetySettings(),
    };

    const model = request.parameters?.model || this.defaultModel;
    const apiUrl = this.buildApiUrl(model);

    try {
      const response = await this.executeWithRetry(async () => {
        const { controller, timeoutId } = this.createAbortController();
        
        try {
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }));
            throw new Error(`Gemini API error (${res.status}): ${errorData.error?.message || res.statusText}`);
          }

          return res.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      const responseTime = Date.now() - startTime;
      const candidate = response.candidates?.[0];

      // Check for content filtering
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Content blocked by Gemini: ${response.promptFeedback.blockReason}`);
      }

      if (!candidate?.content?.parts?.[0]?.text) {
        if (candidate?.finishReason) {
          throw new Error(`Generation stopped: ${candidate.finishReason}`);
        }
        throw new Error('No content in Gemini response');
      }

      return {
        content: candidate.content.parts[0].text,
        metadata: {
          provider: 'gemini',
          model: model,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0,
          responseTime,
          usage: response.usageMetadata,
          finishReason: candidate.finishReason,
          safetyRatings: candidate.safetyRatings,
        },
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${this.parseErrorMessage(error)}`);
    }
  }

  async extractData(content, schema, options = {}) {
    const systemPrompt = `You are a financial data extraction specialist. Extract structured data according to the provided schema.
    
Schema:
${JSON.stringify(schema, null, 2)}

Important:
- Extract ONLY the fields specified in the schema
- Use null for missing values
- Ensure numbers are parsed correctly (remove currency symbols, handle decimals)
- For Brazilian currency (R$), parse correctly considering thousand separators (.) and decimal separators (,)
- Return valid JSON that matches the schema structure`;

    const request = {
      prompt: `Extract financial data from the following content and return as JSON:\n\n${content}`,
      systemPrompt,
      parameters: {
        temperature: 0.1,
        topK: 1,
        ...options.parameters,
      },
    };

    try {
      const response = await this.complete(request);
      
      // Try to extract JSON from the response
      let extractedData;
      try {
        // First try direct parse
        extractedData = JSON.parse(response.content);
      } catch {
        // Try to find JSON in the response
        const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) || 
                         response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      return {
        success: true,
        data: Array.isArray(extractedData) ? extractedData : [extractedData],
        confidence: this.calculateExtractionConfidence(extractedData, schema),
        metadata: {
          provider: 'gemini',
          model: response.metadata.model,
          tokensUsed: response.metadata.tokensUsed,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        confidence: 0,
        error: error.message,
        metadata: { provider: 'gemini' },
      };
    }
  }

  buildApiUrl(model) {
    const baseUrl = this.useProxy ? `${this.proxyUrl}${this.baseUrl}` : this.baseUrl;
    return `${baseUrl}/${model}:generateContent?key=${this.apiKey}`;
  }

  getSafetySettings() {
    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ];
  }

  calculateExtractionConfidence(data, schema) {
    if (!data || typeof data !== 'object') return 0;

    let totalFields = 0;
    let filledFields = 0;
    let validFields = 0;

    const checkFields = (obj, schemaObj) => {
      Object.keys(schemaObj).forEach(key => {
        if (typeof schemaObj[key] === 'object' && !Array.isArray(schemaObj[key])) {
          checkFields(obj[key] || {}, schemaObj[key]);
        } else {
          totalFields++;
          if (obj[key] !== null && obj[key] !== undefined) {
            filledFields++;
            // Additional validation for numbers
            if (typeof schemaObj[key] === 'number' && !isNaN(obj[key])) {
              validFields++;
            } else if (typeof schemaObj[key] === 'string' && typeof obj[key] === 'string') {
              validFields++;
            }
          }
        }
      });
    };

    if (Array.isArray(data)) {
      data.forEach(item => checkFields(item, schema));
    } else {
      checkFields(data, schema);
    }

    const fillRate = totalFields > 0 ? filledFields / totalFields : 0;
    const validRate = filledFields > 0 ? validFields / filledFields : 0;

    return fillRate * 0.7 + validRate * 0.3; // 70% weight on fill rate, 30% on validation
  }
}