// src/services/ai/providers/OpenAIProvider.js
import { BaseProvider } from './BaseProvider';
import { ResponseFormat } from '../types';

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.model || 'gpt-4-turbo';
    this.organizationId = config.organizationId;
  }

  getCapabilities() {
    return {
      maxTokens: 128000,
      supportsStreaming: true,
      supportsVision: true,
      supportsFunctionCalling: true,
      models: [
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-4-vision-preview',
      ],
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000,
      },
    };
  }

  async complete(request) {
    this.validateApiKey();
    const startTime = Date.now();

    const requestBody = {
      model: request.parameters?.model || this.defaultModel,
      messages: this.formatMessages(request),
      temperature: request.parameters?.temperature ?? 0.3,
      max_tokens: request.parameters?.maxTokens || 4000,
      top_p: request.parameters?.topP ?? 1,
      frequency_penalty: request.parameters?.frequencyPenalty ?? 0,
      presence_penalty: request.parameters?.presencePenalty ?? 0,
      response_format: request.parameters?.responseFormat === ResponseFormat.JSON 
        ? { type: 'json_object' } 
        : undefined,
    };

    try {
      const response = await this.executeWithRetry(async () => {
        const { controller, timeoutId } = this.createAbortController();
        
        try {
          const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
            throw new Error(`OpenAI API error (${res.status}): ${error.error?.message || res.statusText}`);
          }

          return res.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      const responseTime = Date.now() - startTime;
      const choice = response.choices?.[0];

      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        metadata: {
          provider: 'openai',
          model: response.model,
          tokensUsed: response.usage?.total_tokens || 0,
          responseTime,
          usage: response.usage,
          finishReason: choice.finish_reason,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API failed: ${this.parseErrorMessage(error)}`);
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
- Return valid JSON that matches the schema structure`;

    const request = {
      prompt: `Extract financial data from the following content:\n\n${content}`,
      systemPrompt,
      parameters: {
        temperature: 0.1,
        responseFormat: ResponseFormat.JSON,
        ...options.parameters,
      },
    };

    try {
      const response = await this.complete(request);
      const extractedData = JSON.parse(response.content);

      return {
        success: true,
        data: Array.isArray(extractedData) ? extractedData : [extractedData],
        confidence: this.calculateExtractionConfidence(extractedData, schema),
        metadata: {
          provider: 'openai',
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
        metadata: { provider: 'openai' },
      };
    }
  }

  formatMessages(request) {
    const messages = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided.',
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt,
    });

    return messages;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }

    return headers;
  }

  calculateExtractionConfidence(data, schema) {
    if (!data || typeof data !== 'object') return 0;

    let totalFields = 0;
    let filledFields = 0;

    const checkFields = (obj, schemaObj) => {
      Object.keys(schemaObj).forEach(key => {
        if (typeof schemaObj[key] === 'object' && !Array.isArray(schemaObj[key])) {
          checkFields(obj[key] || {}, schemaObj[key]);
        } else {
          totalFields++;
          if (obj[key] !== null && obj[key] !== undefined) {
            filledFields++;
          }
        }
      });
    };

    if (Array.isArray(data)) {
      data.forEach(item => checkFields(item, schema));
    } else {
      checkFields(data, schema);
    }

    return totalFields > 0 ? filledFields / totalFields : 0;
  }
}