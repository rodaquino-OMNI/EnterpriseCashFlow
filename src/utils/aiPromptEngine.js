// src/utils/aiPromptEngine.js
import { ANALYSIS_TYPES, ANALYSIS_METADATA } from './aiAnalysisTypes';
import { PERIOD_TYPES } from './constants';
import { fieldDefinitions, getFieldKeys } from './fieldDefinitions';

// --- Helper: Build a detailed summary for AI context ---
function buildFullFinancialDataSummary(calculatedData, periodTypeLabel, companyName, reportTitle) {
  if (!calculatedData || calculatedData.length === 0) return "Nenhum dado financeiro disponível para resumir.";
  let summary = `ANÁLISE FINANCEIRA PARA: ${companyName} - ${reportTitle}\n`;
  summary += `TIPO DE PERÍODO: ${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}\n`;
  summary += `NÚMERO DE PERÍODOS ANALISADOS: ${calculatedData.length}\n\n`;
  summary += "DADOS FINANCEIROS CHAVE POR PERÍODO (Valores em BRL, Prazos em Dias, Percentuais em %):\n";
  calculatedData.forEach((p, i) => {
    summary += `\n--- PERÍODO ${i + 1} (${PERIOD_TYPES[periodTypeLabel]?.shortLabel || 'Per.'} ${i + 1}) ---\n`;
    summary += `Receita: ${p.revenue ?? '-'}\n`;
    summary += `Lucro Bruto: ${p.grossProfit ?? '-'} (Margem Bruta: ${p.gmPct ?? '-'})\n`;
    summary += `Despesas Operacionais: ${p.operatingExpenses ?? '-'}\n`;
    summary += `EBITDA: ${p.ebitda ?? '-'}\n`;
    summary += `Lucro Operacional (EBIT): ${p.ebit ?? '-'} (Margem EBIT: ${p.opProfitPct ?? '-'})\n`;
    summary += `Lucro Líquido: ${p.netProfit ?? '-'} (Margem Líquida: ${p.netProfitPct ?? '-'})\n`;
    summary += `Caixa Final: ${p.closingCash ?? '-'}\n`;
    summary += `Necessidade/Excedente de Financiamento: ${p.fundingGapOrSurplus ?? '-'}\n`;
    summary += `Capital de Giro: ${p.workingCapitalValue ?? '-'} (Ciclo de Caixa: ${p.wcDays ?? '-'})\n`;
    summary += `DIFERENÇA DE BALANÇO: ${p.balanceSheetDifference ?? '-'}\n`;
  });
  summary += "\n--- FIM DOS DADOS FINANCEIROS ---\n";
  return summary;
}

function createRiskAssessmentPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);
  return `VOCÊ É UM ESPECIALISTA EM GESTÃO DE RISCOS FINANCEIROS com experiência em análise de solvência, liquidez e sustentabilidade empresarial.\n\nEMPRESA: ${companyInfo.name}\nANÁLISE: Avaliação de Riscos para ${companyInfo.reportTitle}\nPERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})\n\nDADOS FINANCEIROS DETALHADOS:\n${financialSummary}\n\nFRAMEWORK DE AVALIAÇÃO DE RISCOS (FOQUE NO ÚLTIMO PERÍODO E NAS TENDÊNCIAS):\n\n1. 🚨 RISCOS DE LIQUIDEZ:\n   - Adequação do Saldo Final de Caixa vs. Despesas Operacionais médias ou CPV.\n   - Capacidade de honrar compromissos de curto prazo.\n   - Qualidade e tendência do Fluxo de Caixa Operacional (FCO).\n   - Ciclo de Conversão de Caixa: nível e tendência.\n2. 📊 RISCOS OPERACIONAIS E DE RENTABILIDADE:\n   - Sustentabilidade e tendência das Margens (Bruta, EBIT, Líquida).\n   - Evolução das Despesas Operacionais em relação à Receita.\n3. 💸 RISCOS FINANCEIROS (ENDIVIDAMENTO E ESTRUTURA DE CAPITAL):\n   - Nível de Empréstimos Bancários Totais em relação ao Patrimônio Líquido.\n   - Capacidade de cobertura de juros.\n   - Tendência da Necessidade/Excedente de Financiamento.\n4. 🔄 RISCOS DE CAPITAL DE GIRO:\n   - Evolução e níveis dos prazos (PMR, PME, PMP).\n   - Impacto da Variação do Capital de Giro no caixa.\n5. 📉 RISCOS DE QUALIDADE DA INFORMAÇÃO:\n   - Avalie a "Diferença de Balanço". Se for significativa, classifique como um risco à confiabilidade da análise.\n\nFORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):\n\n## 🛡️ AVALIAÇÃO DE RISCOS FINANCEIROS\n\n### Principais Riscos Identificados (Priorizados)\n1. **🔴 [NOME DO RISCO 1]**\n   * **Descrição:** [Explicação detalhada do risco, suportada por métricas e tendências dos dados fornecidos]\n   * **Métricas Chave Associadas:** [PMR, FCO/Receita, etc.]\n   * **Impacto Potencial:** [Consequências]\n2. **🟡 [NOME DO RISCO 2]**\n   * **Descrição:** [...]\n   * **Métricas Chave Associadas:** [...]\n   * **Impacto Potencial:** [...]\n3. ...\n\n### ✅ Pontos de Menor Risco Relativo ou Fortalezas Observadas\n- **[Aspecto Positivo 1]:** [Descrição]\n- **[Aspecto Positivo 2]:** [Descrição]\n\n## 📊 INDICADORES DE ALERTA (RED FLAGS)\n1. **[Indicador Específico]:** Valor atual [X] no Último Período. [Comentário]\n2. ...\n\n## 🎯 RECOMENDAÇÕES DE MITIGAÇÃO (TOP 2-3 GERAIS)\n1. **Para o Risco de [Nome do Risco 1]:** [Ação de mitigação sugerida]\n2. ...\n\nBaseie toda análise ESTRITAMENTE nos dados financeiros fornecidos. Quantifique sempre que possível.`;
}

function createCashFlowAnalysisPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);
  return `VOCÊ É UM ESPECIALISTA EM FLUXO DE CAIXA E GESTÃO DE TESOURARIA.\n\nEMPRESA: ${companyInfo.name}\nANÁLISE: Análise Detalhada do Fluxo de Caixa para ${companyInfo.reportTitle}\nPERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})\n\nDADOS FINANCEIROS COMPLETOS:\n${financialSummary}\n\nINSTRUÇÕES PARA ANÁLISE DETALHADA DO FLUXO DE CAIXA:\n1. FCO: Analise magnitude, tendência, comparação com Lucro Líquido, qualidade e sustentabilidade.\n2. Investimento em Capital de Giro: Interprete o valor e tendência.\n3. CAPEX: Nível, tendência, impacto no caixa.\n4. Fluxo de Caixa Livre: Capacidade de geração, tendência.\n5. Atividades de Financiamento: Fontes e usos.\n6. Posição Final de Caixa: Evolução e nível.\n7. Necessidade/Excedente de Financiamento: Interpretação.\n\nFORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):\n## 🌊 ANÁLISE DETALHADA DO FLUXO DE CAIXA\n... Estruture conforme instruções acima, quantificando sempre que possível ...`;
}

