// src/utils/aiProviders.js

/**
 * @typedef {'gemini' | 'openai' | 'claude' | 'ollama'} AiProviderKey
 */

/**
 * @typedef {Object} AiProviderConfig
 * @property {string} name - Display name of the provider
 * @property {string} apiKeyPlaceholder - Placeholder text for API key input
 * @property {string} apiUrl - Endpoint URL for API calls
 * @property {string} icon - Unicode icon or emoji representing the provider
 * @property {string} apiKeyHelpUrl - URL to help users get an API key for this provider
 * @property {boolean} requiresKey - Whether this provider requires an API key
 * @property {number} maxTokens - Maximum tokens this provider supports
 * @property {string} defaultModel - Default model for this provider
 * @property {object} defaultRequestConfig - Default configuration for API requests
 * @property {(config: AiProviderConfig, prompt: string, apiKey: string, options: AiRequestOptions) => Promise<string>} callFunction - Function to call this specific API
 * @property {number} recommendedInputChars - Recommended maximum number of input characters for this provider
 */

/**
 * @typedef {Object} AiRequestOptions
 * @property {number} [temperature=0.2] - Controls randomness (0.0 = deterministic, 1.0 = creative)
 * @property {number} [maxTokens] - Maximum number of tokens to generate
 * @property {string} [model] - Model name override
 * @property {any} [extraParams] - Provider-specific additional parameters
 */

// --- Individual API Call Implementations ---

/**
 * Call the Gemini API with enhanced error handling
 */
async function callGemini(config, prompt, apiKey, options) {
  // Validate API key first to prevent hanging requests
  if (!apiKey || apiKey.trim() === '') {
    console.error("Gemini API call failed: No API key provided");
    return `Erro: Chave API do Google Gemini é obrigatória. Configure sua chave API nas configurações.`;
  }
  
  console.log("Calling Gemini API with model:", options.model || config.defaultRequestConfig.model);
  console.log("Prompt length:", prompt.length, "characters");
  
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options.maxTokens || config.defaultRequestConfig.maxOutputTokens,
      temperature: options.temperature === undefined ? config.defaultRequestConfig.temperature : options.temperature,
      topK: options.topK || config.defaultRequestConfig.topK,
      topP: options.topP || config.defaultRequestConfig.topP,
    }
  };
  const model = options.model || config.defaultRequestConfig.model;
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    // Log the API endpoint being called
    const apiUrl = `${config.apiUrl}/${model}:generateContent?key=${apiKey}`;
    console.log("Calling Gemini endpoint:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    console.log("Gemini API response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        // If response isn't valid JSON, get the text instead
        return response.text().then(text => {
          console.error("Non-JSON error response:", text);
          return { error: { message: response.statusText + " (Corpo da resposta não é JSON)" } };
        });
      });
      
      console.error("Gemini API error:", errorData);
      
      // Handle specific error cases
      if (response.status === 400) {
        return `Erro: API Gemini - Requisição inválida: ${errorData.error?.message || response.statusText}`;
      } else if (response.status === 403) {
        return `Erro: API Gemini - Acesso negado. Verifique sua chave API: ${errorData.error?.message || response.statusText}`;
      } else if (response.status === 429) {
        return `Erro: API Gemini - Limite de taxa excedido. Tente novamente em alguns minutos.`;
      }
      
      return `Erro: API Gemini (${response.status}): ${errorData.error?.message || response.statusText}`;
    }
    
    console.log("Gemini API returned success response");
    const result = await response.json();
    
    // Log summary of response structure to help debug
    console.log("Response structure:", {
      hasCandidate: !!result.candidates,
      candidatesCount: result.candidates?.length || 0,
      hasContent: result.candidates?.[0]?.content != null,
      hasParts: result.candidates?.[0]?.content?.parts != null,
      partsCount: result.candidates?.[0]?.content?.parts?.length || 0,
      finishReason: result.candidates?.[0]?.finishReason || 'unknown'
    });
    
    // Check for content filtering block first
    if (result.promptFeedback && result.promptFeedback.blockReason) {
      // Handle content filtering block
      let message = `Erro: Geração Gemini bloqueada: ${result.promptFeedback.blockReason}.`;
      if (result.promptFeedback.safetyRatings) {
        message += ` Classificações de segurança: ${JSON.stringify(result.promptFeedback.safetyRatings.map(r => `${r.category}: ${r.probability}`))}`;
      }
      console.warn("Gemini content blocked:", result.promptFeedback);
      return message;
    }
    
    // Check for complete success case (has candidates with content and text)
    if (result.candidates && 
        result.candidates.length > 0 &&
        result.candidates[0].content && 
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0 &&
        typeof result.candidates[0].content.parts[0].text === 'string' &&
        result.candidates[0].content.parts[0].text.trim().length > 0) {
      
      const text = result.candidates[0].content.parts[0].text;
      const finishReason = result.candidates[0].finishReason;
      
      // Log success but note if there's a concerning finishReason
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`Gemini response finished with reason: ${finishReason} but we have text content of length ${text.length}`);
      } else {
        console.log("Successfully extracted text response, length:", text.length);
      }
      
      // Even with a non-STOP finish reason, return the content if we have it
      return text;
    } 
    
    // Check for candidates with a finish reason but no proper content
    if (result.candidates && 
        result.candidates.length > 0 && 
        result.candidates[0].finishReason) {
      const reason = result.candidates[0].finishReason;
      const safetyRatings = result.candidates[0].safetyRatings;
      
      let message = `Erro: Geração Gemini finalizada com razão "${reason}" sem conteúdo válido.`;
      if (safetyRatings) message += ` Segurança: ${JSON.stringify(safetyRatings)}`;
      
      console.warn("Gemini response had finish reason but no valid content:", result.candidates[0]);
      return message;
    }
    
    // If we got here, we have a completely unexpected response format
    console.error("Unexpected Gemini API response format:", result);
    return 'Erro: Resposta em formato inesperado da API Gemini. Por favor tente novamente.';
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Gemini API request timed out after 60 seconds");
      return 'Erro: Timeout na requisição para Google Gemini. Verifique sua conexão de internet.';
    }
    
    // Log the raw error object to help with debugging
    console.error("Gemini API call failed with error:", error);
    return `Erro: Falha ao comunicar com API Gemini: ${error.message || 'Erro desconhecido'}`;
  }
}

