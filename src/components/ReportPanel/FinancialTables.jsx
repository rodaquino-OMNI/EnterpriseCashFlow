// src/components/ReportPanel/FinancialTables.jsx
import React, { useMemo } from 'react';
import { formatCurrency, formatPercentage, formatDays } from '../../utils/formatters';
import { PERIOD_TYPES } from '../../utils/constants';

/**
 * @param {{
 * calculatedData: import('../../types/financial').CalculatedPeriodData[];
 * periodType: string;
 * detailedMode: boolean;
 * }} props
 */
export default function FinancialTables({ calculatedData, periodType, detailedMode = false }) {
  // Memoize formatters to prevent recreation on each render
  const formatTableCurrency = useMemo(() => (value) => formatCurrency(value, false), []);
  
  // Memoize table configurations to prevent recreation
  const tableConfigs = useMemo(() => {
    // P&L Table Configuration
    const pnlItems = [
      {label: 'Receita Líquida', key: 'revenue', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(-) CPV/CSV', key: 'cogs', format: formatTableCurrency},
      {label: '(=) Lucro Bruto', key: 'grossProfit', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '→ Margem Bruta %', key: 'gmPct', format: formatPercentage, isCalculated: true},
      {label: '(-) Despesas Operacionais', key: 'operatingExpenses', format: formatTableCurrency},
      {label: '(=) EBITDA', key: 'ebitda', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '→ Margem EBITDA %', key: 'ebitdaPct', format: formatPercentage, isCalculated: true},
      {label: '(-) D&A', key: 'depreciationAndAmortisation', format: formatTableCurrency},
      {label: '(=) EBIT', key: 'ebit', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '→ Margem Operacional %', key: 'opProfitPct', format: formatPercentage, isCalculated: true},
      {label: '(+/-) Resultado Financeiro Líquido', key: 'netInterestExpenseIncome', format: formatTableCurrency},
      {label: '(+/-) Itens Extraordinários', key: 'extraordinaryItems', format: formatTableCurrency},
      {label: '(=) Lucro Antes dos Impostos (LAIR)', key: 'pbt', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(-) Imposto de Renda', key: 'incomeTax', format: formatTableCurrency},
      {label: '(=) Lucro Líquido', key: 'netProfit', format: formatTableCurrency, isBold: true, isTotal: true},
      {label: '→ Margem Líquida %', key: 'netProfitPct', format: formatPercentage, isCalculated: true}
    ];

    // Working Capital Table Configuration  
    const workingCapitalItems = [
      {label: '(+) Contas a Receber (Valor Médio - Input)', key: 'accountsReceivableValueAvg', format: formatTableCurrency}, 
      {label: '→ PMR Calculado (Dias)', key: 'arDaysDerived', format: formatDays, isCalculated: true},
      {label: '(+) Estoques (Valor Médio - Input)', key: 'inventoryValueAvg', format: formatTableCurrency}, 
      {label: '→ PME Calculado (Dias)', key: 'inventoryDaysDerived', format: formatDays, isCalculated: true},
      {label: '(-) Contas a Pagar (Valor Médio - Input)', key: 'accountsPayableValueAvg', format: formatTableCurrency},
      {label: '→ PMP Calculado (Dias)', key: 'apDaysDerived', format: formatDays, isCalculated: true},
      {label: '(=) Capital de Giro (Operacional)', key: 'workingCapitalValue', format: formatTableCurrency, isBold: true, isTotal:true},
      {label: '→ Ciclo de Caixa Calculado (Dias)', key: 'wcDays', format: formatDays, isBold: true, isCalculated: true},
      {label: ' ', key: 'spacer1', isSpacer: true}, 
      {label: 'Contas a Receber / Receita %', key: 'arPer100Revenue', format: formatPercentage},
      {label: 'Estoques / Receita %', key: 'inventoryPer100Revenue', format: formatPercentage},
      {label: 'Contas a Pagar / CPV %', key: 'apPer100Revenue', format: formatPercentage, note: 'vs CPV'},
      {label: 'Capital de Giro / Receita %', key: 'wcPer100Revenue', format: formatPercentage}
    ];

    // Cash Flow Table Configuration
    const cashFlowItems = [
      {label: 'Caixa Inicial', key: 'openingCash', format: formatTableCurrency, isBold: true},
      {label: '(+) Fluxo de Caixa Operacional', key: 'operatingCashFlow', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(-) Variação Capital de Giro', key: 'workingCapitalChange', format: formatTableCurrency},
      {label: '(-) CAPEX', key: 'capitalExpenditures', format: formatTableCurrency},
      {label: '(=) FCL (antes Financiamento)', key: 'netCashFlowBeforeFinancing', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(+/-) Variação Empréstimos', key: 'debtChangeNet', format: formatTableCurrency},
      {label: '(-) Dividendos Pagos', key: 'dividendsPaid', format: formatTableCurrency},
      {label: '(=) Variação Líquida de Caixa', key: 'netChangeInCash', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(=) Caixa Final (Calculado DFC)', key: 'closingCash', format: formatTableCurrency, isBold: true, isTotal: true},
    ];

    // Balance Sheet Tables
    const balanceSheetAssetItems = [
      {label: 'Caixa e Equivalentes (Final)', key: 'closingCash', format: formatTableCurrency, isBold: true},
      {label: 'Contas a Receber (Média)', key: 'accountsReceivableValueAvg', format: formatTableCurrency},
      {label: 'Estoques (Média)', key: 'inventoryValueAvg', format: formatTableCurrency},
      {label: '(=) Ativo Circulante (Estimado)', key: 'estimatedCurrentAssets', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: 'Ativo Fixo Líquido', key: 'netFixedAssets', format: formatTableCurrency},
      {label: '(=) ATIVO TOTAL (Estimado)', key: 'estimatedTotalAssets', format: formatTableCurrency, isBold: true, isTotal: true}
    ];

    const balanceSheetLiabilityEquityItems = [
      {label: 'Contas a Pagar (Média)', key: 'accountsPayableValueAvg', format: formatTableCurrency},
      {label: '(=) Passivo Circulante (Estimado)', key: 'estimatedCurrentLiabilities', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: 'Empréstimos Bancários Totais', key: 'totalBankLoans', format: formatTableCurrency},
      {label: '(=) Passivo Total (Estimado)', key: 'estimatedTotalLiabilities', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: 'Patrimônio Líquido (Calculado)', key: 'equity', format: formatTableCurrency, isBold: true, isSubtotal: true},
      {label: '(=) TOTAL PASSIVO + P.L.', key: 'estimatedTotalLiabilitiesAndEquity', format: formatTableCurrency, isBold: true, isTotal: true, 
       note: 'Calculado: Passivo Total + Patrimônio Líquido'},
      {label: ' ', key: 'spacer1', isSpacer: true},
      {label: 'Diferença de Balanço (A-(L+E))', key: 'balanceSheetDifference', format: formatTableCurrency, isHighlight: true, 
       note: 'Deve ser próximo de zero para balanço fechado'}
    ];

    return {
      'Demonstração de Resultado (P&L)': pnlItems,
      'Capital de Giro e Prazos': workingCapitalItems,
      'Demonstração de Fluxo de Caixa (DFC)': cashFlowItems,
      'Balanço Patrimonial (Estimado)': [
        {isHeader: true, label: "ATIVOS"},
        ...balanceSheetAssetItems,
        {isHeader: true, label: "PASSIVOS E PATRIMÔNIO LÍQUIDO"},
        ...balanceSheetLiabilityEquityItems
      ]
    };
  }, [formatTableCurrency]);

  // Memoize period headers generation
  const generatePeriodHeaders = useMemo(() => {
    if (!calculatedData?.length) return [];
    
    return calculatedData.map((_, index) => (
      <th key={index} className="border p-2 text-center bg-blue-50 print:text-sm">
        {PERIOD_TYPES[periodType]?.shortLabel || 'Per.'} {index + 1}
      </th>
    ));
  }, [calculatedData, periodType]);

  // Optimized table row component
  const TableRow = React.memo(({ item, values, originalIndex }) => {
    if (item.isSpacer) {
      return <tr><td colSpan={calculatedData.length + 1} className="border-0 p-1"></td></tr>;
    }

    if (item.isHeader) {
      return (
        <tr>
          <td colSpan={calculatedData.length + 1} className="border bg-blue-200 text-blue-800 p-2 font-bold text-center print:text-sm">
            {item.label}
          </td>
        </tr>
      );
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

    const rowClass = `${item.isBold || item.isTotal || item.isSubtotal || item.isHighlight ? 'font-bold' : ''} ${item.isTotal ? 'bg-blue-50 border-t-2 border-blue-300' : ''} ${item.isSubtotal ? 'bg-slate-50' : ''} ${item.isHighlight ? 'bg-amber-50' : ''} hover:bg-slate-25`;
    const labelClass = `border p-2 text-left ${item.isCalculated ? 'text-blue-700 italic' : ''}`;

    return (
      <tr className={rowClass}>
        <td className={labelClass}>
          {item.label}
          {item.note && <div className="text-xs text-slate-500 mt-1">{item.note}</div>}
        </td>
        {values.map((value, idx) => (
          <td key={idx} className="border p-2 text-right">
            {value !== null && value !== undefined ? item.format(value) : '—'}
          </td>
        ))}
        <td className="border p-2 text-center text-xs text-slate-500">
          {getTrendIndicator(values)}
        </td>
      </tr>
    );
  });

  // Optimized table rendering function
  const renderTable = (title, items) => {
    if (!calculatedData?.length) return null;

    const processedItems = items.map((item, originalIndex) => {
      let values;
      if (item.key === 'openingCash') {
        values = calculatedData.map(period => period.openingCash);
      } else {
        values = calculatedData.map(period => period[item.key]);
      }
      
      return { ...item, values, uniqueKey: `${item.key}-${originalIndex}` };
    });

    return (
      <div className="mb-8 print:mb-4 overflow-x-auto shadow-md rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th colSpan={calculatedData.length + 2} className="border bg-blue-600 text-white p-2 text-center print:text-sm">
                {title}
              </th>
            </tr>
            <tr>
              <th className="border p-2 text-left bg-blue-50 print:text-sm">Item</th>
              {generatePeriodHeaders}
              <th className="border p-2 text-center bg-blue-50 print:text-sm">Tend.</th>
            </tr>
          </thead>
          <tbody>
            {processedItems.map((item) => (
              <TableRow 
                key={item.uniqueKey} 
                item={item} 
                values={item.values} 
                originalIndex={item.originalIndex}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!calculatedData || calculatedData.length === 0) {
    return (
      <section className="mb-8">
        <h3 className="report-section-title">Demonstrações Financeiras</h3>
        <p className="text-center text-slate-500 py-8">Dados insuficientes para gerar tabelas financeiras.</p>
      </section>
    );
  }

  return (
    <section className="mb-8 page-break-after">
      <h3 className="report-section-title">Demonstrações Financeiras</h3>
      {Object.entries(tableConfigs).map(([title, items], index) => 
        <div key={`table-${index}-${title}`}>
          {renderTable(title, items)}
        </div>
      )}
    </section>
  );
}