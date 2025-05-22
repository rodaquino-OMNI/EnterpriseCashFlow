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

    // Simulate a small delay for "loading" or to allow scripts to potentially finish loading
    // In a real scenario, this would be where you might dynamically inject a script tag
    // if the library wasn't preloaded.
    await new Promise(resolve => setTimeout(resolve, 50));

    if (window[libraryNameGlobal]) {
      const libInstance = window[libraryNameGlobal];
      setLibrary(() => libInstance); // Use functional update for safety
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
    isAvailable: !!library // Convenience flag
  };
}