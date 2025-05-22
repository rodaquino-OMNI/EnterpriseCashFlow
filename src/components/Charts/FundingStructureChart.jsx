import React from 'react';
import { PERIOD_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { RechartsWrapper, useRecharts } from './RechartsWrapper';

export default function FundingStructureChart({ calculatedData, periodType }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200 h-[350px] md:h-[400px] w-full">
      <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">
        Estrutura de Financiamento
        {calculatedData.length > 0 ? ` (Último Período: ${PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} ${calculatedData.length})` : ''}
      </h4>
      
      <RechartsWrapper>
        <FundingStructureChartContent calculatedData={calculatedData} periodType={periodType} />
      </RechartsWrapper>
    </div>
  );
}

function FundingStructureChartContent({ calculatedData, periodType }) {
  const { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
  } = useRecharts();

  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para o gráfico de Estrutura de Financiamento.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const data = [
    // Using estimated liabilities as a proxy. Could be refined if more detailed liability inputs are added.
    { name: 'Contas a Pagar (Médio)', value: Math.max(0, latestPeriod.accountsPayableValueAvg || 0) },
    { name: 'Empréstimos Bancários', value: Math.max(0, latestPeriod.totalBankLoans || 0) },
    { name: 'Patrimônio Líquido', value: Math.max(0, latestPeriod.equity || 0) },
    // Add "Outros Passivos" if it were calculated or input
  ].filter(item => item.value > 0);

  const COLORS = ['#ef4444', '#f97316', '#22c55e']; // red, orange, green

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
              outerRadius={Math.min(120, window.innerWidth / 4 - 60)}
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
        <p className="text-center text-slate-500 flex items-center justify-center h-full">Sem dados de financiamento para exibir.</p>
      )}
    </>
  );
}