// src/utils/dataValidation.js
import React, { useState } from 'react';
import { formatCurrency, formatPercentage, formatDays } from './formatters';

/**
 * @typedef {'PME_BAIXO' | 'PME_ALTO_EXTREMO' | 'PMP_ALTO' | 'CICLO_NEGATIVO_ALTO' | 'CICLO_POSITIVO_ALTO' | 'MARGEM_VOLATILIDADE' | 'BALANCO_INCONSISTENTE' | 'CALCULO_BALANCO_INCONSISTENTE' | 'CARGA_TRIBUTARIA_ALTA' | 'FCO_VS_NETPROFIT_DIVERGENCE' | 'RISCO_INSOLVENCIA'} ValidationIssueType
 */

/**
 * @typedef {Object} ValidationEntry
 * @property {ValidationIssueType} type
 * @property {string} message
 * @property {number | null | undefined} value
 * @property {string} field Key of the field in calculatedData
 * @property {'critical' | 'warning' | 'info' | 'success'} severity
 * @property {string} [periodLabel]
 * @property {string} [suggestion]
 * @property {{suspectedIssue?: string, suggestedMultiplier?: number}} [autoFix]
 */

// Enhanced validateBalanceSheetInternalConsistency - uses SSOT balanceSheetDifference
export function validateBalanceSheetInternalConsistency(periodData) {
  const assets = periodData.estimatedTotalAssets; // From SSOT
  // eslint-disable-next-line no-unused-vars
  const liabilities = periodData.estimatedTotalLiabilities; // From SSOT
  // eslint-disable-next-line no-unused-vars
  const equity = periodData.equity; // From SSOT
  
  const storedDifference = periodData.balanceSheetDifference; // From SSOT
  
  const materialThreshold = Math.max(Math.abs(assets * 0.02), 100); // 2% of assets or R$100
  if (Math.abs(storedDifference) > materialThreshold) {
    return {
      type: 'BALANCO_INCONSISTENTE', category: 'Equilíbrio do Balanço Patrimonial',
      message: `Diferença de balanço significativa: ${formatCurrency(storedDifference)} (${assets !== 0 ? formatPercentage(Math.abs(storedDifference / assets) * 100) : 'N/A'} dos ativos). Sugere forte inconsistência nos inputs ou simplificações do modelo.`,
      severity: 'critical', value: storedDifference, field: 'balanceSheetDifference',
      suggestion: 'Revisar TODOS os inputs de balanço (Caixa Inicial, PL Inicial, Ativo Imob., Empréstimos) e valores médios de Capital de Giro (CR, Estoque, CP).',
    };
  } else if (Math.abs(storedDifference) > 1.01) { // Minor differences beyond simple rounding
    return {
      type: 'BALANCO_INCONSISTENTE', category: 'Equilíbrio do Balanço Patrimonial',
      message: `Pequena diferença de ${formatCurrency(storedDifference)} no Balanço. Pode ser devido a arredondamentos cumulativos. Se persistir, revise os inputs de maior valor.`,
      severity: 'warning', value: storedDifference, field: 'balanceSheetDifference',
    };
  }
  return null;
}

