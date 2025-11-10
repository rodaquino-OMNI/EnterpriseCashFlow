import React from 'react';
import BaseChart from './BaseChart';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatPercentage } from '../../utils/formatters';

export default function MarginTrendChart({ data, calculatedData, periodType = 'monthly' }) {
  // Support both APIs (data from tests, calculatedData from legacy)
  const periods = data || calculatedData;

  const renderChartContent = (isRechartsLoaded) => {
    if (!isRechartsLoaded || typeof window.Recharts === 'undefined') {
      return <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">Aguardando biblioteca de gráficos...</div>;
    }

    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    if (!periods || periods.length === 0) {
      return <p className="text-center text-slate-500 py-4">Sem dados disponíveis</p>;
    }

    const chartData = periods.map((period, index) => {
      // Support both data structures
      const income = period.incomeStatement || period;
      const revenue = income.revenue || 0;
      const grossProfit = income.grossProfit || 0;
      const ebitda = income.ebitda || 0;
      const netIncome = income.netIncome || 0;

      return {
        name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
        grossMargin: revenue > 0 ? parseFloat(((grossProfit / revenue) * 100).toFixed(1)) : 0,
        ebitdaMargin: revenue > 0 ? parseFloat(((ebitda / revenue) * 100).toFixed(1)) : 0,
        netMargin: revenue > 0 ? parseFloat(((netIncome / revenue) * 100).toFixed(1)) : 0,
      };
    });

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
              <YAxis tick={{ fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value, name) => [formatPercentage(value), name]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="grossMargin" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Margem Bruta %" />
              <Line type="monotone" dataKey="ebitdaMargin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Margem EBITDA %" />
              <Line type="monotone" dataKey="netMargin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Margem Líquida %" />
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