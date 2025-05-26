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
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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