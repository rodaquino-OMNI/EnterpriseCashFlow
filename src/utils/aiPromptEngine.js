// src/utils/aiPromptEngine.js
import { formatCurrency, formatPercentage, formatDays } from './formatters';
import { PERIOD_TYPES, AI_PROVIDERS } from './constants';
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from './aiAnalysisTypes';
import { fieldDefinitions, getFieldKeys } from './fieldDefinitions';

// --- Helper: Build a detailed summary for AI context ---
function buildFullFinancialDataSummary(calculatedData, periodTypeLabel, companyName, reportTitle) {
  if (!calculatedData || calculatedData.length === 0) return 'Nenhum dado financeiro disponível para resumir.';

  let summary = `ANÁLISE FINANCEIRA PARA: ${companyName} - ${reportTitle}\n`;
  summary += `TIPO DE PERÍODO: ${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}\n`;
  summary += `NÚMERO DE PERÍODOS ANALISADOS: ${calculatedData.length}\n\n`;

  summary += 'DADOS FINANCEIROS CHAVE POR PERÍODO (Valores em BRL, Prazos em Dias, Percentuais em %):\n';
  calculatedData.forEach((p, i) => {
    summary += `\n--- PERÍODO ${i + 1} (${PERIOD_TYPES[periodTypeLabel]?.shortLabel || 'Per.'} ${i + 1}) ---\n`;
    // P&L Highlights
    summary += `Receita: ${formatCurrency(p.revenue)}\n`;
    summary += `Custo dos Produtos/Serviços Vendidos (CPV/CSV): ${formatCurrency(p.cogs)}\n`;
    summary += `Lucro Bruto: ${formatCurrency(p.grossProfit)} (Margem Bruta: ${formatPercentage(p.gmPct)})\n`;
    summary += `Despesas Operacionais: ${formatCurrency(p.operatingExpenses)}\n`;
    summary += `EBITDA: ${formatCurrency(p.ebitda)}\n`;
    summary += `Depreciação e Amortização: ${formatCurrency(p.depreciationAndAmortisation)}\n`;
    summary += `Lucro Operacional (EBIT): ${formatCurrency(p.ebit)} (Margem EBIT: ${formatPercentage(p.opProfitPct)})\n`;
    summary += `Resultado Financeiro Líquido: ${formatCurrency(p.netInterestExpenseIncome)}\n`;
    summary += `Itens Extraordinários: ${formatCurrency(p.extraordinaryItems)}\n`;
    summary += `Lucro Antes do IR (PBT): ${formatCurrency(p.pbt)}\n`;
    summary += `Imposto de Renda: ${formatCurrency(p.incomeTax)}\n`;
    summary += `Lucro Líquido: ${formatCurrency(p.netProfit)} (Margem Líquida: ${formatPercentage(p.netProfitPct)})\n`;
    summary += `Dividendos Pagos: ${formatCurrency(p.dividendsPaid)}\n`;
    summary += `Lucro Retido: ${formatCurrency(p.retainedProfit)}\n\n`;

    // Working Capital & Balance Sheet Highlights
    summary += `Caixa Inicial: ${formatCurrency(p.openingCash)}\n`;
    summary += `Contas a Receber (Valor Médio): ${formatCurrency(p.accountsReceivableValueAvg)} (PMR Derivado: ${formatDays(p.arDaysDerived)})\n`;
    summary += `Estoques (Valor Médio): ${formatCurrency(p.inventoryValueAvg)} (PME Derivado: ${formatDays(p.inventoryDaysDerived)})\n`;
    summary += `Contas a Pagar (Valor Médio): ${formatCurrency(p.accountsPayableValueAvg)} (PMP Derivado: ${formatDays(p.apDaysDerived)})\n`;
    summary += `Capital de Giro (Operacional): ${formatCurrency(p.workingCapitalValue)} (Ciclo de Caixa: ${formatDays(p.wcDays)})\n`;
    summary += `Variação do Capital de Giro (Investimento): ${formatCurrency(p.workingCapitalChange)}\n`;
    summary += `Ativo Imobilizado Líquido (Saldo Final): ${formatCurrency(p.netFixedAssets)}\n`;
    summary += `Total Empréstimos Bancários (Saldo Final): ${formatCurrency(p.totalBankLoans)}\n`;
    summary += `Patrimônio Líquido (Saldo Final): ${formatCurrency(p.equity)}\n`;
    summary += `Total Ativos Estimado: ${formatCurrency(p.estimatedTotalAssets)}\n`;
    summary += `Total Passivos Estimado: ${formatCurrency(p.estimatedTotalLiabilities)}\n`;
    summary += `DIFERENÇA DE BALANÇO (Ativo - (Passivo+PL)): ${formatCurrency(p.balanceSheetDifference)}\n\n`;

    // Cash Flow Highlights
    summary += `Fluxo de Caixa Operacional (FCO): ${formatCurrency(p.operatingCashFlow)}\n`;
    summary += `CAPEX (Invest. Ativo Imob.): ${formatCurrency(p.capitalExpenditures)}\n`;
    summary += `Caixa Gerado Operações (após CG): ${formatCurrency(p.cashFromOpsAfterWC)}\n`;
    summary += `Fluxo de Caixa Livre (Antes do Financiamento): ${formatCurrency(p.netCashFlowBeforeFinancing)}\n`;
    summary += `Variação em Empréstimos: ${formatCurrency(p.changeInDebt)}\n`;
    summary += `Fluxo de Caixa de Financiamento: ${formatCurrency(p.cashFlowFromFinancing)}\n`;
    summary += `Variação Líquida de Caixa: ${formatCurrency(p.netChangeInCash)}\n`;
    summary += `Caixa Final (Calculado): ${formatCurrency(p.closingCash)}\n`;
    summary += `Necessidade (-) / Excedente (+) de Financiamento (FCO - CG - CAPEX): ${formatCurrency(p.fundingGapOrSurplus)}\n`;
  });
  summary += '\n--- FIM DOS DADOS FINANCEIROS ---\n';
  return summary;
}

function createRiskAssessmentPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);

  return `VOCÊ É UM ESPECIALISTA EM GESTÃO DE RISCOS FINANCEIROS com experiência em análise de solvência, liquidez e sustentabilidade empresarial.

EMPRESA: ${companyInfo.name}
ANÁLISE: Avaliação de Riscos para ${companyInfo.reportTitle}
PERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})

DADOS FINANCEIROS DETALHADOS:
${financialSummary}

FRAMEWORK DE AVALIAÇÃO DE RISCOS (FOQUE NO ÚLTIMO PERÍODO E NAS TENDÊNCIAS):

1.  🚨 RISCOS DE LIQUIDEZ:

      - Adequação do Saldo Final de Caixa vs. Despesas Operacionais médias ou CPV.
      - Capacidade de honrar compromissos de curto prazo (analise Passivo Circulante Estimado vs. Ativo Circulante Estimado, se possível com os dados).
      - Qualidade e tendência do Fluxo de Caixa Operacional (FCO).
      - Ciclo de Conversão de Caixa: nível e tendência.

2.  📊 RISCOS OPERACIONAIS E DE RENTABILIDADE:

      - Sustentabilidade e tendência das Margens (Bruta, EBIT, Líquida).
      - Concentração de receitas (não inferível dos dados, mas mencione como ponto de atenção se outros indicadores são fracos).
      - Evolução das Despesas Operacionais em relação à Receita.

3.  💸 RISCOS FINANCEIROS (ENDIVIDAMENTO E ESTRUTURA DE CAPITAL):

      - Nível de Empréstimos Bancários Totais em relação ao Patrimônio Líquido.
      - Capacidade de cobertura de juros (EBIT / Despesa Financeira Líquida – se Desp. Fin. for negativa/despesa).
      - Tendência da Necessidade/Excedente de Financiamento (fundingGapOrSurplus).

4.  🔄 RISCOS DE CAPITAL DE GIRO:

      - Evolução e níveis dos prazos (PMR Derivado, PME Derivado, PMP Derivado).
      - Impacto da Variação do Capital de Giro no caixa.

5.  📉 RISCOS DE QUALIDADE DA INFORMAÇÃO:

      - Avalie a "Diferença de Balanço". Se for significativa (ex: > 2-5% do Total de Ativos Estimado), classifique como um risco à confiabilidade da análise e recomende revisão dos inputs.

FORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):

## 🛡️ AVALIAÇÃO DE RISCOS FINANCEIROS

### Principais Riscos Identificados (Priorizados)

(Liste de 3 a 5 riscos mais importantes, combinando severidade e probabilidade inferida dos dados)

1.  **🔴 [NOME CONCISO DO RISCO 1 - Ex: Risco de Liquidez Elevado]**

      * **Descrição:** [Explicação detalhada do risco, suportada por métricas e tendências dos dados fornecidos. Ex: "O Caixa Final de R$X representa apenas Y dias de Despesas Operacionais, e o FCO tem sido consistentemente negativo..."]
      * **Métricas Chave Associadas:** [PMR, FCO/Receita, Diferença de Balanço, etc.]
      * **Impacto Potencial:** [Consequências se o risco se materializar]

2.  **🟡 [NOME CONCISO DO RISCO 2 - Ex: Risco de Rentabilidade Declinante]**

      * **Descrição:** [...]
      * **Métricas Chave Associadas:** [...]
      * **Impacto Potencial:** [...]

3.  **[Repetir para outros riscos significativos]**

### ✅ Pontos de Menor Risco Relativo ou Fortalezas Observadas

  - **[Aspecto Positivo 1]:** [Descrição e dados que suportam]
  - **[Aspecto Positivo 2]:** [Descrição e dados que suportam]

## 📊 INDICADORES DE ALERTA (RED FLAGS)

(Liste 2-3 indicadores que estão em níveis preocupantes ou com tendências negativas fortes)

1.  **[Indicador Específico]:** Valor atual [X] no Último Período. [Breve comentário sobre por que é um alerta].
2.  **[Indicador Específico]:** ...

## 🎯 RECOMENDAÇÕES DE MITIGAÇÃO (TOP 2-3 GERAIS)

(Sugestões gerais para os riscos mais críticos identificados)

1.  **Para o Risco de [Nome do Risco 1]:** [Ação de mitigação sugerida, ex: "Revisar e otimizar o ciclo de contas a receber para reduzir o PMR." ou "Analisar a estrutura de custos operacionais para identificar oportunidades de redução."]
2.  **Para o Risco de [Nome do Risco 2]:** [...]

-----

Baseie toda análise ESTRITAMENTE nos dados financeiros fornecidos. Quantifique sempre que possível.`;
}

function createCashFlowAnalysisPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);

  return `VOCÊ É UM ESPECIALISTA EM FLUXO DE CAIXA E GESTÃO DE TESOURARIA, com foco em diagnóstico e otimização.

EMPRESA: ${companyInfo.name}
ANÁLISE: Análise Detalhada do Fluxo de Caixa para ${companyInfo.reportTitle}
PERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})

DADOS FINANCEIROS COMPLETOS (INCLUINDO P&L, BALANÇO ESTIMADO E FLUXO DE CAIXA DETALHADO):
${financialSummary}

INSTRUÇÕES PARA ANÁLISE DETALHADA DO FLUXO DE CAIXA:

1.  **FLUXO DE CAIXA OPERACIONAL (FCO):**

      * Analise a magnitude e tendência do FCO. É positivo e suficiente?
      * Compare o FCO com o Lucro Líquido. O que explica as diferenças (principalmente D&A e Variação do Capital de Giro)?
      * Avalie a qualidade e sustentabilidade do FCO.

2.  **INVESTIMENTO EM CAPITAL DE GIRO (Working Capital Change):**

      * Interprete o valor da "Variação do Capital de Giro". Um valor positivo representa um aumento no investimento em capital de giro (uso de caixa), e um negativo, uma liberação de caixa.
      * Analise a tendência. O capital de giro está consumindo caixa consistentemente? Isso é sustentável?

3.  **INVESTIMENTOS (CAPEX - \`capitalExpenditures\`):**

      * Qual o nível de CAPEX? Está alinhado com a Depreciação (como proxy de manutenção) ou sugere expansão/contração?
      * Impacto do CAPEX no caixa.

4.  **FLUXO DE CAIXA LIVRE (FCL - \`netCashFlowBeforeFinancing\`):**

      * Este é o caixa gerado após todas as atividades operacionais e de investimento. Qual sua magnitude e tendência?
      * A empresa gera caixa livre positivo de forma consistente?

5.  **FLUXO DE CAIXA DE FINANCIAMENTO (FCF):**

      * Analise os componentes: \`changeInDebt\` (Variação em Empréstimos) e \`dividendsPaid\`.
      * A empresa está tomando mais dívida, pagando dívida, ou pagando dividendos significativos?
      * Como o FCF se relaciona com o FCL Antes do Financiamento?

6.  **POSIÇÃO DE CAIXA (\`closingCash\`):**

      * Analise a evolução do Saldo Final de Caixa. Está aumentando, diminuindo, estável?
      * O nível de caixa é adequado para as operações da empresa? (Pode ser qualitativo se não houver dados de despesas médias diárias).

7.  **NECESSIDADE/EXCEDENTE DE FINANCIAMENTO (\`fundingGapOrSurplus\`):**

      * Este valor é \`-(FCO - Variação CG - CAPEX)\`. Um valor positivo aqui significa que as operações e investimentos (antes do financiamento externo de dívida/equity) geraram um excedente de caixa. Um valor negativo significa uma necessidade de caixa que teve que ser coberta por financiamento ou redução de caixa.
      * Interprete este valor para o último período e sua tendência.

FORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):

## 🌊 ANÁLISE DETALHADA DO FLUXO DE CAIXA

### 1. Geração de Caixa Operacional (FCO)

  - **Desempenho e Tendência:** [Avaliação: Forte/Fraco, Crescente/Decrescente. Ex: "FCO positivo de R$X no último período, mostrando uma melhora de Y% em relação ao período anterior..."]
  - **Qualidade:** [Comparação com Lucro Líquido. Ex: "O FCO é Z% superior ao Lucro Líquido devido principalmente à D&A, indicando boa conversão de lucro em caixa..."]

### 2. Investimento em Capital de Giro

  - **Impacto no Caixa:** [Análise da \`workingCapitalChange\`. Ex: "Houve um investimento (uso de caixa) de R$X em Capital de Giro no último período, principalmente devido ao aumento do PMR..."]
  - **Tendência e Sustentabilidade:** [Avaliação]

### 3. Investimentos (CAPEX)

  - **Nível e Tendência:** [Avaliação do \`capitalExpenditures\`. Ex: "CAPEX de R$X, representando Y% da Receita, sugere manutenção/expansão..."]

### 4. Fluxo de Caixa Livre (Antes do Financiamento)

  - **Capacidade de Geração:** [Análise do \`netCashFlowBeforeFinancing\`. Ex: "FCL antes do Financiamento foi de R$X, indicando que a empresa gerou/consumiu caixa após operações e investimentos..."]
  - **Tendência:** [Avaliação]

### 5. Atividades de Financiamento

  - **Fontes e Usos:** [Análise de \`changeInDebt\` e \`dividendsPaid\`. Ex: "A empresa tomou R$X em novos empréstimos e pagou R$Y em dividendos..."]

### 6. Posição Final de Caixa

  - **Evolução e Nível:** [Análise do \`closingCash\`. Ex: "O saldo de caixa aumentou para R$X, um nível que parece adequado/preocupante..."]

### 7. Necessidade ou Excedente de Financiamento Estrutural

  - **Interpretação do \`fundingGapOrSurplus\`:** [Ex: "A empresa apresentou uma necessidade de financiamento estrutural de R$X no último período, indicando que as operações e investimentos consumiram mais caixa do que geraram, antes de considerar novas dívidas ou aportes de capital..."]

### 🎯 Conclusões e Recomendações Chave para Fluxo de Caixa (Top 2-3)

1.  **[Ponto Crítico/Oportunidade 1]:** [Ex: "Melhorar a gestão do ciclo de caixa, focando na redução do PMR..."]
    **Ação Sugerida:** [Ex: "Implementar políticas de crédito mais rigorosas e otimizar processos de cobrança." ]
2.  **[Ponto Crítico/Oportunidade 2]:** [...]
    **Ação Sugerida:** [...]

-----

Utilize os dados financeiros fornecidos para quantificar todas as suas análises e conclusões.`;
}

function createStrategicRecommendationsPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);
  return `VOCÊ É UM CONSULTOR DE ESTRATÉGIA EMPRESARIAL SÊNIOR.\n\nEMPRESA: ${companyInfo.name}\nANÁLISE SOLICITADA: Recomendações Estratégicas para ${companyInfo.reportTitle}\nPERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})\n\nDADOS FINANCEIROS COMPLETOS:\n${financialSummary}\n\nMISSÃO: Forneça de 3 a 5 RECOMENDAÇÕES ESTRATÉGICAS ACIONÁVEIS e de ALTO IMPACTO.\nFOCO: Rentabilidade, Eficiência, Liquidez, Crescimento, Estrutura de Capital, Mitigação de Riscos.\n\nFORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):\n## 🎯 RECOMENDAÇÕES ESTRATÉGICAS DE ALTO IMPACTO\n### Recomendação 1: [Título]\n- **Diagnóstico Financeiro Base:** [Problema ou oportunidade suportado por dados]\n- **Ação Estratégica Proposta:** [Descrição clara e detalhada]\n- **Impacto Esperado:** [Quantificação do benefício]\n- **Principais Passos para Implementação:** [Passos resumidos]\n- **Métricas Chave de Sucesso:** [KPIs]\n### Recomendação 2: ...\n...\n\nJustifique cada recomendação com base nos dados fornecidos.`;
}

function createExecutiveSummaryPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);

  return `VOCÊ É UM CONSULTOR FINANCEIRO SÊNIOR COM 20+ ANOS DE EXPERIÊNCIA em análise empresarial e auditoria. Sua especialidade é transformar dados financeiros complexos em insights estratégicos acionáveis para a alta diretoria (C-Level).

EMPRESA: ${companyInfo.name}
ANÁLISE: ${companyInfo.reportTitle}
PERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})

DADOS FINANCEIROS DETALHADOS PARA ANÁLISE:
${financialSummary}

INSTRUÇÕES PARA ANÁLISE EXECUTIVA:

1.  🎯 SITUAÇÃO ATUAL (DIAGNÓSTICO PRECISO DO ÚLTIMO PERÍODO):

      - Avalie a saúde financeira geral da empresa (escala: Crítica/Alerta/Estável/Forte/Excelente) com base nos dados fornecidos.
      - Identifique os 3 principais pontos fortes financeiros evidentes nos dados do último período.
      - Identifique os 3 principais riscos ou pontos de atenção evidentes nos dados do último período.

2.  📈 ANÁLISE DE TENDÊNCIAS (VISÃO TEMPORAL, SE MÚLTIPLOS PERÍODOS):

      - Evolução da rentabilidade (margens chave: Bruta, EBIT, Líquida).
      - Eficiência operacional (capital de giro, ciclo de caixa).
      - Capacidade de geração de caixa e sustentabilidade (FCO, FCL antes Fin.).
      - Análise da "Diferença de Balanço": Se significativa (>2-5% do Total de Ativos no último período), comente sobre a necessidade de revisão dos inputs para melhor qualidade da informação.

3.  💰 ANÁLISE DE CAIXA E LIQUIDEZ (PRIORIDADE C-LEVEL, FOCO NO ÚLTIMO PERÍODO E TENDÊNCIAS):

      - Posição de caixa final e sua evolução.
      - Interprete o valor de "Necessidade/Excedente de Financiamento" do último período e sua tendência.

4.  ⚠️ ALERTAS E RISCOS CRÍTICOS (COM BASE EM TODOS OS PERÍODOS):

      - Identifique qualquer "red flag" financeiro com base exclusivamente nos dados apresentados (ex: margens em queda acentuada, ciclo de caixa aumentando muito, FCO negativo persistente, grande Diferença de Balanço).

5.  🎯 RECOMENDAÇÕES ESTRATÉGICAS IMEDIATAS (MÁXIMO 3-4):

      - Ações prioritárias para os próximos 30-90 dias com base na análise.
      - Sugestões de foco para a diretoria.

FORMATO DE RESPOSTA (ESTRUTURA OBRIGATÓRIA EM PORTUGUÊS DO BRASIL, USE MARKDOWN):

## 🎯 DIAGNÓSTICO EXECUTIVO

**Status Financeiro Geral (Último Período):** [Avaliação com base na escala]

### 💪 Pontos Fortes Chave (Último Período)

1.  **[Ponto forte 1]:** [Descrição baseada em dados, ex: Crescimento da Receita de X% no período Y]
2.  **[Ponto forte 2]:** [Descrição baseada em dados]
3.  **[Ponto forte 3]:** [Descrição baseada em dados]

### ⚠️ Pontos de Atenção Principais (Último Período)

1.  **[Ponto de atenção 1]:** [Descrição baseada em dados e impacto potencial, ex: Aumento do Ciclo de Caixa em Z dias, impactando a liquidez]
2.  **[Ponto de atenção 2]:** [Descrição baseada em dados]
3.  **[Ponto de atenção 3]:** [Descrição baseada em dados, ex: Diferença de Balanço de R$X sugere revisão dos inputs.]

## 📊 ANÁLISE DE PERFORMANCE E TENDÊNCIAS

(Se múltiplos períodos, foque nas tendências. Se um período, foque na fotografia atual.)

### Rentabilidade

[Análise concisa da evolução ou estado das margens (Bruta, EBIT, Líquida)]

### Eficiência Operacional e Capital de Giro

[Análise do ciclo de caixa e seus componentes (PMR, PME, PMP)]

### Fluxo de Caixa e Liquidez

[Análise da geração de caixa (FCO, FCL antes Fin.), saldo de caixa, e a Necessidade/Excedente de Financiamento]

## 🎯 RECOMENDAÇÕES ESTRATÉGICAS

1.  **[Recomendação 1]:** [Ação clara e concisa, com justificativa baseada na análise]
2.  **[Recomendação 2]:** [Ação clara e concisa]
3.  **[Recomendação 3]:** [Ação clara e concisa]

-----

IMPORTANTE:

  - Use linguagem executiva, direta e objetiva.
  - QUANTIFIQUE todos os insights com números e percentuais extraídos DIRETAMENTE dos dados fornecidos.
  - Foque em AÇÕES e IMPLICAÇÕES, não apenas observações passivas.
  - A análise deve ser estritamente baseada nos dados financeiros apresentados. Não invente informações.
  - Seja breve e direto ao ponto.`;
}