// Enhanced validateInventoryLevels - uses SSOT inventoryDaysDerived
export function validateInventoryLevels(periodData) {
  const inventoryDays = periodData.inventoryDaysDerived; // USE DERIVED FROM SSOT
  const inventoryValue = periodData.inventoryValueAvg;   // Use the input value for context
  const cogs = periodData.cogs;

  if (inventoryDays > 365) { // Your threshold for extremely high
    return {
      type: 'PME_ALTO_EXTREMO', category: 'Prazo Médio de Estoques (PME)',
      message: `PME de ${formatDays(inventoryDays)} é irrealisticamente alto (maior que 1 ano). Isso indica um problema com o Valor Médio de Estoque (${formatCurrency(inventoryValue)}) ou com o CPV/CSV (${formatCurrency(cogs)}) utilizado no cálculo.`,
      severity: 'critical', value: inventoryDays, field: 'inventoryDaysDerived',
      suggestion: 'Verifique a escala dos inputs (R$ vs R$ mil). PME típico para varejo: 30-90 dias; indústria: 60-180 dias. Pode indicar estoque obsoleto severo se os inputs estiverem corretos.',
    };
  } else if (inventoryDays < 1 && inventoryValue > 0 && cogs > 0) { 
    return {
      type: 'PME_BAIXO', category: 'Prazo Médio de Estoques (PME)',
      message: `PME muito baixo (${formatDays(inventoryDays)}), apesar de haver valor de estoque (${formatCurrency(inventoryValue)}). Verifique se os inputs de Estoque Médio e Custo (CPV/CSV) estão corretos e na mesma base temporal.`,
      severity: 'warning', value: inventoryDays, field: 'inventoryDaysDerived',
    };
  }
  
  if (periodData.revenue > 0 && inventoryValue > 0) {
    const inventoryToRevenueRatio = (inventoryValue / periodData.revenue) * 100;
    if (inventoryToRevenueRatio > 75) { 
      return {
        type: 'PME_ALTO_EXTREMO', category: 'Nível de Estoques vs Receita',
        message: `Estoques (${formatCurrency(inventoryValue)}) representam ${formatPercentage(inventoryToRevenueRatio)} da receita do período. Este é um nível muito alto e pode indicar excesso de estoque ou problemas de venda.`,
        severity: 'warning', value: inventoryToRevenueRatio, field: 'inventoryValueAvg',
        suggestion: 'Compare com benchmarks do setor e analise a adequação do nível de estoque.',
      };
    }
  }
  return null; 
}

// Enhanced validateRealisticBusinessMetrics - uses SSOT values
export function validateRealisticBusinessMetrics(periodData, periodIndex = 0) {
  const issues = [];
  if (!periodData) return issues;
  
  if ((periodData.closingCash || 0) < 0 && (periodData.ebit || 0) < 0) {
    issues.push({
      type: 'RISCO_INSOLVENCIA', category: 'Risco de Insolvência',
      message: `Caixa final negativo (${formatCurrency(periodData.closingCash)}) combinado com Lucro Operacional (EBIT) negativo (${formatCurrency(periodData.ebit)}) indica um risco extremo de insolvência.`,
      severity: 'critical', value: periodData.closingCash, field: 'closingCash',
      suggestion: 'AÇÃO URGENTE: Análise aprofundada da estrutura de custos, fontes de receita e liquidez. Considerar reestruturação financeira.',
    });
  }
  
  return issues;
}

// Enhanced validateCashFlowPatterns - uses SSOT values from calculatedData
export function validateCashFlowPatterns(calculatedData) {
  const negativeCount = calculatedData.filter(p => p.netCashFlowBeforeFinancing < 0).length;
  const totalPeriods = calculatedData.length;
  
  if (negativeCount >= Math.ceil(totalPeriods * 0.6)) {
    return {
      type: 'CASH_FLOW_TREND',
      category: 'Tendência de Fluxo de Caixa Livre Negativo',
      message: `FCL negativo em ${negativeCount} de ${totalPeriods} períodos. Padrão preocupante que indica necessidade de financiamento recorrente.`,
      severity: 'warning',
      field: 'netCashFlowBeforeFinancing',
      suggestion: 'Revisar estratégia de CAPEX, gestão de capital de giro e estrutura operacional.',
    };
  }
  
  return null;
}

// Enhanced validateWorkingCapitalEfficiency - uses SSOT wcDays
export function validateWorkingCapitalEfficiency(periodData, periodLabel) {
  const wcDays = periodData.wcDays; // Use SSOT wcDays
  
  if (wcDays > 120) {
    return {
      type: 'CICLO_POSITIVO_ALTO', category: 'Eficiência do Capital de Giro',
      message: `Ciclo de caixa de ${formatDays(wcDays)} é muito longo. PMR: ${formatDays(periodData.arDaysDerived)}, PME: ${formatDays(periodData.inventoryDaysDerived)}, PMP: ${formatDays(periodData.apDaysDerived)}.`,
      severity: 'warning', periodLabel,
      suggestion: 'Oportunidades: (1) Acelerar recebimento de clientes, (2) Otimizar giro de estoques, (3) Negociar prazos com fornecedores.',
    };
  }
  if (wcDays < -30) { // Negative cash conversion cycle is actually positive
    return {
      type: 'CICLO_NEGATIVO_ALTO', category: 'Eficiência do Capital de Giro',
      message: `Ciclo de caixa negativo de ${formatDays(Math.abs(wcDays))} é muito favorável - a empresa recebe antes de pagar fornecedores.`,
      severity: 'success', periodLabel,
      suggestion: 'Excelente eficiência operacional. Monitorar para garantir sustentabilidade desta condição.',
    };
  }
  return null;
}

