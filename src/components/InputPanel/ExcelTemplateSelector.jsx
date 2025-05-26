// src/components/InputPanel/ExcelTemplateSelector.jsx
import React, { useState } from 'react';
import { TEMPLATE_TYPES, TEMPLATE_CONFIGS } from '../../utils/excelTemplateGenerator';

/**
 * @param {{
 * onTemplateDownloadRequest: (templateTypeKey: keyof typeof TEMPLATE_TYPES) => void; // Renamed for clarity
 * isLoading: boolean; // General loading state for button
 * currentNumberOfPeriods: number;
 * currentPeriodTypeLabel: string;
 * }} props
 */
export default function ExcelTemplateSelector({
    onTemplateDownloadRequest,
    isLoading,
    currentNumberOfPeriods,
    currentPeriodTypeLabel
}) {
    // Default to SMART_ADAPTIVE if it exists, otherwise the first available
    const defaultTemplate = TEMPLATE_CONFIGS[TEMPLATE_TYPES.SMART_ADAPTIVE] ? TEMPLATE_TYPES.SMART_ADAPTIVE : Object.keys(TEMPLATE_CONFIGS)[0];
    const [selectedTemplateKey, setSelectedTemplateKey] = useState(defaultTemplate);

    return (
        <div className="mb-6 p-4 md:p-6 bg-white rounded-lg border border-slate-200 shadow">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">
                Escolha o Tipo de Template Excel para Baixar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => {
                    if (!config) return null;
                    const isSelected = selectedTemplateKey === key;
                    return (
                        <div
                            key={key}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${
                                isSelected 
                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300' 
                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                            }`}
                            onClick={() => setSelectedTemplateKey(key)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && setSelectedTemplateKey(key)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{config.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    config.complexity === 'Simples' 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : config.complexity === 'Intermediário' 
                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                            : config.complexity === 'Avançado' 
                                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                                : 'bg-blue-100 text-blue-800 border border-blue-200' // For 'Adaptável' or 'Recomendado'
                                }`}>
                                    {config.complexity}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{config.description}</p>
                            <div className="text-xs text-slate-500">
                                <strong>Planilhas inclusas:</strong> {config.sheets.join(', ')}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center">
                <button
                    onClick={() => onTemplateDownloadRequest(selectedTemplateKey)}
                    disabled={isLoading}
                    className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50"
                >
                    {isLoading
                        ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Gerando...
                            </div>
                        )
                        : `Baixar ${TEMPLATE_CONFIGS[selectedTemplateKey]?.name || 'Template'}`
                    }
                </button>
                <p className="text-xs text-slate-500 mt-3">
                    O template será gerado para <strong>{currentNumberOfPeriods} período(s)</strong> do tipo "<strong>{currentPeriodTypeLabel}</strong>".
                </p>
            </div>
        </div>
    );
}