import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function PnlVisualChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Demonstrativo de Resultado Visual (Último Período: {calculatedData.length > 0 ? PERIOD_TYPES[periodType]?.shortLabel || 'Per.' : ''} {calculatedData.length > 0 ? calculatedData.length : ''})
      </h4>
      
      <RechartsWrapper>
        <PnlVisualChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function PnlVisualChartContent({ calculatedData, periodType }) {
  const { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    Legend, ResponsiveContainer, LabelList, Cell
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico P&L Visual.</p>;
  }

  // Using data from the latest period for this visual
  const latestPeriod = calculatedData[calculatedData.length - 1];

  const pnlData = [
    { name: 'Receita', value: latestPeriod.revenue, fill: '#3b82f6' }, // blue-500
    { name: 'CPV/CSV', value: -Math.abs(latestPeriod.cogs), fill: '#ef4444' }, // red-500 (negative)
    { name: 'Lucro Bruto', value: latestPeriod.grossProfit, fill: '#10b981', isSubtotal: true }, // emerald-500
    { name: 'Desp. Oper.', value: -Math.abs(latestPeriod.operatingExpenses), fill: '#f97316' }, // orange-500 (negative)
    { name: 'EBIT (Lucro Oper.)', value: latestPeriod.ebit, fill: '#8b5cf6', isSubtotal: true }, // violet-500
  ];

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={pnlData}
          layout="vertical" // More suitable for this kind of flow
          margin={{ top: 5, right: 30, left: 50, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis type="number" tickFormatter={(tick) => formatCurrency(tick, false)} tick={{ fontSize: 10 }}/>
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }}/>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Bar dataKey="value" barSize={30}>
            {pnlData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => formatCurrency(value, false)}
              style={{ fontSize: '10px', fill: '#333' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2 text-center">Nota: CPV/CSV e Desp. Oper. são mostrados como valores absolutos para o gráfico, mas representam reduções.</p>
    </>
  );
}