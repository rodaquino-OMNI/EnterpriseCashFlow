// src/hooks/useLibrary.js
import { useState, useCallback } from 'react';

export function useLibrary(libraryNameGlobal) {
  const [library, setLibrary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLibrary = useCallback(async () => {
    if (library) return library; // Already "loaded" (available)
    
    setIsLoading(true);
    setError(null);
    
    // For ExcelJS specifically, try multiple global names and wait for it to load
    if (libraryNameGlobal === 'ExcelJS') {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (attempts < maxAttempts) {
        // ExcelJS can be available as ExcelJS, excel, or ExcelJS.Workbook
        if (window.ExcelJS || window.excel || (window.ExcelJS && window.ExcelJS.Workbook)) {
          const libInstance = window.ExcelJS || window.excel;
          setLibrary(() => libInstance);
          setIsLoading(false);
          return libInstance;
        }
        
        // Wait 100ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // If we get here, ExcelJS didn't load
      const errMsg = `Biblioteca ${libraryNameGlobal} não carregou no tempo esperado. Verifique sua conexão de internet e se o CDN está acessível.`;
      console.error(errMsg);
      setError(new Error(errMsg));
      setIsLoading(false);
      return null;
    }
    
    // Original logic for other libraries
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (window[libraryNameGlobal]) {
      const libInstance = window[libraryNameGlobal];
      setLibrary(() => libInstance);
      setIsLoading(false);
      return libInstance;
    } else {
      const errMsg = `Biblioteca ${libraryNameGlobal} não encontrada. Verifique se o script CDN está incluído e carregado corretamente na página HTML.`;
      console.error(errMsg);
      setError(new Error(errMsg));
      setIsLoading(false);
      return null;
    }
  }, [library, libraryNameGlobal]);

  // Optional: Reset state if needed
  const reset = useCallback(() => {
    setLibrary(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    library,
    loadLibrary,
    isLoading,
    error,
    reset,
    isAvailable: !!library, // Convenience flag
  };
}