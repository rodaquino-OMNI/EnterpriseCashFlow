// src/components/ReportPanel/FinancialTables.jsx
import React from 'react';
import { formatCurrency, formatPercentage, formatDays } from '../../utils/formatters';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * periodType: string;
 * detailedMode: boolean;
 * }} props
 */
export default function FinancialTables({ calculatedData, periodType, detailedMode }) {
  if (!calculatedData || calculatedData.length === 0) {
    return <div className="text-center text-slate-500 my-4">Nenhum dado calculado disponível.</div>;
  }

  const periodLabel = PERIOD_TYPES[periodType]?.shortLabel || periodType;

  // Table row component for consistent rendering
  const TableRow = ({ label, values, format = formatCurrency, isBold = false, isCalculated = false, isTotal = false, isSubtotal = false, isHighlight = false, note = null, isSpacer = false }) => {
    if (isSpacer) {
      return <tr><td colSpan={calculatedData.length + 1} className="border-0 p-1"></td></tr>;
    }

    const getTrendIndicator = (vals) => {
      if (vals.length < 2) return '—';
      const firstValid = vals.find(v => v !== null && v !== undefined);
      const lastValid = [...vals].reverse().find(v => v !== null && v !== undefined);
      if (firstValid === undefined || lastValid === undefined) return '—';
      const diff = lastValid - firstValid;
      if (Math.abs(diff) < 0.001) return '→';
      return diff > 0 ? '↗' : '↘';
    };

    const rowClass = `${isBold || isTotal || isSubtotal || isHighlight ? 'font-bold' : ''} ${isTotal ? 'bg-blue-50 border-t-2 border-blue-300' : ''} ${isSubtotal ? 'bg-slate-50' : ''} ${isHighlight ? 'bg-amber-50' : ''} hover:bg-slate-25`;
    const labelClass = `border p-2 text-left ${isCalculated ? 'text-blue-700 italic' : ''}`;

    return (
      <tr className={rowClass}>
        <td className={labelClass}>
          {label}
          {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
        </td>
        {values.map((value, idx) => (
          <td key={idx} className="border p-2 text-right">
            {format(value)}
          </td>
        ))}
        {values.length > 1 && (
          <td className="border p-2 text-center">{getTrendIndicator(values)}</td>
        )}
      </tr>
    );
  };

  const dreItems = [
    {label: 'Receita Líquida', key: 'revenue', format: formatCurrency, isBold: true},
    {label: '(-) Custo dos Produtos/Serviços Vendidos', key: 'cogs', format: formatCurrency},
    {label: '(=) Margem Bruta', key: 'grossProfit', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: '→ Margem Bruta %', key: 'gmPct', format: formatPercentage, isCalculated: true},
    {label: '(-) Despesas Operacionais Totais', key: 'operatingExpenses', format: formatCurrency},
    {label: '(=) EBITDA', key: 'ebitda', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: '(-) Depreciação e Amortização', key: 'depreciationAndAmortisation', format: formatCurrency},
    {label: '(=) EBIT (Resultado Operacional)', key: 'ebit', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: '→ Margem Operacional %', key: 'opProfitPct', format: formatPercentage, isCalculated: true},
    {label: '(+/-) Resultado Financeiro Líquido', key: 'netInterestExpenseIncome', format: formatCurrency},
    {label: '(+/-) Itens Extraordinários', key: 'extraordinaryItems', format: formatCurrency},
    {label: '(=) Lucro Antes dos Impostos (LAIR)', key: 'pbt', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: '(-) Imposto de Renda', key: 'incomeTax', format: formatCurrency},
    {label: '(=) Lucro Líquido Final', key: 'netProfit', format: formatCurrency, isBold: true, isTotal: true},
    {label: '→ Margem Líquida %', key: 'netProfitPct', format: formatPercentage, isCalculated: true},
  ];

  const wcAnalysisItems = [ 
    {label: 'Contas a Receber (Valor Médio - Input)', key: 'accountsReceivableValueAvg', format: formatCurrency},
    {label: '→ PMR Calculado (Dias)', key: 'arDaysDerived', format: formatDays, isCalculated: true},
    {label: 'Estoques (Valor Médio - Input)', key: 'inventoryValueAvg', format: formatCurrency}, 
    {label: '→ PME Calculado (Dias)', key: 'inventoryDaysDerived', format: formatDays, isCalculated: true}, // CORRECTED
    {label: '(-) Contas a Pagar (Valor Médio - Input)', key: 'accountsPayableValueAvg', format: formatCurrency},
    {label: '→ PMP Calculado (Dias)', key: 'apDaysDerived', format: formatDays, isCalculated: true},
    {label: '(=) Capital de Giro (Operacional)', key: 'workingCapitalValue', format: formatCurrency, isBold: true, isTotal:true},
    {label: '→ Ciclo de Caixa Calculado (Dias)', key: 'wcDays', format: formatDays, isBold: true, isCalculated: true}, // Uses derived days
    {label: ' ', key: 'spacer1', isSpacer: true}, 
    {label: 'Contas a Receber / Receita %', key: 'arPer100Revenue', format: formatPercentage},
    {label: 'Estoques / Receita %', key: 'inventoryPer100Revenue', format: formatPercentage},
    {label: 'Contas a Pagar / CPV %', key: 'apPer100Revenue', format: formatPercentage, note: 'vs CPV'}, // CORRECTED LABEL
    {label: 'Capital de Giro / Receita %', key: 'wcPer100Revenue', format: formatPercentage, isBold: true, isSubtotal:true},
  ];

  const cashFlowItems = [ 
    {label: 'Saldo Inicial de Caixa', key: 'openingCashStart', format: formatCurrency, note: 'Calculado ou informado'},
    {label: 'Fluxo de Caixa Operacional (FCO)', key: 'operatingCashFlow', format: formatCurrency, isBold: true},
    {label: '(-) Investimento em Capital de Giro', key: 'workingCapitalChange', format: formatCurrency, note: 'Positivo = Uso de caixa'},
    {label: '(=) Fluxo Operacional após Capital de Giro', key: 'cashFromOpsAfterWC', format: formatCurrency, isSubtotal: true},
    {label: '(-) Investimentos em Ativo Imobilizado (CAPEX)', key: 'capitalExpenditures', format: formatCurrency},
    {label: '(=) Fluxo de Caixa Livre (antes Financiamentos)', key: 'netCashFlowBeforeFinancing', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: ' ', key: 'spacer1', isSpacer: true},
    {label: 'Variação de Empréstimos/Financiamentos', key: 'changeInDebt', format: formatCurrency, note: 'Positivo = Captação'},
    {label: '(-) Dividendos e Distribuições', key: 'dividendsPaid', format: formatCurrency},
    {label: '(=) Fluxo de Financiamentos', key: 'cashFlowFromFinancing', format: formatCurrency, isSubtotal: true},
    {label: ' ', key: 'spacer2', isSpacer: true},
    {label: '(=) Variação Líquida de Caixa', key: 'netChangeInCash', format: formatCurrency, isBold: true},
    {label: '(+) Saldo Inicial de Caixa', key: 'openingCashEnd', format: formatCurrency},
    {label: '(=) Saldo Final de Caixa (Calculado)', key: 'closingCash', format: formatCurrency, isBold: true, isTotal: true},
    {label: ' ', key: 'spacer3', isSpacer: true},
    {label: 'Necessidade (+)/Excedente (-) de Financiamento', key: 'fundingGapOrSurplus', format: formatCurrency, isBold:true, isHighlight:true, note: 'Positivo = Necessidade de caixa externa, Negativo = Excedente de caixa'}, // CORRECTED NOTE
  ];

  const balanceSheetAssetItems = [ 
    {label: 'Caixa e Equivalentes', key: 'closingCash', format: formatCurrency},
    {label: 'Contas a Receber (Médio)', key: 'accountsReceivableValueAvg', format: formatCurrency, note: 'Valor médio usado como proxy'},
    {label: 'Estoques (Médio)', key: 'inventoryValueAvg', format: formatCurrency, note: 'Valor médio usado como proxy'},
    {label: '(=) Ativo Circulante (Estimado)', key: 'estimatedCurrentAssets', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: 'Ativo Imobilizado (Líquido)', key: 'netFixedAssets', format: formatCurrency},
    {label: '(=) ATIVO TOTAL (Estimado)', key: 'estimatedTotalAssets', format: formatCurrency, isBold: true, isTotal: true},
  ];

  const balanceSheetLiabilityEquityItems = [ 
    {label: 'Contas a Pagar (Médio)', key: 'accountsPayableValueAvg', format: formatCurrency, note: 'Valor médio usado como proxy'},
    {label: '(=) Passivo Circulante (Estimado)', key: 'estimatedCurrentLiabilities', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: 'Empréstimos Bancários Totais', key: 'totalBankLoans', format: formatCurrency},
    {label: '(=) Passivo Total (Estimado)', key: 'estimatedTotalLiabilities', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: 'Patrimônio Líquido (Calculado)', key: 'equity', format: formatCurrency, isBold: true, isSubtotal: true},
    {label: '(=) TOTAL PASSIVO + P.L.', key: 'estimatedTotalLiabilitiesAndEquity', format: formatCurrency, isBold: true, isTotal: true, 
     note: 'Calculado: Passivo Total + Patrimônio Líquido'},
    {label: ' ', key: 'spacer1', isSpacer: true},
    {label: 'DIFERENÇA DE BALANÇO (A - (L+PL))', key: 'balanceSheetDifference', format: formatCurrency, isHighlight: true, 
     note: 'Deve estar próximo de zero para consistência'},
  ];

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

  const renderTableSection = (title, items) => {
    const processedItems = items.map((item, originalIndex) => {
      if (item.isSpacer) return { ...item, uniqueKey: `spacer-${originalIndex}` };
      
      let values;
      if (item.key === 'estimatedTotalLiabilitiesAndEquity') {
        // Special calculation for Total Liabilities + Equity
        values = calculatedData.map(period => 
          (period.estimatedTotalLiabilities || 0) + (period.equity || 0)
        );
      } else if (item.key === 'openingCashStart' || item.key === 'openingCashEnd') {
        // Both openingCashStart and openingCashEnd map to the same data field
        values = calculatedData.map(period => period.openingCash);
      } else {
        values = calculatedData.map(period => period[item.key]);
      }
      
      return { ...item, values, uniqueKey: `${item.key}-${originalIndex}` };
    });

    return (
      <table className="min-w-full border-collapse mb-8 print:mb-4">
        <thead>
          <tr>
            <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center print:text-sm">
              {title}
            </th>
          </tr>
          <tr>
            <th className="border p-2 text-left bg-blue-50 print:text-sm">Item</th>
            {generatePeriodHeaders()}
          </tr>
        </thead>
        <tbody>
          {processedItems.map((item) => {
            const { uniqueKey, ...itemProps } = item;
            return <TableRow key={uniqueKey} {...itemProps} />;
          })}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {renderTableSection("Demonstração do Resultado (DRE)", dreItems)}
      {renderTableSection("Análise Detalhada do Capital de Giro", wcAnalysisItems)}
      {renderTableSection("Análise de Fluxo de Caixa (Cash Flow Story)", cashFlowItems)}
      {renderTableSection("Balanço Patrimonial (Resumido)", [
          {isHeader: true, label: "ATIVOS"},
          ...balanceSheetAssetItems,
          {isHeader: true, label: "PASSIVOS E PATRIMÔNIO LÍQUIDO"},
          ...balanceSheetLiabilityEquityItems
      ])}
    </>
  );
}