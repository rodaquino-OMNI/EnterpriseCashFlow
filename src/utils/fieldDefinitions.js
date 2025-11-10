// src/utils/fieldDefinitions.js

/**
 * @typedef {'currency' | 'percentage' | 'days'} FieldType
 * @typedef {'P&L Driver' | 'BS Driver' | 'CF Driver' | 'P&L Override' | 'BS Override' | 'CF Override'} FieldGroup
 * @typedef {(value: number | null | undefined, context: ValidationContext) => string | null} ValidationFunction
 */

/**
 * Field categories for grouping and filtering
 */
export const FIELD_CATEGORIES = {
  DRIVER_REQUIRED: 'Driver',
  DRIVER_OPTIONAL: 'Driver',
  OVERRIDE_PL: 'P&L Override',
  OVERRIDE_BS: 'BS Override', 
  OVERRIDE_CF: 'CF Override',
};

/**
 * @typedef {Object} ValidationContext
 * @property {import('../types/financial').PeriodInputData} periodData - Current period's input data.
 * @property {import('../types/financial').CalculatedPeriodData | null} [previousPeriodCalculated] - Previous period's full calculated data.
 * @property {import('../types/financial').PeriodInputData[]} [allPeriodsInputData] - All raw input periods.
 * @property {number} [periodIndex] - Current period index.
 * @property {number} [daysInPeriod] - Days in the current period type.
 * // Potentially add calculated values as they become available in the engine for context
 * @property {number} [revenueForContext]
 * @property {number} [cogsForContext]
 * @property {number} [totalAssetsForContext]
 * @property {number} [totalLiabilitiesForContext]
 * @property {number} [equityForContext]
 * @property {number} [calculatedClosingCashForContext] 
 */

/**
 * @typedef {Object} FieldDefinition
 * @property {string} label - User-friendly label.
 * @property {FieldType} type - Data type for input.
 * @property {FieldGroup} group - For UI grouping and template generation.
 * @property {string} [note] - Explanatory note for the user.
 * @property {boolean} [firstPeriodOnly] - If true, input only for the first period.
 * @property {boolean} [required] - If true, this driver field is essential.
 * @property {ValidationFunction} [validation] - Custom validation logic.
 * @property {number} [min] - Minimum acceptable value.
 * @property {number} [max] - Maximum acceptable value.
 * @property {number} [maxPercentOfRevenue] - Max value as % of revenue for this field.
 * @property {string[]} [dependencies] - Fields this field's calculation depends on.
 * @property {string[]} [conflicts] - Fields this field might conflict with if both are provided as overrides.
 * @property {boolean} [isOverride] - True if this field is an override for a calculated value.
 */

// --- Validation Helper Functions ---
const validatePositive = (value, context, fieldName) => {
  if (value !== null && Number(value) < 0) return `${fieldName} não pode ser negativo.`;
  return null;
};

const validateNonNegative = (value, context, fieldName) => { // Alias for clarity in some cases
  return validatePositive(value, context, fieldName);
};

const validatePercentage = (value, context, fieldName, min = -100, max = 100) => {
  if (value !== null && (Number(value) < min || Number(value) > max)) {
    return `${fieldName} deve estar entre ${min}% e ${max}%.`;
  }
  return null;
};

const validateRequired = (value, context, fieldName) => {
  if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
    return `${fieldName} é obrigatório.`;
  }
  return null;
};

const validateRequiredIfFirstPeriod = (value, context, fieldName) => {
  if (context.periodIndex === 0 && (value === null || typeof value === 'undefined' || String(value).trim() === '')) {
    return `${fieldName} é obrigatório para o primeiro período.`;
  }
  return null;
};

