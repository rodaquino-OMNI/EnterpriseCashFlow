// src/utils/aiAnalysisTypes.js

export const ANALYSIS_TYPES = {
  EXECUTIVE_SUMMARY: 'executive_summary',
  VARIANCE_ANALYSIS: 'variance_analysis',
  RISK_ASSESSMENT: 'risk_assessment',
  CASH_FLOW_ANALYSIS: 'cash_flow_analysis',
  STRATEGIC_RECOMMENDATIONS: 'strategic_recommendations',
  // DETAILED_AUDIT: 'detailed_audit', // Can be added later if complex prompt defined
  FINANCIAL_DATA_EXTRACTION: 'financial_data_extraction', // For PDF parsing
};

/**
 * @typedef {Object} AnalysisMetadata
 * @property {string} name - Display name for the analysis type (in Portuguese).
 * @property {string} description - Brief description of the analysis.
 * @property {string} targetAudience - Who this analysis is primarily for.
 * @property {string} [estimatedTime] - Estimated time AI takes (conceptual).
 * @property {'low' | 'medium' | 'high'} complexity - Complexity of the analysis/prompt.
 * @property {string} icon - Emoji icon.
 * @property {number} [defaultOutputTokens] - Suggested output tokens for this type of analysis.
 */

/** @type {Record<string, AnalysisMetadata>} */
export const ANALYSIS_METADATA = {
  [ANALYSIS_TYPES.EXECUTIVE_SUMMARY]: {
    name: 'Resumo Executivo C-Level',
    description: 'Análise estratégica da performance financeira geral para alta diretoria.',
    targetAudience: 'C-Level, Diretores',
    complexity: 'high',
    icon: '👔',
    defaultOutputTokens: 1500,
  },
  [ANALYSIS_TYPES.VARIANCE_ANALYSIS]: {
    name: 'Análise de Variações Detalhada',
    description: 'Identificação e explicação das principais mudanças financeiras entre períodos.',
    targetAudience: 'CFO, Controladoria, Gerentes Financeiros',
    complexity: 'medium',
    icon: '📈',
    defaultOutputTokens: 2000,
  },
  [ANALYSIS_TYPES.RISK_ASSESSMENT]: {
    name: 'Avaliação de Riscos Financeiros',
    description: 'Identificação de riscos de liquidez, operacionais, financeiros e de capital de giro.',
    targetAudience: 'Gerenciamento de Riscos, CFO, Conselho',
    complexity: 'high',
    icon: '🛡️',
    defaultOutputTokens: 2500,
  },
  [ANALYSIS_TYPES.CASH_FLOW_ANALYSIS]: {
    name: 'Análise Aprofundada do Fluxo de Caixa',
    description: 'Diagnóstico da geração e uso de caixa, qualidade do FCO, e necessidades de financiamento.',
    targetAudience: 'CFO, Tesouraria, Analistas Financeiros',
    complexity: 'high',
    icon: '🌊',
    defaultOutputTokens: 2000,
  },
  [ANALYSIS_TYPES.STRATEGIC_RECOMMENDATIONS]: {
    name: 'Recomendações Estratégicas',
    description: 'Sugestões de ações e estratégias baseadas na análise financeira para melhoria de performance.',
    targetAudience: 'C-Level, Planejamento Estratégico',
    complexity: 'high',
    icon: '🎯',
    defaultOutputTokens: 1500,
  },
  [ANALYSIS_TYPES.FINANCIAL_DATA_EXTRACTION]: {
    name: 'Extração de Dados Financeiros (de Texto/PDF)',
    description: 'Utiliza IA para extrair dados financeiros estruturados de um texto fornecido.',
    targetAudience: 'Sistema Interno', // Not usually user-selectable directly for this purpose
    complexity: 'high', // Prompt is complex
    icon: '🧩',
    defaultOutputTokens: 3000, // Allow more tokens for JSON structure
  },
  // Example for a future detailed audit
  // [ANALYSIS_TYPES.DETAILED_AUDIT]: {
  //   name: 'Auditoria Financeira Detalhada (Simulada)',
  //   description: 'Análise compreensiva simulando uma auditoria, buscando inconsistências e qualidade da informação.',
  //   targetAudience: 'Auditores Internos, Controladoria',
  //   complexity: 'very_high',
  //   icon: '📋',
  // defaultOutputTokens: 6000,
  // },
};