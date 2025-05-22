import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function AssetCompositionChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Composição do Ativo
        {calculatedData.length > 0 ? ` (Último Período: ${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${calculatedData.length})` : ''}
      </h4>
      
      <RechartsWrapper>
        <AssetCompositionChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function AssetCompositionChartContent({ calculatedData, periodType }) {
  const { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Composição do Ativo.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const data = [
    { name: 'Caixa', value: Math.max(0, latestPeriod.closingCash || 0) }, // Ensure positive for pie chart
    { name: 'Contas a Receber (Médio)', value: Math.max(0, latestPeriod.accountsReceivableValueAvg || 0) },
    { name: 'Estoques (Valor)', value: Math.max(0, latestPeriod.inventoryValue || 0) },
    { name: 'Ativo Imobilizado Líquido', value: Math.max(0, latestPeriod.netFixedAssets || 0) },
  ].filter(item => item.value > 0); // Filter out zero values for cleaner pie

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']; // blue, emerald, amber, indigo

  return (
    <>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(120, window.innerWidth / 4 - 60)} // Adjust outerRadius
              fill="#8884d8"
              dataKey="value"
              paddingAngle={1}
              minAngle={1}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-slate-500 flex items-center justify-center h-full">Sem dados de ativos para exibir.</p>
      )}
    </>
  );
}