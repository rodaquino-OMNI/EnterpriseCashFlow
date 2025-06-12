/**
 * Performance monitoring service
 * Tracks application performance metrics and identifies bottlenecks
 */

export class PerformanceMonitor {
  constructor() {
    this.initialized = false;
    this.timers = new Map();
    this.metrics = new Map();
    this.thresholds = {
      apiCall: 3000, // 3 seconds
      calculation: 1000, // 1 second
      render: 100, // 100ms
      dataProcessing: 5000, // 5 seconds
    };
  }

  /**
   * Initialize performance monitoring
   * @param {Object} config - Performance monitoring configuration
   */
  async initialize(config = {}) {
    if (config.thresholds) {
      this.thresholds = { ...this.thresholds, ...config.thresholds };
    }

    // Set up Performance Observer if available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Monitor Web Vitals
    this.monitorWebVitals();

    this.initialized = true;
  }

  /**
   * Set up Performance Observer for monitoring
   */
  setupPerformanceObserver() {
    try {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('longTask', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('api/') || entry.name.includes('graphql')) {
            this.recordMetric('apiTiming', {
              name: entry.name,
              duration: entry.duration,
              transferSize: entry.transferSize,
              startTime: entry.startTime,
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Monitor navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.fetchStart,
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.error('Failed to setup performance observers:', error);
    }
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals() {
    if (typeof window === 'undefined') return;

    // Use web-vitals library functions
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => this.recordWebVital('CLS', metric));
      getFID((metric) => this.recordWebVital('FID', metric));
      getFCP((metric) => this.recordWebVital('FCP', metric));
      getLCP((metric) => this.recordWebVital('LCP', metric));
      getTTFB((metric) => this.recordWebVital('TTFB', metric));
    });
  }

  /**
   * Record a web vital metric
   * @param {string} name - Metric name
   * @param {Object} metric - Metric data
   */
  recordWebVital(name, metric) {
    this.recordMetric(`webVital.${name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  /**
   * Start a performance timer
   * @param {string} operationName - Name of the operation
   * @returns {Function} Function to stop the timer
   */
  startTimer(operationName) {
    const timerId = `${operationName}-${Date.now()}`;
    const startTime = performance.now();
    
    this.timers.set(timerId, {
      name: operationName,
      startTime,
      marks: [],
    });

    // Return stop function
    return (metadata = {}) => {
      const endTime = performance.now();
      const timer = this.timers.get(timerId);
      
      if (!timer) return;

      const duration = endTime - timer.startTime;
      this.timers.delete(timerId);

      // Record the metric
      this.recordMetric(`operation.${operationName}`, {
        duration,
        startTime: timer.startTime,
        endTime,
        marks: timer.marks,
        ...metadata,
      });

      // Check if duration exceeds threshold
      const threshold = this.getThreshold(operationName);
      if (threshold && duration > threshold) {
        this.recordSlowOperation(operationName, duration, threshold, metadata);
      }

      return duration;
    };
  }

  /**
   * Add a mark to an active timer
   * @param {string} timerId - Timer ID
   * @param {string} markName - Name of the mark
   */
  addMark(timerId, markName) {
    const timer = this.timers.get(timerId);
    if (timer) {
      timer.marks.push({
        name: markName,
        time: performance.now() - timer.startTime,
      });
    }
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {Object} data - Metric data
   */
  recordMetric(name, data) {
    const timestamp = Date.now();
    const metrics = this.metrics.get(name) || [];
    
    metrics.push({
      timestamp,
      ...data,
    });

    // Keep only last 1000 entries per metric
    if (metrics.length > 1000) {
      metrics.shift();
    }

    this.metrics.set(name, metrics);
  }

  /**
   * Get threshold for an operation
   * @param {string} operationName - Operation name
   * @returns {number|null} Threshold in milliseconds
   */
  getThreshold(operationName) {
    // Check specific thresholds
    for (const [key, value] of Object.entries(this.thresholds)) {
      if (operationName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return null;
  }

  /**
   * Record a slow operation
   * @param {string} operationName - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {number} threshold - Threshold in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordSlowOperation(operationName, duration, threshold, metadata) {
    this.recordMetric('slowOperations', {
      operation: operationName,
      duration,
      threshold,
      exceedance: duration - threshold,
      ...metadata,
    });
  }

  /**
   * Get performance metrics summary
   * @param {string} metricName - Optional specific metric name
   * @returns {Object} Metrics summary
   */
  getMetricsSummary(metricName = null) {
    const metricsToSummarize = metricName 
      ? [[metricName, this.metrics.get(metricName) || []]]
      : Array.from(this.metrics.entries());

    const summary = {};

    for (const [name, values] of metricsToSummarize) {
      if (values.length === 0) continue;

      const durations = values.map(v => v.duration).filter(Boolean);
      
      summary[name] = {
        count: values.length,
        latest: values[values.length - 1],
      };

      if (durations.length > 0) {
        summary[name].stats = {
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          p50: this.percentile(durations, 0.5),
          p95: this.percentile(durations, 0.95),
          p99: this.percentile(durations, 0.99),
        };
      }
    }

    return summary;
  }

  /**
   * Calculate percentile
   * @param {number[]} values - Array of values
   * @param {number} percentile - Percentile (0-1)
   * @returns {number} Percentile value
   */
  percentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }

  /**
   * Get performance monitor status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeTimers: this.timers.size,
      metricsCount: this.metrics.size,
      metrics: this.getMetricsSummary(),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  }
}