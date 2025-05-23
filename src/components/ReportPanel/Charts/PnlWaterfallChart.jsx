// src/components/ReportPanel/Charts/PnlWaterfallChart.jsx
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
export default function PnlWaterfallChart({ calculatedData, periodType }) {
  if (typeof window.Recharts === 'undefined') {
    return <div className="p-4 border rounded-md bg-red-50 text-red-700">Erro: Biblioteca de gráficos (Recharts) não carregada.</div>;
  }
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } = window.Recharts;

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o Gráfico Waterfall de P&L.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Data for waterfall: [previous_cumulative, current_value]
  // The bar shows the current_value, starting from previous_cumulative.
  let cumulative = 0;
  const pnlData = [
    { name: 'Receita', value: latestPeriod.revenue, fill: '#10b981', base: 0, currentCumulative: cumulative += latestPeriod.revenue }, // Green - Inflow
    { name: 'CPV/CSV (-)', value: latestPeriod.cogs, fill: '#ef4444', base: cumulative, currentCumulative: cumulative -= latestPeriod.cogs },     // Red - Outflow
    { name: 'Lucro Bruto', value: latestPeriod.grossProfit, fill: '#3b82f6', isTotal: true, base:0, currentCumulative: latestPeriod.grossProfit }, // Blue - Subtotal
    { name: 'Desp. Oper. (-)', value: latestPeriod.operatingExpenses, fill: '#ef4444', base: cumulative, currentCumulative: cumulative -= latestPeriod.operatingExpenses },// Red
    { name: 'EBITDA', value: latestPeriod.ebitda, fill: '#3b82f6', isTotal: true, base:0, currentCumulative: latestPeriod.ebitda }, // Blue
    { name: 'D&A (-)', value: latestPeriod.depreciationAndAmortisation, fill: '#ef4444', base: cumulative, currentCumulative: cumulative -= latestPeriod.depreciationAndAmortisation }, // Red
    { name: 'EBIT', value: latestPeriod.ebit, fill: '#3b82f6', isTotal: true, base:0, currentCumulative: latestPeriod.ebit }, // Blue
    { name: 'Fin/Extr. (+/-)', value: (latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0), fill: ((latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0)) >=0 ? '#10b981' : '#ef4444', base: cumulative, currentCumulative: cumulative += ((latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0))},
    { name: 'LAIR (PBT)', value: latestPeriod.pbt, fill: '#3b82f6', isTotal: true, base:0, currentCumulative: latestPeriod.pbt }, // Blue
    { name: 'Impostos (-)', value: latestPeriod.incomeTax, fill: '#ef4444', base: cumulative, currentCumulative: cumulative -= latestPeriod.incomeTax }, // Red
    { name: 'Lucro Líquido', value: latestPeriod.netProfit, fill: '#059669', isTotal: true, base:0, currentCumulative: latestPeriod.netProfit }, // Dark Green - Final Total
  ];

  // Prepare data for stacked bar chart to simulate waterfall
  // Each bar will have an 'invisible' base and a 'visible' value segment.
  const waterfallChartData = [];
  let runningTotal = 0;
  pnlData.forEach((item, index) => {
    if (item.isTotal) { // For total bars, they start from 0
      waterfallChartData.push({
        name: item.name,
        value: item.value,
        base: 0,
        fill: item.fill,
        labelValue: item.value // Value to display on label
      });
      runningTotal = item.value; // Reset running total for next segment after a total
    } else { // For incremental bars (positive or negative)
      const barStart = runningTotal;
      const barValue = item.value; // This is the actual change (can be negative)
      runningTotal += barValue;

      waterfallChartData.push({
        name: item.name,
        value: Math.abs(barValue), // Bar height is always positive
        base: barValue >= 0 ? barStart : runningTotal, // Base for positive vs negative
        fill: item.fill,
        labelValue: barValue // Value to display on label (with sign)
      });
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // original pnlData item might be better here if complex
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-slate-700 mb-1">{data.name}</p>
          <p>Valor do Componente: <span className="font-bold">{formatCurrency(data.labelValue)}</span></p>
          {/* For a true waterfall, you'd show cumulative value from original data */}
          {pnlData.find(d=>d.name === data.name) &&
            <p>Valor Acumulado: <span className="font-bold">{formatCurrency(pnlData.find(d=>d.name === data.name).currentCumulative)}</span></p>
          }
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[400px] md:h-[450px] w-full print:p-2 print:h-[300px]">
      <h4 className="text-md font-semibold text-slate-700 mb-2 text-center print:text-sm">
        P&L Waterfall (Último Período: {PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} {calculatedData.length})
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={waterfallChartData}
          margin={{ top: 10, right: 5, left: 5, bottom: 110 }} // Increased bottom margin for angled labels
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            angle={-60} // Angle labels for better fit
            textAnchor="end"
            interval={0} // Show all labels
            tick={{ fontSize: 9 }}
            height={100} // Allocate space for angled labels
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, false)}
            tick={{ fontSize: 10 }}
            width={70} // Adjust width for Y-axis labels
          />
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="base" stackId="a" fill="transparent" radius={[2, 2, 0, 0]} /> {/* Invisible base */}
          <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}>
            {waterfallChartData.map((entry, index) => (
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
        Gráfico Waterfall simulado: Barras representam contribuições para o Lucro Líquido.
      </div>
    </div>
  );
}