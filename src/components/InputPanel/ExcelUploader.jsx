// src/components/InputPanel/ExcelUploader.jsx
import React, { useRef } from 'react';
import { DEFAULT_PERIODS_EXCEL } from '../../utils/constants';

export default function ExcelUploader({
  onTemplateDownload,
  onFileUpload,
  isLoading, // General processing state from parent
  excelJsLoading, // Specific to ExcelJS library loading
  excelJsError,
  numberOfPeriodsForTemplate, // Number of periods the template will be generated for
}) {
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input to allow uploading the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const currentPeriodsForTemplate = numberOfPeriodsForTemplate || DEFAULT_PERIODS_EXCEL;

  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Upload de Arquivo Excel
      </h2>

      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={onTemplateDownload}
          disabled={isLoading || excelJsLoading}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || excelJsLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Carregando...</span>
            </div>
          ) : (
            `Baixar Template Excel (${currentPeriodsForTemplate} Períodos)`
          )}
        </button>

        <label className={`
          w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
          transition duration-150 text-center
          ${isLoading || excelJsLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}>
          Carregar Arquivo Preenchido (.xlsx)
          <input 
            type="file" 
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            onChange={handleFileChange} 
            ref={fileInputRef} 
            className="hidden" 
            disabled={isLoading || excelJsLoading}
          />
        </label>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500">
          O template será gerado com {currentPeriodsForTemplate} {currentPeriodsForTemplate > 1 ? "períodos" : "período"}.
          A funcionalidade de upload tentará detectar o número de períodos do arquivo.
        </p>

        {excelJsError && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm text-red-700">Erro ao carregar ExcelJS: {excelJsError.message}</p>
          </div>
        )}
      </div>
    </section>
  );
}