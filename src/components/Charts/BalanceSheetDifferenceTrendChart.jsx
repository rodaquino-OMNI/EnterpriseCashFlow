import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function BalanceSheetDifferenceTrendChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Tendência da Diferença de Balanço (Ativo - (Passivo+PL))
      </h4>
      
      <RechartsWrapper>
        <BalanceSheetDifferenceTrendChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function BalanceSheetDifferenceTrendChartContent({ calculatedData, periodType }) {
  const { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Label, ReferenceLine 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Diferença de Balanço.</p>;
  }

  const chartData = calculatedData.map((period, index) => ({
    name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
    "Diferença de Balanço": parseFloat(period.balanceSheetDifference?.toFixed(0)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
        <XAxis dataKey="name" tick={{ fontSize: 12 }}>
          <Label value={`Períodos (${PERIOD_TYPES[periodType]?.label || periodType})`} offset={-15} position="insideBottom" style={{ fontSize: 12 }}/>
        </XAxis>
        <YAxis tickFormatter={(tick) => formatCurrency(tick, false)} tick={{ fontSize: 12 }}/>
        <Tooltip
          formatter={(value) => [formatCurrency(value), "Diferença"]}
          labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
          itemStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        <Bar dataKey="Diferença de Balanço" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}