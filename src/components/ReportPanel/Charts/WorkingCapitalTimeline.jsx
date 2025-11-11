// src/components/ReportPanel/Charts/WorkingCapitalTimeline.jsx
import React from 'react';
import { PERIOD_TYPES } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/formatters';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Label, 
  ReferenceLine, 
} from 'recharts';

export default function WorkingCapitalTimeline({ calculatedData, periodType }) {
  
  // Debug: Log the data being passed
  console.log('WorkingCapitalTimeline - calculatedData:', calculatedData);
  console.log('WorkingCapitalTimeline - periodType:', periodType);
  
  if (!calculatedData || calculatedData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
        <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
          Timeline Capital de Giro
        </h4>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <p className="text-center py-4">Dados insuficientes para Timeline Capital de Giro.</p>
        </div>
      </div>
    );
  }

  const chartData = calculatedData.map((period, index) => {
    // Use *Avg values if available, otherwise fall back to calculated values
    const arValue = period.accountsReceivableValueAvg !== undefined
      ? period.accountsReceivableValueAvg
      : period.accountsReceivableValue || 0;
    const invValue = period.inventoryValueAvg !== undefined
      ? period.inventoryValueAvg
      : period.inventoryValue || 0;
    const apValue = period.accountsPayableValueAvg !== undefined
      ? period.accountsPayableValueAvg
      : period.accountsPayableValue || 0;

    const dataPoint = {
      name: `${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${index + 1}`,
      'Cap. Giro': period.workingCapitalValue || 0,
      'Var. Cap. Giro': period.workingCapitalChange || 0,
      'A Receber': arValue,
      'Estoque': invValue,
      'A Pagar': -apValue, // Negative to show as cash source
    };
    console.log(`Period ${index + 1} data:`, dataPoint);
    return dataPoint;
  });

  console.log('WorkingCapitalTimeline - chartData:', chartData);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 print:shadow-none print:border-slate-300 h-full flex flex-col">
      <h4 className="text-md font-semibold text-slate-800 mb-3 text-center print:text-sm">
        Timeline Capital de Giro
      </h4>
      <div className="flex-grow w-full min-h-[280px] print:min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 25, left: 0, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }} 
              interval={0} 
              angle={-45} 
              textAnchor="end" 
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(value, true)}>
              <Label angle={-90} value="R$" position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Período: ${label}`}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
            <Line type="monotone" dataKey="Cap. Giro" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Var. Cap. Giro" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="A Receber" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Estoque" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="A Pagar" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}