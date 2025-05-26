// src/components/Charts/WorkingCapitalDaysTrendChart.jsx
import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatDays } from '../../utils/formatters';

export default function WorkingCapitalDaysTrendChart({ calculatedData, periodType }) {
  if (typeof window.Recharts === 'undefined') { 
    return <div className="p-4 border rounded-md bg-red-50 text-red-700">Erro: Biblioteca de gráficos (Recharts) não carregada.</div>;
  }
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } = window.Recharts;

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Prazos de Capital de Giro.</p>;
  }

  const chartData = calculatedData.map((period, index) => ({
    name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
    "PMR (Dias)": parseFloat(period.arDays?.toFixed(1)) || 0,       // Uses period.arDays (aliased to arDaysDerived)
    "PME (Dias)": parseFloat(period.invDays?.toFixed(1)) || 0,      // Uses period.invDays (aliased to inventoryDaysDerived)
    "PMP (Dias)": parseFloat(period.apDays?.toFixed(1)) || 0,       // Uses period.apDays (aliased to apDaysDerived)
    "Ciclo Caixa (Dias)": parseFloat(period.wcDays?.toFixed(1)) || 0 // Uses period.wcDays
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300">
      <h4 className="text-lg font-semibold text-slate-800 mb-4 text-center print:text-base">
        Tendência dos Prazos de Capital de Giro (Dias) - SSOT
      </h4>
      <div className="w-full h-[300px] md:h-[350px] print:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 25, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} className="print:text-[7pt]">
              <Label value={`Períodos (${PERIOD_TYPES[periodType]?.label || periodType})`} offset={-20} position="insideBottom" style={{ fontSize: 10, fill: '#475569' }} className="print:text-[7pt]"/>
            </XAxis>
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} className="print:text-[7pt]" tickFormatter={(value) => `${value}`}/>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '12px', boxShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}
              formatter={(value, name) => [`${Number(value).toFixed(1)} dias`, name]}
              labelStyle={{ fontSize: 12, fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ fontSize: 11 }}
            />
            <Legend wrapperStyle={{fontSize: "11px", paddingTop: "10px"}} iconSize={10} />
            <Line type="monotone" dataKey="PMR (Dias)" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3 }} name="PMR (Recebimento)" />
            <Line type="monotone" dataKey="PME (Dias)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3 }} name="PME (Estoque)" />
            <Line type="monotone" dataKey="PMP (Dias)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 5 }} dot={{ r: 3 }} name="PMP (Pagamento)" />
            <Line type="monotone" dataKey="Ciclo Caixa (Dias)" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} name="Ciclo de Caixa" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}