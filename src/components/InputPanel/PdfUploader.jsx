// src/components/InputPanel/PdfUploader.jsx
import React, { useRef, useState } from 'react';
import { PERIOD_TYPES, MAX_PERIODS } from '../../utils/constants';

/**
 * @param {{
 * onPdfFileUpload: (file: File) => void; // Renamed from onPdfUpload for clarity
 * isLoading: boolean; // Combined loading state (parsing + extracting)
 * aiProviderConfig: import('../../utils/aiProviders').AiProviderConfig | undefined;
 * periodTypeForExtraction: import('../../types/financial').PeriodTypeOption; // Renamed
 * setPeriodTypeForExtraction: (type: import('../../types/financial').PeriodTypeOption) => void; // Renamed
 * numberOfPeriodsForExtraction: number; // Renamed
 * setNumberOfPeriodsForExtraction: (num: number) => void; // Renamed
 * extractionProgress: { step: string; progress: number } | null;
 * }} props
 */
export default function PdfUploader({
  onPdfFileUpload,
  isLoading,
  aiProviderConfig,
  periodTypeForExtraction,
  setPeriodTypeForExtraction,
  numberOfPeriodsForExtraction,
  setNumberOfPeriodsForExtraction,
  extractionProgress,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileProcess = (file) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      alert('Arquivo PDF muito grande. Limite: 15MB.');
      return;
    }
    onPdfFileUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isLoading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isLoading) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
        Upload e Análise de PDF com IA {aiProviderConfig?.icon || ''}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="pdfPeriodType" className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de Período no PDF:
          </label>
          <select 
            id="pdfPeriodType"
            value={periodTypeForExtraction} 
            onChange={(e) => setPeriodTypeForExtraction(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {Object.entries(PERIOD_TYPES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pdfNumberOfPeriods" className="block text-sm font-medium text-slate-700 mb-1">
            Número de Períodos a Extrair (1-{MAX_PERIODS}):
          </label>
          <select 
            id="pdfNumberOfPeriods"
            value={numberOfPeriodsForExtraction} 
            onChange={(e) => setNumberOfPeriodsForExtraction(Number(e.target.value))}
            className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} Período{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'} ${isLoading ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-blue-400 hover:bg-slate-50'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        role="button" tabIndex={isLoading ? -1 : 0} aria-disabled={isLoading}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" disabled={isLoading}/>
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isLoading ? (extractionProgress?.step || 'Processando PDF...') : 'Arraste um PDF aqui ou clique para selecionar'}
            </p>
            <p className="text-sm text-slate-500 mt-1">Balanços, DREs, relatórios financeiros (máx. 15MB)</p>
          </div>
          {!isLoading && ( <button type="button" className="btn-primary">Selecionar Arquivo PDF</button> )}
        </div>
      </div>

      {isLoading && extractionProgress && (
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>{extractionProgress.step}</span>
            <span>{extractionProgress.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${extractionProgress.progress}%` }}/>
          </div>
        </div>
      )}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-800 mb-2 text-sm">📋 Dicas para PDF:</h4>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>PDFs com texto (não imagens) funcionam melhor.</li>
          <li>Relatórios com tabelas claras são ideais.</li>
          <li>A IA ({aiProviderConfig?.name}) tentará extrair os dados. Revise sempre!</li>
        </ul>
      </div>
    </section>
  );
}