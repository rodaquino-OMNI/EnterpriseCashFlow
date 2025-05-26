// src/components/Debug/DataConsistencyMonitor.jsx
import React from 'react';
import { validateInternalSSOTConsistency } from '../../utils/dataConsistencyValidator'; // Use the specific internal validator
import { formatCurrency, formatDays } from '../../utils/formatters';

/**
 * @param {{ 
 * calculatedData: import('../../types/financial').CalculatedPeriodData[]; 
 * enabled?: boolean; 
 * }} props
 */
export default function DataConsistencyMonitor({ calculatedData, enabled = false }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!enabled || !isDevelopment || !calculatedData || calculatedData.length === 0) {
    return null;
  }

  const allSSOTIssues = [];
  calculatedData.forEach((period, index) => {
    const periodIssues = validateInternalSSOTConsistency(period, `Período ${index + 1}`);
    if (periodIssues.length > 0) {
      allSSOTIssues.push(...periodIssues);
    }
  });

  const latestPeriod = calculatedData[calculatedData.length - 1];

  return (
    <section className="my-6 p-4 bg-slate-800 text-slate-200 border-2 border-slate-700 rounded-lg no-print text-xs font-mono">
      <h3 className="text-md font-bold text-yellow-400 mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 icon-yellow" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.728c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Monitor de Consistência SSOT (Dev Mode)
      </h3>
      
      {allSSOTIssues.length === 0 && (
        <p className="text-green-400 font-semibold">✅ Nenhuma inconsistência interna de cálculo SSOT detectada.</p>
      )}
      {allSSOTIssues.length > 0 && (
        <div className="mb-3 p-2 border border-red-700 rounded bg-red-900/30">
          <h4 className="font-semibold text-red-400 mb-1">🚨 Inconsistências SSOT Encontradas:</h4>
          <ul className="list-disc list-inside pl-2 space-y-1 max-h-40 overflow-y-auto">
            {allSSOTIssues.map((issue, idx) => (
              <li key={idx} className="text-red-300">
                <strong>{issue.periodLabel} - {issue.type}:</strong> {issue.message}
                {typeof issue.expected !== 'undefined' && <span className="block text-xs italic"> (Esperado: {issue.expected}, Atual: {issue.actual})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {latestPeriod && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <h4 className="font-semibold text-slate-300 mb-1.5 text-sm">Valores Chave SSOT (Último Período):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                <div>PME (invDays): {formatDays(latestPeriod.invDays)}</div>
                <div>PMR (arDays): {formatDays(latestPeriod.arDays)}</div>
                <div>PMP (apDays): {formatDays(latestPeriod.apDays)}</div>
                <div>Ciclo Caixa (wcDays): {formatDays(latestPeriod.wcDays)}</div>
                <div>BS Diff: {formatCurrency(latestPeriod.balanceSheetDifference)}</div>
                <div>Total Ativos: {formatCurrency(latestPeriod.estimatedTotalAssets)}</div>
            </div>
          </div>
      )}
       <style>{`
        .icon-yellow { filter: drop-shadow(0 0 3px #facc15); }
      `}</style>
    </section>
  );
}