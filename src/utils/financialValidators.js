// src/utils/financialValidators.js
import { formatCurrency, formatPercentage } from './formatters';

export class FinancialConstraintValidator {
  static TOLERANCE_PERCENT = 0.005; 
  static TOLERANCE_ABSOLUTE = 10;   

  static getTolerance(amount, absoluteMinTolerance = 1) {
    if (amount === null || typeof amount === 'undefined' || isNaN(Number(amount))) {
      return Math.max(this.TOLERANCE_ABSOLUTE, absoluteMinTolerance);
    }
    const percentTolerance = Math.abs(Number(amount)) * this.TOLERANCE_PERCENT;
    return Math.max(percentTolerance, absoluteMinTolerance);
  }

  static validatePLConstraints(V) {
    const errors = []; const warnings = [];
    const { revenue, cogs, grossProfit, operatingExpenses, ebitda, depreciationAndAmortisation, ebit, 
            netInterestExpenseIncome, extraordinaryItems, pbt, incomeTax, netProfit } = V;
    const checkEq = (val1, val2, name, equation, fields, baseForTolerance = revenue) => {
      if (val1 !== null && typeof val1 !== 'undefined' && val2 !== null && typeof val2 !== 'undefined') {
        const difference = val1 - val2;
        if (Math.abs(difference) > this.getTolerance(baseForTolerance, 0.015)) {
          errors.push({ type: `${name.toUpperCase().replace(/\s/g, '_')}_EQ_VIOLATION`, severity: 'error',
            message: `P&L Eq: ${name} (${equation}) inconsistente. Armazenado: ${formatCurrency(val1)}, Calc Esperado: ${formatCurrency(val2)}. Diferença: ${formatCurrency(difference)}`, fields });
        }
      }
    };
    checkEq(grossProfit, revenue - cogs, 'Lucro Bruto', 'Receita - CPV', ['revenue', 'cogs', 'grossProfit'], revenue);
    checkEq(ebitda, grossProfit - operatingExpenses, 'EBITDA', 'LB - DespOp', ['grossProfit', 'operatingExpenses', 'ebitda'], grossProfit);
    checkEq(ebit, ebitda - depreciationAndAmortisation, 'EBIT', 'EBITDA - D&A', ['ebitda', 'depreciationAndAmortisation', 'ebit'], ebitda);
    checkEq(pbt, ebit + (netInterestExpenseIncome || 0) + (extraordinaryItems || 0), 'PBT', 'EBIT+Fin+Extr', ['ebit', 'netInterestExpenseIncome', 'extraordinaryItems', 'pbt'], ebit);
    checkEq(netProfit, pbt - incomeTax, 'Lucro Líquido', 'PBT - IR', ['pbt', 'incomeTax', 'netProfit'], pbt);
    
    if (cogs > revenue && revenue > 0) warnings.push({ type: 'COGS_HIGH', severity: 'warning', message: 'CPV excede Receita.', fields: ['cogs', 'revenue']});
    return { errors, warnings };
  }

  static validateBalanceSheetConstraints(V) {
    const errors = []; const warnings = [];
    const { estimatedTotalAssets, estimatedTotalLiabilities, balanceSheetDifference, 
            estimatedCurrentAssets, estimatedCurrentLiabilities } = V;
    const materialThreshold = this.getTolerance(estimatedTotalAssets, 100); 
    if (Math.abs(balanceSheetDifference) > materialThreshold) {
        warnings.push({ 
            type: 'BS_IMBALANCE_MATERIAL', severity: 'warning',
            message: `Balanço com diferença material de ${formatCurrency(balanceSheetDifference)}. (${estimatedTotalAssets !== 0 ? formatPercentage(Math.abs(balanceSheetDifference/estimatedTotalAssets)*100) : 'N/A'} dos Ativos).`,
            fields: ['balanceSheetDifference']
        });
    }
    if (estimatedCurrentAssets > estimatedTotalAssets && estimatedTotalAssets !== 0) errors.push({ type: 'CA_GT_TA', severity: 'error', message: 'Ativos Circulantes excedem Ativos Totais.', fields: ['estimatedCurrentAssets', 'estimatedTotalAssets'] });
    if (estimatedCurrentLiabilities > estimatedTotalLiabilities && estimatedTotalLiabilities !== 0) errors.push({ type: 'CL_GT_TL', severity: 'error', message: 'Passivos Circulantes excedem Passivos Totais.', fields: ['estimatedCurrentLiabilities', 'estimatedTotalLiabilities']});
    return { errors, warnings };
  }

