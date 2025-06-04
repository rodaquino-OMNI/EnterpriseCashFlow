// src/components/ReportPanel/BalanceSheetEquation.jsx
import React from 'react';
import { formatCurrency } from '../../utils/formatters'; // Assuming formatters.js is in ../../utils/

// Modular sub-components from your enhanced design
const ValueCard = ({ title, value, detail, bgColor = "bg-slate-100", borderColor = "border-slate-300", textColor = "text-slate-700", titleColor, valueTextSize = "text-xl lg:text-2xl" }) => (
  <div className={`${bgColor} p-4 md:p-5 rounded-xl border-2 ${borderColor} min-w-[160px] md:min-w-[180px] shadow-sm transition-all hover:shadow-md text-center print:p-2 print:border print:shadow-none`}>
    <div className={`text-xs font-medium ${titleColor || textColor} mb-1 uppercase tracking-wider print:text-[8pt]`}>{title}</div>
    <div className={`${valueTextSize} font-bold ${textColor} print:text-lg`}>{formatCurrency(value)}</div>
    {detail && <div className="text-xs text-slate-500 mt-0.5 print:text-[7pt]">{detail}</div>}
  </div>
);

const BalanceDifferenceIndicator = ({ difference, totalAssets }) => {
  // Use a small absolute threshold for "Equilibrado" to account for minor float discrepancies.
  const isEffectivelyZero = Math.abs(difference) < 0.015; // e.g., less than 1.5 cents
  const diffPercentage = totalAssets !== 0 ? Math.abs(difference / totalAssets * 100) : 0;
  
  // Determine severity for styling based on the magnitude of the difference relative to assets
  let severity = 'ok';
  let message = '✅ Equilibrado';
  if (!isEffectivelyZero) {
    if (diffPercentage > 5) { // More than 5% of assets is critical
        severity = 'critical';
        message = `⚠️ ${diffPercentage.toFixed(1)}% dos Ativos (Crítico!)`;
    } else if (diffPercentage > 1) { // More than 1% is a warning
        severity = 'warning';
        message = `⚠️ ${diffPercentage.toFixed(1)}% dos Ativos (Revisar)`;
    } else { // Small difference, but not zero
        severity = 'ok'; // Still okay, but not perfectly zero
        message = `~ ${diffPercentage.toFixed(1)}% dos Ativos (Pequena Diferença)`;
    }
  }
  
  const severityStyles = {
    critical: 'bg-red-100 text-red-700 border-red-400 print:bg-red-50 print:border-red-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-400 print:bg-yellow-50 print:border-yellow-300',
    ok: 'bg-green-100 text-green-700 border-green-400 print:bg-green-50 print:border-green-300'
  };

  return (
    <div className={`inline-flex flex-col items-center font-bold p-3 rounded-md border-2 ${severityStyles[severity]} min-w-[220px] print:p-2`}>
      <div className="text-lg print:text-base">{formatCurrency(difference)}</div>
      <div className="text-xs font-normal mt-1 print:text-[7pt]">{message}</div>
      {severity === 'critical' && (
        <div className="text-xs mt-2 max-w-xs text-center print:hidden">
          Diferença crítica detectada - revisar inputs urgentemente!
        </div>
      )}
    </div>
  );
};

const NetDebtIndicator = ({ netDebt, totalAssets }) => {
  const isNetCashPosition = netDebt < 0;
  const debtToAssetsRatio = totalAssets !== 0 ? Math.abs(netDebt / totalAssets * 100) : 0;
  
  return (
    <div className="flex flex-col items-center">
      <span className="font-semibold text-slate-700 text-sm mb-1">
        {isNetCashPosition ? "Posição Líquida de Caixa:" : "Dívida Líquida:"}
      </span>
      <span className={`font-bold text-lg ${isNetCashPosition ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(Math.abs(netDebt))}
      </span>
      {totalAssets !== 0 && (
        <span className="text-xs text-slate-500 mt-0.5">
          ({debtToAssetsRatio.toFixed(1)}% dos Ativos Totais)
        </span>
      )}
    </div>
  );
};

export default function BalanceSheetEquation({ calculatedData }) {
  if (!calculatedData || calculatedData.length === 0) {
    return ( <div className="p-8 bg-slate-50 rounded-xl border-2 border-slate-200 text-center"> <p className="text-slate-500">Dados insuficientes para a Equação Patrimonial.</p> </div> );
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  
  // All values sourced directly from the SSOT (latestPeriod object)
  const totalAssets = latestPeriod.estimatedTotalAssets || 0;
  const totalLiabilities = latestPeriod.estimatedTotalLiabilities || 0;
  const equity = latestPeriod.equity || 0;
  const balanceSheetDifference = latestPeriod.balanceSheetDifference || 0; // This is A - (L+E)
  
  const netDebt = (latestPeriod.totalBankLoans || 0) - (latestPeriod.closingCash || 0);

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        ⚖️ Equação Patrimonial Fundamental (Último Período)
      </h3>
      <div className="bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 p-6 md:p-8 rounded-xl shadow-xl border border-slate-300 print:shadow-none print:border-slate-400">
        
        <div className="flex flex-col xl:flex-row items-center justify-around space-y-8 xl:space-y-0 xl:space-x-4 mb-8">
          {/* Assets Side */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Total Ativos</h4>
            <ValueCard title="Ativos Totais (Estimado)" value={totalAssets} 
              bgColor="bg-sky-100 print:bg-sky-50" borderColor="border-sky-400 print:border-sky-300" textColor="text-sky-700" titleColor="text-sky-600"/>
          </div>

          <div className="flex items-center justify-center my-3 xl:my-0">
            <div className="bg-slate-700 text-white p-3 md:p-4 rounded-full shadow-lg transform transition-transform hover:scale-105 print:bg-slate-800">
              <div className="text-2xl md:text-3xl font-bold">=</div>
            </div>
          </div>

          {/* Liabilities + Equity Side */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Total Passivos + Patrimônio Líquido</h4>
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <ValueCard title="Total Passivos (Estimado)" value={totalLiabilities} 
                bgColor="bg-rose-100 print:bg-rose-50" borderColor="border-rose-400 print:border-rose-300" textColor="text-rose-700" titleColor="text-rose-600"/>
              <div className="text-2xl font-bold text-slate-500 mx-1 my-2 sm:my-0">+</div>
              <ValueCard title="Patrimônio Líquido (Final)" value={equity} 
                bgColor="bg-emerald-100 print:bg-emerald-50" borderColor="border-emerald-400 print:border-emerald-300" textColor="text-emerald-700" titleColor="text-emerald-600"/>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-3 border-t-2 border-slate-400 pt-2 w-full max-w-sm text-center">
                {formatCurrency(totalLiabilities + equity)}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-300 text-center">
            <p className="text-sm text-slate-600 mb-2 font-medium">
                Verificação da Equação (Ativos - (Passivos + PL)):
            </p>
            <BalanceDifferenceIndicator difference={balanceSheetDifference} totalAssets={totalAssets} />
             {Math.abs(balanceSheetDifference) > 1.01 && ( // Using same threshold as indicator
                <p className="text-xs text-red-600 mt-3 max-w-md mx-auto">
                    Uma "Diferença de Balanço" indica que os valores de Ativos, Passivos e PL fornecidos ou calculados não se igualam perfeitamente. Isso geralmente requer revisão dos inputs para maior precisão.
                </p>
            )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-300 text-center">
            <NetDebtIndicator netDebt={netDebt} totalAssets={totalAssets} />
        </div>
      </div>
    </section>
  );
}