// src/services/ai/templates/__tests__/PromptTemplates.test.js
import {
  PromptTemplate,
  ExecutiveSummaryTemplate,
  RiskAssessmentTemplate,
  CashFlowAnalysisTemplate,
  VarianceAnalysisTemplate,
  DataExtractionTemplate,
  InsightGenerationTemplate,
  PromptTemplateFactory,
} from '../PromptTemplates';

describe('PromptTemplate', () => {
  let template;

  beforeEach(() => {
    template = new PromptTemplate();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(template.language).toBe('pt-BR');
      expect(template.currency).toBe('BRL');
      expect(template.dateFormat).toBe('DD/MM/YYYY');
    });

    it('should accept custom options', () => {
      const customTemplate = new PromptTemplate({
        language: 'en-US',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      });

      expect(customTemplate.language).toBe('en-US');
      expect(customTemplate.currency).toBe('USD');
      expect(customTemplate.dateFormat).toBe('MM/DD/YYYY');
    });
  });

  describe('buildFinancialContext', () => {
    const mockFinancialData = {
      calculatedData: [
        {
          revenue: 1000000,
          cogs: 600000,
          grossProfit: 400000,
          gmPct: 0.4,
          operatingExpenses: 200000,
          ebitda: 250000,
          ebit: 200000,
          opProfitPct: 0.2,
          netProfit: 150000,
          netProfitPct: 0.15,
          workingCapitalValue: 100000,
          wcDays: 30,
          arDaysDerived: 45,
          inventoryDaysDerived: 60,
          apDaysDerived: 75,
          operatingCashFlow: 180000,
          netCashFlowBeforeFinancing: 120000,
          closingCash: 300000,
        },
      ],
    };

    const mockCompanyInfo = {
      name: 'Test Company',
      reportTitle: 'Q1 2024 Analysis',
      periodType: 'monthly',
    };

    it('should build financial context from data', () => {
      const context = template.buildFinancialContext(mockFinancialData, mockCompanyInfo);

      expect(context).toContain('Test Company');
      expect(context).toContain('Q1 2024 Analysis');
      expect(context).toContain('FINANCIAL DATA BY PERIOD');
    });

    it('should return empty string for empty data', () => {
      const context = template.buildFinancialContext({ calculatedData: [] }, mockCompanyInfo);

      expect(context).toBe('');
    });
  });
});

describe('ExecutiveSummaryTemplate', () => {
  let template;

  beforeEach(() => {
    template = new ExecutiveSummaryTemplate();
  });

  describe('generate', () => {
    const mockData = {
      calculatedData: [{
        revenue: 1000000,
        netProfit: 150000,
        netProfitPct: 0.15,
      }],
    };

    const mockCompany = {
      name: 'TechCorp',
      reportTitle: 'Annual Report',
      periodType: 'yearly',
    };

    it('should generate executive summary prompt', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('senior financial consultant');
      expect(prompt).toContain('EXECUTIVE ANALYSIS REQUIREMENTS');
      expect(prompt).toContain('CURRENT SITUATION');
      expect(prompt).toContain('RECOMMENDATIONS');
      expect(prompt).toContain('Portuguese (Brazil)');
    });

    it('should use English language when configured', () => {
      const enTemplate = new ExecutiveSummaryTemplate({ language: 'en-US' });
      const prompt = enTemplate.generate(mockData, mockCompany);

      expect(prompt).toContain('English');
    });

    it('should include company context', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('TechCorp');
      expect(prompt).toContain('Annual Report');
    });
  });
});

describe('RiskAssessmentTemplate', () => {
  let template;

  beforeEach(() => {
    template = new RiskAssessmentTemplate();
  });

  describe('generate', () => {
    const mockData = {
      calculatedData: [{
        revenue: 1000000,
        netProfit: 100000,
      }],
    };

    const mockCompany = {
      name: 'RiskCo',
      reportTitle: 'Risk Analysis',
      periodType: 'quarterly',
    };

    it('should generate risk assessment prompt', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('financial risk management expert');
      expect(prompt).toContain('RISK ASSESSMENT FRAMEWORK');
      expect(prompt).toContain('LIQUIDITY RISKS');
      expect(prompt).toContain('OPERATIONAL RISKS');
      expect(prompt).toContain('FINANCIAL STRUCTURE RISKS');
      expect(prompt).toContain('STRATEGIC RISKS');
    });

    it('should include risk deliverables', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('Risk matrix');
      expect(prompt).toContain('mitigation strategies');
      expect(prompt).toContain('Early warning indicators');
    });
  });
});

