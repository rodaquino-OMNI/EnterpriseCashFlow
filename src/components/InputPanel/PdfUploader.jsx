// src/components/InputPanel/PdfUploader.jsx
import React, { useRef, useState } from 'react';
import { AI_PROVIDERS } from '../../utils/aiProviders';

/**
 * Component for uploading PDF files and extracting financial data with AI
 * 
 * @param {{
 *   onPdfUpload: (file: File) => Promise<void>;
 *   isLoading: boolean;
 *   aiProviderConfig: import('../../utils/aiProviders').AiProviderConfig;
 *   periodType: string;
 *   setPeriodType: (type: string) => void;
 *   numberOfPeriods: number;
 *   setNumberOfPeriods: (num: number) => void;
 *   extractionProgress: { step: string, progress: number } | null;
 * }} props
 */
export default function PdfUploader({
  onPdfUpload,
  isLoading,
  aiProviderConfig,
  periodType,
  setPeriodType,
  numberOfPeriods,
  setNumberOfPeriods,
  extractionProgress
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  
  // Estimate tokens from the file size (very rough approximation)
  const estimateTokens = (fileSizeInBytes) => {
    // Roughly estimate: PDF text is ~50-75% of file size, and ~4 characters per token
    const estimatedCharacters = fileSizeInBytes * 0.6; // 60% of file size as characters
    const estimatedTokenCount = Math.round(estimatedCharacters / 4);
    return estimatedTokenCount;
  };
  
  // Get the recommended provider based on estimated token count
  const getRecommendedProvider = (tokenCount) => {
    if (tokenCount < 3000) {
      return 'any'; // Any provider can handle small files
    } else if (tokenCount < 25000) {
      return 'openai_claude_gemini'; // Most cloud providers can handle this
    } else if (tokenCount < 100000) {
      return 'claude_gemini'; // Only Claude and Gemini can handle this
    } else {
      return 'gemini'; // Only Gemini 1.5 Flash can handle very large contexts
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      const estimatedTokens = estimateTokens(file.size);
      setEstimatedTokens(estimatedTokens);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        const estimatedTokens = estimateTokens(file.size);
        setEstimatedTokens(estimatedTokens);
      }
    }
  };
  
  const handleUpload = async () => {
    if (selectedFile) {
      await onPdfUpload(selectedFile);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Get the token capacity information
  const getProviderBadge = () => {
    if (!selectedFile) return null;
    
    const recommended = getRecommendedProvider(estimatedTokens);
    const currentProviderKey = Object.keys(AI_PROVIDERS).find(key => 
      AI_PROVIDERS[key].name === aiProviderConfig?.name
    ) || '';
    
    // Check if the current provider is suitable
    const isCurrentProviderOk = (
      (recommended === 'any') ||
      (recommended === 'openai_claude_gemini' && ['openai', 'claude', 'gemini'].includes(currentProviderKey)) ||
      (recommended === 'claude_gemini' && ['claude', 'gemini'].includes(currentProviderKey)) ||
      (recommended === 'gemini' && currentProviderKey === 'gemini')
    );
    
    return (
      <div className={`mt-3 p-3 rounded-md ${isCurrentProviderOk ? 'bg-green-50' : 'bg-amber-50'}`}>
        <div className="flex items-center">
          <span className={`mr-2 text-lg ${isCurrentProviderOk ? 'text-green-500' : 'text-amber-500'}`}>
            {isCurrentProviderOk ? '✓' : '⚠️'}
          </span>
          <div>
            <p className={`text-sm font-medium ${isCurrentProviderOk ? 'text-green-700' : 'text-amber-700'}`}>
              {isCurrentProviderOk 
                ? 'O provedor atual é adequado para este documento' 
                : 'Este documento pode ser grande demais para o provedor atual'}
            </p>
            <p className="text-xs text-slate-600">
              Tamanho estimado: ~{Math.round(estimatedTokens / 1000)}k tokens
              {!isCurrentProviderOk && recommended === 'gemini' && 
                " - Recomendamos usar o Gemini para documentos grandes"}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <section className="mb-10">
      <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          Extração de PDF com Inteligência Artificial 
          <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {aiProviderConfig?.icon} Usando {aiProviderConfig?.name}
          </span>
        </h2>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label htmlFor="periodType" className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Período:
              </label>
              <select
                id="periodType"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="anos">Anos</option>
                <option value="trimestres">Trimestres</option>
                <option value="meses">Meses</option>
              </select>
            </div>
            <div>
              <label htmlFor="numberOfPeriods" className="block text-sm font-medium text-slate-700 mb-1">
                Número de Períodos (máx. 5):
              </label>
              <input
                id="numberOfPeriods"
                type="number"
                min="2"
                max="5"
                value={numberOfPeriods}
                onChange={(e) => setNumberOfPeriods(Math.min(5, Math.max(2, parseInt(e.target.value) || 2)))}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <h3 className="font-medium text-slate-700 mb-2">Capacidade de Processamento por Provedor:</h3>
            <ul className="text-xs text-slate-600 space-y-1 mb-3">
              <li><span className="font-semibold">Gemini 1.5 Flash</span>: Documentos grandes (até 750k caracteres)</li>
              <li><span className="font-semibold">Claude 3</span>: Documentos médios-grandes (até 150k caracteres)</li>
              <li><span className="font-semibold">GPT-4</span>: Documentos médios (até 100k caracteres)</li>
              <li><span className="font-semibold">Ollama Local</span>: Apenas documentos curtos</li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              Documentos maiores serão truncados automaticamente para caber no limite do provedor selecionado.
            </p>
          </div>
        </div>
        <div 
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
          } ${isLoading ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          
          {selectedFile ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  <path d="M8.707 12.293a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L6 13.586V10a1 1 0 112 0v3.586l1.293-1.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-1">{selectedFile.name}</p>
              <p className="text-sm text-slate-500 mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF
              </p>
              
              {/* Display token limit information */}
              {getProviderBadge()}
              
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-400"
              >
                {isLoading ? 'Processando...' : 'Iniciar Extração'}
              </button>
            </div>
          ) : (
            <div className="text-center" onClick={handleButtonClick}>
              <div className="mx-auto w-16 h-16 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-1 text-slate-700">Arraste e solte seu PDF aqui</p>
              <p className="text-sm text-slate-500 mb-4">ou clique para selecionar o arquivo</p>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                Selecionar Arquivo PDF
              </button>
            </div>
          )}
        </div>
        {extractionProgress && (
          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{extractionProgress.step}</span>
              <span className="text-sm font-medium text-slate-700">{extractionProgress.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${extractionProgress.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}