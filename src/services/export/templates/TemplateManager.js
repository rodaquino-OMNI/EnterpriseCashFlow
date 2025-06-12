/**
 * Template Manager
 * Manages report templates for customizable exports
 */

import { defaultTemplates } from './defaultTemplates';

export class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.customTemplates = new Map();
    
    // Load default templates
    this.loadDefaultTemplates();
    
    // Load custom templates from storage
    this.loadCustomTemplates();
  }

  /**
   * Load default templates
   */
  loadDefaultTemplates() {
    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Load custom templates from local storage
   */
  loadCustomTemplates() {
    try {
      const stored = localStorage.getItem('customReportTemplates');
      if (stored) {
        const templates = JSON.parse(stored);
        templates.forEach(template => {
          this.customTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom templates:', error);
    }
  }

  /**
   * Save custom templates to local storage
   */
  saveCustomTemplates() {
    try {
      const templates = Array.from(this.customTemplates.values());
      localStorage.setItem('customReportTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
    }
  }

  /**
   * Get all templates
   * @returns {Array} All templates
   */
  getAllTemplates() {
    return [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values())
    ];
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object} Template or null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || this.customTemplates.get(templateId);
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Array} Templates in category
   */
  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  /**
   * Create custom template
   * @param {Object} template - Template configuration
   * @returns {Object} Created template
   */
  createTemplate(template) {
    const newTemplate = {
      ...template,
      id: template.id || this.generateTemplateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true
    };
    
    this.customTemplates.set(newTemplate.id, newTemplate);
    this.saveCustomTemplates();
    
    return newTemplate;
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Object} Updated template
   */
  updateTemplate(templateId, updates) {
    const template = this.customTemplates.get(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found or is not editable`);
    }
    
    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId,
      updatedAt: new Date().toISOString()
    };
    
    this.customTemplates.set(templateId, updatedTemplate);
    this.saveCustomTemplates();
    
    return updatedTemplate;
  }

  /**
   * Delete custom template
   * @param {string} templateId - Template ID
   * @returns {boolean} Success
   */
  deleteTemplate(templateId) {
    if (this.templates.has(templateId)) {
      throw new Error('Cannot delete default template');
    }
    
    const deleted = this.customTemplates.delete(templateId);
    if (deleted) {
      this.saveCustomTemplates();
    }
    
    return deleted;
  }

  /**
   * Clone template
   * @param {string} templateId - Template ID to clone
   * @param {string} newName - New template name
   * @returns {Object} Cloned template
   */
  cloneTemplate(templateId, newName) {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const clonedTemplate = {
      ...template,
      id: this.generateTemplateId(),
      name: newName || `${template.name} (Copy)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.customTemplates.set(clonedTemplate.id, clonedTemplate);
    this.saveCustomTemplates();
    
    return clonedTemplate;
  }

  /**
   * Apply template to data
   * @param {string} templateId - Template ID
   * @param {Object} data - Report data
   * @returns {Object} Formatted data
   */
  applyTemplate(templateId, data) {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return this.processTemplate(template, data);
  }

  /**
   * Process template with data
   * @param {Object} template - Template configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed data
   */
  processTemplate(template, data) {
    const result = {
      title: template.layout.title || data.title,
      metadata: {
        ...template.metadata,
        ...data.metadata
      },
      styling: template.styling,
      branding: template.branding
    };
    
    // Process sections
    result.sections = template.sections.map(section => {
      return this.processSection(section, data);
    });
    
    // Apply data transformations
    if (template.transformations) {
      template.transformations.forEach(transform => {
        result.sections = this.applyTransformation(result.sections, transform);
      });
    }
    
    return result;
  }

  /**
   * Process template section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed section
   */
  processSection(section, data) {
    const processed = {
      ...section,
      data: null
    };
    
    switch (section.type) {
      case 'summary':
        processed.data = this.processSummarySection(section, data);
        break;
        
      case 'kpis':
        processed.data = this.processKPISection(section, data);
        break;
        
      case 'table':
        processed.data = this.processTableSection(section, data);
        break;
        
      case 'chart':
        processed.data = this.processChartSection(section, data);
        break;
        
      case 'custom':
        processed.data = this.processCustomSection(section, data);
        break;
        
      default:
        processed.data = data[section.dataKey] || null;
    }
    
    return processed;
  }

  /**
   * Process summary section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed summary
   */
  processSummarySection(section, data) {
    const summaryData = data[section.dataKey] || data.summary || {};
    
    return {
      text: summaryData.text || section.defaultText || '',
      highlights: summaryData.highlights || section.highlights || [],
      metrics: summaryData.metrics || section.metrics || []
    };
  }

  /**
   * Process KPI section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Array} Processed KPIs
   */
  processKPISection(section, data) {
    const kpiData = data[section.dataKey] || data.kpis || [];
    
    // Filter KPIs if specified
    if (section.filter) {
      return kpiData.filter(kpi => section.filter.includes(kpi.id || kpi.label));
    }
    
    // Sort KPIs if specified
    if (section.sort) {
      return [...kpiData].sort((a, b) => {
        const aValue = a[section.sort.field];
        const bValue = b[section.sort.field];
        return section.sort.order === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    return kpiData;
  }

  /**
   * Process table section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed table
   */
  processTableSection(section, data) {
    const tableData = data[section.dataKey] || {};
    
    const processed = {
      title: section.title || tableData.title,
      headers: section.headers || tableData.headers,
      data: tableData.data || [],
      formatting: section.formatting || tableData.formatting,
      totals: section.showTotals ? this.calculateTotals(tableData.data, section.totalColumns) : null
    };
    
    // Apply column visibility
    if (section.visibleColumns) {
      processed.headers = processed.headers.filter(h => section.visibleColumns.includes(h));
      processed.data = processed.data.map(row => {
        const filtered = {};
        section.visibleColumns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });
    }
    
    // Apply sorting
    if (section.sort) {
      processed.data = [...processed.data].sort((a, b) => {
        const aValue = a[section.sort.column];
        const bValue = b[section.sort.column];
        return section.sort.order === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    return processed;
  }

  /**
   * Process chart section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed chart
   */
  processChartSection(section, data) {
    const chartData = data[section.dataKey] || {};
    
    return {
      type: section.chartType || chartData.type,
      title: section.title || chartData.title,
      data: chartData.data || [],
      options: {
        ...section.chartOptions,
        ...chartData.options
      },
      element: chartData.element // For existing chart elements
    };
  }

  /**
   * Process custom section
   * @param {Object} section - Section configuration
   * @param {Object} data - Report data
   * @returns {Object} Processed custom section
   */
  processCustomSection(section, data) {
    if (section.processor && typeof section.processor === 'function') {
      return section.processor(data);
    }
    
    return data[section.dataKey] || section.defaultData || null;
  }

  /**
   * Apply transformation to sections
   * @param {Array} sections - Report sections
   * @param {Object} transformation - Transformation configuration
   * @returns {Array} Transformed sections
   */
  applyTransformation(sections, transformation) {
    switch (transformation.type) {
      case 'filter':
        return sections.filter(section => 
          transformation.condition(section)
        );
        
      case 'reorder':
        return transformation.order.map(id => 
          sections.find(s => s.id === id)
        ).filter(Boolean);
        
      case 'merge':
        return this.mergeSections(sections, transformation.mergeConfig);
        
      default:
        return sections;
    }
  }

  /**
   * Calculate totals for table columns
   * @param {Array} data - Table data
   * @param {Array} columns - Columns to total
   * @returns {Object} Totals row
   */
  calculateTotals(data, columns) {
    const totals = { label: 'Total' };
    
    columns.forEach(column => {
      totals[column] = data.reduce((sum, row) => {
        const value = parseFloat(row[column]) || 0;
        return sum + value;
      }, 0);
    });
    
    return totals;
  }

  /**
   * Merge sections
   * @param {Array} sections - Sections to merge
   * @param {Object} config - Merge configuration
   * @returns {Array} Merged sections
   */
  mergeSections(sections, config) {
    const { sectionIds, newSection } = config;
    const toMerge = sections.filter(s => sectionIds.includes(s.id));
    const others = sections.filter(s => !sectionIds.includes(s.id));
    
    if (toMerge.length === 0) {
      return sections;
    }
    
    const merged = {
      ...newSection,
      id: newSection.id || `merged-${Date.now()}`,
      data: toMerge.map(s => s.data)
    };
    
    return [...others, merged];
  }

  /**
   * Generate unique template ID
   * @returns {string} Template ID
   */
  generateTemplateId() {
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export template
   * @param {string} templateId - Template ID
   * @returns {Object} Template for export
   */
  exportTemplate(templateId) {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Remove internal properties
    const { createdAt, updatedAt, ...exportable } = template;
    
    return exportable;
  }

  /**
   * Import template
   * @param {Object} template - Template to import
   * @returns {Object} Imported template
   */
  importTemplate(template) {
    const imported = {
      ...template,
      id: this.generateTemplateId(),
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.customTemplates.set(imported.id, imported);
    this.saveCustomTemplates();
    
    return imported;
  }
}