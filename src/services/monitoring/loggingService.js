/**
 * Centralized logging service with support for different log levels,
 * structured logging, and multiple transports
 */

import winston from 'winston';

export class LoggingService {
  constructor() {
    this.logger = null;
    this.initialized = false;
  }

  /**
   * Initialize the logging service
   * @param {Object} config - Logging configuration
   */
  async initialize(config = {}) {
    const {
      level = 'info',
      enableConsole = true,
      enableFile = false,
      logDir = './logs',
      maxSize = '10m',
      maxFiles = '7d',
    } = config;

    const transports = [];

    // Console transport
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
              }
              return msg;
            })
          ),
        })
      );
    }

    // File transport
    if (enableFile) {
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/error.log`,
          level: 'error',
          maxsize: maxSize,
          maxFiles: maxFiles,
        })
      );
      transports.push(
        new winston.transports.File({
          filename: `${logDir}/combined.log`,
          maxsize: maxSize,
          maxFiles: maxFiles,
        })
      );
    }

    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false,
    });

    // Add global error handlers
    this.setupGlobalHandlers();

    this.initialized = true;
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise,
        });
      });

      window.addEventListener('error', (event) => {
        this.error('Uncaught Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      });
    }
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  info(message, metadata = {}) {
    if (!this.logger) return;
    this.logger.info(message, this.sanitizeMetadata(metadata));
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  warn(message, metadata = {}) {
    if (!this.logger) return;
    this.logger.warn(message, this.sanitizeMetadata(metadata));
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  error(message, metadata = {}) {
    if (!this.logger) return;
    this.logger.error(message, this.sanitizeMetadata(metadata));
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   * @param {Object} metadata - Additional metadata
   */
  debug(message, metadata = {}) {
    if (!this.logger) return;
    this.logger.debug(message, this.sanitizeMetadata(metadata));
  }

  /**
   * Sanitize metadata to remove sensitive information
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'ssn', 'creditCard'];
    const sanitized = { ...metadata };

    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Get logging service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      level: this.logger?.level || 'unknown',
    };
  }

  /**
   * Flush any pending logs
   */
  async flush() {
    if (!this.logger) return;
    
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}