function createFinancialDataExtractionPrompt(pdfText, periodTypeLabel, numberOfPeriods, providerKey) {
  const fieldKeys = getFieldKeys();
  const fieldDescriptions = fieldKeys.map(key => {
    const def = fieldDefinitions[key];
    return `- ${key}: ${def.label}`;
  }).join('\n');
  return `Você é um assistente de IA especializado em extração de dados financeiros.\n\nAnalise o TEXTO DO PDF abaixo e extraia os valores para OS SEGUINTES CAMPOS para ${numberOfPeriods} período(s) do tipo "${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}".\n\nTEXTO DO PDF:\n---\n${pdfText}\n---\n\nCAMPOS PARA EXTRAIR:\n${fieldDescriptions}\n\nFORMATO DE RESPOSTA OBRIGATÓRIO (JSON Array of Objects, um objeto por período):\n[ { "periodLabel": "Período 1", "data": { ... } }, ... ]\nSe não encontrar dados, retorne [].`;
}

function createVarianceAnalysisPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  if (calculatedData.length < 2) {
    return 'ERRO: Análise de variação requer pelo menos 2 períodos de dados para comparação.';
  }
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);

  return `VOCÊ É UM ANALISTA FINANCEIRO SÊNIOR especializado em análise de variações e identificação de causas raiz de mudanças financeiras.

EMPRESA: ${companyInfo.name}
ANÁLISE: ${companyInfo.reportTitle} (Comparativo entre Períodos)
PERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})

DADOS FINANCEIROS DETALHADOS PARA ANÁLISE (TODOS OS PERÍODOS):
${financialSummary}

MISSÃO: Analisar as variações entre o ÚLTIMO período e o PENÚLTIMO período, e também entre o ÚLTIMO período e o PRIMEIRO período. Identificar os direcionadores chave das mudanças, com foco em insights acionáveis.

FRAMEWORK DE ANÁLISE DE VARIAÇÃO:

1.  🔍 IDENTIFICAR VARIAÇÕES CHAVE (Último vs. Penúltimo E Último vs. Primeiro):
      - Para cada um dos seguintes itens, calcule e apresente a variação absoluta (R$) e percentual (%):
          - Receita Total
          - Lucro Bruto (e Margem Bruta %)
          - EBITDA
          - Lucro Operacional (EBIT) (e Margem EBIT %)
          - Lucro Líquido (e Margem Líquida %)
          - Fluxo de Caixa Operacional (FCO)
          - Capital de Giro (Valor) (e Ciclo de Caixa em Dias)
          - Saldo Final de Caixa
      - Destaque as 3-5 variações mais significativas (positivas ou negativas) para cada comparação.

2.  🎯 ANÁLISE DE CAUSA RAIZ (PARA VARIAÇÕES SIGNIFICATIVAS):
      - Para cada variação significativa identificada, proponha POSSÍVEIS CAUSAS INTERNAS (ex: mudanças de preço/volume, eficiência operacional, controle de custos, gestão de capital de giro) ou EXTERNAS (ex: mercado, economia). Seja específico.

3.  💡 CORRELAÇÕES E PADRÕES:
      - Existem variações que se reforçam ou se contradizem? (ex: receita aumenta, mas margem cai).
      - A evolução do caixa é consistente com a lucratividade e gestão do capital de giro?

4.  📊 IMPACTO NO NEGÓCIO:
      - Qual o impacto geral das variações na saúde financeira e performance da empresa?
      - As tendências são sustentáveis?

5.  ❓ PERGUNTAS ESTRATÉGICAS PARA A DIRETORIA:
      - Formule 3-4 perguntas cruciais que a diretoria deveria discutir com base nestas variações.

FORMATO DE RESPOSTA OBRIGATÓRIO (EM PORTUGUÊS DO BRASIL, USE MARKDOWN):

## 📊 ANÁLISE DE VARIAÇÕES CHAVE

### Comparativo: Último Período (Per. ${calculatedData.length}) vs. Penúltimo Período (Per. ${calculatedData.length -1})

(Apresente uma tabela ou lista com as variações calculadas para os itens listados no FRAMEWORK PONTO 1)
**Exemplo:**

  - **Receita Total:** Variou R$ X (Y%)
  - **Lucro Líquido:** Variou R$ A (B%)
    ... (Inclua todos os itens do ponto 1 do Framework)

### Comparativo: Último Período (Per. ${calculatedData.length}) vs. Primeiro Período (Per. 1)

(Apresente uma tabela ou lista similar para esta comparação)
**Exemplo:**

  - **Receita Total:** Variou R$ Z (W%)
    ... (Inclua todos os itens do ponto 1 do Framework)

### Destaques das Variações Mais Significativas:

(Liste 3-5, combinando ambas comparações ou focando nas mais relevantes)

1.  **[Métrica 1 - ex: Queda na Margem Bruta % (Últ vs Penúlt)]:** [Descrição da variação e seu valor]
      * **Possíveis Causas:** [Causa A], [Causa B]
2.  **[Métrica 2 - ex: Aumento Expressivo do FCO (Últ vs Prim)]:** [Descrição da variação e seu valor]
      * **Possíveis Causas:** [Causa C], [Causa D]
3.  **[Métrica 3]:** ...

## 💡 INSIGHTS E PADRÕES OBSERVADOS

  - [Insight 1 sobre correlações ou consistência das variações]
  - [Insight 2 sobre sustentabilidade ou alertas]

## ❓ PERGUNTAS PARA A DIRETORIA

1.  [Pergunta 1 focada em uma variação chave e sua causa raiz]
2.  [Pergunta 2 sobre estratégia à luz das tendências]
3.  [Pergunta 3 sobre ações corretivas ou investigações]

-----

IMPORTANTE:

  - Seja analítico e investigativo.
  - QUANTIFIQUE todas as variações e insights com números dos dados.
  - Conecte as variações de diferentes partes (DRE, Caixa, Capital de Giro).`;
}