/** @type {Record<string, FieldDefinition>} */
export const fieldDefinitions = {
  // === CORE DRIVER INPUTS ===
  'revenue': {
    label: 'Receita Líquida', type: 'currency', group: 'P&L Driver', required: true,
    validation: (v,c) => validatePositive(v,c,'Receita'), dependencies: ['cogs', 'grossProfit', 'arDaysDerived'],
  },
  'grossMarginPercentage': {
    label: 'Margem Bruta %', type: 'percentage', group: 'P&L Driver', required: true, note: 'Ex: 40 para 40%',
    validation: (v,c) => validatePercentage(v,c,'Margem Bruta', -50, 100), dependencies: ['cogs', 'grossProfit'],
  },
  'operatingExpenses': {
    label: 'Despesas Operacionais (SG&A)', type: 'currency', group: 'P&L Driver', required: true,
    validation: (v,c) => validatePositive(v,c,'Despesas Operacionais'), dependencies: ['ebitda'],
  },
  'depreciationAndAmortisation': {
    label: 'Depreciação e Amortização (D&A)', type: 'currency', group: 'P&L Driver',
    validation: (v,c) => validatePositive(v,c,'D&A'), dependencies: ['ebit', 'operatingCashFlow'],
  },
  'netInterestExpenseIncome': {
    label: 'Resultado Financeiro Líquido', type: 'currency', group: 'P&L Driver', note: '(-) para despesa',
    dependencies: ['pbt'],
  },
  'incomeTaxRatePercentage': {
    label: 'Alíquota IR Efetiva %', type: 'percentage', group: 'P&L Driver', note: 'Ex: 25 para 25%',
    validation: (v,c) => validatePercentage(v,c,'Alíquota IR', 0, 100), dependencies: ['incomeTax'],
  },
  'dividendsPaid': {
    label: 'Dividendos Pagos', type: 'currency', group: 'CF Driver',
    validation: (v,c) => validatePositive(v,c,'Dividendos'), dependencies: ['retainedProfit', 'cashFlowFromFinancing'],
  },
  'extraordinaryItems': {
    label: 'Itens Extraordinários (Líquido)', type: 'currency', group: 'P&L Driver', note: '(-) para perda',
    dependencies: ['pbt'],
  },
  'capitalExpenditures': {
    label: 'CAPEX (Investimentos)', type: 'currency', group: 'CF Driver',
    validation: (v,c) => validatePositive(v,c,'CAPEX'), dependencies: ['netCashFlowBeforeFinancing', 'netFixedAssets'], // Also impacts NFA roll-forward if implemented
  },
  'openingCash': {
    label: 'Caixa Inicial (1º Período)', type: 'currency', group: 'BS Driver', firstPeriodOnly: true, required: true,
    validation: (v,c) => validateRequiredIfFirstPeriod(v,c,'Caixa Inicial') || validateNonNegative(v,c,'Caixa Inicial'),
  },
  'accountsReceivableValueAvg': {
    label: 'Contas a Receber (Valor Médio)', type: 'currency', group: 'BS Driver', required: true,
    validation: (v,c) => validateRequired(v,c,'Contas a Receber (Médio)') || validatePositive(v,c,'Contas a Receber (Médio)'), dependencies: ['arDaysDerived', 'workingCapitalValue'],
  },
  'inventoryValueAvg': {
    label: 'Estoques (Valor Médio)', type: 'currency', group: 'BS Driver', required: true,
    validation: (v,c) => validateRequired(v,c,'Estoques (Valor Médio)') || validatePositive(v,c,'Estoques (Valor Médio)'), dependencies: ['inventoryDaysDerived', 'workingCapitalValue'],
  },
  'accountsPayableValueAvg': {
    label: 'Contas a Pagar (Valor Médio)', type: 'currency', group: 'BS Driver', required: true,
    validation: (v,c) => validateRequired(v,c,'Contas a Pagar (Valor Médio)') || validatePositive(v,c,'Contas a Pagar (Valor Médio)'), dependencies: ['apDaysDerived', 'workingCapitalValue'],
  },
  'netFixedAssets': { // This is saldo final
    label: 'Ativo Imobilizado Líquido (Saldo Final)', type: 'currency', group: 'BS Driver', required: true,
    validation: (v,c) => validateRequired(v,c,'Ativo Imobilizado Líquido') || validatePositive(v,c,'Ativo Imobilizado Líquido'), dependencies: ['estimatedTotalAssets'],
  },
  'totalBankLoans': { // This is saldo final
    label: 'Empréstimos Bancários Totais (Saldo Final)', type: 'currency', group: 'BS Driver', required: true,
    validation: (v,c) => validateRequired(v,c,'Empréstimos Bancários') || validatePositive(v,c,'Empréstimos Bancários'), dependencies: ['estimatedTotalLiabilities', 'changeInDebt'],
  },
  'initialEquity': { // Saldo inicial do PL
    label: 'Patrimônio Líquido (Saldo Inicial)', type: 'currency', group: 'BS Driver', firstPeriodOnly: true, required: true,
    validation: (v,c) => validateRequiredIfFirstPeriod(v,c,'PL Inicial'), // Equity can be negative
  },

  // === P&L OVERRIDE FIELDS ===
  'override_cogs': { label: '🔧 CPV/CSV (Override)', type: 'currency', group: 'P&L Override', note: 'Substitui cálculo via Margem Bruta %', isOverride: true, conflicts: ['grossMarginPercentage', 'override_grossProfit'] },
  'override_grossProfit': { label: '🔧 Lucro Bruto (Override)', type: 'currency', group: 'P&L Override', note: 'Substitui Receita - CPV', isOverride: true, conflicts: ['grossMarginPercentage', 'override_cogs'] },
  'override_ebitda': { label: '🔧 EBITDA (Override)', type: 'currency', group: 'P&L Override', note: 'Substitui Lucro Bruto - Desp. Oper.', isOverride: true },
  'override_ebit': { label: '🔧 EBIT (Override)', type: 'currency', group: 'P&L Override', note: 'Substitui EBITDA - D&A', isOverride: true },
  'override_pbt': { label: '🔧 LAIR/PBT (Override)', type: 'currency', group: 'P&L Override', isOverride: true },
  'override_incomeTax': { label: '🔧 Imposto de Renda (Override)', type: 'currency', group: 'P&L Override', isOverride: true, conflicts: ['incomeTaxRatePercentage'] },
  'override_netProfit': { label: '🔧 Lucro Líquido (Override)', type: 'currency', group: 'P&L Override', isOverride: true },

  // === BALANCE SHEET OVERRIDE FIELDS (Typically Ending Balances) ===
  'override_AR_ending': { label: '🔧 Contas a Receber (Saldo Final)', type: 'currency', group: 'BS Override', note: 'Usado para compor Ativo Circulante no Balanço', isOverride: true },
  'override_Inventory_ending': { label: '🔧 Estoques (Saldo Final)', type: 'currency', group: 'BS Override', note: 'Usado para compor Ativo Circulante no Balanço', isOverride: true },
  'override_AP_ending': { label: '🔧 Contas a Pagar (Saldo Final)', type: 'currency', group: 'BS Override', note: 'Usado para compor Passivo Circulante no Balanço', isOverride: true },
  'override_totalCurrentAssets': { label: '🔧 Total Ativos Circulantes', type: 'currency', group: 'BS Override', isOverride: true },
  'override_totalAssets': { label: '🔧 Total Ativos', type: 'currency', group: 'BS Override', isOverride: true },
  'override_totalCurrentLiabilities': { label: '🔧 Total Passivos Circulantes', type: 'currency', group: 'BS Override', isOverride: true },
  'override_totalLiabilities': { label: '🔧 Total Passivos', type: 'currency', group: 'BS Override', isOverride: true },
  'override_equity_ending': { label: '🔧 Patrimônio Líquido (Saldo Final)', type: 'currency', group: 'BS Override', isOverride: true },

  // === CASH FLOW OVERRIDE FIELDS ===
  'override_closingCash': { label: '🔧 Caixa Final (Substituir DFC)', type: 'currency', group: 'CF Override', note: 'Se preenchido, afetará Diferença de Reconciliação de Caixa', isOverride: true },
  'override_operatingCashFlow': { label: '🔧 Fluxo de Caixa Operacional', type: 'currency', group: 'CF Override', isOverride: true },
  'override_workingCapitalChange': { label: '🔧 Variação Capital de Giro (Fluxo)', type: 'currency', group: 'CF Override', note: 'Positivo = Uso de Caixa', isOverride: true },
  // Add more CF overrides if needed: override_cashFromInvesting, override_cashFromFinancing, override_netChangeInCash
};

