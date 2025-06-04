// src/components/Charts/BaseChart.jsx
import React, { useState, useEffect, useCallback } from 'react';
import * as Recharts from 'recharts';

/**
 * Enhanced chart wrapper with advanced error recovery and performance optimization.
 * @param {{
 * children: (isLoaded: boolean) => React.ReactNode; 
 * libraryName?: string; // e.g., 'Recharts', 'NivoLine', 'NivoBar'
 * loadingFallback?: React.ReactNode;
 * errorFallback?: React.ReactNode;
 * retryButton?: boolean;
 * chartTitle?: string;
 * }} props
 */
export default function BaseChart({ 
  children, 
  libraryName = "Recharts", 
  chartTitle = "Chart" 
}) {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Reduced from 4 to 2
  
  // Memoize library check to avoid repeated evaluations
  const checkLibraryAvailability = useCallback(() => {
    // Direct import check - Recharts is already imported above
    if (Recharts && typeof Recharts === 'object' && Object.keys(Recharts).length > 0) {
      // Make Recharts available on window for compatibility
      if (typeof window !== 'undefined') {
        window.Recharts = Recharts;
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // Initial immediate check
    if (checkLibraryAvailability()) {
      setIsLibraryLoaded(true);
      return;
    }
    
    // If not available, try a few more times with short delays
    if (!isLibraryLoaded && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        if (checkLibraryAvailability()) {
          setIsLibraryLoaded(true);
        } else {
          setRetryCount(prev => prev + 1);
        }
      }, 50 + (retryCount * 50)); // Very short delays: 50ms, 100ms
      
      return () => clearTimeout(timeout);
    }
  }, [isLibraryLoaded, retryCount, maxRetries, checkLibraryAvailability]);

  // Force check on mount as fallback
  useEffect(() => {
    const forceCheck = () => {
      if (checkLibraryAvailability()) {
        setIsLibraryLoaded(true);
      }
    };
    
    // Try immediately
    forceCheck();
    
    // Also try after a brief delay
    const fallbackTimeout = setTimeout(forceCheck, 100);
    return () => clearTimeout(fallbackTimeout);
  }, [checkLibraryAvailability]);

  if (!isLibraryLoaded) {
    if (retryCount >= maxRetries) {
      return (
        <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-center p-4">
            <div className="text-slate-400 mb-2">⚠️</div>
            <div className="text-sm text-slate-600">
              Biblioteca de gráficos não disponível
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {chartTitle} - Verifique a conexão de rede
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-slate-600">
            Carregando gráfico...
          </div>
        </div>
      </div>
    );
  }

  return children(isLibraryLoaded);
}