import React from 'react';
import BaseChart from './BaseChart';
import { formatCurrency } from '../../utils/formatters';

export default function AssetCompositionChart({ calculatedData, periodIndex = -1 }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes.</p>;
    }

    const period = periodIndex === -1 ? calculatedData[calculatedData.length - 1] : calculatedData[periodIndex];
    if (!period) {
      return <p className="text-center text-slate-500 py-4">Período não encontrado.</p>;
    }

    const pieData = [
      { name: 'Caixa', value: period.closingCash || 0, color: '#10b981' },
      { name: 'Contas a Receber', value: period.accountsReceivableValueAvg || 0, color: '#3b82f6' },
      { name: 'Estoque', value: period.inventoryValueAvg || 0, color: '#f59e0b' },
      { name: 'Outros Circulantes', value: Math.max(0, (period.estimatedCurrentAssets || 0) - (period.closingCash || 0) - (period.accountsReceivableValueAvg || 0) - (period.inventoryValueAvg || 0)), color: '#8b5cf6' },
      { name: 'Ativo Fixo Líquido', value: period.netFixedAssets || 0, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Composição dos Ativos - Período {periodIndex === -1 ? calculatedData.length : periodIndex + 1}
        </h4>
        <div className="flex-grow w-full min-h-[300px] print:min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="Composição dos Ativos">
      {renderChartContent}
    </BaseChart>
  );
}