export const getFieldKeys = (categories = null) => {
  if (!categories) {
    return Object.keys(fieldDefinitions);
  }
  if (!Array.isArray(categories)) {
    categories = [categories];
  }
  // Since we don't have categories in this structure, filter by group instead
  return Object.entries(fieldDefinitions)
    .filter(([key, def]) => categories.some(cat => def.group?.includes(cat) || def.group === cat))
    .map(([key]) => key);
};

export const getFieldsByGroup = (group) => {
  return Object.entries(fieldDefinitions)
    .filter(([key, def]) => def.group === group)
    .reduce((acc, [key, def]) => {
      acc[key] = def;
      return acc;
    }, {});
};

export const getOverrideFields = () => {
  return Object.entries(fieldDefinitions)
    .filter(([key, def]) => def.isOverride)
    .reduce((acc, [key, def]) => {
      acc[key] = def;
      return acc;
    }, {});
};

export const getDependentFields = (fieldKey) => {
  const def = fieldDefinitions[fieldKey];
  return def?.dependencies || [];
};

export const getConflictingFields = (fieldKey) => {
  const def = fieldDefinitions[fieldKey];
  return def?.conflicts || [];
};

export const validateAllFields = (periodsData) => {
  const allErrors = [];
  if (!periodsData) return allErrors;
  
  periodsData.forEach((period, periodIndex) => {
    const periodErrorsFields = {};
    let hasErrorInPeriod = false;
    
    Object.keys(fieldDefinitions).forEach(fieldKey => {
      const def = fieldDefinitions[fieldKey];
      if (!def) return;
      
      const value = period[fieldKey];
      
      // Skip validation for first-period-only fields in subsequent periods
      if (def.firstPeriodOnly && periodIndex > 0) {
        return; 
      }
      
      // Check required fields
      if (def.required && (value === null || typeof value === 'undefined' || value === '')) {
        if (!def.isOverride) { // Overrides are optional by nature
          periodErrorsFields[fieldKey] = `${def.label} é obrigatório.`;
          hasErrorInPeriod = true;
          return; 
        }
      }
      
      // Run custom validation if field has value
      if (def.validation && (value !== null && value !== undefined && value !== '')) {
        const context = {
          periodData: period,
          allPeriodsInputData: periodsData,
          periodIndex: periodIndex,
        };
        const errorMessage = def.validation(value, context);
        if (errorMessage) {
          periodErrorsFields[fieldKey] = errorMessage;
          hasErrorInPeriod = true;
        }
      }
    });
    
    if (hasErrorInPeriod) {
      allErrors.push({ period: periodIndex + 1, fields: periodErrorsFields });
    }
  });
  
  return allErrors;
};

/**
 * Check if a field is an override field
 * @param {string} fieldKey - The field key to check
 * @returns {boolean} True if the field is an override field
 */
export const isOverrideField = (fieldKey) => {
  const def = fieldDefinitions[fieldKey];
  return def?.isOverride === true;
};