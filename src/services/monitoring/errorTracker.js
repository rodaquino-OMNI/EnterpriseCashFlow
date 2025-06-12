/**
 * Error tracking service with Sentry integration
 * Captures and reports errors with context and user information
 */

import * as Sentry from '@sentry/react';
import { v4 as uuidv4 } from 'uuid';

export class ErrorTracker {
  constructor() {
    this.initialized = false;
    this.errorQueue = [];
    this.maxQueueSize = 100;
  }

  /**
   * Initialize error tracking service
   * @param {Object} config - Error tracking configuration
   */
  async initialize(config = {}) {
    const {
      dsn = process.env.REACT_APP_SENTRY_DSN,
      environment = process.env.NODE_ENV || 'development',
      sampleRate = 1.0,
      enableInDev = false,
    } = config;

    if (!dsn || (environment === 'development' && !enableInDev)) {
      console.log('Error tracking disabled in development');
      this.initialized = true;
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        sampleRate,
        tracesSampleRate: 0.1,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        beforeSend: (event, hint) => {
          // Filter out certain errors
          if (this.shouldFilterError(event, hint)) {
            return null;
          }
          // Add custom context
          event.contexts = {
            ...event.contexts,
            custom: {
              errorId: uuidv4(),
              timestamp: new Date().toISOString(),
            },
          };
          return event;
        },
      });

      this.initialized = true;
      
      // Process any queued errors
      this.processErrorQueue();
    } catch (error) {
      console.error('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Capture an error
   * @param {Error} error - The error to capture
   * @param {Object} context - Additional context
   */
  captureError(error, context = {}) {
    if (!this.initialized) {
      this.queueError(error, context);
      return;
    }

    const errorId = uuidv4();
    
    // Add error ID to the error object for tracking
    error.errorId = errorId;

    // Set context
    Sentry.withScope((scope) => {
      // Add custom context
      scope.setContext('errorDetails', {
        errorId,
        timestamp: new Date().toISOString(),
        ...context,
      });

      // Add tags for filtering
      scope.setTag('errorType', error.name || 'UnknownError');
      scope.setTag('component', context.component || 'unknown');
      
      // Add user context if available
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }

      // Add breadcrumbs
      if (context.breadcrumbs) {
        context.breadcrumbs.forEach(breadcrumb => {
          scope.addBreadcrumb(breadcrumb);
        });
      }

      // Capture the error
      Sentry.captureException(error);
    });

    return errorId;
  }

  /**
   * Capture a message
   * @param {string} message - The message to capture
   * @param {string} level - Severity level
   * @param {Object} context - Additional context
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      scope.setContext('messageDetails', context);
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Set user context
   * @param {Object} user - User information
   */
  setUser(user) {
    if (!this.initialized) return;
    
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Add a breadcrumb
   * @param {Object} breadcrumb - Breadcrumb data
   */
  addBreadcrumb(breadcrumb) {
    if (!this.initialized) return;
    
    Sentry.addBreadcrumb({
      timestamp: Date.now() / 1000,
      ...breadcrumb,
    });
  }

  /**
   * Queue an error if not initialized
   * @param {Error} error - The error to queue
   * @param {Object} context - Additional context
   */
  queueError(error, context) {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
    this.errorQueue.push({ error, context, timestamp: Date.now() });
  }

  /**
   * Process queued errors
   */
  processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const { error, context } = this.errorQueue.shift();
      this.captureError(error, context);
    }
  }

  /**
   * Check if an error should be filtered
   * @param {Object} event - Sentry event
   * @param {Object} hint - Event hint
   * @returns {boolean} Whether to filter the error
   */
  shouldFilterError(event, hint) {
    const error = hint.originalException;
    
    // Filter out network errors in development
    if (process.env.NODE_ENV === 'development' && error?.message?.includes('Network')) {
      return true;
    }

    // Filter out specific error messages
    const filteredMessages = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ];
    
    if (filteredMessages.some(msg => error?.message?.includes(msg))) {
      return true;
    }

    return false;
  }

  /**
   * Get error tracking status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      queuedErrors: this.errorQueue.length,
    };
  }

  /**
   * Flush any pending errors
   */
  async flush() {
    if (!this.initialized) return;
    
    this.processErrorQueue();
    return Sentry.flush(2000); // 2 second timeout
  }
}