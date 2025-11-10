import React from 'react';
import BaseChart from './BaseChart';
import { formatCurrency } from '../../utils/formatters';

/**
 * WorkingCapitalTimeline - Combined chart showing working capital metrics over time
 * Shows DSO, DIO, DPO as lines and working capital value as bars
 * @param {Object} props
 * @param {Array} props.data - Array of period data objects (test API)
 * @param {Array} props.calculatedData - Array of period data objects (legacy API)
 */
export default function WorkingCapitalTimeline({ data, calculatedData }) {
  // Support both APIs
  const periods = data || calculatedData;

  // Check for empty or invalid data
  if (!periods || periods.length === 0) {
    return (
      <BaseChart title="Evolução do Capital de Giro" empty={true} height={400} />
    );
  }

  const { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = window.Recharts || {};

  if (!ResponsiveContainer) {
    return (
      <BaseChart title="Evolução do Capital de Giro" loading={true} height={400} />
    );
  }

  // Transform data for the chart
  const chartData = periods.map((period, index) => {
    const wc = period.workingCapital || {};
    return {
      name: `P${period.periodIndex !== undefined ? period.periodIndex + 1 : index + 1}`,
      workingCapital: wc.workingCapitalValue || 0,
      dso: wc.dso || 0,
      dio: wc.dio || 0,
      dpo: wc.dpo || 0,
    };
  });

  return (
    <BaseChart title="Evolução do Capital de Giro" height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, true)}
            label={{ value: 'R$', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            label={{ value: 'Dias', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'workingCapital') {
                return [formatCurrency(value), 'Capital de Giro'];
              }
              return [`${Math.round(value)} dias`, name];
            }}
            labelFormatter={(label) => `Período: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            yAxisId="left"
            dataKey="workingCapital"
            fill="#8b5cf6"
            name="Capital de Giro"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dso"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="DSO"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="DIO"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dpo"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="DPO"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </BaseChart>
  );
}
