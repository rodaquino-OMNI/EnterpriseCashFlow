// src/components/ReportPanel/Charts/CashFlowWaterfallChart.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { PERIOD_TYPES } from '../../../utils/constants';
import { useRecharts } from '../../Charts/RechartsWrapper';

export default function CashFlowWaterfallChart({ calculatedData, periodType }) {
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
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o Gráfico Waterfall de Fluxo de Caixa.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Values are the *flows* or changes.
  // isTotal flags bars that represent a cumulative balance.
  const cashFlowSourceData = [
    { name: 'Caixa Inicial', value: latestPeriod.openingCash, color: '#6b7280', isTotal: true }, // Gray
    { name: 'FCO', value: latestPeriod.operatingCashFlow, color: latestPeriod.operatingCashFlow >= 0 ? '#10b981' : '#ef4444' },
    { name: 'Invest. CG', value: -latestPeriod.workingCapitalChange, color: -latestPeriod.workingCapitalChange >= 0 ? '#10b981' : '#ef4444', note:"Uso de caixa se positivo"}, // Invert sign for chart logic if WCChange means investment
    { name: 'CAPEX', value: -latestPeriod.capitalExpenditures, color: '#ef4444' }, // Always negative
    { name: 'FCL (antes Fin.)', value: latestPeriod.netCashFlowBeforeFinancing, color: '#3b82f6', isTotal: true }, // Blue
    { name: 'Financiamentos', value: latestPeriod.cashFlowFromFinancing, color: latestPeriod.cashFlowFromFinancing >= 0 ? '#10b981' : '#ef4444' },
    { name: 'Caixa Final', value: latestPeriod.closingCash, color: '#059669', isTotal: true } // Dark Green
  ];

  const waterfallChartData = [];
  let cumulative = 0;
  cashFlowSourceData.forEach((item) => {
    if (item.isTotal) {
      waterfallChartData.push({ name: item.name, value: item.value, base: 0, fill: item.color, displayValue: item.value });
      cumulative = item.value;
    } else {
      const barStart = cumulative;
      const barValue = item.value;
      cumulative += barValue;
      waterfallChartData.push({ name: item.name, value: Math.abs(barValue), base: barValue >= 0 ? barStart : cumulative, fill: item.color, displayValue: barValue });
    }
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // item from waterfallChartData
      const originalItem = cashFlowSourceData.find(d => d.name === data.name);
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-slate-700 mb-1">{label}</p>
          <p>Movimento/Valor: <span className="font-bold">{formatCurrency(data.displayValue)}</span></p>
          {originalItem && originalItem.isTotal &&
            <p>Saldo Acumulado: <span className="font-bold">{formatCurrency(originalItem.value)}</span></p>
          }
          {originalItem && originalItem.note &&
            <p className="text-slate-500 text-[10px] italic mt-1">({originalItem.note})</p>
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
            domain={['auto', 'auto']}
          />
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" radius={[2,2,0,0]}/>
          <Bar dataKey="value" stackId="waterfall" radius={[2,2,0,0]}>
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
        Gráfico Waterfall: Verde = Entradas/Positivo, Vermelho = Saídas/Negativo, Azul/Cinza/Verde Escuro = Saldos.
      </div>
    </div>
  );
}