describe('CashFlowAnalysisTemplate', () => {
  let template;

  beforeEach(() => {
    template = new CashFlowAnalysisTemplate();
  });

  describe('generate', () => {
    const mockData = {
      calculatedData: [{
        operatingCashFlow: 200000,
        closingCash: 500000,
      }],
    };

    const mockCompany = {
      name: 'CashCo',
      reportTitle: 'Cash Flow Report',
      periodType: 'monthly',
    };

    it('should generate cash flow analysis prompt', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('cash flow and treasury management specialist');
      expect(prompt).toContain('OPERATING CASH FLOW');
      expect(prompt).toContain('WORKING CAPITAL IMPACT');
      expect(prompt).toContain('INVESTMENT ACTIVITIES');
      expect(prompt).toContain('FINANCING ACTIVITIES');
      expect(prompt).toContain('CASH POSITION');
    });

    it('should include optimization recommendations', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('cash optimization opportunities');
      expect(prompt).toContain('Working capital improvement');
    });
  });
});

describe('VarianceAnalysisTemplate', () => {
  let template;

  beforeEach(() => {
    template = new VarianceAnalysisTemplate();
  });

  describe('generate', () => {
    const mockData = {
      calculatedData: [
        { revenue: 900000, netProfit: 100000 },
        { revenue: 1000000, netProfit: 150000 },
      ],
    };

    const mockCompany = {
      name: 'VarianceCo',
      reportTitle: 'Variance Report',
      periodType: 'monthly',
    };

    it('should generate variance analysis prompt', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('variance analysis');
      expect(prompt).toContain('PERIOD-OVER-PERIOD ANALYSIS');
      expect(prompt).toContain('ROOT CAUSE ANALYSIS');
      expect(prompt).toContain('TREND PATTERNS');
      expect(prompt).toContain('STRATEGIC QUESTIONS');
    });

    it('should focus on comparing periods', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('Last vs Previous');
      expect(prompt).toContain('Last vs First period');
    });
  });
});

describe('DataExtractionTemplate', () => {
  let template;

  beforeEach(() => {
    template = new DataExtractionTemplate();
  });

  describe('generate', () => {
    const schema = {
      revenue: 'number',
      profit: 'number',
      margin: 'number',
    };

    const content = 'Revenue: R$ 1.000.000, Profit: R$ 200.000';

    it('should generate data extraction prompt', () => {
      const prompt = template.generate(content, schema, 'PDF');

      expect(prompt).toContain('financial data extraction specialist');
      expect(prompt).toContain('SCHEMA:');
      expect(prompt).toContain('EXTRACTION RULES');
      expect(prompt).toContain('Revenue: R$ 1.000.000');
    });

    it('should include schema in prompt', () => {
      const prompt = template.generate(content, schema, 'Excel');

      expect(prompt).toContain('"revenue"');
      expect(prompt).toContain('"profit"');
      expect(prompt).toContain('"margin"');
    });

    it('should specify source type', () => {
      const prompt = template.generate(content, schema, 'Excel');

      expect(prompt).toContain('Excel');
    });

    it('should include Brazilian currency parsing rules', () => {
      const prompt = template.generate(content, schema, 'PDF');

      expect(prompt).toContain('R$ 1.234,56 = 1234.56');
      expect(prompt).toContain('Remove currency symbols');
    });
  });
});

