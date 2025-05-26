// src/components/InputPanel/ExcelUploadProgress.jsx
import React from 'react';

/**
 * @param {{
 * isVisible: boolean;
 * progress: number;
 * currentStep: string;
 * qualityAnalysis?: { requiredCompleteness?: number; overrideCount?: number; qualityScore?: number; } | null;
 * recommendations?: Array<{type: string; title: string; message: string;}> | null;
 * onClose?: () => void; // Optional: if you want a close button after completion/error
 * }} props
 */
export default function ExcelUploadProgress({
  isVisible,
  progress,
  currentStep,
  qualityAnalysis,
  recommendations,
  onClose
}) {
  if (!isVisible) return null;

  const isComplete = progress === 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-lg w-full transform transition-all scale-100 opacity-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800">
            📊 Processando Arquivo Excel...
          </h3>
          {isComplete && onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>{currentStep || (isComplete ? "Concluído!" : "Iniciando...")}</span>
            <span className="font-medium text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Quality Analysis (shown when progress reaches significant point or complete) */}
        {progress >= 80 && qualityAnalysis && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-md font-semibold text-slate-700 mb-3">🔍 Análise Preliminar da Qualidade dos Dados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">Preenchimento (Obrigatórios):</span>
                <span className={`ml-2 font-bold ${
                  (qualityAnalysis.requiredCompleteness || 0) >= 80 ? 'text-green-600' : 
                  (qualityAnalysis.requiredCompleteness || 0) >= 50 ? 'text-orange-500' : 'text-red-600'
                }`}>
                  {qualityAnalysis.requiredCompleteness || 0}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Campos de Override Usados:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {qualityAnalysis.overrideCount || 0}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Score de Qualidade Estimado:</span>
                <span className={`ml-2 font-extrabold text-lg ${
                  (qualityAnalysis.qualityScore || 0) >= 90 ? 'text-green-500' :
                  (qualityAnalysis.qualityScore || 0) >= 70 ? 'text-sky-500' :
                  (qualityAnalysis.qualityScore || 0) >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {qualityAnalysis.qualityScore || 0} / 100
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations (shown when complete) */}
        {isComplete && recommendations && recommendations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-slate-700 mb-3">💡 Sugestões Iniciais:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className={`p-2.5 rounded-md text-sm border-l-4 ${
                  rec.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                  rec.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                  rec.type === 'alert' ? 'bg-red-50 border-red-500 text-red-700' :
                  'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                  <strong className="font-medium">{rec.title}:</strong> {rec.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {isComplete && !recommendations?.length && qualityAnalysis && (
            <div className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                Dados parecem bons! Prossiga para gerar o relatório detalhado.
            </div>
        )}
      </div>
    </div>
  );
}