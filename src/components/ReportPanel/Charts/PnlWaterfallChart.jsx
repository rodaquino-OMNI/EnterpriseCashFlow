// src/components/ReportPanel/Charts/PnlWaterfallChart.jsx
import React from 'react';
import BaseChart from '../../Charts/BaseChart';
import { formatCurrency } from '../../../utils/formatters';

export default function PnlWaterfallChart({ calculatedData, periodIndex = 0 }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0 || !calculatedData[periodIndex]) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes para P&L Waterfall.</p>;
    }

    const period = calculatedData[periodIndex];
    
    const waterfallData = [
      { name: 'Receita', value: period.revenue || 0, cumulative: period.revenue || 0, type: 'start' },
      { name: 'CPV', value: -(period.cogs || 0), cumulative: (period.revenue || 0) - (period.cogs || 0), type: 'negative' },
      { name: 'Desp. Oper.', value: -(period.operatingExpenses || 0), cumulative: (period.grossProfit || 0) - (period.operatingExpenses || 0), type: 'negative' },
      { name: 'D&A', value: -(period.depreciationAndAmortisation || 0), cumulative: (period.ebitda || 0) - (period.depreciationAndAmortisation || 0), type: 'negative' },
      { name: 'Res. Fin.', value: period.netInterestExpenseIncome || 0, cumulative: (period.ebit || 0) + (period.netInterestExpenseIncome || 0), type: period.netInterestExpenseIncome >= 0 ? 'positive' : 'negative' },
      { name: 'IR', value: -(period.incomeTax || 0), cumulative: (period.pbt || 0) - (period.incomeTax || 0), type: 'negative' },
      { name: 'Lucro Líq.', value: 0, cumulative: period.netProfit || 0, type: 'final' },
    ];

    const getBarColor = (type) => {
      switch (type) {
        case 'start': return '#10b981';
        case 'positive': return '#22c55e';
        case 'negative': return '#ef4444';
        case 'final': return '#8b5cf6';
        default: return '#6b7280';
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Cascata P&L - Período {periodIndex + 1}
        </h4>
        <div className="flex-grow w-full min-h-[300px] print:min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Valor']}
                labelFormatter={(label) => `Item: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="cumulative">
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="P&L Waterfall">
      {renderChartContent}
    </BaseChart>
  );
}