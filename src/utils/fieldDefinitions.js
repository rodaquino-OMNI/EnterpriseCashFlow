// src/utils/fieldDefinitions.js
export const fieldDefinitions = {
  // P&L Inputs
  'revenue': { 
    label: 'Receita (Revenue)', 
    type: 'currency',
    group: 'P&L',
    required: true, // Make revenue required for meaningful calculations
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Receita não pode ser negativa.';
      return null; // No error
    }
  },
  'grossMarginPercentage': { 
    label: 'Margem Bruta %', 
    type: 'percentage',
    group: 'P&L',
    note: 'Ex: 40 para 40%',
    validation: (value) => {
      if (value !== null && (Number(value) < 0 || Number(value) > 100)) return 'Margem Bruta deve ser entre 0 e 100.';
      return null;
    }
  },
  'operatingExpenses': { 
    label: 'Despesas Operacionais Totais', 
    type: 'currency',
    group: 'P&L',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Despesas Operacionais não podem ser negativas.';
      return null;
    }
  },
  'depreciationAndAmortisation': { 
    label: 'Depreciação e Amortização', 
    type: 'currency',
    group: 'P&L',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'D&A não pode ser negativa.';
      return null;
    }
  },
  'netInterestExpenseIncome': { 
    label: 'Despesas/Receitas Financeiras (Líquido)', 
    type: 'currency', 
    group: 'P&L',
    note: 'Negativo para despesa líquida'
  },
  'incomeTaxRatePercentage': { 
    label: 'Alíquota de Imposto de Renda %', 
    type: 'percentage',
    group: 'P&L',
    note: 'Ex: 25 para 25%',
    validation: (value) => {
      if (value !== null && (Number(value) < 0 || Number(value) > 100)) return 'Alíquota de IR deve ser entre 0 e 100.';
      return null;
    }
  },
  'dividendsPaid': { 
    label: 'Dividendos Pagos/Distribuições', 
    type: 'currency',
    group: 'P&L',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Dividendos não podem ser negativos.';
      return null;
    }
  },
  'extraordinaryItems': { 
    label: '(Opcional) Itens Extraordinários (Líquido)', 
    type: 'currency', 
    group: 'P&L',
    note: 'Negativo para despesa extraordinária'
  },
  'capitalExpenditures': { 
    label: 'Investimentos em Ativo Imobilizado (CAPEX)', 
    type: 'currency',
    group: 'Cash Flow', // Or Investing Activities
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'CAPEX não pode ser negativo.';
      return null;
    }
  },

  // Balance Sheet Inputs
  'openingCash': { 
    label: 'Caixa (Saldo Inicial)', 
    type: 'currency',
    group: 'Balance Sheet',
    firstPeriodOnly: true,
    note: 'Apenas para o 1º período da série',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Caixa inicial não pode ser negativo.';
      return null;
    }
  },
  'accountsReceivableValueAvg': { 
    label: 'Contas a Receber (Valor Médio do Período)', 
    type: 'currency',
    group: 'Balance Sheet',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Contas a Receber não pode ser negativo.';
      return null;
    }
  },
  'inventoryValueAvg': { // UPDATED: Changed from inventoryDays to inventoryValueAvg
    label: 'Estoques (Valor Médio do Período)', 
    type: 'currency',
    group: 'Balance Sheet',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Estoques (valor) não podem ser negativos.';
      return null;
    }
  },
  'netFixedAssets': { 
    label: 'Ativo Imobilizado Líquido (Saldo Final)', 
    type: 'currency',
    group: 'Balance Sheet',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Ativo Imobilizado não pode ser negativo.';
      return null;
    }
  },
  'accountsPayableValueAvg': { 
    label: 'Contas a Pagar (Valor Médio do Período)', 
    type: 'currency',
    group: 'Balance Sheet',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Contas a Pagar não pode ser negativo.';
      return null;
    }
  },
  'totalBankLoans': { 
    label: 'Empréstimos Bancários Totais (Saldo Final)', 
    type: 'currency',
    group: 'Balance Sheet',
    validation: (value) => {
      if (value !== null && Number(value) < 0) return 'Empréstimos não podem ser negativos.';
      return null;
    }
  },
  'initialEquity': { 
    label: 'Patrimônio Líquido (Saldo Inicial)', 
    type: 'currency',
    group: 'Balance Sheet',
    firstPeriodOnly: true,
    note: 'Apenas para o 1º período da série'
  },
};

export const getFieldKeys = () => Object.keys(fieldDefinitions);

export const validateAllFields = (periodsData) => {
  const allErrors = [];
  periodsData.forEach((period, periodIndex) => {
    const periodErrors = { period: periodIndex + 1, fields: {} };
    let hasErrorInPeriod = false;
    getFieldKeys().forEach(fieldKey => {
      const def = fieldDefinitions[fieldKey];
      if (def.firstPeriodOnly && periodIndex > 0) {
        return; // Skip validation for subsequent periods for these fields
      }
      if (def.validation) {
        const errorMessage = def.validation(period[fieldKey]);
        if (errorMessage) {
          periodErrors.fields[fieldKey] = errorMessage;
          hasErrorInPeriod = true;
        }
      }
    });
    if (hasErrorInPeriod) {
      allErrors.push(periodErrors);
    }
  });
  return allErrors;
};