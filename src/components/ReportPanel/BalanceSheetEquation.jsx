// src/components/ReportPanel/BalanceSheetEquation.jsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * @param {{ calculatedData: import('../../types/financial').CalculatedPeriodData[] }} props
 */
export default function BalanceSheetEquation({ calculatedData }) {
  if (!calculatedData || calculatedData.length === 0) {
    return <p className="text-center text-slate-500 py-4">Dados insuficientes para a Equação Patrimonial.</p>;
  }
  const latestPeriod = calculatedData[calculatedData.length - 1];

  // Net Debt = Total Bank Loans - Closing Cash
  const netDebt = (latestPeriod.totalBankLoans || 0) - (latestPeriod.closingCash || 0);

  // Other Capital / Assets = Net Fixed Assets (as per benchmark visual and simplification)
  const otherCapitalValue = (latestPeriod.netFixedAssets || 0);

  const totalFundingSide = (latestPeriod.equity || 0) + netDebt;
  const totalAssetsSideEquation = (latestPeriod.workingCapitalValue || 0) + otherCapitalValue;
  const equationDifference = totalFundingSide - totalAssetsSideEquation; // Should be related to balanceSheetDifference but calculated independently here

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        ⚖️ Sua Equação Patrimonial (Último Período)
      </h3>

      <div className="bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 p-6 md:p-8 rounded-xl shadow-xl border border-slate-300 print:shadow-none print:border-slate-400">
        {/* Equation Visual */}
        <div className="flex flex-col lg:flex-row items-center justify-around space-y-6 lg:space-y-0 lg:space-x-4 mb-8">
          {/* Funding Side: Equity + Net Debt */}
          <div className="flex flex-col items-center text-center">
            <div className="text-sm font-medium text-slate-600 mb-2">FONTES DE FINANCIAMENTO</div>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300 min-w-[160px] shadow-sm">
                <div className="text-xs font-semibold text-blue-700 mb-1">Patrimônio Líquido</div>
                <div className="text-xl font-bold text-blue-800">{formatCurrency(latestPeriod.equity)}</div>
              </div>
              <div className="text-2xl font-bold text-slate-500 mx-1">+</div>
              <div className="bg-red-100 p-4 rounded-lg border-2 border-red-300 min-w-[160px] shadow-sm">
                <div className="text-xs font-semibold text-red-700 mb-1">Dívida Líquida</div>
                <div className="text-xl font-bold text-red-800">{formatCurrency(netDebt)}</div>
                {netDebt < 0 && <div className="text-xs text-green-600 mt-0.5">(Posição Caixa Líquido)</div>}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-700 mt-2">{formatCurrency(totalFundingSide)}</div>
          </div>

          <div className="flex items-center justify-center my-3 lg:my-0">
            <div className="bg-slate-700 text-white p-3 rounded-full shadow-md">
              <div className="text-2xl font-bold">=</div>
            </div>
          </div>

          {/* Net Operating Assets Side: Working Capital + Other Capital (Fixed Assets) */}
          <div className="flex flex-col items-center text-center">
            <div className="text-sm font-medium text-slate-600 mb-2">ATIVOS OPERACIONAIS LÍQUIDOS</div>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300 min-w-[160px] shadow-sm">
                <div className="text-xs font-semibold text-green-700 mb-1">Capital de Giro</div>
                <div className="text-xl font-bold text-green-800">{formatCurrency(latestPeriod.workingCapitalValue)}</div>
              </div>
              <div className="text-2xl font-bold text-slate-500 mx-1">+</div>
              <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300 min-w-[160px] shadow-sm">
                <div className="text-xs font-semibold text-purple-700 mb-1">Outros Ativos (Imobilizado)</div>
                <div className="text-xl font-bold text-purple-800">{formatCurrency(otherCapitalValue)}</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-700 mt-2">{formatCurrency(totalAssetsSideEquation)}</div>
          </div>
        </div>

        {/* Reconciliation Note & Overall Balance Sheet Difference */}
        <div className="mt-6 pt-4 border-t border-slate-300 text-center">
            <p className="text-xs text-slate-600 mb-2">
              Esta equação simplifica a estrutura de financiamento e investimento. A "Diferença de Balanço" abaixo reflete a consistência do balanço patrimonial completo estimado.
            </p>
            <div className="inline-flex items-center bg-white p-3 rounded-lg border border-slate-300 shadow-sm">
              <span className="text-sm font-medium text-slate-700 mr-2">Diferença de Balanço (Geral):</span>
              <span className={`text-md font-bold ${Math.abs(latestPeriod.balanceSheetDifference) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(latestPeriod.balanceSheetDifference)}
              </span>
              <span className={`ml-2 text-xs ${Math.abs(latestPeriod.balanceSheetDifference) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.abs(latestPeriod.balanceSheetDifference) < 1 ? '(Equilibrado)' : '(Revisar Inputs)'}
              </span>
            </div>
        </div>
      </div>
    </section>
  );
}