// Enhanced runAllValidations to call the updated validation functions
export function runAllValidations(calculatedData) {
  if (!calculatedData || calculatedData.length === 0) {
    return { isValidOverall: true, errors: [], warnings: [], infos: [], successes: [] };
  }
  
  const results = { isValidOverall: true, errors: [], warnings: [], infos: [], successes: [] };
  
  const addValidationResult = (result) => {
    if (!result) return;
    if (Array.isArray(result)) { 
      result.forEach(r => addValidationResult(r)); 
      return; 
    }
    if (result.severity === 'critical') { 
      results.errors.push(result); 
      results.isValidOverall = false; 
    }
    else if (result.severity === 'warning') { 
      results.warnings.push(result); 
    }
    else if (result.severity === 'info') { 
      results.infos.push(result); 
    }
    else if (result.severity === 'success') { 
      results.successes.push(result); 
    }
  };
  
  calculatedData.forEach((period, index) => {
    const periodLabel = `Período ${index + 1}`;
    
    // Call enhanced validation functions using SSOT values
    addValidationResult({ ...validateBalanceSheetInternalConsistency(period), periodLabel });
    addValidationResult({ ...validateInventoryLevels(period), periodLabel });
    addValidationResult({ ...validateWorkingCapitalEfficiency(period, periodLabel), periodLabel });
    
    // Call realistic business metrics validation
    validateRealisticBusinessMetrics(period, index).forEach(issue => { 
      addValidationResult({ ...issue, periodLabel }); 
    });
  });
  
  // Call cash flow patterns validation
  addValidationResult(validateCashFlowPatterns(calculatedData)); 
  
  return results;
}

/**
 * Enhanced validation with focus on latest period and trends
 * @param {import('../types/financial').CalculatedPeriodData[]} calculatedData
 * @returns {object} Enhanced validation results
 */
