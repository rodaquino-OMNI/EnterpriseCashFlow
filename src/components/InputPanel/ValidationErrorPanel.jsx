// src/components/InputPanel/ValidationErrorPanel.jsx
import React, { useState } from 'react';
import { fieldDefinitions } from '../../utils/fieldDefinitions';

/**
 * Enhanced validation error display component with detailed field-by-field breakdown
 * @param {Object} props
 * @param {Array} props.validationErrors - Array of validation errors from validateAllFields
 * @param {Function} props.onDismiss - Callback when user dismisses the panel
 */
export default function ValidationErrorPanel({ validationErrors, onDismiss }) {
  const [expandedPeriods, setExpandedPeriods] = useState(new Set([1])); // First period expanded by default

  if (!validationErrors || validationErrors.length === 0) {
    return null;
  }

  const togglePeriod = (periodNumber) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodNumber)) {
      newExpanded.delete(periodNumber);
    } else {
      newExpanded.add(periodNumber);
    }
    setExpandedPeriods(newExpanded);
  };

  const getFieldSuggestion = (fieldKey, errorMessage) => {
    const def = fieldDefinitions[fieldKey];
    if (!def) return null;

    // Custom suggestions based on field type and error
    if (errorMessage.includes('obrigatório')) {
      if (def.type === 'currency') {
        return `💡 Este campo deve conter um valor em moeda (ex: 1000000 para R$ 1.000.000,00). ${def.note || ''}`;
      } else if (def.type === 'percentage') {
        return `💡 Este campo deve conter um percentual (ex: 40 para 40%). ${def.note || ''}`;
      } else if (def.type === 'days') {
        return `💡 Este campo deve conter número de dias (ex: 30, 60, 90). ${def.note || ''}`;
      }
    }

    if (errorMessage.includes('negativo')) {
      return `💡 Este campo não aceita valores negativos. Verifique se o valor foi inserido corretamente.`;
    }

    if (errorMessage.includes('entre') && def.type === 'percentage') {
      return `💡 Percentuais devem estar no formato numérico (ex: 25 para 25%, não 0.25). ${def.note || ''}`;
    }

    // Default suggestion from field definition
    if (def.note) {
      return `💡 ${def.note}`;
    }

    return null;
  };

  const getFieldIcon = (fieldKey) => {
    const def = fieldDefinitions[fieldKey];
    if (!def) return '❓';

    switch (def.group) {
      case 'P&L Driver':
        return '📊';
      case 'BS Driver':
        return '🏦';
      case 'CF Driver':
        return '💰';
      case 'P&L Override':
      case 'BS Override':
      case 'CF Override':
        return '🔧';
      default:
        return '📝';
    }
  };

  const totalErrors = validationErrors.reduce((sum, period) => {
    return sum + Object.keys(period.fields || {}).length;
  }, 0);

  return (
    <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-xl shadow-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-red-900">
              Erros de Validação Detectados
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {totalErrors} campo{totalErrors !== 1 ? 's' : ''} com problema{totalErrors !== 1 ? 's' : ''} em {validationErrors.length} período{validationErrors.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Fechar painel de erros"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Details by Period */}
      <div className="space-y-3">
        {validationErrors.map((periodError) => {
          const isExpanded = expandedPeriods.has(periodError.period);
          const fieldCount = Object.keys(periodError.fields || {}).length;

          return (
            <div
              key={periodError.period}
              className="bg-white border-2 border-red-200 rounded-lg overflow-hidden"
            >
              {/* Period Header */}
              <button
                onClick={() => togglePeriod(periodError.period)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-red-800">
                    📅 Período {periodError.period}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {fieldCount} erro{fieldCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-red-600 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Period Fields */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-red-100">
                  {Object.entries(periodError.fields).map(([fieldKey, errorMessage]) => {
                    const def = fieldDefinitions[fieldKey];
                    const suggestion = getFieldSuggestion(fieldKey, errorMessage);
                    const icon = getFieldIcon(fieldKey);

                    return (
                      <div
                        key={fieldKey}
                        className="mt-3 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg"
                      >
                        {/* Field Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-red-900">
                                {def?.label || fieldKey}
                              </h4>
                              <p className="text-sm text-red-700 mt-1">
                                <span className="font-medium">❌ Erro:</span> {errorMessage}
                              </p>
                              {def?.group && (
                                <span className="inline-block mt-2 px-2 py-1 bg-white text-xs text-red-700 rounded border border-red-200">
                                  {def.group}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Suggestion */}
                        {suggestion && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-900">{suggestion}</p>
                          </div>
                        )}

                        {/* Field Type Info */}
                        {def && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-red-600">
                            <span className="px-2 py-1 bg-white rounded border border-red-200">
                              Tipo: {def.type === 'currency' ? '💵 Moeda' : def.type === 'percentage' ? '📊 Percentual' : '📅 Dias'}
                            </span>
                            {def.required && (
                              <span className="px-2 py-1 bg-red-100 rounded border border-red-300 font-medium">
                                ⚠️ Obrigatório
                              </span>
                            )}
                            {def.firstPeriodOnly && (
                              <span className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
                                🔹 Apenas 1º Período
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Help */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">Como corrigir:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Via Excel:</strong> Baixe o template, preencha os campos destacados e faça upload novamente</li>
              <li>• <strong>Via Manual:</strong> Mude para entrada manual e preencha os campos necessários</li>
              <li>• <strong>Campos obrigatórios:</strong> Devem ser preenchidos em todos os períodos (exceto os marcados como "1º Período")</li>
              <li>• <strong>Valores negativos:</strong> A maioria dos campos financeiros não aceita valores negativos (exceto Resultado Financeiro)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
