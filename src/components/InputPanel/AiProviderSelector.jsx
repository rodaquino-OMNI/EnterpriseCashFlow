// src/components/InputPanel/AiProviderSelector.jsx
import React, { useState } from 'react';
import { AI_PROVIDERS } from '../../utils/aiProviders';

/**
 * Component for selecting and configuring AI providers
 * 
 * @param {{
 *   selectedProvider: string;
 *   onProviderChange: (providerKey: string) => void;
 *   apiKeys: Record<string, string>;
 *   onApiKeyChange: (providerKey: string, apiKey: string) => void;
 *   className?: string;
 * }} props
 */
export default function AiProviderSelector({
  selectedProvider,
  onProviderChange,
  apiKeys,
  onApiKeyChange,
  className = ''
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentProvider = AI_PROVIDERS[selectedProvider];

  const handleToggleApiKeyVisibility = () => {
    setShowApiKey(prev => !prev);
  };

  const handleToggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  return (
    <section className={`p-6 bg-white rounded-xl shadow-lg border border-slate-200 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-lg font-semibold mb-2 md:mb-0 text-slate-700 flex items-center">
          <span className="mr-2">🤖</span>
          Configuração de IA
        </h3>
        <div className="flex items-center">
          <button 
            onClick={handleToggleSettings}
            className="text-sm flex items-center px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {showSettings ? 'Ocultar Configurações' : 'Mostrar Configurações'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ml-1 transition-transform ${showSettings ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="aiProvider" className="block text-sm font-medium text-slate-700 mb-1">
                Provedor de IA:
              </label>
              <select
                id="aiProvider"
                value={selectedProvider}
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
            
            <div className="md:col-span-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>Chave de API ({currentProvider?.name})</span>
                <a 
                  href={currentProvider?.apiKeyHelpUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Como obter uma chave?
                </a>
              </label>
              <div className="flex">
                <input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKeys[selectedProvider] || ''}
                  onChange={(e) => onApiKeyChange(selectedProvider, e.target.value.trim())}
                  placeholder={currentProvider?.apiKeyPlaceholder || 'Insira sua chave de API'}
                  className="w-full p-2.5 border border-slate-300 rounded-l-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                />
                <button 
                  type="button"
                  onClick={handleToggleApiKeyVisibility}
                  className="px-3 border border-l-0 border-slate-300 rounded-r-md bg-slate-50 hover:bg-slate-100"
                  aria-label={showApiKey ? "Esconder chave" : "Mostrar chave"}
                >
                  {showApiKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                As chaves de API são salvas no navegador, mas nunca são enviadas para nossos servidores.
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-slate-600">
                Este recurso utiliza modelos de IA para processar dados de entrada e gerar análises. Os custos de API são de sua responsabilidade.
                Alguns provedores oferecem créditos gratuitos para novos usuários.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center text-sm text-slate-600">
          <span className="mr-2">{currentProvider?.icon || '🤖'}</span>
          <span>Provedor de IA configurado: <strong>{currentProvider?.name}</strong></span>
          {apiKeys[selectedProvider] ? (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Chave API configurada
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
              </svg>
              Chave API necessária
            </span>
          )}
        </div>
      )}
    </section>
  );
}