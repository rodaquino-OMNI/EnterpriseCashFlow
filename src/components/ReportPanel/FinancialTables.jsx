// src/components/ReportPanel/FinancialTables.jsx
import React from 'react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * periodType: string;
 * detailedMode: boolean;
 * }} props
 */
export default function FinancialTables({ calculatedData, periodType, detailedMode }) {
  const periodLabel = PERIOD_TYPES[periodType]?.shortLabel || periodType;

  const generatePeriodHeaders = (withTrend = true) => {
    return (
      <>
        {calculatedData.map((_, idx) => (
          <th key={`period-${idx}`} className="border p-2 text-center whitespace-nowrap bg-blue-50">
            P{idx + 1} ({periodLabel})
          </th>
        ))}
        {withTrend && calculatedData.length > 1 && (
          <th className="border p-2 text-center whitespace-nowrap bg-blue-100">
            Tendência
          </th>
        )}
      </>
    );
  };

  const getColumnLabel = (key) => {
    const labels = {
      'revenue': 'Receita',
      'cogs': 'Custo de Vendas',
      'grossProfit': 'Lucro Bruto',
      'gmPct': 'Margem Bruta (%)',
      'operatingExpenses': 'Despesas Operacionais',
      'ebitda': 'EBITDA',
      'depreciationAndAmortisation': 'Depreciação e Amortização',
      'ebit': 'EBIT (Res. Operacional)',
      'netInterestExpenseIncome': 'Despesas/Receitas Financeiras',
      'extraordinaryItems': 'Itens Extraordinários',
      'pbt': 'Lucro Antes dos Impostos',
      'incomeTax': 'Impostos s/ Lucro',
      'netProfit': 'Lucro Líquido',
      'netProfitPct': 'Margem Líquida (%)',
      'openingCash': 'Saldo Inicial de Caixa',
      'closingCash': 'Saldo Final de Caixa',
      'accountsReceivableValueAvg': 'Contas a Receber',
      'inventoryValueAvg': 'Estoque (Valor Médio - Input)',
      'accountsPayableValueAvg': 'Contas a Pagar',
      'workingCapitalValue': 'Capital de Giro',
      'workingCapitalChange': 'Variação do Capital de Giro',
      'netFixedAssets': 'Ativo Imobilizado',
      'totalBankLoans': 'Empréstimos Bancários',
      'equity': 'Patrimônio Líquido',
      'operatingCashFlow': 'Fluxo de Caixa Operacional',
      'cashFromOpsAfterWC': 'Fluxo Operacional após WC',
      'capitalExpenditures': 'CAPEX',
      'netCashFlowBeforeFinancing': 'Fluxo antes de Financiamentos',
      'changeInDebt': 'Variação de Empréstimos',
      'dividendsPaid': 'Dividendos Pagos',
      'cashFlowFromFinancing': 'Fluxo de Financiamentos',
      'netChangeInCash': 'Variação Líquida de Caixa',
      'fundingGapOrSurplus': 'Necessidade (+)/Excedente (-) de Financiamento',
      'arDaysDerived': 'PMR (dias)',
      'inventoryDaysDerived': '→ PME Calculado (Dias)',
      'apDaysDerived': 'PMP (dias)',
      'wcDays': 'Ciclo de Caixa (dias)'
    };
    return labels[key] || key;
  };

  const isPercentageField = (key) => {
    return key.toLowerCase().includes('pct') || key.toLowerCase().includes('margin');
  };

  const formatCellValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    if (isPercentageField(key)) return formatPercentage(value);
    if (key.includes('days') || key.includes('Days')) {
      return value.toFixed(1) + ' dias';
    }
    return formatCurrency(value);
  };

  const getTrendIndicator = (values) => {
    if (values.length < 2) return '—';
    
    const firstValid = values.find(v => v !== null && v !== undefined);
    const lastValid = [...values].reverse().find(v => v !== null && v !== undefined);
    
    if (firstValid === undefined || lastValid === undefined) return '—';
    
    const diff = lastValid - firstValid;
    if (Math.abs(diff) < 0.001) return '→';
    
    return diff > 0 ? '↗' : '↘';
  };

  const renderTable = (title, fields) => (
    <table className="min-w-full border-collapse mb-8">
      <thead>
        <tr>
          <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center">
            {title}
          </th>
        </tr>
        <tr>
          <th className="border p-2 text-left bg-blue-50">Item</th>
          {generatePeriodHeaders()}
        </tr>
      </thead>
      <tbody>
        {fields.map(key => {
          const values = calculatedData.map(p => p[key]);
          return (
            <tr key={key} className="hover:bg-slate-50">
              <td className="border p-2 font-medium">{getColumnLabel(key)}</td>
              {values.map((value, idx) => (
                <td key={idx} className="border p-2 text-right">
                  {formatCellValue(key, value)}
                </td>
              ))}
              {values.length > 1 && (
                <td className="border p-2 text-center">
                  {getTrendIndicator(values)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const profitLossFields = [
    'revenue', 'cogs', 'grossProfit', 'gmPct', 'operatingExpenses', 
    'ebitda', 'depreciationAndAmortisation', 'ebit', 'netInterestExpenseIncome', 
    'extraordinaryItems', 'pbt', 'incomeTax', 'netProfit', 'netProfitPct'
  ];

  const cashFlowFields = [
    'openingCash', 'operatingCashFlow', 'workingCapitalChange', 'cashFromOpsAfterWC',
    'capitalExpenditures', 'netCashFlowBeforeFinancing', 'changeInDebt',
    'dividendsPaid', 'cashFlowFromFinancing', 'netChangeInCash', 'closingCash'
  ];

  const workingCapitalFields = [
    'accountsReceivableValueAvg', 'arDaysDerived',
    'inventoryValueAvg', 'inventoryDaysDerived',
    'accountsPayableValueAvg', 'apDaysDerived',
    'workingCapitalValue', 'wcDays', 'workingCapitalChange'
  ];

  const balanceSheetFields = [
    'closingCash', 'accountsReceivableValueAvg', 'inventoryValueAvg', 'netFixedAssets',
    'accountsPayableValueAvg', 'totalBankLoans', 'equity'
  ];

  return (
    <div className="financial-tables">
      {renderTable('Demonstração de Resultados', profitLossFields)}
      {renderTable('Fluxo de Caixa', cashFlowFields)}
      {detailedMode && renderTable('Análise de Capital de Giro', workingCapitalFields)}
      {detailedMode && renderTable('Balanço Patrimonial (Simplificado)', balanceSheetFields)}
    </div>
  );
}