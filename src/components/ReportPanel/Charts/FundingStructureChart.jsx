// src/components/ReportPanel/Charts/FundingStructureChart.jsx
import React from 'react';
import BaseChart from '../../Charts/BaseChart';
import { formatCurrency } from '../../../utils/formatters';

export default function FundingStructureChart({ calculatedData, periodIndex = 0 }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0 || !calculatedData[periodIndex]) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes para estrutura de financiamento.</p>;
    }

    const period = calculatedData[periodIndex];
    
    const fundingData = [
      { 
        name: 'Patrimônio Líquido', 
        value: Math.abs(period.equity || 0),
        color: '#10b981'
      },
      { 
        name: 'Empréstimos Bancários', 
        value: Math.abs(period.totalBankLoans || 0),
        color: '#ef4444'
      },
      { 
        name: 'Outras Obrigações', 
        value: Math.abs((period.totalLiabilities || 0) - (period.totalBankLoans || 0)),
        color: '#f59e0b'
      }
    ].filter(item => item.value > 0);

    if (fundingData.length === 0) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes para estrutura de financiamento.</p>;
    }

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Estrutura de Financiamento - Período {periodIndex + 1}
        </h4>
        <div className="flex-grow w-full min-h-[280px] print:min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fundingData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {fundingData.map((entry, index) => (
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
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="Estrutura de Financiamento">
      {renderChartContent}
    </BaseChart>
  );
}