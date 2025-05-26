// src/utils/fieldDefinitions.js

/**
 * Field categories for adaptive input methodology
 */
export const FIELD_CATEGORIES = {
  DRIVER_REQUIRED: 'driver_required',     // Essential drivers for basic calculation
  DRIVER_OPTIONAL: 'driver_optional',     // Optional drivers that enhance calculations
  OVERRIDE_PL: 'override_pl',             // Direct P&L line item overrides
  OVERRIDE_BS: 'override_bs',             // Direct Balance Sheet overrides  
  OVERRIDE_CF: 'override_cf'              // Direct Cash Flow overrides
};

/**
 * @typedef {'currency' | 'percentage' | 'days'} FieldType
 * @typedef {'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Operational'} FieldGroup
 * @typedef {(value: number | null | undefined, periodData?: import('../types/financial').PeriodInputData, allPeriodsData?: import('../types/financial').PeriodInputData[], periodIndex?: number) => string | null} ValidationFunction
 */

/**
 * @type {import('../types/financial').FieldDefinitions}
 */
export const fieldDefinitions = {
  // ===== CORE DRIVERS (REQUIRED or Strongly Recommended) =====
  'revenue': { 
    label: 'Receita Líquida (Revenue)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'P&L',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Receita é obrigatória.';
      if (Number(value) < 0) return 'Receita não pode ser negativa.';
      if (Number(value) > 1e12) return 'Valor de receita muito alto. Verifique a escala (ex: R$ vs R$ mil).';
      return null;
    }
  },
  'grossMarginPercentage': { 
    label: 'Margem Bruta %', 
    type: 'percentage', 
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'P&L',
    note: 'Ex: 40 para 40%. Usado para calcular CPV/CSV.',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Margem Bruta % é obrigatória.';
      if (Number(value) < -100 || Number(value) > 100) return 'Margem Bruta deve ser entre -100% e 100%.';
      return null;
    }
  },
  'operatingExpenses': { 
    label: 'Despesas Operacionais Totais (SG&A)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED, 
    group: 'P&L',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Despesas Operacionais são obrigatórias.';
      if (Number(value) < 0) return 'Despesas Operacionais não podem ser negativas.';
      return null;
    }
  },
  'openingCash': { 
    label: 'Caixa (Saldo Inicial)', 
    type: 'currency', 
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    firstPeriodOnly: true,
    note: 'Apenas para o 1º período da série.',
    required: true, 
    validation: (value, _pD, _aPD, periodIndex) => {
      if (periodIndex === 0 && (value === null || typeof value === 'undefined')) return 'Caixa Inicial é obrigatório para o 1º período.';
      if (value !== null && Number(value) < 0) return 'Caixa inicial não pode ser negativo.';
      return null;
    }
  },
  'accountsReceivableValueAvg': { 
    label: 'Contas a Receber (Valor Médio do Período)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Contas a Receber (Valor Médio) é obrigatório.';
      if (Number(value) < 0) return 'Contas a Receber (valor) não pode ser negativo.';
      return null;
    }
  },
  'inventoryValueAvg': { 
    label: 'Estoques (Valor Médio do Período)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Estoques (Valor Médio) é obrigatório.';
      if (Number(value) < 0) return 'Estoques (valor) não podem ser negativos.';
      return null;
    }
  },
  'accountsPayableValueAvg': { 
    label: 'Contas a Pagar (Valor Médio do Período)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Contas a Pagar (Valor Médio) é obrigatório.';
      if (Number(value) < 0) return 'Contas a Pagar (valor) não pode ser negativo.';
      return null;
    }
  },
  'netFixedAssets': { 
    label: 'Ativo Imobilizado Líquido (Saldo Final)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Ativo Imobilizado (Líq.) é obrigatório.';
      if (Number(value) < 0) return 'Ativo Imobilizado não pode ser negativo.';
      return null;
    }
  },
  'totalBankLoans': { 
    label: 'Empréstimos Bancários Totais (Saldo Final)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    required: true,
    validation: (value) => {
      if (value === null || typeof value === 'undefined') return 'Total de Empréstimos é obrigatório (pode ser 0).';
      if (Number(value) < 0) return 'Empréstimos não podem ser negativos.';
      return null;
    }
  },
  'initialEquity': { 
    label: 'Patrimônio Líquido (Saldo Inicial)', 
    type: 'currency', 
    category: FIELD_CATEGORIES.DRIVER_REQUIRED,
    group: 'Balance Sheet',
    firstPeriodOnly: true,
    note: 'Apenas para o 1º período da série.',
    required: true, 
    validation: (value, _pD, _aPD, periodIndex) => {
        if (periodIndex === 0 && (value === null || typeof value === 'undefined')) return 'PL Inicial é obrigatório para o 1º período.';
        return null;
    }
  },

  // ===== OPTIONAL DRIVERS =====
  'depreciationAndAmortisation': { 
    label: 'Depreciação e Amortização (D&A)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'P&L',
    validation: (value) => value !== null && Number(value) < 0 ? 'D&A não pode ser negativa.' : null
  },
  'netInterestExpenseIncome': { 
    label: 'Despesas/Receitas Financeiras (Líquido)', 
    type: 'currency', 
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'P&L',
    note: 'Negativo para despesa líquida'
  },
  'incomeTaxRatePercentage': { 
    label: 'Alíquota de Imposto de Renda Efetiva %', 
    type: 'percentage',
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'P&L',
    note: 'Ex: 25 para 25%. Usada sobre o PBT. Se não informado, impostos não serão calculados.',
    validation: (value) => {
      if (value !== null && (Number(value) < 0 || Number(value) > 100)) return 'Alíquota de IR deve ser entre 0% e 100%.';
      return null;
    }
  },
  'dividendsPaid': { 
    label: 'Dividendos Pagos / Distribuições', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'Cash Flow', 
    validation: (value) => value !== null && Number(value) < 0 ? 'Dividendos não podem ser negativos.' : null
  },
  'extraordinaryItems': { 
    label: '(Opcional) Itens Extraordinários (Líquido)', 
    type: 'currency', 
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'P&L',
    note: 'Positivo para ganho, negativo para perda extraordinária.'
  },
  'capitalExpenditures': { 
    label: 'Investimentos em Ativo Imobilizado (CAPEX)', 
    type: 'currency',
    category: FIELD_CATEGORIES.DRIVER_OPTIONAL,
    group: 'Cash Flow',
    validation: (value) => value !== null && Number(value) < 0 ? 'CAPEX não pode ser negativo (representa aquisição).' : null
  },

  // ===== P&L OVERRIDES (Advanced Users) =====
  'override_cogs': { label: '🔧 CPV/CSV (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', note: 'Substitui cálculo via Margem Bruta %', isOverride: true },
  'override_grossProfit': { label: '🔧 Lucro Bruto (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', note: 'Substitui Receita - CPV', isOverride: true },
  'override_ebitda': { label: '🔧 EBITDA (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', note: 'Substitui Lucro Bruto - Desp. Operacionais', isOverride: true },
  'override_ebit': { label: '🔧 EBIT/Lucro Operacional (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', isOverride: true },
  'override_pbt': { label: '🔧 LAIR/Lucro Antes IR (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', isOverride: true },
  'override_incomeTax': { label: '🔧 Imposto de Renda (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', isOverride: true },
  'override_netProfit': { label: '🔧 Lucro Líquido (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_PL, group: 'P&L', isOverride: true },

  // ===== BALANCE SHEET OVERRIDES =====
  'override_AR_ending': { label: '🔧 Contas a Receber (Saldo Final Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', note: 'Saldo final real. Se não preenchido, usa valor médio como proxy no Balanço.', isOverride: true },
  'override_Inventory_ending': { label: '🔧 Estoques (Saldo Final Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_AP_ending': { label: '🔧 Contas a Pagar (Saldo Final Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_totalCurrentAssets': { label: '🔧 Ativo Circulante Total (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_totalAssets': { label: '🔧 Ativo Total (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_totalCurrentLiabilities': { label: '🔧 Passivo Circulante Total (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_totalLiabilities': { label: '🔧 Passivo Total (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },
  'override_equity_ending': { label: '🔧 Patrimônio Líquido (Saldo Final Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_BS, group: 'Balance Sheet', isOverride: true },

  // ===== CASH FLOW OVERRIDES =====
  'override_closingCash': { label: '🔧 Caixa Final (Valor Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_CF, group: 'Cash Flow', note: 'Se preenchido, será comparado com cálculo do DFC', isOverride: true },
  'override_operatingCashFlow': { label: '🔧 Fluxo de Caixa Operacional (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_CF, group: 'Cash Flow', isOverride: true },
  'override_workingCapitalChange': { label: '🔧 Variação do Capital de Giro (Real)', type: 'currency', category: FIELD_CATEGORIES.OVERRIDE_CF, group: 'Cash Flow', note: 'Positivo = Uso de Caixa', isOverride: true },
};

export const getFieldKeys = (categories = null) => {
  if (!categories) {
    return Object.keys(fieldDefinitions);
  }
  if (!Array.isArray(categories)) {
    categories = [categories];
  }
  return Object.entries(fieldDefinitions)
    .filter(([key, def]) => categories.includes(def.category))
    .map(([key]) => key);
};

// Get only driver fields (required or optional)
export const getDriverFieldKeys = () => [
  ...getFieldKeys(FIELD_CATEGORIES.DRIVER_REQUIRED),
  ...getFieldKeys(FIELD_CATEGORIES.DRIVER_OPTIONAL)
];

// Get only override fields
export const getOverrideFieldKeys = (group = null) => {
  let categories = [
    FIELD_CATEGORIES.OVERRIDE_PL,
    FIELD_CATEGORIES.OVERRIDE_BS,
    FIELD_CATEGORIES.OVERRIDE_CF
  ];
  if (group === 'P&L') categories = [FIELD_CATEGORIES.OVERRIDE_PL];
  if (group === 'Balance Sheet') categories = [FIELD_CATEGORIES.OVERRIDE_BS];
  if (group === 'Cash Flow') categories = [FIELD_CATEGORIES.OVERRIDE_CF];
  
  return getFieldKeys(categories);
};

export const isOverrideField = (fieldKey) => {
  const def = fieldDefinitions[fieldKey];
  return def && (
    def.category === FIELD_CATEGORIES.OVERRIDE_PL ||
    def.category === FIELD_CATEGORIES.OVERRIDE_BS ||
    def.category === FIELD_CATEGORIES.OVERRIDE_CF ||
    def.isOverride === true // Explicit flag
  );
};

export const validateAllFields = (periodsData) => {
  const allErrors = [];
  if (!periodsData) return allErrors;

  periodsData.forEach((period, periodIndex) => {
    const periodErrorsFields = {};
    let hasErrorInPeriod = false;
    
    getFieldKeys().forEach(fieldKey => { // Validate all defined fields present in the data
      const def = fieldDefinitions[fieldKey];
      if (!def) return; // Should not happen if fieldKey is from getFieldKeys

      const value = period[fieldKey];

      if (def.firstPeriodOnly && periodIndex > 0) {
        // For firstPeriodOnly fields, ensure they are null or undefined in subsequent periods if an override wasn't intended
        if (value !== null && typeof value !== 'undefined' && isOverrideField(fieldKey)) {
             // This case should ideally not happen if UI disables them, but good to check
        }
        return; 
      }

      if (def.required && (value === null || typeof value === 'undefined' || value === '')) {
        if (!isOverrideField(fieldKey)) { // Overrides are optional by nature
            periodErrorsFields[fieldKey] = `${def.label} é obrigatório.`;
            hasErrorInPeriod = true;
            return; 
        }
      }
      
      if (def.validation && (value !== null && value !== undefined && value !== '')) {
        const errorMessage = def.validation(value, period, periodsData, periodIndex);
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