export function validateFinancialData(calculatedData) {
  if (!calculatedData || calculatedData.length === 0) {
    return { 
      isValid: true, 
      critical: [], 
      warnings: [], 
      infos: [], 
      trends: [],
      latest: null,
      summary: { total: 0, critical: 0, warnings: 0 },
    };
  }
  
  const latestPeriod = calculatedData[calculatedData.length - 1];
  const latestIndex = calculatedData.length - 1;
  
  const results = {
    isValid: true,
    critical: [],      // High-severity issues (latest period focus)
    warnings: [],      // Medium-severity issues (consolidated)
    infos: [],         // Low-severity/positive info (latest period only)
    trends: [],        // Multi-period trend analysis
    latest: latestIndex + 1,
    summary: { total: 0, critical: 0, warnings: 0 },
  };
  
  // === LATEST PERIOD CRITICAL CHECKS ===
  
  // 1. Balance Sheet Consistency (Latest Period) - uses SSOT
  const latestBSValidation = validateBalanceSheetConsistency(latestPeriod);
  if (latestBSValidation && latestBSValidation.type === 'error') {
    results.critical.push({
      ...latestBSValidation,
      periodLabel: `Período ${latestIndex + 1} (Atual)`,
      priority: 1,
    });
    results.isValid = false;
  }
  
  // 2. Liquidity Crisis (Latest Period)
  const liquidityCheck = validateLiquidityCrisis(latestPeriod, latestIndex + 1);
  if (liquidityCheck) {
    results.critical.push(liquidityCheck);
    results.isValid = false;
  }
  
  // === CONSOLIDATED WARNINGS (Multi-period patterns) ===
  
  // Balance Sheet Differences (All periods with issues)
  const bsIssues = [];
  calculatedData.forEach((period, index) => {
    const bsValidation = validateBalanceSheetConsistency(period);
    if (bsValidation && bsValidation.type === 'warning') {
      bsIssues.push({
        ...bsValidation,
        periodLabel: `Período ${index + 1}`,
        values: {
          difference: period.balanceSheetDifference, // SSOT value
          assets: period.estimatedTotalAssets,       // SSOT value
          liabilitiesPlusEquity: period.estimatedTotalLiabilities + period.equity, // SSOT values
        },
      });
    }
  });
  
  if (bsIssues.length > 0) {
    const consolidated = consolidateBalanceSheetIssues(bsIssues);
    results.warnings.push(consolidated);
  }
  
  // Inventory Issues (Consolidated) - uses SSOT inventoryDaysDerived
  const inventoryIssues = [];
  calculatedData.forEach((period, index) => {
    const invValidation = validateInventoryLevels(period);
    if (invValidation && invValidation.type === 'warning') {
      inventoryIssues.push({
        ...invValidation,
        periodLabel: `Período ${index + 1}`,
        values: { days: period.inventoryDaysDerived, value: period.inventoryValueAvg }, // SSOT derived days
      });
    }
  });
  
  if (inventoryIssues.length > 0) {
    const consolidated = consolidateInventoryIssues(inventoryIssues);
    results.warnings.push(consolidated);
  }
  
  // === TREND ANALYSIS ===
  if (calculatedData.length >= 2) {
    const trendAnalysis = analyzeTrends(calculatedData);
    results.trends = trendAnalysis;
  }
  
  // === LATEST PERIOD INFO (Positive/Neutral) ===
  const wcValidation = validateWorkingCapitalEfficiency(latestPeriod);
  if (wcValidation && (wcValidation.type === 'success' || wcValidation.type === 'info')) {
    results.infos.push({
      ...wcValidation,
      periodLabel: `Período ${latestIndex + 1} (Atual)`,
    });
  }
  
  // Update summary
  results.summary = {
    total: results.critical.length + results.warnings.length + results.trends.length,
    critical: results.critical.length,
    warnings: results.warnings.length + results.trends.filter(t => t.severity === 'high').length,
  };
  
  return results;
}

/**
 * Check for liquidity crisis in latest period
 */
function validateLiquidityCrisis(periodData, periodNumber) {
  const { closingCash, netCashFlowBeforeFinancing } = periodData;
  
  // Critical: Negative FCL with very low cash
  if (netCashFlowBeforeFinancing < 0 && closingCash < Math.abs(netCashFlowBeforeFinancing * 1.5)) {
    return {
      type: 'error',
      category: '🚨 Crise de Liquidez',
      message: `FCL negativo (${formatCurrency(netCashFlowBeforeFinancing)}) com caixa baixo (${formatCurrency(closingCash)}). Risco de insolvência.`,
      severity: 'critical',
      periodLabel: `Período ${periodNumber} (Atual)`,
      priority: 1,
      suggestion: 'AÇÃO IMEDIATA: Suspender CAPEX não essencial, acelerar cobrança, buscar financiamento emergencial.',
    };
  }
  
  return null;
}

/**
 * Consolidate balance sheet issues across periods
 */
function consolidateBalanceSheetIssues(bsIssues) {
  const periods = bsIssues.map(issue => issue.periodLabel.match(/\d+/)[0]).join(', ');
  const avgDifference = bsIssues.reduce((sum, issue) => sum + Math.abs(issue.values.difference), 0) / bsIssues.length;
  
  return {
    type: 'warning',
    category: 'Diferenças no Balanço Patrimonial',
    message: `Diferenças significativas detectadas em ${bsIssues.length} período(s): ${periods}. Diferença média: ${formatCurrency(avgDifference)}.`,
    severity: 'medium',
    affectedPeriods: bsIssues.map(i => i.periodLabel),
    isConsolidated: true,
    details: bsIssues,
    suggestion: 'Revisar inputs de Ativo Imobilizado, Empréstimos e Patrimônio Líquido Inicial para melhor consistência.',
    priority: 2,
  };
}

/**
 * Consolidate inventory issues across periods
 */
