import React from 'react';
import BaseChart from './BaseChart';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function BalanceSheetDifferenceTrendChart({ calculatedData, periodType }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes.</p>;
    }

    const chartData = calculatedData.map((period, index) => ({
      name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
      "Diferença BS": period.balanceSheetDifference || 0,
      "% dos Ativos": period.estimatedTotalAssets ? 
        ((period.balanceSheetDifference || 0) / period.estimatedTotalAssets) * 100 : 0
    }));

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Tendência Diferença Balanço Patrimonial
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
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(value, true)}>
                <Label angle={-90} value="R$" position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip 
                formatter={(value, name) => [
                  name === "% dos Ativos" ? `${value.toFixed(2)}%` : formatCurrency(value), 
                  name
                ]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="Diferença BS" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="Tendência Diferença Balanço">
      {renderChartContent}
    </BaseChart>
  );
}