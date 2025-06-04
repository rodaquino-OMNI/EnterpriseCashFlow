import React from 'react';
import BaseChart from './BaseChart';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function CashFlowComponentsChart({ calculatedData, periodType }) {
  
  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }
    
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } = window.Recharts;

    if (!calculatedData || calculatedData.length === 0) {
      return <p className="text-center text-slate-500 py-4">Dados insuficientes.</p>;
    }

    const chartData = calculatedData.map((period, index) => ({
      name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
      "FCO": period.operatingCashFlow || 0,
      "Var. Cap. Giro": -(period.workingCapitalChange || 0), // Negative for cash use
      "CAPEX": -(period.capitalExpenditures || 0), // Negative for cash use
      "Fin. Líquido": period.cashFlowFromFinancing || 0,
      "Var. Caixa": period.netChangeInCash || 0
    }));

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Componentes do Fluxo de Caixa
        </h4>
        <div className="flex-grow w-full min-h-[300px] print:min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 25, left: 0, bottom: 60 }}>
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
                formatter={(value, name) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="FCO" fill="#10b981" />
              <Bar dataKey="Var. Cap. Giro" fill="#f59e0b" />
              <Bar dataKey="CAPEX" fill="#ef4444" />
              <Bar dataKey="Fin. Líquido" fill="#3b82f6" />
              <Bar dataKey="Var. Caixa" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <BaseChart libraryName="Recharts" chartTitle="Componentes Fluxo de Caixa">
      {renderChartContent}
    </BaseChart>
  );
}