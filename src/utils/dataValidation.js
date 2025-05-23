// src/utils/dataValidation.js
import React from 'react';
import { formatCurrency, formatDays, formatPercentage } from './formatters';

/**
 * @typedef {'PME_BAIXO' | 'PMP_ALTO' | 'CICLO_NEGATIVO_ALTO' | 'MARGEM_VOLATILIDADE' | 'BALANCO_INCONSISTENTE' | 'CARGA_TRIBUTARIA_ALTA'} ValidationIssueType
 */

/**
 * @typedef {Object} ValidationEntry
 * @property {ValidationIssueType} type
 * @property {string} message
 * @property {number | null | undefined} value
 * @property {string} field Key of the field in calculatedData
 */

/**
 * @typedef {Object} ValidationResults
 * @property {ValidationEntry[]} warnings
 * @property {ValidationEntry[]} criticalIssues
 * @property {ValidationEntry[]} recommendations // Or insights
 */

/**
 * Validates financial data and identifies suspicious values or inconsistencies.
 * @param {import('../types/financial').CalculatedPeriodData[]} calculatedData
 * @returns {ValidationResults}
 */
export function validateFinancialData(calculatedData) {
  /** @type {ValidationResults} */
  const validationResults = {
    warnings: [],
    criticalIssues: [],
    recommendations: [] // Using recommendations for neutral/positive insights from validation
  };

  if (!calculatedData || calculatedData.length === 0) {
    return validationResults;
  }

  const latestPeriod = calculatedData[calculatedData.length - 1];
  const previousPeriod = calculatedData.length > 1 ? calculatedData[calculatedData.length - 2] : null;

  // 1. Validação de Prazos de Capital de Giro (Latest Period)
  if (latestPeriod.inventoryDaysDerived < 5 && latestPeriod.inventoryDaysDerived !== 0) { // Allow 0 for service co.
    validationResults.warnings.push({
      type: 'PME_BAIXO',
      message: `PME (Estoque) muito baixo (${formatDays(latestPeriod.inventoryDaysDerived)}). Se não for empresa de serviços, verificar inputs de Custo ou Estoque Médio.`,
      value: latestPeriod.inventoryDaysDerived,
      field: 'inventoryDaysDerived'
    });
  }

  if (latestPeriod.apDaysDerived > 180) { // Example threshold
    validationResults.warnings.push({
      type: 'PMP_ALTO',
      message: `PMP (Fornecedores) muito alto (${formatDays(latestPeriod.apDaysDerived)}). Pode indicar forte poder de negociação ou risco de sustentabilidade com fornecedores.`,
      value: latestPeriod.apDaysDerived,
      field: 'apDaysDerived'
    });
  }

  if (latestPeriod.wcDays < -30) { // Example threshold for very negative cycle
    validationResults.recommendations.push({ // This is often good, so a recommendation/insight
      type: 'CICLO_NEGATIVO_ALTO',
      message: `Ciclo de caixa significativamente negativo (${formatDays(latestPeriod.wcDays)}). Excelente para o fluxo de caixa, indica forte financiamento por fornecedores. Avaliar sustentabilidade e relacionamento.`,
      value: latestPeriod.wcDays,
      field: 'wcDays'
    });
  } else if (latestPeriod.wcDays > 120) { // Example threshold for very positive cycle
    validationResults.warnings.push({
      type: 'CICLO_POSITIVO_ALTO',
      message: `Ciclo de caixa muito alto (${formatDays(latestPeriod.wcDays)}). Indica grande necessidade de capital de giro. Analisar otimização de PMR e PME.`,
      value: latestPeriod.wcDays,
      field: 'wcDays'
    });
  }

  // 2. Validação de Margens (Volatility vs Previous Period)
  if (previousPeriod) {
    const gmPctChange = latestPeriod.gmPct - previousPeriod.gmPct;
    if (Math.abs(gmPctChange) > 15) { // Change of 15 p.p.
      validationResults.criticalIssues.push({
        type: 'MARGEM_VOLATILIDADE',
        message: `Variação abrupta na Margem Bruta: ${gmPctChange > 0 ? '+' : ''}${formatPercentage(gmPctChange).replace('%','p.p.')}. Investigar alterações drásticas em custos ou preços.`,
        value: gmPctChange,
        field: 'gmPct'
      });
    }
    const netProfitPctChange = latestPeriod.netProfitPct - previousPeriod.netProfitPct;
    if (Math.abs(netProfitPctChange) > 10) { // Change of 10 p.p.
      validationResults.warnings.push({
        type: 'MARGEM_VOLATILIDADE',
        message: `Variação expressiva na Margem Líquida: ${netProfitPctChange > 0 ? '+' : ''}${formatPercentage(netProfitPctChange).replace('%','p.p.')}. Analisar causas.`,
        value: netProfitPctChange,
        field: 'netProfitPct'
      });
    }
  }

  // 3. Validação de Balanço (Latest Period)
  if (latestPeriod.estimatedTotalAssets > 0) { // Only if assets are not zero
    const balanceErrorPercentage = Math.abs(latestPeriod.balanceSheetDifference / latestPeriod.estimatedTotalAssets) * 100;
    if (balanceErrorPercentage > 5) { // More than 5% of assets
      validationResults.criticalIssues.push({
        type: 'BALANCO_INCONSISTENTE',
        message: `Diferença de balanço significativa: ${formatCurrency(latestPeriod.balanceSheetDifference)} (${formatPercentage(balanceErrorPercentage)} dos ativos). Revisar URGENTEMENTE os dados de entrada para garantir consistência.`,
        value: latestPeriod.balanceSheetDifference,
        field: 'balanceSheetDifference'
      });
    } else if (balanceErrorPercentage > 1) { // Between 1% and 5%
      validationResults.warnings.push({
        type: 'BALANCO_INCONSISTENTE',
        message: `Diferença de balanço notável: ${formatCurrency(latestPeriod.balanceSheetDifference)} (${formatPercentage(balanceErrorPercentage)} dos ativos). Recomenda-se revisão dos inputs.`,
        value: latestPeriod.balanceSheetDifference,
        field: 'balanceSheetDifference'
      });
    }
  }

  // 4. Validação de Carga Tributária (Tax on PBT) - Latest Period
  if (latestPeriod.pbt > 0 && latestPeriod.incomeTax > 0) {
    const effectiveTaxRateOnPBT = (latestPeriod.incomeTax / latestPeriod.pbt) * 100;
    if (effectiveTaxRateOnPBT > 45) { // Example: if tax rate on PBT seems too high
      validationResults.warnings.push({
        type: 'CARGA_TRIBUTARIA_ALTA',
        message: `Alíquota de IR efetiva sobre o Lucro Antes do IR (PBT) parece alta: ${formatPercentage(effectiveTaxRateOnPBT)}. Verificar inputs de Imposto ou Tax Rate.`,
        value: effectiveTaxRateOnPBT,
        field: 'incomeTax' // or incomeTaxRatePercentage
      });
    }
  }

  // 5. Cash Flow Sanity - FCO vs Net Profit
  if (Math.abs(latestPeriod.operatingCashFlow - (latestPeriod.netProfit + latestPeriod.depreciationAndAmortisation)) > Math.abs(latestPeriod.netProfit * 0.2) && latestPeriod.netProfit !== 0) { // If FCO differs from NP+DA by more than 20% of NP
    validationResults.warnings.push({
      type: 'FCO_VS_NETPROFIT_DIVERGENCE',
      message: `Fluxo de Caixa Operacional (FCO: ${formatCurrency(latestPeriod.operatingCashFlow)}) diverge significativamente de (Lucro Líquido + D&A: ${formatCurrency(latestPeriod.netProfit + latestPeriod.depreciationAndAmortisation)}). Isso pode ser devido a grandes variações no Capital de Giro. Analisar em detalhe.`,
      value: latestPeriod.operatingCashFlow - (latestPeriod.netProfit + latestPeriod.depreciationAndAmortisation),
      field: 'operatingCashFlow'
    });
  }

  return validationResults;
}