/**
 * Call the OpenAI API
 */
async function callOpenAI(config, prompt, apiKey, options) {
  if (!apiKey) throw new Error(`API Key para ${config.name} é necessária.`);
  
  const requestBody = {
    model: options.model || config.defaultRequestConfig.model,
    messages: [
      { role: "system", content: "You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided." },
      { role: "user", content: prompt }
    ],
    temperature: options.temperature === undefined ? config.defaultRequestConfig.temperature : options.temperature,
    max_tokens: options.maxTokens || config.defaultRequestConfig.max_tokens,
    top_p: options.top_p || config.defaultRequestConfig.top_p
  };
  
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`API OpenAI (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`);
  }
  const result = await response.json();
  return result.choices?.[0]?.message?.content || 'Resposta vazia da API OpenAI.';
}

/**
 * Call the Claude API
 */
async function callClaude(config, prompt, apiKey, options) {
  if (!apiKey) throw new Error(`API Key para ${config.name} é necessária.`);
  
  const requestBody = {
    model: options.model || config.defaultRequestConfig.model,
    messages: [
      { role: "user", content: prompt }
    ],
    system: "You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided.",
    temperature: options.temperature === undefined ? config.defaultRequestConfig.temperature : options.temperature,
    max_tokens: options.maxTokens || config.defaultRequestConfig.max_tokens
  };
  
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`API Claude (${response.status}): ${errorData.error?.message || errorData.type || response.statusText}`);
  }
  const result = await response.json();
  if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
    return result.content[0].text;
  }
  return 'Resposta vazia ou em formato inesperado da API Claude.';
}

/**
 * Call the Ollama API
 */
