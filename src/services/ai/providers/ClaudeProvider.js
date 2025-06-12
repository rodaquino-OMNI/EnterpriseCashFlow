// src/services/ai/providers/ClaudeProvider.js
import { BaseProvider } from './BaseProvider';
import { ResponseFormat } from '../types';

export class ClaudeProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.defaultModel = config.model || 'claude-3-opus-20240229';
    this.anthropicVersion = config.anthropicVersion || '2023-06-01';
  }

  getCapabilities() {
    return {
      maxTokens: 200000,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: false,
      models: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0'
      ],
      rateLimit: {
        requestsPerMinute: 50,
        tokensPerMinute: 100000
      }
    };
  }

  async complete(request) {
    this.validateApiKey();
    const startTime = Date.now();

    const requestBody = {
      model: request.parameters?.model || this.defaultModel,
      messages: [{
        role: 'user',
        content: request.prompt
      }],
      system: request.systemPrompt || 'You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided.',
      temperature: request.parameters?.temperature ?? 0.3,
      max_tokens: request.parameters?.maxTokens || 4000,
      top_p: request.parameters?.topP ?? 1
    };

    try {
      const response = await this.executeWithRetry(async () => {
        const { controller, timeoutId } = this.createAbortController();
        
        try {
          const res = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }));
            throw new Error(`Claude API error (${res.status}): ${errorData.error?.message || errorData.type || res.statusText}`);
          }

          return res.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      const responseTime = Date.now() - startTime;

      if (!response.content?.[0]?.text) {
        throw new Error('No content in Claude response');
      }

      return {
        content: response.content[0].text,
        metadata: {
          provider: 'claude',
          model: response.model,
          tokensUsed: response.usage?.total_tokens || 0,
          responseTime,
          usage: response.usage,
          stopReason: response.stop_reason
        }
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude API failed: ${this.parseErrorMessage(error)}`);
    }
  }

  async extractData(content, schema, options = {}) {
    const systemPrompt = `You are a financial data extraction specialist with expertise in parsing financial documents.

Your task is to extract structured data according to this schema:
${JSON.stringify(schema, null, 2)}

Guidelines:
- Extract ONLY the fields specified in the schema
- Use null for missing or unclear values
- Parse numbers correctly (remove currency symbols, handle thousand/decimal separators)
- For Brazilian formats: R$ 1.234,56 means 1234.56
- Ensure the output is valid JSON matching the schema structure
- Be precise and conservative - only extract data you're confident about`;

    const request = {
      prompt: `Please extract financial data from the following content and return it as properly formatted JSON:\n\n${content}\n\nReturn only the JSON data, no additional text.`,
      systemPrompt,
      parameters: {
        temperature: 0.1,
        ...options.parameters
      }
    };

    try {
      const response = await this.complete(request);
      
      // Extract JSON from response
      let extractedData;
      try {
        // Try direct parse
        extractedData = JSON.parse(response.content);
      } catch {
        // Try to find JSON in the response
        const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) || 
                         response.content.match(/\{[\s\S]*\}/) ||
                         response.content.match(/\[[\s\S]*\]/);
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
          provider: 'claude',
          model: response.metadata.model,
          tokensUsed: response.metadata.tokensUsed
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        confidence: 0,
        error: error.message,
        metadata: { provider: 'claude' }
      };
    }
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion
    };
  }

  calculateExtractionConfidence(data, schema) {
    if (!data || typeof data !== 'object') return 0;

    let totalFields = 0;
    let filledFields = 0;
    let highConfidenceFields = 0;

    const checkFields = (obj, schemaObj) => {
      Object.keys(schemaObj).forEach(key => {
        if (typeof schemaObj[key] === 'object' && !Array.isArray(schemaObj[key])) {
          checkFields(obj[key] || {}, schemaObj[key]);
        } else {
          totalFields++;
          if (obj[key] !== null && obj[key] !== undefined) {
            filledFields++;
            // High confidence if the value seems reasonable
            if (typeof obj[key] === 'number' && !isNaN(obj[key]) && isFinite(obj[key])) {
              highConfidenceFields++;
            } else if (typeof obj[key] === 'string' && obj[key].trim().length > 0) {
              highConfidenceFields++;
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
    const confidenceRate = filledFields > 0 ? highConfidenceFields / filledFields : 0;

    // Claude typically has high accuracy, so weight confidence higher
    return fillRate * 0.6 + confidenceRate * 0.4;
  }
}