import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function MarginTrendChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Tendência das Margens Chave (%)
      </h4>
      
      <RechartsWrapper>
        <MarginTrendChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function MarginTrendChartContent({ calculatedData, periodType }) {
  // Get Recharts components safely
  const { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Label 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para exibir o gráfico de tendências de margens.</p>;
  }

  const chartData = calculatedData.map((period, index) => ({
    name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
    "Margem Bruta %": parseFloat(period.gmPct?.toFixed(2)) || 0,
    "Margem Oper. (EBIT) %": parseFloat(period.opProfitPct?.toFixed(2)) || 0,
    "Margem Líquida %": parseFloat(period.netProfitPct?.toFixed(2)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
        <XAxis dataKey="name" tick={{ fontSize: 12 }}>
          <Label value={`Períodos (${PERIOD_TYPES[periodType]?.label || periodType})`} offset={-15} position="insideBottom" style={{ fontSize: 12 }}/>
        </XAxis>
        <YAxis tickFormatter={(tick) => `${tick}%`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
          labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
          itemStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} />
        <Line
          type="monotone"
          dataKey="Margem Bruta %"
          stroke="#3b82f6"  // Tailwind blue-500
          strokeWidth={2}
          activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
          dot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
        />
        <Line
          type="monotone"
          dataKey="Margem Oper. (EBIT) %"
          stroke="#10b981" // Tailwind emerald-500
          strokeWidth={2}
          activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
          dot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
        />
        <Line
          type="monotone"
          dataKey="Margem Líquida %"
          stroke="#f59e0b" // Tailwind amber-500
          strokeWidth={2}
          activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
          dot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}