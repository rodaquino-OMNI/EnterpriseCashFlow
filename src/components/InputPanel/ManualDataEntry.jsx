// src/components/InputPanel/ManualDataEntry.jsx
import React, { useState } from 'react';
import { 
  fieldDefinitions, 
  getFieldKeys, 
  FIELD_CATEGORIES, 
  isOverrideField, 
} from '../../utils/fieldDefinitions';
import { PERIOD_TYPES, MIN_PERIODS_MANUAL, MAX_PERIODS } from '../../utils/constants';

/**
 * @param {{
 * numberOfPeriods: number;
 * onNumberOfPeriodsChange: (periods: number) => void;
 * periodType: import('../../types/financial').PeriodTypeOption;
 * onPeriodTypeChange: (type: import('../../types/financial').PeriodTypeOption) => void;
 * inputData: import('../../types/financial').PeriodInputData[];
 * onInputChange: (periodIndex: number, fieldKey: import('../../types/financial').FieldKey, value: string) => void;
 * onSubmit: () => void;
 * isLoading: boolean;
 * validationErrors?: Array<{ period: number, fields: Record<string, string> }> | null;
 * }} props
 */
export default function ManualDataEntry({
  numberOfPeriods,
  onNumberOfPeriodsChange,
  periodType,
  onPeriodTypeChange,
  inputData,
  onInputChange,
  onSubmit,
  isLoading,
  validationErrors,
}) {
  const [expandedOverrides, setExpandedOverrides] = useState({
    pl: false,
    bs: false,
    cf: false,
  });

  const toggleOverrideSection = (sectionKey) => {
    setExpandedOverrides(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const driverFieldKeys = getFieldKeys([FIELD_CATEGORIES.DRIVER_REQUIRED, FIELD_CATEGORIES.DRIVER_OPTIONAL]);
  
  const overrideSections = [
    { key: 'pl', title: '🔧 DRE - Itens de Resultado (Overrides Opcionais)', category: FIELD_CATEGORIES.OVERRIDE_PL },
    { key: 'bs', title: '🔧 Balanço Patrimonial (Overrides Opcionais)', category: FIELD_CATEGORIES.OVERRIDE_BS },
    { key: 'cf', title: '🔧 Fluxo de Caixa (Overrides Opcionais)', category: FIELD_CATEGORIES.OVERRIDE_CF },
  ];

  const renderFieldRow = (fieldKey, periodIndex) => {
    const def = fieldDefinitions[fieldKey];
    if (!def) return null;
    const isDisabled = def.firstPeriodOnly && periodIndex > 0;
    const periodErrorObj = validationErrors?.find(pErr => pErr.period === periodIndex + 1);
    const fieldErrorMsg = periodErrorObj?.fields[fieldKey];
    const currentValue = inputData?.[periodIndex]?.[fieldKey];
    const isOverridden = isOverrideField(fieldKey) && (currentValue !== null && typeof currentValue !== 'undefined' && currentValue !== '');

    return (
      <td key={`${fieldKey}-${periodIndex}`} className="p-1.5 border border-slate-300">
        <input
          type="number"
          step={def.type === 'percentage' || def.type === 'days' ? '0.01' : 'any'}
          placeholder={isDisabled ? 'N/A' : '0'}
          disabled={isDisabled}
          title={def.note || def.label}
          value={isDisabled ? '' : (currentValue === null || typeof currentValue === 'undefined' ? '' : currentValue)}
          onChange={(e) => onInputChange(periodIndex, fieldKey, e.target.value)}
          className={`w-full p-2 border rounded-md text-sm text-right transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isDisabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 
              fieldErrorMsg ? 'border-red-500 bg-red-50' : 
                isOverridden ? 'border-green-400 bg-green-50 font-semibold' : 'border-slate-200 hover:border-slate-300'
          }`}
          aria-invalid={!!fieldErrorMsg}
          aria-describedby={fieldErrorMsg ? `${fieldKey}-${periodIndex}-error` : undefined}
        />
        {fieldErrorMsg && (<p id={`${fieldKey}-${periodIndex}-error`} className="text-xs text-red-600 mt-0.5">{fieldErrorMsg}</p>)}
      </td>
    );
  };

  const renderSectionTable = (title, fieldKeysToShow, isOverrideSectionContent = false, sectionKeyForToggle = null) => {
    if (fieldKeysToShow.length === 0) return null;

    const isCollapsible = isOverrideSectionContent && sectionKeyForToggle;
    const isExpanded = !isCollapsible || expandedOverrides[sectionKeyForToggle];

    const overrideCount = isCollapsible ? fieldKeysToShow.reduce((count, key) => {
      return count + (inputData?.some(period => {
        const val = period[key];
        return val !== null && val !== undefined && val !== '';
      }) ? 1 : 0);
    }, 0) : 0;


    return (
      <div className={`mb-6 ${isCollapsible ? 'border-l-4 border-sky-300 pl-4 py-2 bg-sky-50/50 rounded-r-lg' : ''}`}>
        {isCollapsible ? (
          <button
            type="button"
            onClick={() => toggleOverrideSection(sectionKeyForToggle)}
            className="flex items-center justify-between w-full p-3 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors mb-3 shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium text-sky-700">{title}</span>
              <span className="text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full">
                Opcional Avançado
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {overrideCount > 0 && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                  {overrideCount} preenchido(s)
                </span>
              )}
              <svg 
                className={`w-5 h-5 text-sky-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        ) : (
          <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        )}

        {isExpanded && (
          <div className="overflow-x-auto border border-slate-300 rounded-lg mt-2 animation-fade-in">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 border-x border-slate-300 text-left text-sm font-semibold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[250px] md:min-w-[300px]">
                    {isOverrideSectionContent ? '🔧 Item Financeiro (Override)' : 'Item Financeiro'}
                  </th>
                  {inputData?.map((_, index) => (
                    <th key={index} className="p-3 border-x border-slate-300 text-center text-sm font-semibold text-slate-700 min-w-[120px]">
                      Período {index + 1}
                      <span className="font-normal text-xs block">
                        ({PERIOD_TYPES[periodType]?.shortLabel || periodType})
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fieldKeysToShow.map(fieldKey => {
                  const def = fieldDefinitions[fieldKey];
                  return (
                    <tr key={fieldKey} className={`hover:bg-slate-50 ${isOverrideSectionContent ? 'bg-sky-50/30' : ''}`}>
                      <td className="p-3 border-x border-b border-slate-300 text-sm text-slate-600 sticky left-0 bg-white hover:bg-slate-50 z-10" title={def.note || ''}>
                        <div className="font-medium">{def.label}</div>
                        {def.note && (<div className="text-xs text-slate-400 mt-0.5">({def.note})</div>)}
                      </td>
                      {inputData?.map((_periodData, periodIndex) => (
                        <React.Fragment key={`${fieldKey}-${periodIndex}`}>
                          {renderFieldRow(fieldKey, periodIndex)}
                        </React.Fragment>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Entrada Manual de Dados - Modo Adaptativo
      </h2>
      {/* Config Section: Number of Periods and Period Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="numberOfPeriodsEntry" className="block text-sm font-medium text-slate-700 mb-1">
            Número de Períodos ({MIN_PERIODS_MANUAL}-{MAX_PERIODS}):
          </label>
          <select id="numberOfPeriodsEntry" value={numberOfPeriods} onChange={(e) => onNumberOfPeriodsChange(Number(e.target.value))}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {Array.from({ length: MAX_PERIODS - MIN_PERIODS_MANUAL + 1 }, (_, i) => MIN_PERIODS_MANUAL + i).map(n => (
              <option key={n} value={n}>{n} Períodos</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="periodTypeEntry" className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de Período:
          </label>
          <select id="periodTypeEntry" value={periodType} onChange={(e) => onPeriodTypeChange(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.entries(PERIOD_TYPES).map(([key, value]) => (<option key={key} value={key}>{value.label}</option>))}
          </select>
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="bg-sky-50 p-4 rounded-lg mb-6 border border-sky-200 text-sm text-sky-700">
        <h4 className="font-semibold text-sky-800 mb-2 flex items-center">
          <span className="text-lg mr-2">💡</span> Como Funciona o Modo Adaptativo:
        </h4>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Preencha os **Dados Principais / Drivers** para que o sistema calcule automaticamente as demonstrações.</li>
          <li>Se possuir valores reais para itens específicos da DRE, Balanço ou Fluxo de Caixa, expanda as seções de **Overrides Opcionais** e insira esses valores.</li>
          <li>Valores inseridos nos campos de **Override (🔧)** terão prioridade sobre os cálculos automáticos do sistema para aquele item específico.</li>
          <li>A "Diferença de Balanço" e as "Validações de Dados" ajudarão a identificar possíveis inconsistências.</li>
        </ul>
      </div>

      {/* Driver Fields Section */}
      {renderSectionTable('📋 Dados Principais / Drivers Essenciais', driverFieldKeys)}
      
      {/* Override Sections */}
      {overrideSections.map(section => (
        <div key={section.key}>
          {renderSectionTable(
            section.title,
            getFieldKeys(section.category),
            true,
            section.key,
          )}
        </div>
      ))}

      {/* Submit Button */}
      <div className="text-center mt-8">
        <button onClick={onSubmit} disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processando...</span>
            </div>
          ) : 'Gerar Relatório com Dados Atuais'}
        </button>
      </div>
    </section>
  );
}