function consolidateInventoryIssues(inventoryIssues) {
  const periods = inventoryIssues.map(issue => issue.periodLabel.match(/\d+/)[0]).join(', ');
  const maxDays = Math.max(...inventoryIssues.map(issue => issue.values.days));
  
  return {
    type: 'warning',
    category: 'Prazo Médio de Estoques Elevado',
    message: `PME elevado detectado em ${inventoryIssues.length} período(s): ${periods}. Máximo: ${formatDays(maxDays)}.`,
    severity: 'medium',
    affectedPeriods: inventoryIssues.map(i => i.periodLabel),
    isConsolidated: true,
    details: inventoryIssues,
    suggestion: 'Analisar causas: estoques obsoletos, problemas de vendas, ou sazonalidade do negócio.',
    priority: 3,
  };
}

/**
 * Analyze trends across periods
 */
function analyzeTrends(calculatedData) {
  const trends = [];
  
  // Cash flow trend
  const cashFlowTrend = analyzeCashFlowTrend(calculatedData);
  if (cashFlowTrend) trends.push(cashFlowTrend);
  
  // Balance sheet difference trend
  const bsTrend = analyzeBalanceSheetTrend(calculatedData);
  if (bsTrend) trends.push(bsTrend);
  
  return trends;
}

function analyzeCashFlowTrend(calculatedData) {
  const negativeCount = calculatedData.filter(p => p.netCashFlowBeforeFinancing < 0).length;
  const totalPeriods = calculatedData.length;
  
  if (negativeCount >= Math.ceil(totalPeriods * 0.6)) {
    return {
      type: 'trend',
      category: 'Tendência de Fluxo de Caixa Livre Negativo',
      message: `FCL negativo em ${negativeCount} de ${totalPeriods} períodos. Padrão preocupante.`,
      severity: 'high',
      suggestion: 'Revisar estratégia de CAPEX e gestão de capital de giro.',
      priority: 2,
    };
  }
  
  return null;
}

function analyzeBalanceSheetTrend(calculatedData) {
  const differences = calculatedData.map(p => Math.abs(p.balanceSheetDifference)); // SSOT values
  const isWorsening = differences.length >= 3 && 
    differences[differences.length - 1] > differences[differences.length - 3];
  
  if (isWorsening && differences[differences.length - 1] > 10000) {
    return {
      type: 'trend',
      category: 'Deterioração da Qualidade dos Dados',
      message: `Diferenças no balanço aumentando ao longo do tempo. Última: ${formatCurrency(differences[differences.length - 1])}.`,
      severity: 'medium',
      suggestion: 'Revisar processo de coleta de dados e consistência dos inputs.',
      priority: 4,
    };
  }
  
  return null;
}

/**
 * Validates balance sheet consistency by checking A = L + E
 * @param {import('../types/financial').CalculatedPeriodData} periodData
 * @returns {object|null} Validation result or null if valid
 */
export function validateBalanceSheetConsistency(periodData) {
  const assets = periodData.estimatedTotalAssets;       // SSOT value
  const liabilities = periodData.estimatedTotalLiabilities; // SSOT value
  const equity = periodData.equity;                     // SSOT value
  
  const independentDifference = assets - (liabilities + equity);
  const storedDifference = periodData.balanceSheetDifference; // SSOT value
  
  const calculationConsistency = Math.abs(independentDifference - storedDifference) < 0.01;
  const materialThreshold = Math.max(assets * 0.01, 1000);
  const isMateriallyBalanced = Math.abs(storedDifference) < materialThreshold;
  
  if (!calculationConsistency) {
    return {
      type: 'error',
      category: 'Inconsistência de Cálculo',
      message: `Diferença de Balanço armazenada (${formatCurrency(storedDifference)}) não confere com cálculo independente (${formatCurrency(independentDifference)}).`,
      severity: 'high',
    };
  }
  
  if (!isMateriallyBalanced) {
    return {
      type: 'warning',
      category: 'Equilíbrio do Balanço',
      message: `Diferença de ${formatCurrency(storedDifference)} no Balanço Patrimonial.`,
      severity: 'medium',
      suggestion: 'Verifique Ativo Imobilizado, Empréstimos Bancários e Patrimônio Líquido Inicial.',
    };
  }
  
  return null;
}

/**
 * Enhanced ValidationAlerts component with better UX
 */
