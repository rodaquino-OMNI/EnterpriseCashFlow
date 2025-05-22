// src/components/InputPanel/ManualDataEntry.jsx
import React from 'react';
import { PERIOD_TYPES, MIN_PERIODS_MANUAL, MAX_PERIODS } from '../../utils/constants';
import { fieldDefinitions, getFieldKeys } from '../../utils/fieldDefinitions';

export default function ManualDataEntry({
  numberOfPeriods,
  onNumberOfPeriodsChange,
  periodType,
  onPeriodTypeChange,
  inputData,
  onInputChange,
  onSubmit,
  isLoading
}) {
  const fieldKeys = getFieldKeys();
  const periodOptions = Object.keys(PERIOD_TYPES);

  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-4">Entrada Manual de Dados</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Períodos:</label>
          <select
            value={numberOfPeriods}
            onChange={e => onNumberOfPeriodsChange(Number(e.target.value))}
            className="p-2 border border-slate-300 rounded"
            disabled={isLoading}
          >
            {Array.from({ length: MAX_PERIODS - MIN_PERIODS_MANUAL + 1 }, (_, i) => MIN_PERIODS_MANUAL + i)
              .map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Período:</label>
          <select
            value={periodType}
            onChange={e => onPeriodTypeChange(e.target.value)}
            className="p-2 border border-slate-300 rounded"
            disabled={isLoading}
          >
            {periodOptions.map(opt => (
              <option key={opt} value={opt}>{PERIOD_TYPES[opt].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-slate-100">Campo</th>
              {Array.from({ length: numberOfPeriods }, (_, idx) => (
                <th key={idx} className="border p-2 bg-slate-100 text-center">
                  P{idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fieldKeys.map(fieldKey => {
              const def = fieldDefinitions[fieldKey];
              return (
                <tr key={fieldKey} className="hover:bg-slate-50">
                  <td className="border p-2 font-medium">{def.label}</td>
                  {Array.from({ length: numberOfPeriods }, (_, idx) => (
                    <td key={idx} className="border p-1 text-right">
                      <input
                        type="number"
                        step="any"
                        className="w-full p-1 border border-slate-300 rounded text-right"
                        value={inputData[idx]?.[fieldKey] ?? ''}
                        onChange={e => onInputChange(idx, fieldKey, e.target.value)}
                        disabled={isLoading || (def.firstPeriodOnly && idx > 0)}
                        placeholder={def.firstPeriodOnly && idx > 0 ? '-': ''}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processando...' : 'Gerar Relatório'}
        </button>
      </div>
    </section>
  );
}