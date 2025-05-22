import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function CashFlowComponentsChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Principais Componentes do Fluxo de Caixa
        {calculatedData.length > 0 ? ` (Último Período: ${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${calculatedData.length})` : ''}
      </h4>
      
      <RechartsWrapper>
        <CashFlowComponentsChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function CashFlowComponentsChartContent({ calculatedData, periodType }) {
  const { 
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ReferenceLine, ResponsiveContainer, LabelList 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Componentes do Fluxo de Caixa.</p>;
  }

  // Using data from the latest period for this visual
  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Data for a stacked/grouped bar chart.
  // Positive values are inflows, negative are outflows.
  const chartData = [
    { name: 'FCO', value: latestPeriod.operatingCashFlow, fill: '#22c55e' }, // green-500
    { name: 'Invest. CG', value: -latestPeriod.workingCapitalChange, fill: '#f97316' }, // orange-500 (negative if investment)
    { name: 'CAPEX', value: -latestPeriod.capitalExpenditures, fill: '#ef4444' }, // red-500
    { name: 'Financiamentos', value: latestPeriod.cashFlowFromFinancing, fill: '#3b82f6' }, // blue-500
    { name: 'Var. Líq. Caixa', value: latestPeriod.netChangeInCash, fill: '#6b7280', isTotal: true }, // gray-500
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
        <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
        <YAxis tickFormatter={(tick) => formatCurrency(tick, false)} tick={{ fontSize: 10 }}/>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        <Bar dataKey="value">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(value) => formatCurrency(value, false)}
            style={{ fontSize: '10px', fill: '#333' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}