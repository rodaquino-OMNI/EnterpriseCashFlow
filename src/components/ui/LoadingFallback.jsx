/**
 * Loading Fallback Component
 * Provides consistent loading states for lazy-loaded components
 */

import React from 'react';

export function ChartLoadingFallback() {
  return (
    <div className="chart-loading-fallback" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e9ecef',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ color: '#6c757d', margin: 0 }}>Carregando gráfico...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function ComponentLoadingFallback({ message = 'Carregando...' }) {
  return (
    <div className="component-loading-fallback" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e9ecef',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ color: '#6c757d', margin: 0 }}>{message}</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="page-loading-fallback" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e9ecef',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <h3 style={{ color: '#495057', margin: '0 0 8px' }}>Carregando...</h3>
        <p style={{ color: '#6c757d', margin: 0 }}>Preparando conteúdo</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ComponentLoadingFallback;
