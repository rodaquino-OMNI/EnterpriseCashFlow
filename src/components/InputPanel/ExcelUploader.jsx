// src/components/InputPanel/ExcelUploader.jsx
import React, { useRef } from 'react';
import ExcelTemplateSelector from './ExcelTemplateSelector'; 
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * onTemplateDownloadRequest: (templateTypeKey: keyof typeof import('../../utils/excelTemplateGenerator').TEMPLATE_TYPES) => Promise<void>;
 * onFileUpload: (file: File) => Promise<void>;
 * isLoading: boolean;
 * isExcelJsLoading: boolean; // Renamed for clarity
 * excelJsError: Error | null;
 * currentAppNumberOfPeriods: number;
 * currentAppPeriodType: import('../../types/financial').PeriodTypeOption;
 * onNumberOfPeriodsChange: (periods: number) => void;
 * onPeriodTypeChange: (periodType: import('../../types/financial').PeriodTypeOption) => void;
 * }} props
 */
export default function ExcelUploader({
  onTemplateDownloadRequest,
  onFileUpload,
  isLoading,
  isExcelJsLoading, // Specific loading for ExcelJS library
  excelJsError,
  currentAppNumberOfPeriods,
  currentAppPeriodType,
  onNumberOfPeriodsChange,
  onPeriodTypeChange,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // isLoading prop should reflect overall processing (parsing + calculating)
  // isExcelJsLoading is for the library itself
  const isButtonDisabled = isLoading || isExcelJsLoading;

  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-xl border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Entrada de Dados via Excel (Upload Adaptativo)
      </h2>

      {/* Period Configuration Controls */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Configurar Template Excel:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Number of Periods Control */}
          <div>
            <label htmlFor="numberOfPeriodsExcel" className="block text-sm font-medium text-slate-700 mb-2">
              Número de Períodos (2-6):
            </label>
            <select
              id="numberOfPeriodsExcel"
              value={currentAppNumberOfPeriods}
              onChange={(e) => onNumberOfPeriodsChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'período' : 'períodos'}
                </option>
              ))}
            </select>
          </div>

          {/* Period Type Control */}
          <div>
            <label htmlFor="periodTypeExcel" className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Período:
            </label>
            <select
              id="periodTypeExcel"
              value={currentAppPeriodType}
              onChange={(e) => onPeriodTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="anos">Anos</option>
              <option value="trimestres">Trimestres</option>
              <option value="meses">Meses</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>O template será gerado com a configuração acima. Após o upload, o sistema detectará automaticamente se você adicionou mais períodos ou alterou o tipo.</span>
        </p>
      </div>

      <ExcelTemplateSelector
        onTemplateDownloadRequest={onTemplateDownloadRequest} // Renamed prop
        isLoading={isExcelJsLoading} // Template download depends on ExcelJS loading
        currentNumberOfPeriods={currentAppNumberOfPeriods}
        currentPeriodTypeLabel={PERIOD_TYPES[currentAppPeriodType]?.label || currentAppPeriodType}
      />

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-lg font-medium text-slate-700 mb-4 text-center">Ou Carregue seu Arquivo Preenchido:</h3>
        <div className="flex justify-center">
          <label className={`w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 text-center ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Carregar Planilha Excel (.xlsx)
            </span>
            <input
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              disabled={isButtonDisabled}
              data-testid="excel-file-input"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 text-center">
        {excelJsError && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">Erro com ExcelJS: {excelJsError.message}</p>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          A plataforma tentará identificar automaticamente o formato do template e o número de períodos do seu arquivo.
          Recomendamos usar o "Template Inteligente".
        </p>
      </div>
    </section>
  );
}