function createStrategicRecommendationsPrompt(financialDataBundle, providerKey, options) {
  const { calculatedData, companyInfo } = financialDataBundle;
  const financialSummary = buildFullFinancialDataSummary(calculatedData, companyInfo.periodType, companyInfo.name, companyInfo.reportTitle);
  return `VOCÊ É UM CONSULTOR DE ESTRATÉGIA EMPRESARIAL SÊNIOR.\n\nEMPRESA: ${companyInfo.name}\nANÁLISE SOLICITADA: Recomendações Estratégicas para ${companyInfo.reportTitle}\nPERÍODOS ANALISADOS: ${calculatedData.length} (${PERIOD_TYPES[companyInfo.periodType]?.label || companyInfo.periodType})\n\nDADOS FINANCEIROS COMPLETOS:\n${financialSummary}\n\nMISSÃO: Forneça de 3 a 5 RECOMENDAÇÕES ESTRATÉGICAS ACIONÁVEIS e de ALTO IMPACTO.\nFOCO: Rentabilidade, Eficiência, Liquidez, Crescimento, Estrutura de Capital, Mitigação de Riscos.\n\nFORMATO DE RESPOSTA (MARKDOWN, EM PORTUGUÊS DO BRASIL):\n## 🎯 RECOMENDAÇÕES ESTRATÉGICAS DE ALTO IMPACTO\n### Recomendação 1: [Título]\n- **Diagnóstico Financeiro Base:** [Problema ou oportunidade suportado por dados]\n- **Ação Estratégica Proposta:** [Descrição clara e detalhada]\n- **Impacto Esperado:** [Quantificação do benefício]\n- **Principais Passos para Implementação:** [Passos resumidos]\n- **Métricas Chave de Sucesso:** [KPIs]\n### Recomendação 2: ...\n...\n\nJustifique cada recomendação com base nos dados fornecidos.`;
}

function createFinancialDataExtractionPrompt(pdfText, periodTypeLabel, numberOfPeriods, providerKey) {
  const fieldKeys = getFieldKeys();
  const fieldDescriptions = fieldKeys.map(key => {
    const def = fieldDefinitions[key];
    return `- ${key}: ${def.label}`;
  }).join('\n');
  return `Você é um assistente de IA especializado em extração de dados financeiros.\n\nAnalise o TEXTO DO PDF abaixo e extraia os valores para OS SEGUINTES CAMPOS para ${numberOfPeriods} período(s) do tipo "${PERIOD_TYPES[periodTypeLabel]?.label || periodTypeLabel}".\n\nTEXTO DO PDF:\n---\n${pdfText}\n---\n\nCAMPOS PARA EXTRAIR:\n${fieldDescriptions}\n\nFORMATO DE RESPOSTA OBRIGATÓRIO (JSON Array of Objects, um objeto por período):\n[ { "periodLabel": "Período 1", "data": { ... } }, ... ]\nSe não encontrar dados, retorne [].`;
}

export function createFinancialAnalysisPrompt(analysisType, financialDataBundle, providerKey, options = {}) {
  const { companyInfo } = financialDataBundle;
  const promptTemplates = {
    [ANALYSIS_TYPES.EXECUTIVE_SUMMARY]: createStrategicRecommendationsPrompt, // You can swap for a more specific summary if needed
    [ANALYSIS_TYPES.VARIANCE_ANALYSIS]: createCashFlowAnalysisPrompt, // Placeholder, implement as needed
    [ANALYSIS_TYPES.RISK_ASSESSMENT]: createRiskAssessmentPrompt,
    [ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]: createCashFlowAnalysisPrompt,
    [ANALYSIS_TYPES.STRATEGIC_RECOMMENDATIONS]: createStrategicRecommendationsPrompt,
    [ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION]: (dataBundle, pKey, opts) =>
      createFinancialDataExtractionPrompt(dataBundle.pdfText || "", companyInfo.periodType, companyInfo.numberOfPeriods, pKey),
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
  const metadata = ANALYSIS_METADATA[analysisType];
  
  const standardized = {
    content: validatedResponse,
    metadata: {
      analysisType,
      typeName: metadata.name,
      provider: providerKey,
      timestamp: new Date().toISOString(),
      complexity: metadata.complexity
    }
  };

  // Add quality score estimation (simple heuristic)
  if (analysisType === ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION) {
    standardized.qualityScore = estimateExtractionQuality(validatedResponse);
  } else {
    standardized.qualityScore = estimateTextQuality(validatedResponse);
  }

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