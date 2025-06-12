// src/services/ai/utils/ResponseParser.js

/**
 * Utility class for parsing AI responses
 */
export class ResponseParser {
  /**
   * Parse JSON from AI response text
   * @param {string} text - Response text that may contain JSON
   * @returns {Object|Array|null} Parsed JSON or null
   */
  static extractJSON(text) {
    if (!text || typeof text !== 'string') return null;

    // Try direct parse first
    try {
      return JSON.parse(text);
    } catch {
      // Continue to extraction methods
    }

    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        // Continue to next method
      }
    }

    // Try to find JSON object or array in text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue to next method
      }
    }

    // Try to clean and parse
    try {
      // Remove common prefixes/suffixes
      const cleaned = text
        .replace(/^[^{[]*/, '') // Remove everything before first { or [
        .replace(/[^}\]]*$/, '') // Remove everything after last } or ]
        .trim();
      
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  /**
   * Parse structured sections from markdown response
   * @param {string} text - Markdown formatted text
   * @returns {Object} Sections keyed by heading
   */
  static parseMarkdownSections(text) {
    if (!text || typeof text !== 'string') return {};

    const sections = {};
    const lines = text.split('\n');
    let currentSection = 'introduction';
    let currentContent = [];

    for (const line of lines) {
      // Check for markdown headings
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = this.normalizeHeading(headingMatch[1]);
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract key-value pairs from text
   * @param {string} text - Text containing key-value pairs
   * @returns {Object} Extracted key-value pairs
   */
  static extractKeyValuePairs(text) {
    if (!text || typeof text !== 'string') return {};

    const pairs = {};
    const lines = text.split('\n');

    for (const line of lines) {
      // Match patterns like "Key: Value" or "Key = Value"
      const match = line.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (match) {
        const key = this.normalizeKey(match[1].trim());
        const value = this.parseValue(match[2].trim());
        pairs[key] = value;
      }
    }

    return pairs;
  }

  /**
   * Extract bullet points from text
   * @param {string} text - Text containing bullet points
   * @returns {Array<string>} Array of bullet point texts
   */
  static extractBulletPoints(text) {
    if (!text || typeof text !== 'string') return [];

    const bullets = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Match various bullet point formats
      const match = line.match(/^[\s]*[-*•·]\s+(.+)$/);
      if (match) {
        bullets.push(match[1].trim());
      }
    }

    return bullets;
  }

  /**
   * Extract numbered list items
   * @param {string} text - Text containing numbered list
   * @returns {Array<Object>} Array of {number, text} objects
   */
  static extractNumberedList(text) {
    if (!text || typeof text !== 'string') return [];

    const items = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Match numbered list formats like "1." or "1)"
      const match = line.match(/^[\s]*(\d+)[.)\s]+(.+)$/);
      if (match) {
        items.push({
          number: parseInt(match[1]),
          text: match[2].trim()
        });
      }
    }

    return items;
  }

  /**
   * Extract tables from markdown
   * @param {string} text - Markdown text containing tables
   * @returns {Array<Object>} Array of table objects
   */
  static extractTables(text) {
    if (!text || typeof text !== 'string') return [];

    const tables = [];
    const lines = text.split('\n');
    let inTable = false;
    let currentTable = { headers: [], rows: [] };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is a table row
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        
        if (!inTable) {
          // Start of new table
          inTable = true;
          currentTable = { headers: cells, rows: [] };
        } else if (i > 0 && lines[i - 1].includes('---')) {
          // Skip separator line
          continue;
        } else if (line.includes('---')) {
          // Separator line, headers are complete
          continue;
        } else {
          // Data row
          currentTable.rows.push(cells);
        }
      } else if (inTable) {
        // End of table
        tables.push(currentTable);
        inTable = false;
        currentTable = { headers: [], rows: [] };
      }
    }

    // Add last table if still in progress
    if (inTable && currentTable.headers.length > 0) {
      tables.push(currentTable);
    }

    return tables;
  }

  /**
   * Extract financial metrics from text
   * @param {string} text - Text containing financial data
   * @returns {Object} Extracted financial metrics
   */
  static extractFinancialMetrics(text) {
    if (!text || typeof text !== 'string') return {};

    const metrics = {};
    
    // Currency patterns
    const currencyPatterns = [
      { regex: /R\$\s*([\d.,]+)/g, currency: 'BRL' },
      { regex: /\$\s*([\d.,]+)/g, currency: 'USD' },
      { regex: /€\s*([\d.,]+)/g, currency: 'EUR' }
    ];

    // Percentage patterns
    const percentPattern = /([\d.,]+)\s*%/g;

    // Extract currency values
    for (const { regex, currency } of currencyPatterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const value = this.parseNumber(match[1]);
        const context = this.getContext(text, match.index, 50);
        const key = this.extractMetricKey(context);
        if (key) {
          metrics[key] = { value, currency, type: 'currency' };
        }
      }
    }

    // Extract percentages
    let match;
    while ((match = percentPattern.exec(text)) !== null) {
      const value = this.parseNumber(match[1]) / 100;
      const context = this.getContext(text, match.index, 50);
      const key = this.extractMetricKey(context);
      if (key) {
        metrics[key] = { value, type: 'percentage' };
      }
    }

    return metrics;
  }

  /**
   * Normalize heading text to key
   * @private
   */
  static normalizeHeading(heading) {
    return heading
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  /**
   * Normalize key text
   * @private
   */
  static normalizeKey(key) {
    return key
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  /**
   * Parse value string to appropriate type
   * @private
   */
  static parseValue(value) {
    // Try to parse as number
    const num = this.parseNumber(value);
    if (!isNaN(num)) return num;

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Parse number from string with locale handling
   * @private
   */
  static parseNumber(str) {
    if (typeof str === 'number') return str;
    
    // Remove currency symbols and spaces
    let cleaned = str.replace(/[R$€£¥\s]/g, '');
    
    // Handle Brazilian format (1.234,56)
    if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Handle standard format (1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
    
    return parseFloat(cleaned);
  }

  /**
   * Get context around a match
   * @private
   */
  static getContext(text, index, radius = 50) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end);
  }

  /**
   * Extract metric key from context
   * @private
   */
  static extractMetricKey(context) {
    // Common financial metric keywords
    const keywords = [
      'revenue', 'receita',
      'profit', 'lucro',
      'margin', 'margem',
      'ebitda', 'ebit',
      'cash', 'caixa',
      'debt', 'divida',
      'assets', 'ativos',
      'equity', 'patrimonio'
    ];

    const lowerContext = context.toLowerCase();
    for (const keyword of keywords) {
      if (lowerContext.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }
}