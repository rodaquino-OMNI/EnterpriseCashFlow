// src/services/ai/providers/OllamaProvider.js
import { BaseProvider } from './BaseProvider';

export class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434/api';
    this.defaultModel = config.model || 'llama2';
    // Ollama doesn't require API key
    this.apiKey = 'local';
  }

  getCapabilities() {
    return {
      maxTokens: 4096,
      supportsStreaming: true,
      supportsVision: false,
      supportsFunctionCalling: false,
      models: [
        'llama2',
        'mistral',
        'codellama',
        'neural-chat',
        'starling-lm',
        'orca-mini'
      ],
      rateLimit: {
        requestsPerMinute: 100,
        tokensPerMinute: 50000
      }
    };
  }

  async complete(request) {
    const startTime = Date.now();

    const requestBody = {
      model: request.parameters?.model || this.defaultModel,
      prompt: this.formatPromptWithContext(request.prompt, request.systemPrompt),
      stream: false,
      options: {
        temperature: request.parameters?.temperature ?? 0.3,
        num_predict: request.parameters?.maxTokens || 2000,
        top_p: request.parameters?.topP ?? 0.9,
        top_k: request.parameters?.topK ?? 40
      }
    };

    try {
      const response = await this.executeWithRetry(async () => {
        const { controller, timeoutId } = this.createAbortController();
        
        try {
          const res = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Ollama API error (${res.status}): ${errorText || res.statusText}`);
          }

          return res.json();
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      });

      const responseTime = Date.now() - startTime;

      if (!response.response) {
        throw new Error('No content in Ollama response');
      }

      return {
        content: response.response,
        metadata: {
          provider: 'ollama',
          model: response.model || requestBody.model,
          tokensUsed: response.prompt_eval_count + response.eval_count || 0,
          responseTime,
          usage: {
            prompt_tokens: response.prompt_eval_count,
            completion_tokens: response.eval_count,
            total_tokens: response.prompt_eval_count + response.eval_count
          },
          context: response.context
        }
      };
    } catch (error) {
      console.error('Ollama API error:', error);
      throw new Error(`Ollama API failed: ${this.parseErrorMessage(error)}`);
    }
  }

  async extractData(content, schema, options = {}) {
    const systemPrompt = `You are a financial data extraction assistant. Extract data according to the schema provided.

Schema:
${JSON.stringify(schema, null, 2)}

Rules:
- Extract only fields from the schema
- Use null for missing values
- Parse numbers correctly (remove currency symbols)
- Return valid JSON`;

    const request = {
      prompt: `Extract financial data from this content and return as JSON:\n\n${content}`,
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
        extractedData = JSON.parse(response.content);
      } catch {
        // Try to find JSON in the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/) ||
                         response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }

      return {
        success: true,
        data: Array.isArray(extractedData) ? extractedData : [extractedData],
        confidence: this.calculateExtractionConfidence(extractedData, schema),
        metadata: {
          provider: 'ollama',
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
        metadata: { provider: 'ollama' }
      };
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/tags`);
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data.models) && data.models.length > 0;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
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

    // Local models typically have lower confidence
    const fillRate = totalFields > 0 ? filledFields / totalFields : 0;
    return fillRate * 0.8; // Apply 80% confidence ceiling for local models
  }
}