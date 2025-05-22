// src/hooks/usePdfParser.js
import { useState, useCallback } from 'react';

/**
 * Custom hook for parsing PDF files and extracting their text content
 * 
 * @returns {{
 *   extractTextFromPdf: (file: File) => Promise<{text: string, pages: number, fileName: string}>;
 *   isParsing: boolean;
 *   parsingError: Error | null;
 *   resetError: () => void;
 * }} PDF parsing functions and state
 */
export function usePdfParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState(null);

  // Reset any errors
  const resetError = useCallback(() => {
    setParsingError(null);
  }, []);

  /**
   * Extract text from a PDF file
   * Uses PDF.js library loaded dynamically via CDN to avoid bundling the library
   * 
   * @param {File} file - The PDF file to parse
   * @returns {Promise<{text: string, pages: number, fileName: string}>} The extracted text and metadata
   */
  const extractTextFromPdf = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Invalid file. Please upload a PDF file.');
    }

    setIsParsing(true);
    setParsingError(null);

    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library is not loaded. Please make sure the CDN script is included in the HTML page.');
      }

      // Ensure worker source is set
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.warn("PDF.js workerSrc not configured. Using default Cloudflare CDN.");
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${window.pdfjsLib.version}/pdf.worker.min.js`;
      }

      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Process text items and concatenate them with better formatting
        const pageText = textContent.items
          .map(item => item.str + (item.hasEOL ? '\n' : ' '))
          .join('');

        fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`;
      }
      
      return {
        text: fullText.trim(),
        pages: pdf.numPages,
        fileName: file.name
      };
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      setParsingError(err);
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  }, []);

  return {
    extractTextFromPdf,
    isParsing,
    parsingError,
    resetError
  };
}