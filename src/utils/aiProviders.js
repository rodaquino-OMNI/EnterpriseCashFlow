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
 * @property {object} defaultRequestConfig - Default configuration for API requests
 * @property {(config: AiProviderConfig, prompt: string, apiKey: string, options: AiRequestOptions) => Promise<string>} callFunction - Function to call this specific API
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
 * Call the Gemini API
 */
async function callGemini(config, prompt, apiKey, options) {
  // In Canvas, an empty string for apiKey allows the environment to inject it.
  // For local dev, user would need to supply one if GENAI_API_KEY is not set elsewhere.
  const effectiveApiKey = apiKey || ""; // Let Canvas handle injection if apiKey is empty

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
  const response = await fetch(`${config.apiUrl}/${model}:generateContent?key=${effectiveApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText + " (Corpo da resposta não é JSON)" } }));
    throw new Error(`API Gemini (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  if (result.candidates && result.candidates.length > 0 &&
    result.candidates[0].content && result.candidates[0].content.parts &&
    result.candidates[0].content.parts.length > 0 &&
    typeof result.candidates[0].content.parts[0].text === 'string') {
    return result.candidates[0].content.parts[0].text;
  } else if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason) {
    const reason = result.candidates[0].finishReason;
    const safetyRatings = result.candidates[0].safetyRatings;
    let message = `Geração Gemini finalizada: ${reason}.`;
    if (safetyRatings) message += `  Safety: ${JSON.stringify(safetyRatings)} `;
    console.warn("Gemini Response Details:", result.candidates[0]);
    throw new Error(message);
  }
  console.warn("Resposta inesperada da API Gemini:", result);
  throw new Error('Resposta vazia ou em formato inesperado da API Gemini.');
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
    defaultRequestConfig: {
      model: 'gemini-1.5-pro',
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8000,
    },
    callFunction: callGemini
  },
  openai: {
    name: 'OpenAI',
    apiKeyPlaceholder: 'sk-1234...',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    icon: '🤖',
    apiKeyHelpUrl: 'https://platform.openai.com/account/api-keys',
    defaultRequestConfig: {
      model: 'gpt-4-turbo',
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    },
    callFunction: callOpenAI
  },
  claude: {
    name: 'Anthropic Claude',
    apiKeyPlaceholder: 'sk-ant-api...',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    icon: '🔮',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    defaultRequestConfig: {
      model: 'claude-3-opus-20240229',
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1
    },
    callFunction: callClaude
  },
  ollama: {
    name: 'Ollama (Local)',
    apiKeyPlaceholder: 'Não necessário',
    apiUrl: 'http://localhost:11434/api/generate',
    icon: '🏠',
    apiKeyHelpUrl: 'https://github.com/ollama/ollama',
    defaultRequestConfig: {
      model: 'llama2',
      temperature: 0.2,
      max_tokens: 2000,
    },
    callFunction: callOllama
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