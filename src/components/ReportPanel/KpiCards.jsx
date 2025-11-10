// src/components/ReportPanel/KpiCards.jsx
import React from 'react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * }} props
 */
export default function KpiCards({ calculatedData }) {
  const lastPeriod = calculatedData[calculatedData.length - 1];
  const prevPeriod = calculatedData.length > 1 ? calculatedData[calculatedData.length - 2] : null;

  const getPercentageChange = (current, previous) => {
    if (!previous || !current) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const kpis = [
    {
      title: 'Receita',
      value: lastPeriod?.revenue,
      change: getPercentageChange(lastPeriod?.revenue, prevPeriod?.revenue),
      formatter: formatCurrency,
      goodTrend: 'up',
    },
    {
      title: 'Margem EBITDA',
      value: lastPeriod?.revenue ? (lastPeriod?.ebitda / lastPeriod.revenue) * 100 : null,
      change: getPercentageChange(
        lastPeriod?.revenue ? (lastPeriod?.ebitda / lastPeriod.revenue) * 100 : null,
        prevPeriod?.revenue ? (prevPeriod?.ebitda / prevPeriod.revenue) * 100 : null,
      ),
      formatter: formatPercentage,
      goodTrend: 'up',
    },
    {
      title: 'Fluxo de Caixa Operacional',
      value: lastPeriod?.operatingCashFlow,
      change: getPercentageChange(lastPeriod?.operatingCashFlow, prevPeriod?.operatingCashFlow),
      formatter: formatCurrency,
      goodTrend: 'up',
    },
    {
      title: 'Ciclo de Caixa',
      value: lastPeriod?.wcDays,
      change: getPercentageChange(lastPeriod?.wcDays, prevPeriod?.wcDays),
      formatter: (value) => value?.toFixed(1) + ' dias',
      goodTrend: 'down',
    },
  ];

  if (!lastPeriod) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => {
        const isPositiveChange = kpi.change && kpi.change > 0;
        const isGoodTrend = kpi.goodTrend === 'up' ? isPositiveChange : !isPositiveChange;
        
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
            <h3 className="text-sm font-medium text-slate-600 mb-1">{kpi.title}</h3>
            <p className="text-xl font-bold text-slate-800 mb-2">
              {kpi.formatter(kpi.value)}
            </p>
            {kpi.change !== null && (
              <p className={`text-sm flex items-center ${
                isGoodTrend ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveChange ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}