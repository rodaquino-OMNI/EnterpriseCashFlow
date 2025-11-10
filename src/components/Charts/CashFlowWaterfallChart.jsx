import React from 'react';
import BaseChart from './BaseChart';
import { formatCurrency } from '../../utils/formatters';

/**
 * CashFlowWaterfallChart - Waterfall visualization of cash flow components
 * Shows the progression from EBITDA to final cash position
 * @param {Object} props
 * @param {Array} props.data - Array of period data objects (test API)
 * @param {Array} props.calculatedData - Array of period data objects (legacy API)
 */
export default function CashFlowWaterfallChart({ data, calculatedData }) {
  // Support both APIs
  const periods = data || calculatedData;

  // Check for empty or invalid data
  if (!periods || periods.length === 0) {
    return (
      <BaseChart title="Análise de Fluxo de Caixa - Waterfall" empty={true} height={400} />
    );
  }

  // For waterfall, we show the cash flow progression
  const period = periods[0];

  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = window.Recharts || {};

  if (!ResponsiveContainer) {
    return (
      <BaseChart title="Análise de Fluxo de Caixa - Waterfall" loading={true} height={400} />
    );
  }

  // Extract cash flow components and create waterfall data points
  const ebitda = period.incomeStatement?.ebitda || 0;
  const workingCapitalChange = Math.abs(period.cashFlow?.workingCapitalChange || 0);
  const capex = Math.abs(period.cashFlow?.capex || 0);
  const financing = Math.abs(period.cashFlow?.financingCashFlow || 0);

  // Create 5 data points for the waterfall
  const waterfallData = [
    { name: 'EBITDA', value: ebitda, EBITDA: ebitda },
    { name: 'Var. Cap. Giro', value: workingCapitalChange, workingCapitalChange: workingCapitalChange },
    { name: 'CAPEX', value: capex, capex: capex },
    { name: 'Financiamento', value: financing, financing: financing },
    { name: 'Caixa Final', value: ebitda + workingCapitalChange + capex + financing },
  ];

  return (
    <BaseChart title="Análise de Fluxo de Caixa - Waterfall" height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            labelFormatter={(label) => `Item: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill="#8b5cf6" name="Valor" />
          <Bar dataKey="EBITDA" fill="#10b981" name="EBITDA" />
          <Bar dataKey="workingCapitalChange" fill="#f59e0b" name="Capital de Giro" />
          <Bar dataKey="capex" fill="#ef4444" name="CAPEX" />
          <Bar dataKey="financing" fill="#3b82f6" name="Financiamento" />
        </BarChart>
      </ResponsiveContainer>
    </BaseChart>
  );
}
