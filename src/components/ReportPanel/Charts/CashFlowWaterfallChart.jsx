// src/components/ReportPanel/Charts/CashFlowWaterfallChart.jsx
import React from 'react';
import BaseChart from '../../Charts/BaseChart';
import { formatCurrency } from '../../../utils/formatters';

export default function CashFlowWaterfallChart({ calculatedData, periodIndex = 0 }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0 || !calculatedData[periodIndex]) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes para Cashflow Waterfall.</p>;
    }

    const period = calculatedData[periodIndex];
    const previousPeriod = periodIndex > 0 ? calculatedData[periodIndex - 1] : null;
    
    const waterfallData = [
      { 
        name: 'Caixa Inicial', 
        value: previousPeriod?.closingCash || period.openingCash || 0, 
        cumulative: previousPeriod?.closingCash || period.openingCash || 0, 
        type: 'start' 
      },
      { 
        name: 'FCO', 
        value: period.operatingCashFlow || 0, 
        cumulative: (previousPeriod?.closingCash || period.openingCash || 0) + (period.operatingCashFlow || 0), 
        type: period.operatingCashFlow >= 0 ? 'positive' : 'negative' 
      },
      { 
        name: 'CAPEX', 
        value: -(period.capitalExpenditures || 0), 
        cumulative: (previousPeriod?.closingCash || period.openingCash || 0) + (period.operatingCashFlow || 0) - (period.capitalExpenditures || 0), 
        type: 'negative' 
      },
      { 
        name: 'Fin. Líquido', 
        value: period.cashFlowFromFinancing || 0, 
        cumulative: (previousPeriod?.closingCash || period.openingCash || 0) + (period.operatingCashFlow || 0) - (period.capitalExpenditures || 0) + (period.cashFlowFromFinancing || 0), 
        type: period.cashFlowFromFinancing >= 0 ? 'positive' : 'negative' 
      },
      { 
        name: 'Caixa Final', 
        value: 0, 
        cumulative: period.closingCash || 0, 
        type: 'final' 
      }
    ];

    const getBarColor = (type) => {
      switch (type) {
        case 'start': return '#64748b';
        case 'positive': return '#10b981';
        case 'negative': return '#ef4444';
        case 'final': return '#8b5cf6';
        default: return '#6b7280';
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Cascata Fluxo de Caixa - Período {periodIndex + 1}
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
                  fontSize: '12px'
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
    <BaseChart libraryName="Recharts" chartTitle="Cashflow Waterfall">
      {renderChartContent}
    </BaseChart>
  );
}