export function createFinancialAnalysisPrompt(analysisType, financialDataBundle, providerKey, options = {}) {
  const { companyInfo } = financialDataBundle; // pdfText and calculatedData are used by specific prompt functions

  const promptTemplates = {
    [ANALYSIS_TYPES.EXECUTIVE_SUMMARY]: createExecutiveSummaryPrompt,
    [ANALYSIS_TYPES.VARIANCE_ANALYSIS]: createVarianceAnalysisPrompt,
    [ANALYSIS_TYPES.RISK_ASSESSMENT]: createRiskAssessmentPrompt,
    [ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]: createCashFlowAnalysisPrompt,
    [ANALYSIS_TYPES.STRATEGIC_RECOMMENDATIONS]: createStrategicRecommendationsPrompt,
    [ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION]: (dataBundle, pKey, opts) =>
      createFinancialDataExtractionPrompt(dataBundle.pdfText || '', companyInfo.periodType, companyInfo.numberOfPeriods, pKey),
  };

  const promptFunction = promptTemplates[analysisType];
  if (!promptFunction) {
    throw new Error(`Tipo de análise não suportado para geração de prompt: ${analysisType}`);
  }
  return promptFunction(financialDataBundle, providerKey, options);
}

/**
 * Validates an AI response based on the analysis type
 * @param {any} rawResponse - The raw response from the AI
 * @param {string} analysisType - The type of analysis
 * @returns {any} The validated response
 */
