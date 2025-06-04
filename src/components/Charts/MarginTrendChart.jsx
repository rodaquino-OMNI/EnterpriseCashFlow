import React from 'react';
import BaseChart from './BaseChart';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatPercentage } from '../../utils/formatters';

export default function MarginTrendChart({ calculatedData, periodType }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes.</p>;
    }

    const chartData = calculatedData.map((period, index) => ({
      name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
      "Margem Bruta %": parseFloat(period.gmPct?.toFixed(1)) || 0,
      "Margem Operacional %": parseFloat(period.opProfitPct?.toFixed(1)) || 0,
      "Margem Líquida %": parseFloat(period.netProfitPct?.toFixed(1)) || 0
    }));

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Evolução das Margens
        </h4>
        <div className="flex-grow w-full min-h-[280px] print:min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 25, left: 0, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }}>
                <Label angle={-90} value="%" position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip 
                formatter={(value, name) => [formatPercentage(value), name]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Margem Bruta %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Margem Operacional %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Margem Líquida %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="Evolução das Margens">
      {renderChartContent}
    </BaseChart>
  );
}