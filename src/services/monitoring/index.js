/**
 * Central monitoring service for the Enterprise Cash Flow application
 * Provides logging, error tracking, performance monitoring, and audit trails
 */

import { LoggingService } from './loggingService';
import { ErrorTracker } from './errorTracker';
import { PerformanceMonitor } from './performanceMonitor';
import { AuditLogger } from './auditLogger';
import { MetricsCollector } from './metricsCollector';
import { SecurityMonitor } from './securityMonitor';

class MonitoringService {
  constructor() {
    this.logging = new LoggingService();
    this.errorTracker = new ErrorTracker();
    this.performanceMonitor = new PerformanceMonitor();
    this.auditLogger = new AuditLogger();
    this.metricsCollector = new MetricsCollector();
    this.securityMonitor = new SecurityMonitor();
    
    this.initialized = false;
  }

  /**
   * Initialize all monitoring services
   * @param {Object} config - Configuration object
   */
  async initialize(config = {}) {
    if (this.initialized) return;

    try {
      // Initialize each service
      await this.logging.initialize(config.logging);
      await this.errorTracker.initialize(config.errorTracking);
      await this.performanceMonitor.initialize(config.performance);
      await this.auditLogger.initialize(config.audit);
      await this.metricsCollector.initialize(config.metrics);
      await this.securityMonitor.initialize(config.security);

      this.initialized = true;
      this.logging.info('Monitoring services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring services:', error);
      throw error;
    }
  }

  /**
   * Log an informational message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  log(message, metadata = {}) {
    this.logging.info(message, metadata);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  warn(message, metadata = {}) {
    this.logging.warn(message, metadata);
  }

  /**
   * Log an error
   * @param {Error} error - The error to log
   * @param {Object} context - Additional context
   */
  error(error, context = {}) {
    this.logging.error(error.message, { error, ...context });
    this.errorTracker.captureError(error, context);
  }

  /**
   * Track a performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags
   */
  trackMetric(name, value, tags = {}) {
    this.metricsCollector.record(name, value, tags);
  }

  /**
   * Start a performance timer
   * @param {string} operationName - Name of the operation
   * @returns {Function} Function to stop the timer
   */
  startTimer(operationName) {
    return this.performanceMonitor.startTimer(operationName);
  }

  /**
   * Log a financial operation for audit
   * @param {string} action - The action performed
   * @param {Object} details - Operation details
   */
  auditFinancialOperation(action, details) {
    this.auditLogger.logFinancialOperation(action, details);
  }

  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   */
  logSecurityEvent(eventType, details) {
    this.securityMonitor.logEvent(eventType, details);
  }

  /**
   * Check if a user action is allowed
   * @param {string} userId - User ID
   * @param {string} action - Action to check
   * @returns {boolean} Whether the action is allowed
   */
  checkSecurityPolicy(userId, action) {
    return this.securityMonitor.checkPolicy(userId, action);
  }

  /**
   * Get current system health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      logging: this.logging.getStatus(),
      errorTracking: this.errorTracker.getStatus(),
      performance: this.performanceMonitor.getStatus(),
      audit: this.auditLogger.getStatus(),
      metrics: this.metricsCollector.getStatus(),
      security: this.securityMonitor.getStatus(),
    };
  }

  /**
   * Flush all pending logs and metrics
   */
  async flush() {
    await Promise.all([
      this.logging.flush(),
      this.errorTracker.flush(),
      this.metricsCollector.flush(),
      this.auditLogger.flush(),
    ]);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export individual services for direct access if needed
export { LoggingService } from './loggingService';
export { ErrorTracker } from './errorTracker';
export { PerformanceMonitor } from './performanceMonitor';
export { AuditLogger } from './auditLogger';
export { MetricsCollector } from './metricsCollector';
export { SecurityMonitor } from './securityMonitor';