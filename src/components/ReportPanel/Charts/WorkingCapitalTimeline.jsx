// src/components/ReportPanel/Charts/WorkingCapitalTimeline.jsx
import React from 'react';
import { formatCurrency, formatDays, getMovementClass } from '../../../utils/formatters';
import { PERIOD_TYPES } from '../../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../../types/financial').CalculatedPeriodData[];
 * periodType: import('../../../types/financial').PeriodTypeOption;
 * }} props
 */
export default function WorkingCapitalTimeline({ calculatedData, periodType }) {
  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para a Timeline do Capital de Giro.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const previousPeriod = calculatedData.length > 1 ? calculatedData[calculatedData.length - 2] : null;

  const createCycleData = (period) => {
    if (!period) return null;
    const apDays = Math.max(0, Math.round(period.apDaysDerived || 0));
    const inventoryDays = Math.max(0, Math.round(period.inventoryDaysDerived || 0));
    const arDays = Math.max(0, Math.round(period.arDaysDerived || 0));
    const wcDays = Math.round(period.wcDays || 0);

    return {
      apDays,
      inventoryDays,
      arDays,
      wcDays,
      paymentEventDay: apDays,
      saleEventDay: inventoryDays,
      cashInEventDay: inventoryDays + arDays,
      maxDayForTimeline: Math.max(inventoryDays + arDays, apDays, 1)
    };
  };

  const currentCycle = createCycleData(latestPeriod);
  const previousCycle = createCycleData(previousPeriod);

  const TimelineBar = ({ cycle, isComparison = false }) => {
    if (!cycle) return null;

    const totalOperatingCycleVisual = cycle.inventoryDays + cycle.arDays;

    return (
      <div className={`p-4 rounded-lg ${isComparison ? 'bg-slate-100' : 'bg-sky-50'} border ${isComparison ? 'border-slate-300' : 'border-sky-300'}`}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Prazo Médio de Estoque (PME):</span>
            <span className="font-semibold">{formatDays(cycle.inventoryDays)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Prazo Médio de Recebimento (PMR):</span>
            <span className="font-semibold">{formatDays(cycle.arDays)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-2">
            <span>Ciclo Operacional (PME + PMR):</span>
            <span className="text-blue-700">{formatDays(totalOperatingCycleVisual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>(-) Prazo Médio de Pagamento (PMP):</span>
            <span className="font-semibold text-red-600">{formatDays(cycle.apDays)}</span>
          </div>
          <div className={`flex justify-between text-lg font-bold border-t-2 pt-2 ${isComparison ? 'border-slate-400' : 'border-sky-500'}`}>
            <span>(=) Ciclo de Conversão de Caixa:</span>
            <span className={getMovementClass(-cycle.wcDays)}>{formatDays(cycle.wcDays)}</span>
          </div>
        </div>

        {/* Simplified Visual Timeline Bar */}
        <div className="mt-6 mb-4">
            <div className="text-xs text-slate-600 mb-1">Representação Visual do Ciclo de Caixa:</div>
            <div className="relative h-6 bg-gray-200 rounded-full w-full" title={`Ciclo Operacional: ${totalOperatingCycleVisual} dias`}>
                <div 
                    className="h-full bg-yellow-400 absolute left-0 rounded-l-full"
                    style={{ width: `${totalOperatingCycleVisual > 0 ? (cycle.inventoryDays / totalOperatingCycleVisual) * 100 : 0}%` }}
                    title={`Estoque: ${cycle.inventoryDays} dias`}
                ></div>
                <div 
                    className="h-full bg-green-400 absolute rounded-r-full"
                    style={{ 
                        left: `${totalOperatingCycleVisual > 0 ? (cycle.inventoryDays / totalOperatingCycleVisual) * 100 : 0}%`,
                        width: `${totalOperatingCycleVisual > 0 ? (cycle.arDays / totalOperatingCycleVisual) * 100 : 0}%`
                    }}
                    title={`Contas a Receber: ${cycle.arDays} dias`}
                ></div>
            </div>
            <div className="flex justify-between text-xs mt-1 px-1">
                <span>Dia 0 (Compra/Produção)</span>
                <span>Dia {totalOperatingCycleVisual} (Recebimento Previsto)</span>
            </div>
            <p className="text-xs text-center mt-2 text-slate-500">
                O PMP de {cycle.apDays} dias ajuda a financiar este ciclo operacional.
            </p>
        </div>
      </div>
    );
  };

  const cashImpact = latestPeriod.workingCapitalChange;
  const cashImpactLabel = cashImpact === null || typeof cashImpact === 'undefined' ? 'N/A' :
    (cashImpact > 0 ? 'Investimento Adicional em CG (Uso de Caixa)' :
    (cashImpact < 0 ? 'Liberação de Caixa do CG (Fonte de Caixa)' : 'Sem Variação no Investimento em CG'));

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        🕐 Timeline do Capital de Giro e Impacto no Caixa
      </h3>

      <div className="space-y-8">
        {currentCycle && <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-700 mb-3">Período Atual ({PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} {calculatedData.length})</h4>
          <TimelineBar cycle={currentCycle} />
        </div>}

        {previousCycle && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-3">Período Anterior ({PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} {calculatedData.length - 1})</h4>
            <TimelineBar cycle={previousCycle} isComparison={true}/>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-500 print:shadow-none print:border-orange-300">
                <h4 className="text-lg font-bold text-orange-800 mb-3">💰 Impacto da Variação do Capital de Giro no Caixa</h4>
                <div className={`text-3xl font-bold ${getMovementClass(-cashImpact)}`}>
                    {formatCurrency(Math.abs(cashImpact))}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                    {cashImpactLabel} (vs Período Anterior)
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Um aumento no capital de giro consome caixa, enquanto uma redução libera caixa.
                </p>
            </div>

            <div className="bg-gradient-to-r from-sky-50 to-cyan-50 p-6 rounded-xl border-l-4 border-sky-500 print:shadow-none print:border-sky-300">
              <h4 className="text-lg font-bold text-sky-800 mb-3">📊 Capital de Giro por R$100 de Receita (Últ. Per.)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Estoques (Valor Médio):</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.inventoryPer100Revenue, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contas a Receber (Valor Médio):</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.arPer100Revenue, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Contas a Pagar (Valor Médio):</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.apPer100Revenue, true)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-1 font-bold text-sky-700">
                  <span>(=) Total Capital de Giro Necessário:</span>
                  <span className="text-lg">{formatCurrency(latestPeriod.wcPer100Revenue, true)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Para cada R$100 adicionais de receita, sua empresa precisa investir aproximadamente {formatCurrency(latestPeriod.wcPer100Revenue, true)} em capital de giro.
              </p>
            </div>
        </div>
      </div>
    </section>
  );
}