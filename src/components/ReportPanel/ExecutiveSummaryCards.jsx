// src/components/ReportPanel/ExecutiveSummaryCards.jsx
import React from 'react';
import { formatCurrency, formatPercentage, getMovementClass, getMovementIndicator, formatMovement, formatDays } from '../../utils/formatters';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * companyInfo: import('../../types/financial').CompanyInfo;
 * }} props
 */
export default function ExecutiveSummaryCards({ calculatedData, companyInfo }) {
  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 my-4">Dados insuficientes para o resumo executivo.</p>;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const previousPeriod = calculatedData.length > 1 ? calculatedData[calculatedData.length - 2] : null;

  const ProfitStoryCard = () => {
    if (!latestPeriod) return null;

    let revenueChange = null, gmPctChange = null, opProfitPctChange = null, netProfitPctChange = null;
    if (previousPeriod) {
      revenueChange = latestPeriod.revenue - previousPeriod.revenue;
      gmPctChange = latestPeriod.gmPct - previousPeriod.gmPct;
      opProfitPctChange = latestPeriod.opProfitPct - previousPeriod.opProfitPct;
      netProfitPctChange = latestPeriod.netProfitPct - previousPeriod.netProfitPct;
    }

    return (
      <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 p-5 md:p-6 rounded-xl shadow-lg border border-blue-200 print:shadow-none print:border-blue-300">
        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center print:text-lg">
          <span className="text-2xl mr-2 print:text-xl">📈</span>
          Sua História de Resultados (Último Período)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-1.5 text-sm md:text-base">
            <div className="flex justify-between items-center py-1.5"><span className="font-medium text-slate-700">Receita</span><span className="text-lg font-bold text-slate-800">{formatCurrency(latestPeriod.revenue)}</span></div>
            <div className="flex justify-between items-center py-1.5 border-b border-blue-200"><span className="font-medium text-slate-600">(-) Custos Diretos (CPV/CSV)</span><span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.cogs)}</span></div>
            <div className="flex justify-between items-center py-1.5 font-bold"><span className="text-blue-700">(=) Margem Bruta</span><span className="text-lg text-blue-700">{formatCurrency(latestPeriod.grossProfit)}</span></div>
            <div className="flex justify-between items-center py-1.5 border-b border-blue-200"><span className="font-medium text-slate-600">(-) Despesas Operacionais</span><span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.operatingExpenses)}</span></div>
            <div className="flex justify-between items-center py-1.5 font-bold"><span className="text-blue-700">(=) Lucro Operacional (EBIT)</span><span className="text-lg text-blue-700">{formatCurrency(latestPeriod.ebit)}</span></div>
          </div>
          <div className="space-y-1 md:space-y-1.5 text-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 pt-1 md:pt-0">Principais Métricas e Variações (vs Per. Ant.)</h4>
            {[
              { label: 'Receita', value: latestPeriod.revenue, change: revenueChange, movementType: 'value' },
              { label: 'Margem Bruta %', value: latestPeriod.gmPct, change: gmPctChange, movementType: 'percentage_points', isPercentContext: true },
              { label: 'Lucro Oper. (EBIT) %', value: latestPeriod.opProfitPct, change: opProfitPctChange, movementType: 'percentage_points', isPercentContext: true },
              { label: 'Lucro Líquido %', value: latestPeriod.netProfitPct, change: netProfitPctChange, movementType: 'percentage_points', isPercentContext: true },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-1 border-b border-blue-100 last:border-b-0">
                <span className="text-slate-600">{item.label}:</span>
                <div className="text-right">
                  <span className={`font-bold ${item.isPercentContext ? 'text-blue-700' : 'text-slate-800'}`}>{item.isPercentContext ? formatPercentage(item.value) : formatCurrency(item.value)}</span>
                  {previousPeriod && item.change !== null && typeof item.change !== 'undefined' && (
                    <span className={`ml-2 text-xs font-medium ${getMovementClass(item.change)}`}>
                      ({getMovementIndicator(item.change)} {formatMovement(Math.abs(item.change), item.movementType, item.isPercentContext)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BalanceSheetStoryCard = () => {
    if (!latestPeriod) return null;

    let arDaysChange = null, inventoryDaysChange = null, apDaysChange = null, wcDaysChange = null;
    if (previousPeriod) {
      arDaysChange = latestPeriod.arDaysDerived - previousPeriod.arDaysDerived;
      inventoryDaysChange = latestPeriod.inventoryDaysDerived - previousPeriod.inventoryDaysDerived; // CORRECTED
      apDaysChange = latestPeriod.apDaysDerived - previousPeriod.apDaysDerived;
      wcDaysChange = latestPeriod.wcDays - previousPeriod.wcDays; // wcDays is now derived from all derived days
    }

    const displayAssets = latestPeriod.estimatedTotalAssets;
    const displayLiabilities = latestPeriod.estimatedTotalLiabilities;
    const displayEquity = latestPeriod.equity;
    const displayBalanceDifference = latestPeriod.balanceSheetDifference;

    return (
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 p-5 md:p-6 rounded-xl shadow-lg border border-emerald-200 print:shadow-none print:border-emerald-300">
        <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center print:text-lg">
          <span className="text-2xl mr-2 print:text-xl">⚖️</span>
          Sua História do Balanço (Último Período)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-green-700 mb-2">Estrutura Patrimonial Estimada</h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-medium text-slate-600">Total Ativos</span><span className="text-lg font-bold text-blue-600">{formatCurrency(displayAssets)}</span></div>
              <div className="text-xs text-slate-500 space-y-0.5 pl-2">
                <div className="flex justify-between"><span>• Caixa Final (Calc.):</span> <span>{formatCurrency(latestPeriod.closingCash)}</span></div>
                <div className="flex justify-between"><span>• Contas a Receber (Médio):</span> <span>{formatCurrency(latestPeriod.accountsReceivableValueAvg)}</span></div>
                <div className="flex justify-between"><span>• Estoques (Médio):</span> <span>{formatCurrency(latestPeriod.inventoryValueAvg)}</span></div>
                <div className="flex justify-between"><span>• Ativo Imobilizado (Líq.):</span> <span>{formatCurrency(latestPeriod.netFixedAssets || 0)}</span></div>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-medium text-slate-600">Total Passivos</span><span className="text-lg font-bold text-red-600">{formatCurrency(displayLiabilities)}</span></div>
              <div className="text-xs text-slate-500 space-y-0.5 pl-2">
                <div className="flex justify-between"><span>• Contas a Pagar (Médio):</span> <span>{formatCurrency(latestPeriod.accountsPayableValueAvg)}</span></div>
                <div className="flex justify-between"><span>• Empréstimos Totais:</span> <span>{formatCurrency(latestPeriod.totalBankLoans || 0)}</span></div>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-600">Patrimônio Líquido (Calc.)</span><span className="text-lg font-bold text-green-600">{formatCurrency(displayEquity)}</span></div>
            </div>
            <div className={`p-3 rounded-lg border-2 ${Math.abs(displayBalanceDifference) > 1 ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}>
              <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium text-slate-700">Verificação do Balanço:</span><span className={`text-sm font-bold ${Math.abs(displayBalanceDifference) > 1 ? 'text-red-700' : 'text-green-700'}`}>{Math.abs(displayBalanceDifference) < 1 ? '✅ Equilibrado' : '⚠️ Revisar Inputs'}</span></div>
              <div className="flex justify-between text-xs font-bold"><span>Diferença (A - (L+PL)):</span><span className={Math.abs(displayBalanceDifference) > 1 ? 'text-red-700' : 'text-green-700'}>{formatCurrency(displayBalanceDifference)}</span></div>
              {Math.abs(displayBalanceDifference) > 1 && (<div className="text-xs text-red-700 mt-1">💡 Diferença indica necessidade de revisão dos inputs para consistência.</div>)}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-green-700 mb-2">Prazos de Capital de Giro (vs Per. Ant.)</h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1.5 text-sm">
              {[
                { label: 'PMR (dias)', value: latestPeriod.arDaysDerived, change: arDaysChange },
                { label: 'PME (dias)', value: latestPeriod.inventoryDaysDerived, change: inventoryDaysChange }, // CORRECTED
                { label: 'PMP (dias)', value: latestPeriod.apDaysDerived, change: apDaysChange },
                { label: 'Ciclo de Caixa (dias)', value: latestPeriod.wcDays, change: wcDaysChange, isBold: true }, // CORRECTED (uses derived days)
              ].map(item => (
                <div key={item.label} className={`flex justify-between items-center py-1 border-b border-emerald-100 last:border-b-0 ${item.isBold ? 'font-bold': ''}`}>
                  <span className="text-slate-600">{item.label}:</span>
                  <div className="text-right">
                    <span className={`font-semibold ${item.isBold && latestPeriod.wcDays < 0 ? 'text-green-600' : item.isBold ? 'text-orange-600' : 'text-slate-800'}`}>{formatDays(item.value)}</span>
                    {previousPeriod && item.change !== null && typeof item.change !== 'undefined' && (
                      <span className={`ml-2 text-xs font-medium ${getMovementClass(item.change)}`}>
                        ({getMovementIndicator(item.change)} {formatMovement(Math.abs(item.change), 'days')})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CashFlowStoryCard = () => {
    if (!latestPeriod) return null;
    
    let fcoChange = null, fcfChange = null, fundingGapChange = null, closingCashChange = null;
    if (previousPeriod) {
      fcoChange = latestPeriod.operatingCashFlow - previousPeriod.operatingCashFlow;
      fcfChange = latestPeriod.netCashFlowBeforeFinancing - previousPeriod.netCashFlowBeforeFinancing;
      fundingGapChange = latestPeriod.fundingGapOrSurplus - previousPeriod.fundingGapOrSurplus;
      closingCashChange = latestPeriod.closingCash - previousPeriod.closingCash;
    }

    return (
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5 md:p-6 rounded-xl shadow-lg border border-amber-200 print:shadow-none print:border-amber-300 md:col-span-2">
        <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center print:text-lg">
          <span className="text-2xl mr-2 print:text-xl">🌊</span>
          Sua História de Fluxo de Caixa (Último Período)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2 text-sm md:text-base">
            <div className="flex justify-between items-center py-1.5"><span className="font-medium text-slate-700">FCO (Operacional)</span><span className="text-lg font-bold text-slate-800">{formatCurrency(latestPeriod.operatingCashFlow)}</span></div>
            <div className="flex justify-between items-center py-1.5"><span className="font-medium text-slate-600">(-) Invest. Capital de Giro</span><span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.workingCapitalChange)}</span></div>
            <div className="flex justify-between items-center py-1.5 border-b border-amber-200"><span className="font-medium text-slate-600">(-) CAPEX</span><span className="font-semibold text-slate-700">{formatCurrency(latestPeriod.capitalExpenditures)}</span></div>
            <div className="flex justify-between items-center py-1.5 font-bold"><span className="text-amber-700">(=) FCL (Antes do Financiamento)</span><span className="text-lg text-amber-700">{formatCurrency(latestPeriod.netCashFlowBeforeFinancing)}</span></div>
            <div className="flex justify-between items-center py-1.5 font-bold"><span className="text-amber-700">Necessidade (+)/Excedente (-) de Financiamento</span><span className={`text-lg ${getMovementClass(latestPeriod.fundingGapOrSurplus)}`}>{formatCurrency(latestPeriod.fundingGapOrSurplus)}</span></div>
          </div>
          <div className="space-y-1 md:space-y-1.5 text-sm">
            <h4 className="text-sm font-semibold text-slate-700 mb-2 pt-1 md:pt-0">Principais Métricas e Variações (vs Per. Ant.)</h4>
            {[
              { label: 'FCO', value: latestPeriod.operatingCashFlow, change: fcoChange, movementType: 'value' },
              { label: 'FCL (Antes Fin.)', value: latestPeriod.netCashFlowBeforeFinancing, change: fcfChange, movementType: 'value' },
              { label: 'Necessidade(+)/Exc.(-)', value: latestPeriod.fundingGapOrSurplus, change: fundingGapChange, movementType: 'value', isBold: true },
              { label: 'Saldo Final de Caixa', value: latestPeriod.closingCash, change: closingCashChange, movementType: 'value' },
            ].map(item => (
              <div key={item.label} className={`flex justify-between items-center py-1 border-b border-amber-100 last:border-b-0 ${item.isBold ? 'font-bold': ''}`}>
                <span className="text-slate-600">{item.label}:</span>
                <div className="text-right">
                  <span className={`font-semibold ${item.isBold ? 'text-amber-700' : 'text-slate-800'}`}>{formatCurrency(item.value)}</span>
                  {previousPeriod && item.change !== null && typeof item.change !== 'undefined' && (
                    <span className={`ml-2 text-xs font-medium ${getMovementClass(item.change)}`}>
                      ({getMovementIndicator(item.change)} {formatMovement(Math.abs(item.change), item.movementType)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        Destaques Executivos e Análise Patrimonial
      </h3>
      <div className="space-y-6">
        <ProfitStoryCard />
        <BalanceSheetStoryCard />
        <CashFlowStoryCard />
      </div>
    </section>
  );
}