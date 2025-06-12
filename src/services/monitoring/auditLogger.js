/**
 * Audit logging service for financial operations
 * Maintains comprehensive audit trail for compliance and security
 */

import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
  constructor() {
    this.initialized = false;
    this.auditLog = [];
    this.maxLogSize = 10000;
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : null;
    this.storageKey = 'ecf_audit_log';
  }

  /**
   * Initialize audit logging service
   * @param {Object} config - Audit logging configuration
   */
  async initialize(config = {}) {
    const {
      enablePersistence = true,
      maxLogSize = 10000,
      retentionDays = 90,
    } = config;

    this.maxLogSize = maxLogSize;
    this.retentionDays = retentionDays;
    this.enablePersistence = enablePersistence;

    // Load existing audit logs from storage
    if (this.enablePersistence && this.localStorage) {
      this.loadFromStorage();
    }

    // Clean up old entries
    this.cleanupOldEntries();

    this.initialized = true;
  }

  /**
   * Log a financial operation
   * @param {string} action - The action performed
   * @param {Object} details - Operation details
   */
  logFinancialOperation(action, details) {
    const entry = this.createAuditEntry('FINANCIAL_OPERATION', {
      action,
      ...details,
    });

    this.addEntry(entry);

    // Log critical financial operations with higher priority
    const criticalActions = ['DELETE', 'MODIFY_AMOUNT', 'APPROVE_TRANSACTION', 'EXPORT_DATA'];
    if (criticalActions.includes(action)) {
      this.flagCriticalOperation(entry);
    }
  }

  /**
   * Log a data access event
   * @param {string} dataType - Type of data accessed
   * @param {string} operation - Operation performed
   * @param {Object} details - Additional details
   */
  logDataAccess(dataType, operation, details = {}) {
    const entry = this.createAuditEntry('DATA_ACCESS', {
      dataType,
      operation,
      ...details,
    });

    this.addEntry(entry);
  }

  /**
   * Log a configuration change
   * @param {string} setting - Setting that was changed
   * @param {*} oldValue - Previous value
   * @param {*} newValue - New value
   * @param {Object} context - Additional context
   */
  logConfigChange(setting, oldValue, newValue, context = {}) {
    const entry = this.createAuditEntry('CONFIG_CHANGE', {
      setting,
      oldValue: this.sanitizeValue(oldValue),
      newValue: this.sanitizeValue(newValue),
      ...context,
    });

    this.addEntry(entry);
  }

  /**
   * Log an authentication event
   * @param {string} event - Authentication event type
   * @param {Object} details - Event details
   */
  logAuthEvent(event, details = {}) {
    const entry = this.createAuditEntry('AUTHENTICATION', {
      event,
      ...details,
    });

    this.addEntry(entry);
  }

  /**
   * Log an export operation
   * @param {string} exportType - Type of export
   * @param {Object} details - Export details
   */
  logExport(exportType, details = {}) {
    const entry = this.createAuditEntry('DATA_EXPORT', {
      exportType,
      timestamp: new Date().toISOString(),
      ...details,
    });

    this.addEntry(entry);
  }

  /**
   * Create an audit entry
   * @param {string} type - Entry type
   * @param {Object} data - Entry data
   * @returns {Object} Audit entry
   */
  createAuditEntry(type, data) {
    return {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
      },
    };
  }

  /**
   * Add an entry to the audit log
   * @param {Object} entry - Audit entry
   */
  addEntry(entry) {
    this.auditLog.push(entry);

    // Maintain max log size
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.shift();
    }

    // Persist to storage
    if (this.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Flag a critical operation
   * @param {Object} entry - Audit entry
   */
  flagCriticalOperation(entry) {
    entry.critical = true;
    entry.metadata.flaggedAt = new Date().toISOString();
    
    // Could trigger additional alerts or notifications here
    console.warn('Critical operation logged:', entry);
  }

  /**
   * Sanitize data to remove sensitive information
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'apiKey', 'token', 'secret', 'creditCard', 'ssn'];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize a value for logging
   * @param {*} value - Value to sanitize
   * @returns {*} Sanitized value
   */
  sanitizeValue(value) {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...[truncated]';
    }
    return value;
  }

  /**
   * Get or create session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = uuidv4();
    }
    return this.sessionId;
  }

  /**
   * Search audit logs
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching entries
   */
  search(criteria = {}) {
    let results = [...this.auditLog];

    if (criteria.type) {
      results = results.filter(entry => entry.type === criteria.type);
    }

    if (criteria.startDate) {
      const startDate = new Date(criteria.startDate);
      results = results.filter(entry => new Date(entry.timestamp) >= startDate);
    }

    if (criteria.endDate) {
      const endDate = new Date(criteria.endDate);
      results = results.filter(entry => new Date(entry.timestamp) <= endDate);
    }

    if (criteria.action) {
      results = results.filter(entry => 
        entry.data.action && entry.data.action.includes(criteria.action)
      );
    }

    if (criteria.critical) {
      results = results.filter(entry => entry.critical === true);
    }

    return results;
  }

  /**
   * Get audit log statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const stats = {
      totalEntries: this.auditLog.length,
      byType: {},
      criticalOperations: 0,
      recentActivity: [],
    };

    this.auditLog.forEach(entry => {
      // Count by type
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      
      // Count critical operations
      if (entry.critical) {
        stats.criticalOperations++;
      }
    });

    // Get recent activity (last 10 entries)
    stats.recentActivity = this.auditLog.slice(-10).reverse();

    return stats;
  }

  /**
   * Export audit logs
   * @param {Object} options - Export options
   * @returns {string} Exported data
   */
  exportLogs(options = {}) {
    const { format = 'json', criteria = {} } = options;
    const logs = criteria ? this.search(criteria) : this.auditLog;

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Convert logs to CSV format
   * @param {Array} logs - Log entries
   * @returns {string} CSV string
   */
  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = ['ID', 'Type', 'Timestamp', 'Action', 'Details'];
    const rows = logs.map(entry => [
      entry.id,
      entry.type,
      entry.timestamp,
      entry.data.action || 'N/A',
      JSON.stringify(entry.data),
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /**
   * Load audit logs from storage
   */
  loadFromStorage() {
    if (!this.localStorage) return;

    try {
      const stored = this.localStorage.getItem(this.storageKey);
      if (stored) {
        this.auditLog = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
    }
  }

  /**
   * Save audit logs to storage
   */
  saveToStorage() {
    if (!this.localStorage) return;

    try {
      this.localStorage.setItem(this.storageKey, JSON.stringify(this.auditLog));
    } catch (error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }

  /**
   * Clean up old entries based on retention policy
   */
  cleanupOldEntries() {
    if (!this.retentionDays) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    this.auditLog = this.auditLog.filter(entry => 
      new Date(entry.timestamp) > cutoffDate
    );
  }

  /**
   * Get audit logger status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      entryCount: this.auditLog.length,
      oldestEntry: this.auditLog[0]?.timestamp,
      newestEntry: this.auditLog[this.auditLog.length - 1]?.timestamp,
      statistics: this.getStatistics(),
    };
  }

  /**
   * Flush audit logs
   */
  async flush() {
    if (this.enablePersistence) {
      this.saveToStorage();
    }
  }
}