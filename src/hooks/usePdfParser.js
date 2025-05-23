// src/hooks/usePdfParser.js
import { useState, useCallback } from 'react';

/**
 * Hook for extracting text content from PDF files
 * @returns {{
 *   extractTextFromPdf: (file: File) => Promise<{text: string, pageCount: number}>;
 *   isParsing: boolean;
 *   parsingError: Error | null;
 *   setParsingError: React.Dispatch<React.SetStateAction<Error | null>>;
 * }}
 */
export function usePdfParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState(null);

  /**
   * Extract text from a PDF file
   * @param {File} file - The PDF file to extract text from
   * @returns {Promise<{text: string, pageCount: number}>} - The extracted text and page count
   */
  const extractTextFromPdf = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      const error = new Error('Arquivo inválido. Por favor, forneça um PDF válido.');
      setParsingError(error);
      throw error;
    }

    setIsParsing(true);
    setParsingError(null);

    try {
      // Check if the PDF.js library is available (should be loaded via CDN)
      if (!window.pdfjsLib) {
        throw new Error('Biblioteca PDF.js não disponível. Verifique a conexão de internet.');
      }

      // Read the file as ArrayBuffer
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo PDF.'));
        reader.readAsArrayBuffer(file);
      });

      // Load the PDF document using PDF.js
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      // Extract text from each page
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Join text items into a single string
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      setIsParsing(false);
      return { text: fullText.trim(), pageCount: numPages };
    } catch (err) {
      console.error('Erro ao analisar PDF:', err);
      setParsingError(err);
      setIsParsing(false);
      throw err;
    }
  }, []);

  return {
    extractTextFromPdf,
    isParsing,
    parsingError,
    setParsingError
  };
}