/**
 * Structured Logger Utility
 * Production-grade logging with environment awareness and Sentry integration
 *
 * Features:
 * - Environment-aware filtering (no logs in production unless error)
 * - Structured JSON logging for production
 * - Automatic Sentry integration for errors
 * - Performance tracking
 * - Context preservation
 *
 * Usage:
 *   import Logger from './utils/Logger';
 *   Logger.debug('Debug info', { data });
 *   Logger.info('Operation completed', { userId });
 *   Logger.warn('Performance issue', { duration });
 *   Logger.error('Operation failed', error, { context });
 */

import * as Sentry from '@sentry/react';

class LoggerService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.environment === 'development';
    this.isProduction = this.environment === 'production';
    this.isTest = this.environment === 'test';

    // Log level hierarchy
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    // Minimum level to log (configurable)
    this.minLevel = this.isProduction ? this.levels.warn : this.levels.debug;

    // Performance tracking
    this.timers = new Map();
  }

  /**
   * Format log message with metadata
   * @private
   */
  _formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      // JSON format for production (parseable by log aggregators)
      return JSON.stringify({
        timestamp,
        level,
        message,
        environment: this.environment,
        ...metadata,
      });
    }

    // Human-readable format for development
    const metaStr = Object.keys(metadata).length > 0
      ? `\n${JSON.stringify(metadata, null, 2)}`
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Check if level should be logged
   * @private
   */
  _shouldLog(level) {
    if (this.isTest) {
      // In tests, only log errors by default
      return this.levels[level] >= this.levels.error;
    }
    return this.levels[level] >= this.minLevel;
  }

  /**
   * Send log to appropriate output
   * @private
   */
  _output(level, formattedMessage, originalMessage, metadata, error) {
    if (!this._shouldLog(level)) return;

    // Output to console (only in development or for errors)
    if (this.isDevelopment || level === 'error') {
      const consoleMethod = console[level] || console.log;
      consoleMethod(formattedMessage);
    }

    // Send errors to Sentry
    if (level === 'error' && error) {
      this._sendToSentry(error, originalMessage, metadata);
    } else if (level === 'warn' && this.isProduction) {
      // Send warnings to Sentry in production as messages
      Sentry.captureMessage(originalMessage, 'warning');
    }
  }

  /**
   * Send error to Sentry with context
   * @private
   */
  _sendToSentry(error, message, metadata) {
    try {
      Sentry.withScope((scope) => {
        // Add metadata as context
        scope.setContext('logContext', {
          message,
          timestamp: new Date().toISOString(),
          ...metadata,
        });

        // Add tags for filtering
        if (metadata.component) {
          scope.setTag('component', metadata.component);
        }
        if (metadata.operation) {
          scope.setTag('operation', metadata.operation);
        }
        if (metadata.userId) {
          scope.setUser({ id: metadata.userId });
        }

        // Capture the error
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          // If not an Error object, create one
          const err = new Error(message);
          err.originalError = error;
          Sentry.captureException(err);
        }
      });
    } catch (sentryError) {
      // Fallback if Sentry fails - use console as last resort
      console.error('Failed to send to Sentry:', sentryError);
    }
  }

  /**
   * Debug level logging (development only)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   */
  debug(message, metadata = {}) {
    const formatted = this._formatMessage('debug', message, metadata);
    this._output('debug', formatted, message, metadata);
  }

  /**
   * Info level logging (development and staging)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   */
  info(message, metadata = {}) {
    const formatted = this._formatMessage('info', message, metadata);
    this._output('info', formatted, message, metadata);
  }

  /**
   * Warning level logging (all environments)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional context
   */
  warn(message, metadata = {}) {
    const formatted = this._formatMessage('warn', message, metadata);
    this._output('warn', formatted, message, metadata);
  }

  /**
   * Error level logging (all environments + Sentry)
   * @param {string} message - Log message
   * @param {Error|any} error - Error object or value
   * @param {Object} metadata - Additional context
   */
  error(message, error = null, metadata = {}) {
    // Enhance metadata with error details
    const enhancedMetadata = {
      ...metadata,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
    };

    const formatted = this._formatMessage('error', message, enhancedMetadata);
    this._output('error', formatted, message, enhancedMetadata, error);
  }

  /**
   * Start a performance timer
   * @param {string} label - Timer label
   */
  time(label) {
    this.timers.set(label, performance.now());
  }

  /**
   * End a performance timer and log the duration
   * @param {string} label - Timer label
   * @param {Object} metadata - Additional context
   */
  timeEnd(label, metadata = {}) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`Timer '${label}' does not exist`, metadata);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    const enhancedMetadata = {
      ...metadata,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration,
    };

    // Log as warning if slow (>1000ms)
    if (duration > 1000) {
      this.warn(`Performance: ${label}`, enhancedMetadata);
    } else {
      this.debug(`Performance: ${label}`, enhancedMetadata);
    }
  }

  /**
   * Add breadcrumb to Sentry for debugging
   * @param {string} message - Breadcrumb message
   * @param {Object} data - Additional data
   */
  addBreadcrumb(message, data = {}) {
    try {
      Sentry.addBreadcrumb({
        message,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      // Silently fail if Sentry not initialized
    }
  }

  /**
   * Set user context for logs
   * @param {Object} user - User information
   */
  setUser(user) {
    try {
      Sentry.setUser({
        id: user?.id,
        email: user?.email,
        username: user?.username,
      });
    } catch (error) {
      // Silently fail if Sentry not initialized
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    try {
      Sentry.setUser(null);
    } catch (error) {
      // Silently fail if Sentry not initialized
    }
  }

  /**
   * Configure logger settings
   * @param {Object} config - Configuration options
   */
  configure(config = {}) {
    if (config.minLevel && this.levels[config.minLevel] !== undefined) {
      this.minLevel = this.levels[config.minLevel];
    }
  }

  /**
   * Get logger status
   * @returns {Object} Logger configuration and status
   */
  getStatus() {
    return {
      environment: this.environment,
      minLevel: Object.keys(this.levels).find(key => this.levels[key] === this.minLevel),
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isTest: this.isTest,
      activeTimers: Array.from(this.timers.keys()),
    };
  }
}

// Export singleton instance
const Logger = new LoggerService();

// Convenience exports for different use cases
export default Logger;
export { Logger, LoggerService };