  static validateCashFlowConstraints(V_current) {
    const errors = []; const warnings = []; const infos = [];
    const { 
        calculatedOpeningCash, netChangeInCash, closingCash, 
        cashReconciliationDifference, // Key field: final_closingCash - dfc_calculated_closing_cash
        // Fields for internal DFC consistency check
        operatingCashFlow, workingCapitalChange, capitalExpenditures, 
        changeInDebt, dividendsPaid
    } = V_current;

    // This is what DFC calculated BEFORE any override on closingCash itself
    const dfcInternalCalculatedClosingCash = (calculatedOpeningCash || 0) + (netChangeInCash || 0);

    // Check 1: DFC's internal logic consistency (components leading to netChangeInCash)
    const cfOpsAfterWCCalc = (operatingCashFlow || 0) - (workingCapitalChange || 0);
    const fclCalc = cfOpsAfterWCCalc - (capitalExpenditures || 0);
    const cfFinCalc = (changeInDebt || 0) - (dividendsPaid || 0);
    const internalNetChangeCalc = fclCalc + cfFinCalc;

    if (Math.abs((netChangeInCash || 0) - internalNetChangeCalc) > this.getTolerance(netChangeInCash, 0.015)) {
        errors.push({ 
            type: 'DFC_NET_CHANGE_CALC_ERROR', severity: 'critical', 
            message: `ERRO INTERNO DFC: Variação Líquida de Caixa Armazenada (${formatCurrency(netChangeInCash)}) não confere com soma de seus componentes (FCL+FCF = ${formatCurrency(internalNetChangeCalc)}).`,
            fields: ['netCashFlowBeforeFinancing', 'cashFlowFromFinancing', 'netChangeInCash'] 
        });
    }
    
    // Check 2: Report on the cashReconciliationDifference (impact of override_closingCash)
    // This difference is V_current.closingCash - dfcInternalCalculatedClosingCash
    if (cashReconciliationDifference !== null && typeof cashReconciliationDifference !== 'undefined') {
      if (Math.abs(cashReconciliationDifference) > this.getTolerance(dfcInternalCalculatedClosingCash, 0.015)) {
        warnings.push({ 
          type: 'CASH_OVERRIDE_RECONCILIATION_IMPACT', severity: 'warning',
          message: `IMPACTO DO OVERRIDE DE CAIXA FINAL: O Caixa Final informado/override (${formatCurrency(closingCash)}) resultou em uma diferença de reconciliação de ${formatCurrency(cashReconciliationDifference)} em relação ao Caixa Final que seria calculado pelo DFC (${formatCurrency(dfcInternalCalculatedClosingCash)}). O Balanço Patrimonial refletirá este Caixa Final informado.`, 
          fields: ['override_closingCash', 'closingCash', 'calculatedOpeningCash', 'netChangeInCash'] 
        });
      } else if (cashReconciliationDifference !== 0) {
          infos.push({ // Changed to info for minor, expected diffs if override matches calc closely
             type: 'CASH_OVERRIDE_APPLIED_MATCH', severity: 'info',
             message: `Nota: Caixa Final foi sobrescrito e o valor é consistente com o cálculo do DFC (Diferença: ${formatCurrency(cashReconciliationDifference)}).`, 
             fields: ['override_closingCash', 'closingCash'] 
          });
      }
    }
    return { errors, warnings, infos };
  }
  
  static validateAllStatements(V_current, V_previous = null) {
    const pl = this.validatePLConstraints(V_current);
    const bs = this.validateBalanceSheetConstraints(V_current);
    const cf = this.validateCashFlowConstraints(V_current);
    const crossErrors = []; const crossWarnings = []; const crossInfos = []; // Added infos
    if (V_previous && typeof V_current.equity !== 'undefined' && typeof V_previous.equity !== 'undefined' && typeof V_current.retainedProfit !== 'undefined') {
        const expectedEquity = V_previous.equity + V_current.retainedProfit;
        if (Math.abs(V_current.equity - expectedEquity) > this.getTolerance(V_current.equity)) {
            crossWarnings.push({ type: 'EQUITY_BRIDGE_WARN', severity: 'warning', message: `Ponte do PL: PL Ant. (${formatCurrency(V_previous.equity)}) + Lucro Retido (${formatCurrency(V_current.retainedProfit)}) = ${formatCurrency(expectedEquity)} ≠ PL Atual (${formatCurrency(V_current.equity)})`})
        }
    }
    return {
      errors: [...pl.errors, ...bs.errors, ...cf.errors, ...crossErrors],
      warnings: [...pl.warnings, ...bs.warnings, ...cf.warnings, ...crossWarnings],
      infos: [...(cf.infos || []), ...(crossInfos || [])], // Collect infos
      isValid: [...pl.errors, ...bs.errors, ...cf.errors, ...crossErrors].length === 0
    };
  }
}

export class OverrideValidator {
  static validateOverrideConsistency(periodInput) {
    const errors = []; const warnings = [];
    const overrides = this.extractOverrides(periodInput);
    
    // Helper to parse financial values
    const parseToNumber = (value, defaultValue = 0) => {
      if (value === null || typeof value === 'undefined' || value === '') return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };
    
    const revenueInput = parseToNumber(periodInput.revenue);
    if (overrides.cogs && overrides.grossProfit && typeof revenueInput === 'number') {
      if (Math.abs((revenueInput - overrides.cogs) - overrides.grossProfit) > FinancialConstraintValidator.getTolerance(revenueInput, 0.01)) {
        errors.push({ 
          type: 'PL_OVERRIDE_INCONSISTENT', 
          severity: 'error', 
          message: `Overrides de CPV (${formatCurrency(overrides.cogs)}) e Lucro Bruto (${formatCurrency(overrides.grossProfit)}) são matematicamente inconsistentes com a Receita (${formatCurrency(revenueInput)}).` 
        });
      }
    }
    
    const overrideCount = Object.keys(overrides).length;
    if (overrideCount > 7) {
      warnings.push({ 
        type: 'EXCESSIVE_OVERRIDES_WARNING', 
        severity: 'warning', 
        message: `${overrideCount} overrides em uso. Considere revisar os drivers de entrada para maior clareza e rastreabilidade.` 
      });
    }
    
    return { errors, warnings };
  }
  
  static extractOverrides(periodInput) {
    const overrides = {};
    Object.keys(periodInput).forEach(key => {
      if (key.startsWith('override_')) {
        const value = periodInput[key];
        if (value !== null && typeof value !== 'undefined' && String(value).trim() !== '' && !isNaN(Number(value))) {
          overrides[key.replace('override_', '')] = Number(value);
        }
      }
    });
    return overrides;
  }
}