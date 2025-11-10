// src/components/ReportPanel/PowerOfOneAnalysis.jsx
import React, { useMemo } from 'react';
import { formatCurrency, getMovementClass, getMovementIndicator } from '../../utils/formatters';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * periodType: import('../../types/financial').PeriodTypeOption;
 * }} props
 */
export default function PowerOfOneAnalysis({ calculatedData, periodType }) {
  // Memoize the power of one calculations to prevent recalculation on each render
  const powerOfOneData = useMemo(() => {
    if (!calculatedData?.length) return null;

    const latestPeriod = calculatedData[calculatedData.length - 1];
    if (!latestPeriod) return null;

    const daysInPeriod = PERIOD_TYPES[periodType]?.daysInPeriod || 365;
    const currentOperatingProfit = latestPeriod.ebit || 0;
    const currentCashFlowForPowerOfOne = latestPeriod.operatingCashFlow || 0;

    // Pre-calculate common values to avoid repeated calculations
    const taxRate = latestPeriod.incomeTaxRatePercentageActual || 0;
    const afterTaxMultiplier = 1 - taxRate;
    const dailyRevenue = latestPeriod.revenue / daysInPeriod;
    const dailyCogs = latestPeriod.cogs / daysInPeriod;

    const powerOfOneScenarios = [
      {
        lever: 'Aumento Preço',
        change: '+1%',
        operatingProfitImpact: latestPeriod.revenue * 0.01,
        cashFlowImpact: latestPeriod.revenue * 0.01 * afterTaxMultiplier,
        color: 'bg-green-50 border-green-400 text-green-700 print:border-green-300',
      },
      {
        lever: 'Aumento de Volume',
        change: '+1%',
        operatingProfitImpact: latestPeriod.grossProfit * 0.01,
        cashFlowImpact: (latestPeriod.grossProfit * 0.01 * afterTaxMultiplier) - 
          (latestPeriod.wcPer100Revenue * latestPeriod.revenue * 0.0001),
        color: 'bg-blue-50 border-blue-400 text-blue-700 print:border-blue-300',
      },
      {
        lever: 'Redução Custos Diretos (CPV/CSV)',
        change: '-1%',
        operatingProfitImpact: latestPeriod.cogs * 0.01,
        cashFlowImpact: latestPeriod.cogs * 0.01 * afterTaxMultiplier,
        color: 'bg-purple-50 border-purple-400 text-purple-700 print:border-purple-300',
      },
      {
        lever: 'Redução Despesas Operacionais',
        change: '-1%',
        operatingProfitImpact: latestPeriod.operatingExpenses * 0.01,
        cashFlowImpact: latestPeriod.operatingExpenses * 0.01 * afterTaxMultiplier,
        color: 'bg-orange-50 border-orange-400 text-orange-700 print:border-orange-300',
      },
      {
        lever: 'Redução PMR (Dias)',
        change: '-1 dia',
        operatingProfitImpact: 0,
        cashFlowImpact: dailyRevenue,
        color: 'bg-cyan-50 border-cyan-400 text-cyan-700 print:border-cyan-300',
      },
      {
        lever: 'Redução PME (Dias)',
        change: '-1 dia',
        operatingProfitImpact: 0,
        cashFlowImpact: dailyCogs,
        color: 'bg-indigo-50 border-indigo-400 text-indigo-700 print:border-indigo-300',
      },
      {
        lever: 'Aumento PMP (Dias)',
        change: '+1 dia',
        operatingProfitImpact: 0,
        cashFlowImpact: dailyCogs,
        color: 'bg-teal-50 border-teal-400 text-teal-700 print:border-teal-300',
      },
    ];

    // Calculate totals once
    const totalPositiveOperatingImpact = powerOfOneScenarios.reduce(
      (sum, scenario) => sum + Math.max(0, scenario.operatingProfitImpact || 0), 0,
    );
    const totalPositiveCashFlowImpact = powerOfOneScenarios.reduce(
      (sum, scenario) => sum + Math.max(0, scenario.cashFlowImpact || 0), 0,
    );

    return {
      latestPeriod,
      currentOperatingProfit,
      currentCashFlowForPowerOfOne,
      powerOfOneScenarios,
      totalPositiveOperatingImpact,
      totalPositiveCashFlowImpact,
    };
  }, [calculatedData, periodType]);

  if (!powerOfOneData) {
    return (
      <section className="mb-8">
        <h3 className="report-section-title">🎯 Poder do Um - Análise de Alavancas de Valor</h3>
        <p className="text-center text-slate-500 py-8">Dados insuficientes para análise do Poder do Um.</p>
      </section>
    );
  }

  const {
    currentOperatingProfit,
    currentCashFlowForPowerOfOne,
    powerOfOneScenarios,
    totalPositiveOperatingImpact,
    totalPositiveCashFlowImpact,
  } = powerOfOneData;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 print:grid-cols-2 print:mt-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow print:p-3">
          <div className="text-sm text-slate-600 mb-1">Nova Posição Estimada - Lucro Operacional</div>
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

      <div className="mt-6 p-3 bg-blue-50 border-l-4 border-blue-400 text-xs text-blue-700 print:mt-3 print:text-[7pt]">
        <p><strong>Metodologia:</strong> Esta análise aplica mudanças individuais de 1% ou 1 dia aos principais direcionadores de valor para demonstrar o impacto potencial na lucratividade e geração de caixa.</p>
        <p className="mt-1">* O impacto no caixa considera efeitos tributários e variações do capital de giro quando aplicável.</p>
      </div>
    </section>
  );
}