export function validateAiResponse(rawResponse, analysisType) {
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new Error('Resposta da IA está vazia ou em formato inválido');
  }

  if (analysisType === ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION) {
    try {
      const parsed = JSON.parse(rawResponse);
      if (!parsed.success || !Array.isArray(parsed.extractedData)) {
        throw new Error('Formato JSON de extração inválido');
      }
      return parsed;
    } catch (error) {
      throw new Error(`Erro ao validar resposta de extração: ${error.message}`);
    }
  }

  // For other analysis types, basic text validation
  if (rawResponse.length < 50) {
    throw new Error('Resposta da IA muito curta ou incompleta');
  }

  return rawResponse;
}

/**
 * Standardizes the AI response format
 * @param {any} validatedResponse - The validated response
 * @param {string} analysisType - The type of analysis
 * @param {string} providerKey - The AI provider used
 * @returns {Object} Standardized response with metadata
 */
export function standardizeResponse(validatedResponse, analysisType, providerKey) {
  // Add debugging to see what's coming in
  console.log('Standardizing response from AI:', {
    analysisType,
    provider: providerKey,
    responseType: typeof validatedResponse,
    responseLength: typeof validatedResponse === 'string' ? validatedResponse.length : 'N/A',
    responseStart: typeof validatedResponse === 'string' ? validatedResponse.substring(0, 50) + '...' : 'N/A',
  });

  const metadata = ANALYSIS_METADATA[analysisType];
  
  const standardized = {
    content: validatedResponse,
    metadata: {
      analysisType,
      typeName: metadata.name,
      provider: providerKey,
      timestamp: new Date().toISOString(),
      complexity: metadata.complexity,
    },
  };

  // Add quality score estimation (simple heuristic)
  if (analysisType === ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION) {
    standardized.qualityScore = estimateExtractionQuality(validatedResponse);
  } else {
    standardized.qualityScore = estimateTextQuality(validatedResponse);
  }

  // Add additional debugging for the output
  console.log('AI Response standardized successfully', {
    provider: providerKey,
    qualityScore: standardized.qualityScore,
    contentLength: typeof standardized.content === 'string' ? standardized.content.length : 'N/A',
  });

  return standardized;
}

/**
 * Estimates quality for financial data extraction
 * @param {Object} extractionResponse - The extraction response
 * @returns {number} Quality score 0-1
 */
function estimateExtractionQuality(extractionResponse) {
  if (!extractionResponse.extractedData || !Array.isArray(extractionResponse.extractedData)) {
    return 0;
  }

  let totalFields = 0;
  let filledFields = 0;

  extractionResponse.extractedData.forEach(period => {
    if (period.data) {
      Object.values(period.data).forEach(value => {
        totalFields++;
        if (value !== null && value !== undefined) {
          filledFields++;
        }
      });
    }
  });

  const fillRate = totalFields > 0 ? filledFields / totalFields : 0;
  
  // Adjust based on confidence if available
  const confidenceMultiplier = extractionResponse.confidence === 'alta' ? 1 : 
    extractionResponse.confidence === 'media' ? 0.8 : 0.6;

  return Math.min(fillRate * confidenceMultiplier, 1);
}

/**
 * Estimates quality for text-based analysis
 * @param {string} textResponse - The text response
 * @returns {number} Quality score 0-1
 */
function estimateTextQuality(textResponse) {
  // Simple heuristics for text quality
  const length = textResponse.length;
  const hasStructure = /^\d+\.|^[*-]|\*\*/.test(textResponse); // Has bullets or numbers
  const hasNumbers = /\d/.test(textResponse); // Contains numbers
  const hasPortuguese = /[àáâãéêíóôõúç]/i.test(textResponse); // Contains Portuguese chars
  
  let score = 0.5; // Base score
  
  if (length > 500) score += 0.1;
  if (length > 1000) score += 0.1;
  if (hasStructure) score += 0.1;
  if (hasNumbers) score += 0.1;
  if (hasPortuguese) score += 0.1;
  
  return Math.min(score, 1);
}