export function ValidationAlerts({ validationResults }) {
  const [expandedSections, setExpandedSections] = useState(new Set());
  
  if (!validationResults) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">✅</span>
          <span className="text-green-800 font-medium">Dados validados com sucesso - nenhum problema crítico detectado.</span>
        </div>
      </div>
    );
  }

  const normalizedResults = {
    critical: validationResults.critical || validationResults.errors || [],
    warnings: validationResults.warnings || [],
    infos: validationResults.infos || [],
    trends: validationResults.trends || [],
    successes: validationResults.successes || [],
    latest: validationResults.latest || null,
    summary: validationResults.summary || {
      total: ((validationResults.errors && validationResults.errors.length) || 0) + 
             ((validationResults.warnings && validationResults.warnings.length) || 0) + 
             ((validationResults.trends && validationResults.trends.length) || 0),
      critical: (validationResults.errors && validationResults.errors.length) || 0,
      warnings: (validationResults.warnings && validationResults.warnings.length) || 0,
    },
  };

  const { critical, warnings, trends, infos, successes, summary, latest } = normalizedResults;

  const totalIssues = critical.length + warnings.length + trends.length;
  if (totalIssues === 0 && successes.length === 0) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">✅</span>
          <span className="text-green-800 font-medium">Dados validados com sucesso - nenhum problema crítico detectado.</span>
        </div>
      </div>
    );
  }
  
  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  const AlertSection = ({ alerts, title, bgColor, borderColor, textColor, icon, sectionId, defaultExpanded = false }) => {
    if (!alerts || alerts.length === 0) return null;
    
    const isExpanded = expandedSections.has(sectionId) ?? defaultExpanded;
    
    return (
      <div className={`${bgColor} border ${borderColor} rounded-lg mb-3`}>
        <div 
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection(sectionId)}
        >
          <div className="flex items-center">
            <span className="text-lg mr-3">{icon}</span>
            <h4 className={`font-semibold ${textColor}`}>
              {title} ({alerts.length})
            </h4>
          </div>
          <span className={`${textColor} transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-white p-3 rounded border-l-4 border-current">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-800">{alert.category}</span>
                  {alert.periodLabel && (
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {alert.periodLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mb-2">{alert.message}</p>
                {alert.suggestion && (
                  <p className="text-xs text-slate-600 italic">
                    💡 <strong>Sugestão:</strong> {alert.suggestion}
                  </p>
                )}
                
                {alert.isConsolidated && alert.details && expandedSections.has(`${sectionId}-details-${index}`) && (
                  <div className="mt-2 pl-4 border-l-2 border-slate-200">
                    {alert.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="text-xs text-slate-600 py-1">
                        <strong>{detail.period}:</strong> {detail.message}
                      </div>
                    ))}
                  </div>
                )}
                
                {alert.isConsolidated && alert.details && (
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(`${sectionId}-details-${index}`);
                    }}
                  >
                    {expandedSections.has(`${sectionId}-details-${index}`) ? 'Ocultar' : 'Ver'} detalhes por período
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2">
          🔍 Verificações de Qualidade dos Dados
        </h3>
        <div className="text-sm text-slate-500">
          Foco: Período {latest} (Atual) • {summary.total} alerta(s) total
        </div>
      </div>
      
      <AlertSection
        alerts={critical}
        title="Problemas Críticos"
        bgColor="bg-red-50"
        borderColor="border-red-300"
        textColor="text-red-800"
        icon="🚨"
        sectionId="critical"
        defaultExpanded={true}
      />
      
      <AlertSection
        alerts={warnings}
        title="Avisos Importantes"
        bgColor="bg-amber-50"
        borderColor="border-amber-300"
        textColor="text-amber-800"
        icon="⚠️"
        sectionId="warnings"
        defaultExpanded={warnings.length <= 2}
      />
      
      <AlertSection
        alerts={trends}
        title="Análise de Tendências"
        bgColor="bg-purple-50"
        borderColor="border-purple-300"
        textColor="text-purple-800"
        icon="📈"
        sectionId="trends"
        defaultExpanded={false}
      />
      
      <AlertSection
        alerts={infos}
        title="Pontos Positivos"
        bgColor="bg-green-50"
        borderColor="border-green-300"
        textColor="text-green-800"
        icon="✅"
        sectionId="infos"
        defaultExpanded={false}
      />
    </section>
  );
}