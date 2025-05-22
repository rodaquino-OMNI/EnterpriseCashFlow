import React, { useEffect, useState } from 'react';

/**
 * A wrapper component that checks for Recharts availability and provides proper error handling
 */
export function RechartsWrapper({ children, fallbackHeight = '350px' }) {
  const [isRechartsLoaded, setIsRechartsLoaded] = useState(false);
  const [isCheckComplete, setIsCheckComplete] = useState(false);

  useEffect(() => {
    // Check if Recharts is available
    const recharts = window.Recharts;
    setIsRechartsLoaded(!!recharts);
    setIsCheckComplete(true);
    
    if (!recharts) {
      console.error("Recharts library not found. Make sure it's loaded via CDN.");
    }
  }, []);

  if (!isCheckComplete) {
    return <div className="p-4 text-center" style={{ height: fallbackHeight }}>Carregando gráficos...</div>;
  }

  if (!isRechartsLoaded) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-700" style={{ height: fallbackHeight }}>
        Erro: Biblioteca de gráficos (Recharts) não carregada. Verifique o console.
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Get Recharts components from global scope with proper null checks
 */
export function useRecharts() {
  const R = window.Recharts || {};
  
  return {
    // Return all Recharts components safely
    LineChart: R.LineChart,
    Line: R.Line,
    BarChart: R.BarChart,
    Bar: R.Bar,
    PieChart: R.PieChart,
    Pie: R.Pie,
    Cell: R.Cell,
    XAxis: R.XAxis,
    YAxis: R.YAxis,
    CartesianGrid: R.CartesianGrid,
    Tooltip: R.Tooltip,
    Legend: R.Legend,
    ResponsiveContainer: R.ResponsiveContainer,
    Label: R.Label,
    LabelList: R.LabelList,
    ReferenceLine: R.ReferenceLine,
    // Add additional components as needed
  };
}