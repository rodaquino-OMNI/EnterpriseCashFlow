// src/components/Charts/BaseChart.jsx
import React, { useState, useEffect, useCallback } from 'react';
import * as Recharts from 'recharts';

/**
 * Enhanced chart wrapper with dual API support for backward compatibility.
 * Supports both function children (legacy) and ReactNode children (test-friendly).
 * @param {{
 * children: React.ReactNode | ((isLoaded: boolean) => React.ReactNode);
 * libraryName?: string;
 * chartTitle?: string;
 * title?: string;
 * subtitle?: string;
 * className?: string;
 * height?: number;
 * loading?: boolean;
 * error?: string;
 * empty?: boolean;
 * }} props
 */
export default function BaseChart({
  children,
  libraryName = "Recharts",
  chartTitle,
  title,
  subtitle,
  className = '',
  height = 400,
  loading = false,
  error = null,
  empty = false
}) {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const displayTitle = title || chartTitle || "Chart";

  // Memoize library check
  const checkLibraryAvailability = useCallback(() => {
    if (Recharts && typeof Recharts === 'object' && Object.keys(Recharts).length > 0) {
      if (typeof window !== 'undefined') {
        window.Recharts = Recharts;
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (checkLibraryAvailability()) {
      setIsLibraryLoaded(true);
      return;
    }

    if (!isLibraryLoaded && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        if (checkLibraryAvailability()) {
          setIsLibraryLoaded(true);
        } else {
          setRetryCount(prev => prev + 1);
        }
      }, 50 + (retryCount * 50));

      return () => clearTimeout(timeout);
    }
  }, [isLibraryLoaded, retryCount, maxRetries, checkLibraryAvailability]);

  useEffect(() => {
    const forceCheck = () => {
      if (checkLibraryAvailability()) {
        setIsLibraryLoaded(true);
      }
    };

    forceCheck();
    const fallbackTimeout = setTimeout(forceCheck, 100);
    return () => clearTimeout(fallbackTimeout);
  }, [checkLibraryAvailability]);

  // Render wrapper with title, subtitle, and states
  const renderContent = (content) => {
    return (
      <div className={`bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 print:break-inside-avoid ${className}`} style={{ minHeight: height }}>
        <div className="mb-3">
          <h4 className="text-md font-semibold text-slate-800 text-center print:text-sm">
            {displayTitle}
          </h4>
          {subtitle && (
            <p className="text-sm text-slate-600 text-center mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-grow" style={{ height: height - 60 }}>
          {content}
        </div>
      </div>
    );
  };

  // Handle loading state
  if (loading) {
    return renderContent(
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-slate-600">Carregando...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return renderContent(
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="text-slate-400 mb-2">⚠️</div>
          <div className="text-sm text-slate-600">{error}</div>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (empty) {
    return renderContent(
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="text-sm text-slate-500">Sem dados disponíveis</div>
        </div>
      </div>
    );
  }

  // Handle library loading
  if (!isLibraryLoaded) {
    if (retryCount >= maxRetries) {
      return renderContent(
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <div className="text-slate-400 mb-2">⚠️</div>
            <div className="text-sm text-slate-600">
              Biblioteca de gráficos não disponível
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Verifique a conexão de rede
            </div>
          </div>
        </div>
      );
    }

    return renderContent(
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-slate-600">Carregando gráfico...</div>
        </div>
      </div>
    );
  }

  // Support both function children (legacy) and ReactNode children (test-friendly)
  if (typeof children === 'function') {
    return children(isLibraryLoaded);
  }

  // For ReactNode children, wrap in ResponsiveContainer for consistency
  const { ResponsiveContainer } = window.Recharts || {};

  if (ResponsiveContainer) {
    return renderContent(
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    );
  }

  return renderContent(children);
}