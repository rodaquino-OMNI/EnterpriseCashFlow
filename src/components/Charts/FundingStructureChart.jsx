import React from 'react';
import BaseChart from './BaseChart';
import { formatCurrency } from '../../utils/formatters';

export default function FundingStructureChart({ data, calculatedData, periodIndex = -1 }) {

  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }

    const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = window.Recharts;

    // Support both APIs: simple object from tests or array from legacy
    let pieData = [];

    if (data && !Array.isArray(data)) {
      // Test API: simple object with { debt, equity, retainedEarnings }
      const totalValue = (data.debt || 0) + (data.equity || 0) + (data.retainedEarnings || 0);

      if (totalValue === 0) {
        return <p className="text-center text-slate-500 py-4">Sem dados disponíveis</p>;
      }

      pieData = [
        { name: 'Dívida', value: data.debt || 0, color: '#ef4444' },
        { name: 'Capital Social', value: data.equity || 0, color: '#10b981' },
        { name: 'Lucros Retidos', value: data.retainedEarnings || 0, color: '#8b5cf6' },
      ].filter(item => item.value > 0);

    } else if (calculatedData || (Array.isArray(data) && data.length > 0)) {
      // Legacy API: array of periods
      const periods = calculatedData || data;

      if (!periods || periods.length === 0) {
        return <p className="text-center text-slate-500 py-4">Dados insuficientes.</p>;
      }

      const period = periodIndex === -1 ? periods[periods.length - 1] : periods[periodIndex];
      if (!period) {
        return <p className="text-center text-slate-500 py-4">Período não encontrado.</p>;
      }

      pieData = [
        { name: 'Fornecedores', value: period.accountsPayableValueAvg || 0, color: '#ef4444' },
        { name: 'Empréstimos Bancários', value: period.totalBankLoans || 0, color: '#f59e0b' },
        { name: 'Outros Passivos', value: Math.max(0, (period.estimatedTotalLiabilities || 0) - (period.accountsPayableValueAvg || 0) - (period.totalBankLoans || 0)), color: '#8b5cf6' },
        { name: 'Capital Próprio', value: period.equity || 0, color: '#10b981' },
      ].filter(item => item.value > 0);
    } else {
      return <p className="text-center text-slate-500 py-4">Sem dados disponíveis</p>;
    }

    const titleSuffix = (calculatedData && calculatedData.length > 0)
      ? ` - Período ${periodIndex === -1 ? calculatedData.length : periodIndex + 1}`
      : '';

    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Estrutura de Financiamento{titleSuffix}
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
                  fontSize: '12px',
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
    <BaseChart libraryName="Recharts" chartTitle="Estrutura de Financiamento">
      {renderChartContent}
    </BaseChart>
  );
}