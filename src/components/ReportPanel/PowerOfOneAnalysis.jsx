// src/components/ReportPanel/PowerOfOneAnalysis.jsx
import React from 'react';
import { formatCurrency, getMovementClass, getMovementIndicator } from '../../utils/formatters';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * periodType: import('../../types/financial').PeriodTypeOption;
 * }} props
 */
export default function PowerOfOneAnalysis({ calculatedData, periodType }) {
  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para Análise Poder do Um.</p>;
  }
  const latestPeriod = calculatedData[calculatedData.length - 1];
  const daysInPeriod = PERIOD_TYPES[periodType]?.days || 365;

  const currentOperatingProfit = latestPeriod.ebit;
  // Using Cash From Operations After WC as the cash flow metric for Power of One, as it's pre-financing
  const currentCashFlowForPowerOfOne = latestPeriod.cashFromOpsAfterWC;

  const powerOfOneScenarios = [
    {
      lever: 'Aumento de Preço',
      change: '+1%',
      operatingProfitImpact: latestPeriod.revenue * 0.01,
      cashFlowImpact: latestPeriod.revenue * 0.01 * (1 - (latestPeriod.incomeTaxRatePercentageActual || 0)), // After tax on incremental profit
      color: 'bg-green-50 border-green-400 text-green-700 print:border-green-300'
    },
    {
      lever: 'Aumento de Volume',
      change: '+1%',
      operatingProfitImpact: latestPeriod.grossProfit * 0.01, // Impact on Gross Profit (pre-tax)
      cashFlowImpact: (latestPeriod.grossProfit * 0.01 * (1 - (latestPeriod.incomeTaxRatePercentageActual || 0))) -
        (latestPeriod.wcPer100Revenue * latestPeriod.revenue * 0.0001), // (WC/Rev%) * (Rev*1%)
      color: 'bg-blue-50 border-blue-400 text-blue-700 print:border-blue-300'
    },
    {
      lever: 'Redução Custos Diretos (CPV/CSV)',
      change: '-1%',
      operatingProfitImpact: latestPeriod.cogs * 0.01,
      cashFlowImpact: latestPeriod.cogs * 0.01 * (1 - (latestPeriod.incomeTaxRatePercentageActual || 0)),
      color: 'bg-purple-50 border-purple-400 text-purple-700 print:border-purple-300'
    },
    {
      lever: 'Redução Despesas Operacionais',
      change: '-1%',
      operatingProfitImpact: latestPeriod.operatingExpenses * 0.01,
      cashFlowImpact: latestPeriod.operatingExpenses * 0.01 * (1 - (latestPeriod.incomeTaxRatePercentageActual || 0)),
      color: 'bg-orange-50 border-orange-400 text-orange-700 print:border-orange-300'
    },
    {
      lever: 'Redução PMR (Dias)',
      change: '-1 dia',
      operatingProfitImpact: 0, // No direct P&L impact from AR days change, primarily cash
      cashFlowImpact: (latestPeriod.revenue / daysInPeriod), // Cash freed from AR
      color: 'bg-cyan-50 border-cyan-400 text-cyan-700 print:border-cyan-300'
    },
    {
      lever: 'Redução PME (Dias)',
      change: '-1 dia',
      operatingProfitImpact: 0,
      cashFlowImpact: (latestPeriod.cogs / daysInPeriod), // Cash freed from inventory
      color: 'bg-indigo-50 border-indigo-400 text-indigo-700 print:border-indigo-300'
    },
    {
      lever: 'Aumento PMP (Dias)',
      change: '+1 dia',
      operatingProfitImpact: 0,
      cashFlowImpact: (latestPeriod.cogs / daysInPeriod), // Cash retained by paying slower (positive cash impact)
      color: 'bg-teal-50 border-teal-400 text-teal-700 print:border-teal-300'
    }
  ];

  // Sum of positive impacts only for "total impact" display to represent potential gain
  const totalPositiveOperatingImpact = powerOfOneScenarios.reduce((sum, scenario) => sum + Math.max(0, scenario.operatingProfitImpact || 0), 0);
  const totalPositiveCashFlowImpact = powerOfOneScenarios.reduce((sum, scenario) => sum + Math.max(0, scenario.cashFlowImpact || 0), 0);

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        🎯 Poder do Um - Análise de Alavancas de Valor (Baseado no Último Período)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
        <div className="bg-slate-100 p-4 rounded-lg shadow print:p-3">
          <div className="text-sm text-slate-600 mb-1">Lucro Operacional (EBIT) Atual:</div>
          <div className="text-2xl font-bold text-blue-700 print:text-xl">{formatCurrency(currentOperatingProfit)}</div>
        </div>
        <div className="bg-slate-100 p-4 rounded-lg shadow print:p-3">
          <div className="text-sm text-slate-600 mb-1">Caixa Gerado nas Operações (após CG) Atual:</div>
          <div className="text-2xl font-bold text-blue-700 print:text-xl">{formatCurrency(currentCashFlowForPowerOfOne)}</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border">
        <table className="min-w-full report-table-styles">
          <thead className="bg-slate-200 print:bg-slate-100">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-slate-700">Alavanca de Valor</th>
              <th className="p-3 text-center text-sm font-semibold text-slate-700">Mudança Proposta</th>
              <th className="p-3 text-right text-sm font-semibold text-slate-700">Impacto no Lucro Oper. (EBIT)</th>
              <th className="p-3 text-right text-sm font-semibold text-slate-700">Impacto no Caixa (Após CG e IR*)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {powerOfOneScenarios.map((scenario) => (
              <tr key={scenario.lever} className="hover:bg-slate-50 print:hover:bg-transparent">
                <td className="p-3 print:py-1.5">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${scenario.color}`}>
                    {scenario.lever}
                  </span>
                </td>
                <td className="p-3 text-center font-semibold text-slate-700 print:py-1.5">{scenario.change}</td>
                <td className={`p-3 text-right font-bold ${getMovementClass(scenario.operatingProfitImpact)} print:py-1.5`}>
                  {scenario.operatingProfitImpact !== 0 ? formatCurrency(scenario.operatingProfitImpact) : '--'}
                </td>
                <td className={`p-3 text-right font-bold ${getMovementClass(scenario.cashFlowImpact)} print:py-1.5`}>
                  {formatCurrency(scenario.cashFlowImpact)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-500 shadow print:p-3 print:border-yellow-300">
        <h4 className="text-lg font-bold text-yellow-800 mb-3 print:text-base">🚀 Impacto Combinado Potencial do Poder do Um</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
          <div>
            <div className="text-sm text-slate-600 mb-1">Nova Posição Estimada - Lucro Operacional (EBIT)</div>
            <div className="text-xl font-bold text-green-700 print:text-lg">
              {formatCurrency(currentOperatingProfit + totalPositiveOperatingImpact)}
            </div>
            <div className={`text-sm font-medium ${getMovementClass(totalPositiveOperatingImpact)}`}>
              {getMovementIndicator(totalPositiveOperatingImpact)} {formatCurrency(Math.abs(totalPositiveOperatingImpact), false)} vs Posição Atual
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Nova Posição Estimada - Caixa Gerado nas Operações (após CG)</div>
            <div className="text-xl font-bold text-blue-700 print:text-lg">
              {formatCurrency(currentCashFlowForPowerOfOne + totalPositiveCashFlowImpact)}
            </div>
            <div className={`text-sm font-medium ${getMovementClass(totalPositiveCashFlowImpact)}`}>
              {getMovementIndicator(totalPositiveCashFlowImpact)} {formatCurrency(Math.abs(totalPositiveCashFlowImpact), false)} vs Posição Atual
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 print:text-[10px]">
          * Impacto no caixa considera efeito do IR sobre itens de P&L e o impacto direto no Capital de Giro para os itens de dias e volume. Representa o potencial se todas as alavancas positivas fossem aplicadas.
        </p>
      </div>
    </section>
  );
}