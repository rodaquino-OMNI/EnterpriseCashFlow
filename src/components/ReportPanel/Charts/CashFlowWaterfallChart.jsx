// src/components/ReportPanel/Charts/CashFlowWaterfallChart.jsx
import React from 'react';
// Ensure Recharts is loaded globally: const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } = window.Recharts;
import { formatCurrency } from '../../../utils/formatters';
import { PERIOD_TYPES } from '../../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../../types/financial').CalculatedPeriodData[];
 * periodType: import('../../../types/financial').PeriodTypeOption;
 * }} props
 */
export default function CashFlowWaterfallChart({ calculatedData, periodType }) {
  if (typeof window.Recharts === 'undefined') {
    return <div className="p-4 border rounded-md bg-red-50 text-red-700">Erro: Biblioteca de gráficos (Recharts) não carregada.</div>;
  }
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } = window.Recharts;

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o Gráfico Waterfall de Fluxo de Caixa.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Data for waterfall, values are the *changes* or flows
  let cumulativeCash = latestPeriod.openingCash;
  const cashFlowWaterfallData = [
    { name: 'Caixa Inicial', value: latestPeriod.openingCash, fill: '#6b7280', base: 0, labelValue: latestPeriod.openingCash, isTotal: true}, // Gray - Starting Point

    { name: 'FCO', value: latestPeriod.operatingCashFlow, fill: latestPeriod.operatingCashFlow >= 0 ? '#10b981' : '#ef4444', base: cumulativeCash, labelValue: latestPeriod.operatingCashFlow},
    { name: 'FCO Acum.', value: cumulativeCash += latestPeriod.operatingCashFlow, fill: '#8b5cf6', isTotal: true, base: 0, labelValue: cumulativeCash }, // Violet - Subtotal

    { name: 'Invest. CG (-)', value: -latestPeriod.workingCapitalChange, fill: -latestPeriod.workingCapitalChange >= 0 ? '#10b981' : '#ef4444', base: cumulativeCash, labelValue: -latestPeriod.workingCapitalChange},
    { name: 'Caixa Op. Após CG', value: cumulativeCash -= latestPeriod.workingCapitalChange, fill: '#8b5cf6', isTotal: true, base: 0, labelValue: cumulativeCash },

    { name: 'CAPEX (-)', value: -latestPeriod.capitalExpenditures, fill: '#ef4444', base: cumulativeCash, labelValue: -latestPeriod.capitalExpenditures},
    { name: 'FCL Antes Fin.', value: cumulativeCash -= latestPeriod.capitalExpenditures, fill: '#3b82f6', isTotal: true, base: 0, labelValue: cumulativeCash }, // Blue - Subtotal

    { name: 'Financ.(+/-)', value: latestPeriod.cashFlowFromFinancing, fill: latestPeriod.cashFlowFromFinancing >= 0 ? '#10b981' : '#ef4444', base: cumulativeCash, labelValue: latestPeriod.cashFlowFromFinancing},
    { name: 'Caixa Final', value: cumulativeCash += latestPeriod.cashFlowFromFinancing, fill: '#059669', isTotal: true, base: 0, labelValue: cumulativeCash }, // Dark Green - Ending Total
  ];

  // Prepare data for stacked bar chart to simulate waterfall
  const chartData = [];
  let runningTotal = 0;
  cashFlowWaterfallData.forEach((item) => {
    if (item.isTotal) {
      chartData.push({ name: item.name, value: item.value, base: 0, fill: item.fill, labelValue: item.labelValue });
      runningTotal = item.value;
    } else {
      const barStart = runningTotal;
      const barValue = item.labelValue; // Use labelValue which has the correct sign for the flow
      runningTotal += barValue;
      chartData.push({ name: item.name, value: Math.abs(barValue), base: barValue >= 0 ? barStart : runningTotal, fill: item.fill, labelValue: barValue });
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // This is an item from chartData
      const originalItem = cashFlowWaterfallData.find(d => d.name === data.name);
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-slate-700 mb-1">{data.name}</p>
          <p>Movimento no Período: <span className="font-bold">{formatCurrency(data.labelValue)}</span></p>
          {originalItem && !originalItem.isTotal && typeof originalItem.base !== 'undefined' &&
            <p>Saldo Anterior Acumulado: <span className="font-bold">{formatCurrency(originalItem.base)}</span></p>
          }
          {originalItem && typeof originalItem.value !== 'undefined' && originalItem.isTotal &&
            <p>Saldo Acumulado Final: <span className="font-bold">{formatCurrency(originalItem.value)}</span></p>
          }
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[400px] md:h-[450px] w-full print:p-2 print:h-[300px]">
      <h4 className="text-md font-semibold text-slate-700 mb-2 text-center print:text-sm">
        Fluxo de Caixa Waterfall (Último Período: {PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} {calculatedData.length})
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 5, left: 5, bottom: 110 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            angle={-60}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 9 }}
            height={100}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, false)}
            tick={{ fontSize: 10 }}
            width={70}
          />
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="base" stackId="a" fill="transparent" radius={[2,2,0,0]}/> {/* Invisible base */}
          <Bar dataKey="value" stackId="a" radius={[2,2,0,0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="labelValue"
              position="top"
              formatter={(value) => value !== 0 ? formatCurrency(value, false) : ''}
              style={{ fontSize: '8px', fill: '#444' }}
              angle={-45}
              dy={-5}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 mt-1 text-center print:text-[8px]">
        Gráfico Waterfall simulado: Barras representam fluxos e saldos de caixa.
      </div>
    </div>
  );
}