/**
 * Component to display validation alerts.
 * @param {{ validationResults: ValidationResults | null }} props
 */
export function ValidationAlerts({ validationResults }) {
  if (!validationResults ||
    (validationResults.warnings.length === 0 &&
    validationResults.criticalIssues.length === 0 &&
    validationResults.recommendations.length === 0)) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4 print:hidden"> {/* Hidden on print to keep report clean */}
      {validationResults.criticalIssues.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 002 0v-2a1 1 0 00-2 0v2zm0-5a1 1 0 002 0V6a1 1 0 00-2 0v2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-bold text-red-800">🚨 Alertas Críticos! (Revisão Urgente)</h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {validationResults.criticalIssues.map((issue, index) => (
                  <li key={`critical-${index}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationResults.warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-bold text-yellow-800">⚠️ Avisos e Pontos de Atenção</h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                {validationResults.warnings.map((warning, index) => (
                  <li key={`warning-${index}`}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationResults.recommendations.length > 0 && (
        <div className="bg-sky-50 border-l-4 border-sky-400 p-4 rounded-md shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-sky-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-bold text-sky-800">💡 Insights & Recomendações da Validação</h3>
              <ul className="mt-2 text-sm text-sky-700 list-disc list-inside space-y-1">
                {validationResults.recommendations.map((rec, index) => (
                  <li key={`rec-${index}`}>{rec.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}