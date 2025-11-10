// src/components/InputPanel/AiProviderSelector.jsx
import React, { useState } from 'react';
import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from '../../utils/aiProviders';

/**
 * @param {{
 * selectedProviderKey: import('../../utils/aiProviders').AiProviderKey;
 * onProviderChange: (providerKey: import('../../utils/aiProviders').AiProviderKey) => void;
 * apiKeys: Record<string, string>;
 * onApiKeyChange: (providerKey: string, apiKey: string) => void;
 * className?: string;
 * }} props
 */
export default function AiProviderSelector({
  selectedProviderKey,
  onProviderChange,
  apiKeys,
  onApiKeyChange,
  className = '',
}) {
  const [showApiKeysInput, setShowApiKeysInput] = useState(false);
  const currentProviderConfig = AI_PROVIDERS[selectedProviderKey];

  return (
    <div className={`bg-white p-4 md:p-6 rounded-xl shadow-lg border border-slate-200 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-slate-700">
          ⚙️ Configuração do Provedor de IA
        </h3>
        <button
          onClick={() => setShowApiKeysInput(!showApiKeysInput)}
          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none whitespace-nowrap"
          type="button"
        >
          {showApiKeysInput ? 'Ocultar Chaves API' : 'Configurar Chaves API'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label htmlFor="aiProviderSelect" className="block text-sm font-medium text-slate-700 mb-1">
            Provedor de IA Ativo:
          </label>
          <select
            id="aiProviderSelect"
            value={selectedProviderKey}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
              <option key={key} value={key}>
                {provider.icon} {provider.name}
              </option>
            ))}
          </select>
        </div>

        {currentProviderConfig && (
          <div className="flex items-center pt-5 sm:pt-0 sm:items-end sm:pb-1">
            <div className="text-sm text-slate-600">
              <div className="font-medium">
                Modelo Padrão: {currentProviderConfig.defaultModel || 'N/A'}
              </div>
              <div className="text-xs">
                Max Tokens (Saída Padrão): {currentProviderConfig.maxTokens?.toLocaleString()}
              </div>
              <div className="text-xs">
                {currentProviderConfig.requiresKey ? 'Requer Chave API' : 'Não Requer Chave API (Local)'}
              </div>
            </div>
          </div>
        )}
      </div>

      {showApiKeysInput && (
        <div className="mt-6 space-y-4 p-4 bg-slate-50 rounded-md border border-slate-200">
          <p className="text-sm text-slate-700 mb-3">
            Insira suas chaves API abaixo. Elas são salvas localmente no seu navegador.
          </p>
          
          {Object.entries(AI_PROVIDERS)
            .filter(([_, providerConfig]) => providerConfig.requiresKey) // Only show for providers requiring keys
            .map(([key, providerConfig]) => (
              <div key={key}>
                <label htmlFor={`apiKey-${key}`} className="block text-xs font-medium text-slate-600 mb-1">
                  {providerConfig.icon} {providerConfig.name} API Key:
                </label>
                <input
                  id={`apiKey-${key}`}
                  type="password" 
                  autoComplete="off"
                  value={apiKeys[key] || ''}
                  onChange={(e) => onApiKeyChange(key, e.target.value)}
                  placeholder={`Sua chave API do ${providerConfig.name}`}
                  className="w-full p-2 text-sm border border-slate-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          
          <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded-md mt-4">
            <span className="font-bold">⚠️ Atenção:</span> As chaves API são armazenadas localmente no seu navegador (localStorage). Não são enviadas para nossos servidores. Use com responsabilidade, especialmente em computadores compartilhados ou públicos.
          </div>
        </div>
      )}
    </div>
  );
}