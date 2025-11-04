import React from 'react';
import BaseChart from './BaseChart';
import { formatCurrency } from '../../utils/formatters';

/**
 * ProfitWaterfallChart - Waterfall visualization showing profit formation
 * Shows the progression from revenue through costs to net income
 * @param {Object} props
 * @param {Array} props.data - Array of period data objects (test API)
 * @param {Array} props.calculatedData - Array of period data objects (legacy API)
 */
export default function ProfitWaterfallChart({ data, calculatedData }) {
  // Support both APIs
  const periods = data || calculatedData;

  // Check for empty or invalid data
  if (!periods || periods.length === 0) {
    return (
      <BaseChart title="Formação do Lucro - Waterfall" empty={true} height={400} />
    );
  }

  // Use the first period for waterfall
  const period = periods[0];
  const income = period.incomeStatement || {};

  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = window.Recharts || {};

  if (!ResponsiveContainer) {
    return (
      <BaseChart title="Formação do Lucro - Waterfall" loading={true} height={400} />
    );
  }

  // Extract P&L components - create data structure with separate dataKeys
  const chartData = [{
    name: 'P&L',
    revenue: income.revenue || 0,
    cogs: Math.abs(income.cogs || 0),
    opex: Math.abs(income.operatingExpenses || 0),
    financial: Math.abs(income.netFinancialResult || 0),
    taxes: Math.abs(income.taxes || 0)
  }];

  return (
    <BaseChart title="Formação do Lucro - Waterfall" height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="revenue" fill="#10b981" name="Receita" />
          <Bar dataKey="cogs" fill="#ef4444" name="CPV" />
          <Bar dataKey="opex" fill="#f59e0b" name="Despesas Operacionais" />
          <Bar dataKey="financial" fill="#3b82f6" name="Resultado Financeiro" />
          <Bar dataKey="taxes" fill="#8b5cf6" name="Impostos" />
        </BarChart>
      </ResponsiveContainer>
    </BaseChart>
  );
}
