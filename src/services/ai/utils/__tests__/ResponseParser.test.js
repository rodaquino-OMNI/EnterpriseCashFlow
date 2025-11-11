// src/services/ai/utils/__tests__/ResponseParser.test.js
import { ResponseParser } from '../ResponseParser';

describe('ResponseParser', () => {
  describe('extractJSON', () => {
    it('should parse direct JSON object', () => {
      const text = '{"revenue": 1000, "profit": 200}';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual({ revenue: 1000, profit: 200 });
    });

    it('should parse direct JSON array', () => {
      const text = '[{"value": 100}, {"value": 200}]';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual([{ value: 100 }, { value: 200 }]);
    });

    it('should extract JSON from markdown code blocks', () => {
      const text = '```json\n{"revenue": 5000}\n```';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual({ revenue: 5000 });
    });

    it('should extract JSON from code blocks without language tag', () => {
      const text = '```\n{"revenue": 3000}\n```';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual({ revenue: 3000 });
    });

    it('should find JSON in mixed text', () => {
      const text = 'Here is the data: {"revenue": 7500, "costs": 4000} and more text';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual({ revenue: 7500, costs: 4000 });
    });

    it('should handle JSON with prefix and suffix text', () => {
      const text = 'Response:\n\n{"value": 123}\n\nEnd of response';
      const result = ResponseParser.extractJSON(text);

      expect(result).toEqual({ value: 123 });
    });

    it('should return null for invalid JSON', () => {
      const text = 'This is not JSON at all';
      const result = ResponseParser.extractJSON(text);

      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = ResponseParser.extractJSON(null);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = ResponseParser.extractJSON('');

      expect(result).toBeNull();
    });
  });

  describe('parseMarkdownSections', () => {
    it('should parse sections from markdown headings', () => {
      const text = `
# Executive Summary
This is the summary content.

## Financial Analysis
Here is the analysis.

### Key Metrics
Metrics details here.
      `;

      const sections = ResponseParser.parseMarkdownSections(text);

      expect(sections).toHaveProperty('executive_summary');
      expect(sections).toHaveProperty('financial_analysis');
      expect(sections).toHaveProperty('key_metrics');
      expect(sections.executive_summary).toContain('summary content');
    });

    it('should handle content before first heading', () => {
      const text = `Introduction text before headings.

# First Section
Section content.
      `;

      const sections = ResponseParser.parseMarkdownSections(text);

      expect(sections).toHaveProperty('introduction');
      expect(sections.introduction).toContain('Introduction text');
    });

    it('should normalize heading names', () => {
      const text = `
# Risk Assessment & Analysis
Content here.

## Cash-Flow Analysis
More content.
      `;

      const sections = ResponseParser.parseMarkdownSections(text);

      expect(sections).toHaveProperty('risk_assessment_analysis');
      expect(sections).toHaveProperty('cashflow_analysis');
    });

    it('should return empty object for no headings', () => {
      const text = 'Just plain text with no headings';

      const sections = ResponseParser.parseMarkdownSections(text);

      expect(sections.introduction).toBe('Just plain text with no headings');
    });

    it('should handle empty input', () => {
      const sections = ResponseParser.parseMarkdownSections('');

      expect(sections).toEqual({});
    });
  });

  describe('extractKeyValuePairs', () => {
    it('should extract colon-separated pairs', () => {
      const text = `
Revenue: R$ 1.000.000
Profit: R$ 200.000
Margin: 20%
      `;

      const pairs = ResponseParser.extractKeyValuePairs(text);

      expect(pairs).toHaveProperty('revenue');
      expect(pairs).toHaveProperty('profit');
      expect(pairs).toHaveProperty('margin');
    });

    it('should extract equals-separated pairs', () => {
      const text = `
company = TechCorp
year = 2024
revenue = 5000000
      `;

      const pairs = ResponseParser.extractKeyValuePairs(text);

      expect(pairs.company).toBe('TechCorp');
      expect(pairs.year).toBe(2024);
      expect(pairs.revenue).toBe(5000000);
    });

    it('should parse number values', () => {
      const text = 'count: 42\nprice: 99.99';

      const pairs = ResponseParser.extractKeyValuePairs(text);

      expect(pairs.count).toBe(42);
      expect(pairs.price).toBe(99.99);
    });

    it('should parse boolean values', () => {
      const text = 'active: true\ndisabled: false';

      const pairs = ResponseParser.extractKeyValuePairs(text);

      expect(pairs.active).toBe(true);
      expect(pairs.disabled).toBe(false);
    });

    it('should normalize keys', () => {
      const text = 'Net Profit: 1000\nGross-Margin: 30%';

      const pairs = ResponseParser.extractKeyValuePairs(text);

      expect(pairs).toHaveProperty('net_profit');
      expect(pairs).toHaveProperty('grossmargin');
    });

    it('should handle empty input', () => {
      const pairs = ResponseParser.extractKeyValuePairs('');

      expect(pairs).toEqual({});
    });
  });

  describe('extractBulletPoints', () => {
    it('should extract bullet points with dash', () => {
      const text = `
- First point
- Second point
- Third point
      `;

      const bullets = ResponseParser.extractBulletPoints(text);

      expect(bullets).toHaveLength(3);
      expect(bullets[0]).toBe('First point');
      expect(bullets[1]).toBe('Second point');
    });

    it('should extract bullet points with asterisk', () => {
      const text = `
* Point one
* Point two
      `;

      const bullets = ResponseParser.extractBulletPoints(text);

      expect(bullets).toHaveLength(2);
      expect(bullets[0]).toBe('Point one');
    });

    it('should extract bullet points with various symbols', () => {
      const text = `
• Bullet with filled circle
· Bullet with middle dot
- Regular dash bullet
      `;

      const bullets = ResponseParser.extractBulletPoints(text);

      expect(bullets).toHaveLength(3);
    });

    it('should handle indented bullets', () => {
      const text = `
  - Indented bullet
    - Nested bullet
      `;

      const bullets = ResponseParser.extractBulletPoints(text);

      expect(bullets).toHaveLength(2);
    });

    it('should return empty array for no bullets', () => {
      const text = 'Text without any bullets';

      const bullets = ResponseParser.extractBulletPoints(text);

      expect(bullets).toEqual([]);
    });
  });

  describe('extractNumberedList', () => {
    it('should extract numbered list with dots', () => {
      const text = `
1. First item
2. Second item
3. Third item
      `;

      const items = ResponseParser.extractNumberedList(text);

      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ number: 1, text: 'First item' });
      expect(items[1]).toEqual({ number: 2, text: 'Second item' });
    });

    it('should extract numbered list with parentheses', () => {
      const text = `
1) Item one
2) Item two
      `;

      const items = ResponseParser.extractNumberedList(text);

      expect(items).toHaveLength(2);
      expect(items[0].number).toBe(1);
      expect(items[1].number).toBe(2);
    });

    it('should handle indented numbered lists', () => {
      const text = `
  1. Indented item
    2. Nested item
      `;

      const items = ResponseParser.extractNumberedList(text);

      expect(items).toHaveLength(2);
    });

    it('should return empty array for no numbered items', () => {
      const text = 'Plain text without numbers';

      const items = ResponseParser.extractNumberedList(text);

      expect(items).toEqual([]);
    });
  });

  describe('extractTables', () => {
    it('should extract markdown table', () => {
      const text = `
| Metric | Value |
|--------|-------|
| Revenue | 1000 |
| Profit | 200 |
      `;

      const tables = ResponseParser.extractTables(text);

      expect(tables).toHaveLength(1);
      expect(tables[0].headers).toEqual(['Metric', 'Value']);
      expect(tables[0].rows).toHaveLength(2);
      expect(tables[0].rows[0]).toEqual(['Revenue', '1000']);
    });

    it('should extract multiple tables', () => {
      const text = `
| A | B |
|---|---|
| 1 | 2 |

Some text in between

| C | D | E |
|---|---|---|
| 3 | 4 | 5 |
      `;

      const tables = ResponseParser.extractTables(text);

      expect(tables).toHaveLength(2);
      expect(tables[0].headers).toEqual(['A', 'B']);
      expect(tables[1].headers).toEqual(['C', 'D', 'E']);
    });

    it('should handle tables without separator', () => {
      const text = `
| Header 1 | Header 2 |
| Data 1 | Data 2 |
      `;

      const tables = ResponseParser.extractTables(text);

      expect(tables).toHaveLength(1);
    });

    it('should return empty array for no tables', () => {
      const text = 'Text without any tables';

      const tables = ResponseParser.extractTables(text);

      expect(tables).toEqual([]);
    });
  });

  describe('extractFinancialMetrics', () => {
    it('should extract Brazilian currency values', () => {
      const text = 'Revenue: R$ 1.000.000 Profit: R$ 200.000';

      const metrics = ResponseParser.extractFinancialMetrics(text);

      expect(Object.keys(metrics)).toContain('revenue');
      expect(metrics.revenue.value).toBe(1000000);
      expect(metrics.revenue.currency).toBe('BRL');
      expect(metrics.revenue.type).toBe('currency');
    });

    it('should extract USD currency values', () => {
      const text = 'Cash: $ 50,000.00';

      const metrics = ResponseParser.extractFinancialMetrics(text);

      expect(Object.keys(metrics).length).toBeGreaterThan(0);
      const cashMetric = Object.values(metrics).find(m => m.currency === 'USD');
      expect(cashMetric).toBeDefined();
    });

    it('should extract percentage values', () => {
      const text = 'Margin: 25.5% Growth: 15%';

      const metrics = ResponseParser.extractFinancialMetrics(text);

      const marginMetric = Object.values(metrics).find(m => m.type === 'percentage' && m.value === 0.255);
      expect(marginMetric).toBeDefined();
    });

    it('should identify metric keys from context', () => {
      const text = 'Total revenue was R$ 5.000.000';

      const metrics = ResponseParser.extractFinancialMetrics(text);

      expect(metrics.revenue).toBeDefined();
      expect(metrics.revenue.value).toBe(5000000);
    });

    it('should handle empty input', () => {
      const metrics = ResponseParser.extractFinancialMetrics('');

      expect(metrics).toEqual({});
    });
  });

  describe('parseNumber', () => {
    it('should parse Brazilian format numbers', () => {
      const result = ResponseParser.parseNumber('1.234,56');

      expect(result).toBe(1234.56);
    });

    it('should parse US format numbers', () => {
      const result = ResponseParser.parseNumber('1,234.56');

      expect(result).toBe(1234.56);
    });

    it('should remove currency symbols', () => {
      const result1 = ResponseParser.parseNumber('R$ 1.000,00');
      const result2 = ResponseParser.parseNumber('$ 1,000.00');

      expect(result1).toBe(1000);
      expect(result2).toBe(1000);
    });

    it('should handle already numeric values', () => {
      const result = ResponseParser.parseNumber(42);

      expect(result).toBe(42);
    });

    it('should handle large numbers', () => {
      const result = ResponseParser.parseNumber('1.000.000,50');

      expect(result).toBe(1000000.5);
    });
  });

  describe('Integration Tests', () => {
    it('should parse complete AI response with multiple elements', () => {
      const response = `
# Executive Summary

Here are the key findings:

1. Revenue increased by 25%
2. Profit margin improved to 20%
3. Cash position is strong

## Financial Metrics

| Metric | Value |
|--------|-------|
| Revenue | R$ 1.000.000 |
| Profit | R$ 200.000 |

Key insights:
- Strong revenue growth
- Improved margins
- Positive cash flow

Risk Level: Medium
      `;

      const sections = ResponseParser.parseMarkdownSections(response);
      const bullets = ResponseParser.extractBulletPoints(sections.financial_metrics || '');
      const numbers = ResponseParser.extractNumberedList(response);
      const tables = ResponseParser.extractTables(response);
      const metrics = ResponseParser.extractFinancialMetrics(response);

      expect(Object.keys(sections)).toContain('executive_summary');
      expect(bullets).toHaveLength(3);
      expect(numbers).toHaveLength(3);
      expect(tables).toHaveLength(1);
      expect(metrics.revenue).toBeDefined();
    });
  });
});
