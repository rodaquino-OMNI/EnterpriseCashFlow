import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function WorkingCapitalDaysTrendChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Tendência dos Prazos de Capital de Giro (Dias)
      </h4>
      
      <RechartsWrapper>
        <WorkingCapitalDaysTrendChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function WorkingCapitalDaysTrendChartContent({ calculatedData, periodType }) {
  const { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Label 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Prazos de Capital de Giro.</p>;
  }

  const chartData = calculatedData.map((period, index) => ({
    name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
    "PMR (Dias)": parseFloat(period.arDaysDerived?.toFixed(1)) || 0,
    "PME (Dias)": parseFloat(period.inventoryDaysInput?.toFixed(1)) || 0,
    "PMP (Dias)": parseFloat(period.apDaysDerived?.toFixed(1)) || 0,
    "Ciclo Caixa (Dias)": parseFloat(period.wcDays?.toFixed(1)) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0"/>
        <XAxis dataKey="name" tick={{ fontSize: 12 }}>
          <Label value={`Períodos (${PERIOD_TYPES[periodType]?.label || periodType})`} offset={-15} position="insideBottom" style={{ fontSize: 12 }}/>
        </XAxis>
        <YAxis tickFormatter={(tick) => `${tick}`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [`${Number(value).toFixed(1)} dias`, name]}
          labelStyle={{ fontSize: 13, fontWeight: 'bold' }}
          itemStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
        <Line type="monotone" dataKey="PMR (Dias)" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 4 }}/>
        <Line type="monotone" dataKey="PME (Dias)" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 4 }}/>
        <Line type="monotone" dataKey="PMP (Dias)" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 4 }}/>
        <Line type="monotone" dataKey="Ciclo Caixa (Dias)" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 4 }}/>
      </LineChart>
    </ResponsiveContainer>
  );
}