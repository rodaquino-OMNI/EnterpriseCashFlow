import React, { useState, useRef } from 'react';
import { useExcelParser } from '../hooks/useExcelParser';
import * as XLSX from 'xlsx';

/**
 * Component for uploading and parsing Excel files containing financial data
 * @param {Object} props Component props
 * @param {Function} props.onDataParsed Callback when data is successfully parsed
 * @param {Function} props.onError Callback when an error occurs during parsing
 */
const ExcelUploader = ({ onDataParsed, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  
  // Use our Excel parser hook
  const { parseExcelData, isParsing, parsingError } = useExcelParser(XLSX);
  
  // Combined status for UI
  const isProcessing = isUploading || isParsing;
  
  /**
   * Handle file selection
   * @param {Event} event Change event from file input
   */
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setFileName(file.name);
      
      // Read file as ArrayBuffer
      const buffer = await readFileAsArrayBuffer(file);
      
      // Parse Excel data
      const parsedData = await parseExcelData(buffer);
      
      if (parsedData) {
        onDataParsed(parsedData);
      } else if (parsingError) {
        onError(parsingError);
      }
    } catch (error) {
      onError(error.message || 'Erro ao processar arquivo');
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Read file as ArrayBuffer
   * @param {File} file File to read
   * @returns {Promise<ArrayBuffer>} File contents as ArrayBuffer
   */
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };
  
  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={triggerFileInput}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="spinner-border w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">
                {isParsing ? 'Analisando dados...' : 'Carregando arquivo...'}
              </span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique para selecionar ou arraste a planilha Excel'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Formatos aceitos: .xlsx, .xls</p>
            </>
          )}
        </div>
        
        {parsingError && (
          <div className="mt-3 text-sm text-red-600">
            <span className="font-medium">Erro:</span> {parsingError}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;