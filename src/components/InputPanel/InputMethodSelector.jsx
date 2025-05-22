// src/components/InputPanel/InputMethodSelector.jsx
import React from 'react';

/**
 * @param {{
 * inputMethod: 'manual' | 'excel' | 'pdf';
 * onInputMethodChange: (method: 'manual' | 'excel' | 'pdf') => void;
 * companyName: string;
 * onCompanyNameChange: (name: string) => void;
 * reportTitle: string;
 * onReportTitleChange: (title: string) => void;
 * supportsPdf?: boolean;
 * }} props
 */
export default function InputMethodSelector({
  inputMethod,
  onInputMethodChange,
  companyName,
  onCompanyNameChange,
  reportTitle,
  onReportTitleChange,
  supportsPdf = true
}) {
  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
        <div>
          <label htmlFor="inputMethod" className="block text-sm font-medium text-slate-700 mb-1">
            Método de Entrada:
          </label>
          <select
            id="inputMethod"
            value={inputMethod}
            onChange={(e) => onInputMethodChange(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="manual">Entrada Manual de Dados</option>
            <option value="excel">Upload de Arquivo Excel</option>
            {supportsPdf && (
              <option value="pdf">Extrair de PDF com IA</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
            Nome da Empresa:
          </label>
          <input 
            type="text" 
            id="companyName" 
            value={companyName} 
            onChange={(e) => onCompanyNameChange(e.target.value)} 
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o nome da empresa"
          />
        </div>
        <div>
          <label htmlFor="reportTitle" className="block text-sm font-medium text-slate-700 mb-1">
            Título do Relatório:
          </label>
          <input 
            type="text" 
            id="reportTitle" 
            value={reportTitle} 
            onChange={(e) => onReportTitleChange(e.target.value)} 
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o título do relatório"
          />
        </div>
      </div>
      
      {inputMethod === 'pdf' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-start text-sm text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              A extração de dados de PDF utiliza IA para reconhecer tabelas financeiras. Os resultados podem variar conforme o formato do documento.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}