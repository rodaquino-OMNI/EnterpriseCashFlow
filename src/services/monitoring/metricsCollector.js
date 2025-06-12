/**
 * Metrics collection service for business and technical metrics
 * Collects, aggregates, and reports various application metrics
 */

export class MetricsCollector {
  constructor() {
    this.initialized = false;
    this.metrics = new Map();
    this.aggregationInterval = null;
    this.flushInterval = null;
  }

  /**
   * Initialize metrics collector
   * @param {Object} config - Metrics configuration
   */
  async initialize(config = {}) {
    const {
      aggregationIntervalMs = 60000, // 1 minute
      flushIntervalMs = 300000, // 5 minutes
      enableAutoFlush = true,
    } = config;

    this.config = config;

    // Set up aggregation interval
    if (aggregationIntervalMs > 0) {
      this.aggregationInterval = setInterval(() => {
        this.aggregateMetrics();
      }, aggregationIntervalMs);
    }

    // Set up flush interval
    if (enableAutoFlush && flushIntervalMs > 0) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, flushIntervalMs);
    }

    // Initialize default metric categories
    this.initializeMetricCategories();

    this.initialized = true;
  }

  /**
   * Initialize default metric categories
   */
  initializeMetricCategories() {
    const categories = [
      'business.revenue',
      'business.cashFlow',
      'business.profitability',
      'technical.apiLatency',
      'technical.errorRate',
      'technical.throughput',
      'user.activeUsers',
      'user.sessionDuration',
      'data.processingTime',
      'data.recordsProcessed',
    ];

    categories.forEach(category => {
      this.metrics.set(category, {
        values: [],
        aggregated: {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        },
      });
    });
  }

  /**
   * Record a metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags
   */
  record(name, value, tags = {}) {
    if (!this.initialized || typeof value !== 'number') return;

    let metric = this.metrics.get(name);
    if (!metric) {
      metric = {
        values: [],
        aggregated: {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        },
      };
      this.metrics.set(name, metric);
    }

    const dataPoint = {
      value,
      timestamp: Date.now(),
      tags,
    };

    metric.values.push(dataPoint);

    // Keep only last 1000 values to prevent memory issues
    if (metric.values.length > 1000) {
      metric.values.shift();
    }

    // Update real-time aggregates
    this.updateAggregates(metric, value);
  }

  /**
   * Increment a counter metric
   * @param {string} name - Metric name
   * @param {number} increment - Increment value
   * @param {Object} tags - Additional tags
   */
  increment(name, increment = 1, tags = {}) {
    const current = this.getMetricValue(name) || 0;
    this.record(name, current + increment, tags);
  }

  /**
   * Record a timing metric
   * @param {string} name - Metric name
   * @param {Function} fn - Function to time
   * @param {Object} tags - Additional tags
   * @returns {*} Function result
   */
  async recordTiming(name, fn, tags = {}) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, { ...tags, status: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Record business metrics
   * @param {Object} financialData - Financial data object
   */
  recordBusinessMetrics(financialData) {
    if (!financialData) return;

    // Revenue metrics
    if (financialData.revenue) {
      this.record('business.revenue.total', financialData.revenue);
      this.record('business.revenue.growth', financialData.revenueGrowth || 0);
    }

    // Cash flow metrics
    if (financialData.cashFlow) {
      this.record('business.cashFlow.operating', financialData.cashFlow.operating || 0);
      this.record('business.cashFlow.investing', financialData.cashFlow.investing || 0);
      this.record('business.cashFlow.financing', financialData.cashFlow.financing || 0);
      this.record('business.cashFlow.net', financialData.cashFlow.net || 0);
    }

    // Profitability metrics
    if (financialData.profitability) {
      this.record('business.profitability.grossMargin', financialData.profitability.grossMargin || 0);
      this.record('business.profitability.netMargin', financialData.profitability.netMargin || 0);
      this.record('business.profitability.ebitda', financialData.profitability.ebitda || 0);
    }

    // Working capital metrics
    if (financialData.workingCapital) {
      this.record('business.workingCapital.days', financialData.workingCapital.days || 0);
      this.record('business.workingCapital.ratio', financialData.workingCapital.ratio || 0);
    }
  }

  /**
   * Update metric aggregates
   * @param {Object} metric - Metric object
   * @param {number} value - New value
   */
  updateAggregates(metric, value) {
    const agg = metric.aggregated;
    agg.count++;
    agg.sum += value;
    agg.min = Math.min(agg.min, value);
    agg.max = Math.max(agg.max, value);
    agg.avg = agg.sum / agg.count;
  }

  /**
   * Aggregate metrics over time windows
   */
  aggregateMetrics() {
    const now = Date.now();
    const windows = {
      '1min': 60000,
      '5min': 300000,
      '15min': 900000,
      '1hour': 3600000,
    };

    this.metrics.forEach((metric, name) => {
      Object.entries(windows).forEach(([windowName, windowMs]) => {
        const windowStart = now - windowMs;
        const windowValues = metric.values.filter(v => v.timestamp >= windowStart);
        
        if (windowValues.length > 0) {
          const aggregated = this.calculateAggregates(windowValues);
          this.record(`${name}.${windowName}`, aggregated.avg, {
            window: windowName,
            ...aggregated,
          });
        }
      });
    });
  }

  /**
   * Calculate aggregates for a set of values
   * @param {Array} values - Array of value objects
   * @returns {Object} Aggregated statistics
   */
  calculateAggregates(values) {
    const numbers = values.map(v => v.value);
    const sorted = [...numbers].sort((a, b) => a - b);
    
    return {
      count: numbers.length,
      sum: numbers.reduce((a, b) => a + b, 0),
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      p50: this.percentile(sorted, 0.5),
      p75: this.percentile(sorted, 0.75),
      p90: this.percentile(sorted, 0.9),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Calculate percentile
   * @param {number[]} sorted - Sorted array of values
   * @param {number} p - Percentile (0-1)
   * @returns {number} Percentile value
   */
  percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get current value of a metric
   * @param {string} name - Metric name
   * @returns {number|null} Current value
   */
  getMetricValue(name) {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) return null;
    return metric.values[metric.values.length - 1].value;
  }

  /**
   * Get metric summary
   * @param {string} name - Metric name
   * @returns {Object|null} Metric summary
   */
  getMetricSummary(name) {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    return {
      current: this.getMetricValue(name),
      aggregated: metric.aggregated,
      recentValues: metric.values.slice(-10),
    };
  }

  /**
   * Get all metrics summary
   * @returns {Object} All metrics summary
   */
  getAllMetrics() {
    const summary = {};
    
    this.metrics.forEach((metric, name) => {
      summary[name] = this.getMetricSummary(name);
    });

    return summary;
  }

  /**
   * Get metrics by category
   * @param {string} category - Category prefix
   * @returns {Object} Metrics in category
   */
  getMetricsByCategory(category) {
    const categoryMetrics = {};
    
    this.metrics.forEach((metric, name) => {
      if (name.startsWith(category)) {
        categoryMetrics[name] = this.getMetricSummary(name);
      }
    });

    return categoryMetrics;
  }

  /**
   * Export metrics for reporting
   * @param {Object} options - Export options
   * @returns {Object} Exported metrics
   */
  exportMetrics(options = {}) {
    const { categories = [], timeRange = null } = options;
    const exported = {};

    this.metrics.forEach((metric, name) => {
      // Filter by categories if specified
      if (categories.length > 0 && !categories.some(cat => name.startsWith(cat))) {
        return;
      }

      // Filter by time range if specified
      let values = metric.values;
      if (timeRange) {
        const startTime = Date.now() - timeRange;
        values = values.filter(v => v.timestamp >= startTime);
      }

      if (values.length > 0) {
        exported[name] = {
          values,
          aggregated: this.calculateAggregates(values),
        };
      }
    });

    return exported;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.initializeMetricCategories();
  }

  /**
   * Get metrics collector status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      metricCount: this.metrics.size,
      totalDataPoints: Array.from(this.metrics.values())
        .reduce((sum, metric) => sum + metric.values.length, 0),
    };
  }

  /**
   * Flush metrics (prepare for external reporting)
   */
  async flush() {
    // In a real implementation, this would send metrics to an external service
    // For now, we'll just aggregate and log
    this.aggregateMetrics();
    
    const summary = this.getAllMetrics();
    console.log('Metrics flush:', summary);
  }

  /**
   * Cleanup and stop intervals
   */
  destroy() {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }
}