/**
 * Performance optimization utilities for financial calculations
 * Implements caching, memoization, and efficient data structures
 */

/**
 * LRU Cache implementation for calculation results
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  set(key, value) {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add to end
    this.cache.set(key, value);
    
    // Remove oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Memoization decorator for expensive calculations
 */
export const memoize = (fn, getCacheKey = (...args) => JSON.stringify(args)) => {
  const cache = new LRUCache(50);
  
  return (...args) => {
    const key = getCacheKey(...args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

/**
 * Batch processor for large datasets
 */
export class BatchProcessor {
  constructor(batchSize = 100, delayMs = 0) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
  }

  async processBatches(items, processor, onProgress) {
    const results = [];
    const totalBatches = Math.ceil(items.length / this.batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.batchSize;
      const end = Math.min(start + this.batchSize, items.length);
      const batch = items.slice(start, end);
      
      // Process batch
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Report progress
      if (onProgress) {
        onProgress({
          processed: end,
          total: items.length,
          percentage: (end / items.length) * 100,
          currentBatch: i + 1,
          totalBatches,
        });
      }
      
      // Delay to prevent blocking
      if (this.delayMs > 0 && i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }
    
    return results;
  }
}

/**
 * Optimized array operations using typed arrays
 */
export const OptimizedArrays = {
  /**
   * Convert regular array to typed array for better performance
   */
  toFloat64Array(arr) {
    return new Float64Array(arr);
  },

  /**
   * Sum array elements efficiently
   */
  sum(arr) {
    if (arr instanceof Float64Array) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
      }
      return sum;
    }
    return arr.reduce((a, b) => a + b, 0);
  },

  /**
   * Calculate running sum efficiently
   */
  cumulativeSum(arr) {
    const result = new Float64Array(arr.length);
    result[0] = arr[0];
    
    for (let i = 1; i < arr.length; i++) {
      result[i] = result[i - 1] + arr[i];
    }
    
    return result;
  },

  /**
   * Apply discount factor to array
   */
  discountArray(arr, rate) {
    const result = new Float64Array(arr.length);
    
    for (let i = 0; i < arr.length; i++) {
      result[i] = arr[i] / Math.pow(1 + rate, i + 1);
    }
    
    return result;
  },
};

/**
 * Worker pool for parallel processing
 */
export class WorkerPool {
  constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.queue = [];
    this.poolSize = poolSize;
    
    // Initialize workers
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.busy = false;
      worker.id = i;
      
      worker.onmessage = (event) => {
        worker.busy = false;
        worker.resolver(event.data);
        this.processQueue();
      };
      
      worker.onerror = (error) => {
        worker.busy = false;
        worker.rejector(error);
        this.processQueue();
      };
      
      this.workers.push(worker);
    }
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      this.queue.push(task);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.queue.shift();
    availableWorker.busy = true;
    availableWorker.resolver = task.resolve;
    availableWorker.rejector = task.reject;
    availableWorker.postMessage(task.data);
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
  }
}

/**
 * Debounce function for calculation triggers
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for rate limiting
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  measurements: new Map(),

  start(label) {
    this.measurements.set(label, performance.now());
  },

  end(label) {
    const start = this.measurements.get(label);
    if (!start) return null;
    
    const duration = performance.now() - start;
    this.measurements.delete(label);
    
    return {
      label,
      duration,
      durationMs: Math.round(duration * 100) / 100,
    };
  },

  measure(label, fn) {
    this.start(label);
    const result = fn();
    const measurement = this.end(label);
    
    return {
      result,
      performance: measurement,
    };
  },

  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    const measurement = this.end(label);
    
    return {
      result,
      performance: measurement,
    };
  },
};

/**
 * Data validation and sanitization for performance
 */
export const DataValidator = {
  /**
   * Validate and sanitize cash flow array
   */
  validateCashFlows(cashFlows) {
    if (!Array.isArray(cashFlows)) {
      throw new Error('Cash flows must be an array');
    }
    
    // Convert to numbers and validate
    const sanitized = cashFlows.map((cf, index) => {
      const num = Number(cf);
      if (isNaN(num) || !isFinite(num)) {
        throw new Error(`Invalid cash flow at index ${index}: ${cf}`);
      }
      return num;
    });
    
    return sanitized;
  },

  /**
   * Validate rate parameters
   */
  validateRate(rate, name = 'rate') {
    const num = Number(rate);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Invalid ${name}: ${rate}`);
    }
    
    if (num < -1) {
      throw new Error(`${name} cannot be less than -100%`);
    }
    
    return num;
  },

  /**
   * Validate positive number
   */
  validatePositiveNumber(value, name = 'value') {
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num) || num < 0) {
      throw new Error(`Invalid ${name}: must be a positive number`);
    }
    
    return num;
  },
};

/**
 * Chunked processing for very large datasets
 */
export const processInChunks = async (data, chunkSize, processor) => {
  const chunks = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  const results = [];
  
  for (const chunk of chunks) {
    // Process chunk and yield control back to event loop
    const chunkResult = await new Promise(resolve => {
      setTimeout(() => {
        resolve(processor(chunk));
      }, 0);
    });
    
    results.push(...chunkResult);
  }
  
  return results;
};

/**
 * Memory-efficient streaming processor
 */
export class StreamProcessor {
  constructor(processor, bufferSize = 1000) {
    this.processor = processor;
    this.buffer = [];
    this.bufferSize = bufferSize;
    this.results = [];
  }

  async add(item) {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;
    
    const processed = await this.processor(this.buffer);
    this.results.push(...processed);
    this.buffer = [];
  }

  async getResults() {
    await this.flush();
    return this.results;
  }
}

export default {
  LRUCache,
  memoize,
  BatchProcessor,
  OptimizedArrays,
  WorkerPool,
  debounce,
  throttle,
  PerformanceMonitor,
  DataValidator,
  processInChunks,
  StreamProcessor,
};