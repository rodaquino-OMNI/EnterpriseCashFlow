// src/components/ReportPanel/FundingReconciliation.jsx
import React from 'react';
import { formatCurrency, getMovementClass, getMovementIndicator } from '../../utils/formatters';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * companyInfo: import('../../types/financial').CompanyInfo;
 * }} props
 */
export default function FundingReconciliation({ calculatedData, companyInfo }) {
  if (!calculatedData || calculatedData.length < 1) { // Needs at least one period for current state, 2 for changes
    return (
      <section className="mb-8 page-break-after">
        <h3 className="report-section-title">💰 Sua História de Financiamento</h3>
        <p className="text-slate-500">Dados insuficientes para análise de financiamento.</p>
      </section>
    );
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const previousPeriod = calculatedData.length > 1 ? calculatedData[calculatedData.length - 2] : null;

  // Values for the "Posição Atual" card - focusing on latest period's balance sheet items
  const currentCash = latestPeriod.closingCash;
  const currentDebt = latestPeriod.totalBankLoans;
  const currentEquity = latestPeriod.equity;
  const currentTotalFunding = currentDebt + currentEquity; // Typical definition of total capital/funding

  let changeInCash = null, changeInDebt = null, changeInEquity = null, changeInTotalFunding = null;

  if (previousPeriod) {
    changeInCash = latestPeriod.closingCash - previousPeriod.closingCash;
    changeInDebt = latestPeriod.totalBankLoans - previousPeriod.totalBankLoans;
    changeInEquity = latestPeriod.equity - previousPeriod.equity;
    changeInTotalFunding = currentTotalFunding - ((previousPeriod.totalBankLoans || 0) + (previousPeriod.equity || 0));
  }

  // For Cash Flow Reconciliation (Sources & Uses leading to Change in Cash)
  // These are flows *during* the latest period
  const retainedProfitForLatestPeriod = latestPeriod.retainedProfit;
  const netNewDebtForLatestPeriod = latestPeriod.changeInDebt; // This is already (Current Loans - Prior Loans)
  const investmentInWCLatestPeriod = latestPeriod.workingCapitalChange; // (Current WC - Prior WC)
  const capexLatestPeriod = latestPeriod.capitalExpenditures;
  const dividendsLatestPeriod = latestPeriod.dividendsPaid;

  // Sources for latest period
  const sources = retainedProfitForLatestPeriod + (netNewDebtForLatestPeriod > 0 ? netNewDebtForLatestPeriod : 0);
  // Uses for latest period
  const uses = (investmentInWCLatestPeriod > 0 ? investmentInWCLatestPeriod : 0) + // Only count if it's an investment (use of cash)
    capexLatestPeriod +
    dividendsLatestPeriod +
    (netNewDebtForLatestPeriod < 0 ? Math.abs(netNewDebtForLatestPeriod) : 0); // Debt repayment is a use

  const calculatedNetChangeInCashFromSourcesUses = sources - uses;
  const observedNetChangeInCash = latestPeriod.netChangeInCash; // From cash flow statement

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">
        💰 Sua História de Financiamento (Foco no Último Período)
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Funding Position Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border-l-4 border-blue-500 print:shadow-none print:border-blue-300">
          <h4 className="text-xl font-bold text-blue-800 mb-4">Posição de Financiamento (Final do Último Período)</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600">Caixa e Equivalentes</span>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{formatCurrency(currentCash)}</div>
                {changeInCash !== null && <div className={`text-xs ${getMovementClass(changeInCash)}`}>({getMovementIndicator(changeInCash)} {formatCurrency(Math.abs(changeInCash), false)} vs Per. Ant.)</div>}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600">Empréstimos Bancários Totais</span>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{formatCurrency(currentDebt)}</div>
                {changeInDebt !== null && <div className={`text-xs ${getMovementClass(-changeInDebt)}`}>({getMovementIndicator(-changeInDebt)} {formatCurrency(Math.abs(changeInDebt), false)} vs Per. Ant.)</div>}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-600">Patrimônio Líquido</span>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800">{formatCurrency(currentEquity)}</div>
                {changeInEquity !== null && <div className={`text-xs ${getMovementClass(changeInEquity)}`}>({getMovementIndicator(changeInEquity)} {formatCurrency(Math.abs(changeInEquity), false)} vs Per. Ant.)</div>}
              </div>
            </div>
            <div className="border-t border-blue-200 pt-3 mt-3">
              <div className="flex justify-between font-bold items-center">
                <span className="text-slate-700">Total Capital Investido (Dívida + PL)</span>
                <div className="text-right">
                  <div className="text-xl text-blue-600">{formatCurrency(currentTotalFunding)}</div>
                  {changeInTotalFunding !== null && <div className={`text-xs ${getMovementClass(changeInTotalFunding)}`}>({getMovementIndicator(changeInTotalFunding)} {formatCurrency(Math.abs(changeInTotalFunding), false)} vs Per. Ant.)</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Reconciliation / Sources & Uses Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-l-4 border-green-500 print:shadow-none print:border-green-300">
          <h4 className="text-xl font-bold text-green-800 mb-4">Fontes e Usos de Caixa (Durante o Último Período)</h4>
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="text-sm font-bold text-green-700 mb-1.5">✅ Fontes de Caixa</h5>
              <div className="space-y-1.5 ml-4">
                <div className="flex justify-between"><span className="text-slate-600">Lucro Retido no Período</span><span className="font-semibold text-green-600">{formatCurrency(retainedProfitForLatestPeriod)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Novos Empréstimos (Líquido)</span><span className="font-semibold text-green-600">{formatCurrency(netNewDebtForLatestPeriod > 0 ? netNewDebtForLatestPeriod : 0)}</span></div>
                {/* Other sources like equity issuance would go here if captured */}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-bold text-red-700 mb-1.5">💸 Usos de Caixa</h5>
              <div className="space-y-1.5 ml-4">
                <div className="flex justify-between"><span className="text-slate-600">Investimento em Capital de Giro</span><span className="font-semibold text-red-600">{formatCurrency(investmentInWCLatestPeriod > 0 ? investmentInWCLatestPeriod : 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">CAPEX</span><span className="font-semibold text-red-600">{formatCurrency(capexLatestPeriod)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Dividendos Pagos</span><span className="font-semibold text-red-600">{formatCurrency(dividendsLatestPeriod)}</span></div>
                {netNewDebtForLatestPeriod < 0 && <div className="flex justify-between"><span className="text-slate-600">Pagamento de Dívidas</span><span className="font-semibold text-red-600">{formatCurrency(Math.abs(netNewDebtForLatestPeriod))}</span></div>}
              </div>
            </div>
            <div className="border-t border-green-200 pt-3 mt-3">
              <div className="flex justify-between font-bold items-center">
                <span className="text-slate-700">Variação Líquida de Caixa (Calculada Fontes-Usos):</span>
                <span className={`text-lg ${getMovementClass(calculatedNetChangeInCashFromSourcesUses)}`}>{formatCurrency(calculatedNetChangeInCashFromSourcesUses)}</span>
              </div>
              <div className="flex justify-between font-semibold items-center text-xs mt-1">
                <span className="text-slate-600">Variação Líquida de Caixa (Conforme DFC):</span>
                <span className={`text-sm ${getMovementClass(observedNetChangeInCash)}`}>{formatCurrency(observedNetChangeInCash)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-slate-500">Diferença de Reconciliação:</span>
                <span className={`font-medium ${Math.abs(observedNetChangeInCash - calculatedNetChangeInCashFromSourcesUses) > 1 ? 'text-orange-500' : 'text-slate-500'}`}>
                  {formatCurrency(observedNetChangeInCash - calculatedNetChangeInCashFromSourcesUses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4 text-center">
        A "História de Financiamento" detalha como a posição de financiamento mudou e como as atividades do período impactaram o caixa. Pequenas diferenças na reconciliação podem ocorrer devido a arredondamentos ou itens não detalhados.
      </p>
    </section>
  );
}