async function callOllama(config, prompt, apiKey, options) { // apiKey is not used by ollama but kept for signature consistency
  const requestBody = {
    model: options.model || config.defaultRequestConfig.model,
    prompt: prompt,
    stream: false,
    options: {
      temperature: options.temperature === undefined ? config.defaultRequestConfig.temperature : options.temperature,
      num_predict: options.maxTokens || config.defaultRequestConfig.max_tokens,
    }
  };
  
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Ollama (${response.status}): ${errorText || response.statusText}`);
  }
  const result = await response.json();
  return result.response || 'Resposta vazia da API Ollama.';
}

/**
 * Configuration for supported AI providers
 */
export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    apiKeyPlaceholder: 'AIzaSyA1234...', 
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    icon: '🧠',
    apiKeyHelpUrl: 'https://ai.google.dev/tutorials/setup',
    requiresKey: true,
    maxTokens: 8000,
    defaultModel: 'gemini-1.0-pro', // Fallback to stable model for older installations
    defaultRequestConfig: {
      model: 'gemini-1.0-pro', // Using a more stable model that's widely available
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
    callFunction: callGemini,
    recommendedInputChars: 30000, // Reasonable size for the pro model
  },
  openai: {
    name: 'OpenAI',
    apiKeyPlaceholder: 'sk-1234...',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    icon: '🤖',
    apiKeyHelpUrl: 'https://platform.openai.com/account/api-keys',
    requiresKey: true,
    maxTokens: 4000,
    defaultModel: 'gpt-4-turbo',
    defaultRequestConfig: {
      model: 'gpt-4-turbo',
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    },
    callFunction: callOpenAI,
    recommendedInputChars: 100000, // About 25k tokens for gpt-4-turbo's 128k context
  },
  claude: {
    name: 'Anthropic Claude',
    apiKeyPlaceholder: 'sk-ant-api...',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    icon: '🔮',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    requiresKey: true,
    maxTokens: 4000,
    defaultModel: 'claude-3-opus-20240229',
    defaultRequestConfig: {
      model: 'claude-3-opus-20240229',
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1
    },
    callFunction: callClaude,
    recommendedInputChars: 150000, // About 37.5k tokens for Claude-3's 200k context
  },
  ollama: {
    name: 'Ollama (Local)',
    apiKeyPlaceholder: 'Não necessário',
    apiUrl: 'http://localhost:11434/api/generate',
    icon: '🏠',
    apiKeyHelpUrl: 'https://github.com/ollama/ollama',
    requiresKey: false,
    maxTokens: 2000,
    defaultModel: 'llama2',
    defaultRequestConfig: {
      model: 'llama2',
      temperature: 0.2,
      max_tokens: 2000,
    },
    callFunction: callOllama,
    recommendedInputChars: 3000, // Very conservative for local models with typically 4k context
  }
};

export const DEFAULT_AI_PROVIDER = 'gemini';

/**
 * Formats the API data for an AI request based on the provider
 * @param {string} providerKey - Key identifying the AI provider
 * @param {string} prompt - The prompt to send to the AI
 * @param {AiRequestOptions} [options={}] - Optional parameters to customize the request
 * @returns {Object} Request data formatted for the specified provider
 */
export function formatRequestData(providerKey, prompt, options = {}) {
  switch (providerKey) {
    case 'gemini':
      return {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: options.temperature ?? AI_PROVIDERS.gemini.defaultRequestConfig.temperature,
          topK: options.topK ?? AI_PROVIDERS.gemini.defaultRequestConfig.topK,
          topP: options.topP ?? AI_PROVIDERS.gemini.defaultRequestConfig.topP,
          maxOutputTokens: options.maxTokens ?? AI_PROVIDERS.gemini.defaultRequestConfig.maxOutputTokens
        }
      };

    case 'openai':
      return {
        model: options.model ?? AI_PROVIDERS.openai.defaultRequestConfig.model,
        messages: [
          { role: "system", content: "You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided." },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? AI_PROVIDERS.openai.defaultRequestConfig.temperature,
        max_tokens: options.maxTokens ?? AI_PROVIDERS.openai.defaultRequestConfig.max_tokens,
        top_p: options.top_p ?? AI_PROVIDERS.openai.defaultRequestConfig.top_p
      };

    case 'claude':
      return {
        model: options.model ?? AI_PROVIDERS.claude.defaultRequestConfig.model,
        messages: [
          { role: "user", content: prompt }
        ],
        system: "You are a helpful financial analyst assistant. Use clear, precise language and keep responses focused on the financial data provided.",
        temperature: options.temperature ?? AI_PROVIDERS.claude.defaultRequestConfig.temperature,
        max_tokens: options.maxTokens ?? AI_PROVIDERS.claude.defaultRequestConfig.max_tokens
      };
      
    case 'ollama':
      return {
        model: options.model ?? AI_PROVIDERS.ollama.defaultRequestConfig.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? AI_PROVIDERS.ollama.defaultRequestConfig.temperature,
          num_predict: options.maxTokens ?? AI_PROVIDERS.ollama.defaultRequestConfig.max_tokens,
        }
      };

    default:
      throw new Error(`Provider ${providerKey} not supported`);
  }
}

/**
 * Extracts the generated text from the provider's response
 * @param {string} providerKey - Key identifying the AI provider
 * @param {Object} responseData - The response data from the API
 * @returns {string} The extracted text
 */
export function extractResponseText(providerKey, responseData) {
  switch (providerKey) {
    case 'gemini':
      return responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    case 'openai':
      return responseData.choices?.[0]?.message?.content || '';

    case 'claude':
      return responseData.content?.[0]?.text || '';
      
    case 'ollama':
      return responseData.response || '';

    default:
      throw new Error(`Provider ${providerKey} not supported`);
  }
}