describe('InsightGenerationTemplate', () => {
  let template;

  beforeEach(() => {
    template = new InsightGenerationTemplate();
  });

  describe('generate', () => {
    const mockData = {
      calculatedData: [{
        revenue: 1000000,
        netProfit: 150000,
      }],
    };

    const mockCompany = {
      name: 'InsightCo',
      reportTitle: 'Insights Report',
      periodType: 'quarterly',
    };

    it('should generate insight generation prompt', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('AI-powered financial insight generator');
      expect(prompt).toContain('HIDDEN PATTERNS');
      expect(prompt).toContain('PREDICTIVE INDICATORS');
      expect(prompt).toContain('COMPARATIVE INSIGHTS');
      expect(prompt).toContain('STRATEGIC IMPLICATIONS');
    });

    it('should include focus areas when provided', () => {
      const focusAreas = ['profitability', 'cash flow', 'efficiency'];
      const prompt = template.generate(mockData, mockCompany, focusAreas);

      expect(prompt).toContain('profitability, cash flow, efficiency');
    });

    it('should default to all aspects when no focus areas', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('all financial aspects');
    });

    it('should require actionability scoring', () => {
      const prompt = template.generate(mockData, mockCompany);

      expect(prompt).toContain('actionability score');
      expect(prompt).toContain('data-driven');
    });
  });
});

describe('PromptTemplateFactory', () => {
  describe('create', () => {
    it('should create ExecutiveSummaryTemplate', () => {
      const template = PromptTemplateFactory.create('executive_summary');

      expect(template).toBeInstanceOf(ExecutiveSummaryTemplate);
    });

    it('should create RiskAssessmentTemplate', () => {
      const template = PromptTemplateFactory.create('risk_assessment');

      expect(template).toBeInstanceOf(RiskAssessmentTemplate);
    });

    it('should create CashFlowAnalysisTemplate', () => {
      const template = PromptTemplateFactory.create('cash_flow_analysis');

      expect(template).toBeInstanceOf(CashFlowAnalysisTemplate);
    });

    it('should create VarianceAnalysisTemplate', () => {
      const template = PromptTemplateFactory.create('variance_analysis');

      expect(template).toBeInstanceOf(VarianceAnalysisTemplate);
    });

    it('should create DataExtractionTemplate', () => {
      const template = PromptTemplateFactory.create('data_extraction');

      expect(template).toBeInstanceOf(DataExtractionTemplate);
    });

    it('should create InsightGenerationTemplate', () => {
      const template = PromptTemplateFactory.create('insight_generation');

      expect(template).toBeInstanceOf(InsightGenerationTemplate);
    });

    it('should pass options to template', () => {
      const template = PromptTemplateFactory.create('executive_summary', {
        language: 'en-US',
        currency: 'USD',
      });

      expect(template.language).toBe('en-US');
      expect(template.currency).toBe('USD');
    });

    it('should throw error for unknown template type', () => {
      expect(() => {
        PromptTemplateFactory.create('unknown_template');
      }).toThrow('Unknown prompt template type: unknown_template');
    });
  });

  describe('registerTemplate', () => {
    class CustomTemplate extends PromptTemplate {
      generate() {
        return 'Custom prompt';
      }
    }

    it('should register custom template', () => {
      PromptTemplateFactory.registerTemplate('custom', CustomTemplate);

      const template = PromptTemplateFactory.create('custom');

      expect(template).toBeInstanceOf(CustomTemplate);
      expect(template.generate()).toBe('Custom prompt');
    });

    it('should allow overriding existing templates', () => {
      class OverrideTemplate extends PromptTemplate {
        generate() {
          return 'Override';
        }
      }

      PromptTemplateFactory.registerTemplate('executive_summary', OverrideTemplate);

      const template = PromptTemplateFactory.create('executive_summary');

      expect(template).toBeInstanceOf(OverrideTemplate);

      // Restore original
      PromptTemplateFactory.registerTemplate('executive_summary', ExecutiveSummaryTemplate);
    });
  });

  describe('Integration', () => {
    it('should create all template types without errors', () => {
      const types = [
        'executive_summary',
        'risk_assessment',
        'cash_flow_analysis',
        'variance_analysis',
        'data_extraction',
        'insight_generation',
      ];

      types.forEach(type => {
        expect(() => {
          PromptTemplateFactory.create(type);
        }).not.toThrow();
      });
    });

    it('should create templates with consistent configuration', () => {
      const options = {
        language: 'en-US',
        currency: 'EUR',
        dateFormat: 'YYYY-MM-DD',
      };

      const template1 = PromptTemplateFactory.create('executive_summary', options);
      const template2 = PromptTemplateFactory.create('risk_assessment', options);

      expect(template1.language).toBe('en-US');
      expect(template2.language).toBe('en-US');
      expect(template1.currency).toBe('EUR');
      expect(template2.currency).toBe('EUR');
    });
  });
});
