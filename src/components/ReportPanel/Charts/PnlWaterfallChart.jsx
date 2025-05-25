// src/components/ReportPanel/Charts/PnlWaterfallChart.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { PERIOD_TYPES } from '../../../utils/constants';
import { useRecharts } from '../../Charts/RechartsWrapper';

export default function PnlWaterfallChart({ calculatedData, periodType }) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
    LabelList
  } = useRecharts();
  
  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o Gráfico Waterfall de P&L.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Data for waterfall: values are the *changes* or components
  const pnlWaterfallSourceData = [
    { name: 'Receita', value: latestPeriod.revenue, type: 'positive', color: '#10b981' }, // Green
    { name: 'CPV/CSV', value: -latestPeriod.cogs, type: 'negative', color: '#ef4444' },     // Red
    { name: 'Lucro Bruto', isTotal: true, value: latestPeriod.grossProfit, color: '#3b82f6' }, // Blue
    { name: 'Desp. Oper.', value: -latestPeriod.operatingExpenses, type: 'negative', color: '#f97316' },// Orange-Red
    { name: 'EBITDA', isTotal: true, value: latestPeriod.ebitda, color: '#3b82f6' },
    { name: 'D&A', value: -latestPeriod.depreciationAndAmortisation, type: 'negative', color: '#f97316'},
    { name: 'EBIT (Lucro Oper.)', isTotal: true, value: latestPeriod.ebit, color: '#3b82f6' },
    { name: 'Fin.Líq+Extr.', value: (latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0), type: ((latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0)) >= 0 ? 'positive' : 'negative', color: ((latestPeriod.netInterestExpenseIncome || 0) + (latestPeriod.extraordinaryItems || 0)) >=0 ? '#10b981' : '#ef4444' },
    { name: 'LAIR (PBT)', isTotal: true, value: latestPeriod.pbt, color: '#3b82f6' },
    { name: 'Impostos', value: -latestPeriod.incomeTax, type: 'negative', color: '#ef4444' },
    { name: 'Lucro Líquido', isTotal: true, value: latestPeriod.netProfit, color: '#059669' } // Dark Green
  ];

  // Prepare data for stacked bar chart to simulate waterfall
  const waterfallChartData = [];
  let cumulative = 0;
  pnlWaterfallSourceData.forEach((item) => {
    if (item.isTotal) {
      waterfallChartData.push({
        name: item.name,
        displayValue: item.value, // This is the total value
        fill: item.color,
        // For totals, the 'base' is 0 and 'value' is the total height
        base: 0,
        value: item.value
      });
      cumulative = item.value; // Next flow starts from this new total
    } else {
      const valueChange = item.value; // This is the actual change (can be negative)
      const baseValue = cumulative;
      cumulative += valueChange;
      
      waterfallChartData.push({
        name: item.name,
        displayValue: valueChange, // The actual change for this item
        fill: item.color,
        base: valueChange >= 0 ? baseValue : cumulative, // Start of the bar
        value: Math.abs(valueChange) // Height of the bar (always positive)
      });
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // This is an item from waterfallChartData
      // Find original item to get more details if needed
      const originalItem = pnlWaterfallSourceData.find(d => d.name === label);
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-slate-700 mb-1">{label}</p>
          <p>Valor do Componente: <span className="font-bold">{formatCurrency(data.displayValue)}</span></p>
          {originalItem && originalItem.isTotal &&
            <p>Total Acumulado: <span className="font-bold">{formatCurrency(originalItem.value)}</span></p>
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
            domain={['auto', 'auto']} // Let Recharts determine domain
          />
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="base" stackId="a" fill="transparent" radius={[2,2,0,0]} /> {/* Invisible base */}
          <Bar dataKey="value" stackId="a" radius={[2,2,0,0]}>
            {waterfallChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="displayValue"
              position="top"
              formatter={(value) => Number(value) !== 0 ? formatCurrency(value, false) : ''}
              style={{ fontSize: '8px', fill: '#444' }}
              angle={-45}
              dy={-5}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-500 mt-1 text-center print:text-[8px]">
        Gráfico Waterfall: Verde/Azul = Adições/Totais, Laranja/Vermelho = Reduções.
      </div>
    </div>
  );
}