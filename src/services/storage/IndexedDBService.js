/**
 * @fileoverview IndexedDB implementation for large dataset storage
 */

import { StorageService, StorageError, StorageErrorCode } from './StorageService';

/**
 * IndexedDB storage service implementation
 * Used for storing large datasets like projects, scenarios, and reports
 */
export class IndexedDBService extends StorageService {
  constructor(config = {}) {
    super(config);
    
    this.dbName = `${this.config.namespace}_db`;
    this.dbVersion = parseInt(this.config.version.replace(/\./g, ''), 10);
    this.db = null;
    
    // Define object stores
    this.stores = {
      projects: {
        name: 'projects',
        keyPath: 'id',
        indexes: [
          { name: 'userId', keyPath: 'userId', unique: false },
          { name: 'createdAt', keyPath: 'createdAt', unique: false },
          { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
        ]
      },
      scenarios: {
        name: 'scenarios',
        keyPath: 'id',
        indexes: [
          { name: 'projectId', keyPath: 'projectId', unique: false },
          { name: 'type', keyPath: 'type', unique: false },
          { name: 'createdAt', keyPath: 'createdAt', unique: false }
        ]
      },
      reports: {
        name: 'reports',
        keyPath: 'id',
        indexes: [
          { name: 'projectId', keyPath: 'projectId', unique: false },
          { name: 'scenarioId', keyPath: 'scenarioId', unique: false },
          { name: 'type', keyPath: 'type', unique: false },
          { name: 'createdAt', keyPath: 'createdAt', unique: false }
        ]
      },
      autoSave: {
        name: 'autoSave',
        keyPath: 'id',
        indexes: [
          { name: 'entityType', keyPath: 'entityType', unique: false },
          { name: 'entityId', keyPath: 'entityId', unique: false },
          { name: 'timestamp', keyPath: 'timestamp', unique: false }
        ]
      },
      cache: {
        name: 'cache',
        keyPath: 'key',
        indexes: [
          { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
        ]
      }
    };
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (!this._isIndexedDBSupported()) {
        throw new StorageError(
          'IndexedDB is not supported in this browser',
          StorageErrorCode.INITIALIZATION_FAILED
        );
      }

      this.db = await this._openDatabase();
      
      // Clean up expired cache entries
      await this._cleanupExpiredCache();
      
    } catch (error) {
      throw new StorageError(
        'Failed to initialize IndexedDB',
        StorageErrorCode.INITIALIZATION_FAILED,
        error
      );
    }
  }

  /**
   * Store data in a specific object store
   * @param {string} storeName - Object store name
   * @param {Object} data - Data to store
   * @returns {Promise<void>}
   */
  async set(storeName, data) {
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await this._promisifyRequest(store.put(data));
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new StorageError(
          'Storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED,
          error
        );
      }
      throw new StorageError(
        `Failed to store data in ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Retrieve data from a specific object store
   * @param {string} storeName - Object store name
   * @param {string} key - Data key
   * @returns {Promise<any>}
   */
  async get(storeName, key) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const result = await this._promisifyRequest(store.get(key));
      
      if (!result) {
        throw new StorageError(
          `Key not found: ${key}`,
          StorageErrorCode.KEY_NOT_FOUND
        );
      }
      
      return result;
      
    } catch (error) {
      if (error.code === StorageErrorCode.KEY_NOT_FOUND) {
        throw error;
      }
      throw new StorageError(
        `Failed to retrieve data from ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Get all data from a specific object store
   * @param {string} storeName - Object store name
   * @param {Object} options - Query options
   * @returns {Promise<any[]>}
   */
  async getAll(storeName, options = {}) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request;
      
      if (options.index && options.value) {
        const index = store.index(options.index);
        request = index.getAll(options.value);
      } else if (options.range) {
        request = store.getAll(options.range);
      } else {
        request = store.getAll();
      }
      
      const results = await this._promisifyRequest(request);
      
      // Apply sorting if specified
      if (options.sort) {
        results.sort((a, b) => {
          const aVal = a[options.sort.field];
          const bVal = b[options.sort.field];
          const direction = options.sort.direction === 'desc' ? -1 : 1;
          
          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
          return 0;
        });
      }
      
      // Apply limit if specified
      if (options.limit) {
        return results.slice(0, options.limit);
      }
      
      return results;
      
    } catch (error) {
      throw new StorageError(
        `Failed to retrieve all data from ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Query data using an index
   * @param {string} storeName - Object store name
   * @param {string} indexName - Index name
   * @param {any} value - Index value
   * @returns {Promise<any[]>}
   */
  async query(storeName, indexName, value) {
    return this.getAll(storeName, { index: indexName, value });
  }

  /**
   * Remove data from a specific object store
   * @param {string} storeName - Object store name
   * @param {string} key - Data key
   * @returns {Promise<void>}
   */
  async remove(storeName, key) {
    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await this._promisifyRequest(store.delete(key));
      
    } catch (error) {
      throw new StorageError(
        `Failed to remove data from ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Clear all data from a specific object store
   * @param {string} storeName - Object store name
   * @returns {Promise<void>}
   */
  async clear(storeName = null) {
    try {
      if (storeName) {
        // Clear specific store
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await this._promisifyRequest(store.clear());
      } else {
        // Clear all stores
        const storeNames = Object.keys(this.stores);
        const transaction = this.db.transaction(storeNames, 'readwrite');
        
        await Promise.all(
          storeNames.map(name => 
            this._promisifyRequest(transaction.objectStore(name).clear())
          )
        );
      }
      
    } catch (error) {
      throw new StorageError(
        'Failed to clear data',
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Get all keys from a specific object store
   * @param {string} storeName - Object store name
   * @returns {Promise<string[]>}
   */
  async keys(storeName) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return await this._promisifyRequest(store.getAllKeys());
      
    } catch (error) {
      throw new StorageError(
        `Failed to get keys from ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Check if key exists in a specific object store
   * @param {string} storeName - Object store name
   * @param {string} key - Data key
   * @returns {Promise<boolean>}
   */
  async has(storeName, key) {
    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const result = await this._promisifyRequest(store.count(key));
      return result > 0;
      
    } catch (error) {
      throw new StorageError(
        `Failed to check key existence in ${storeName}`,
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Get storage size for a specific store or all stores
   * @param {string} storeName - Object store name (optional)
   * @returns {Promise<number>} Size in bytes
   */
  async getSize(storeName = null) {
    try {
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      
      // Fallback: estimate size by counting records
      let totalSize = 0;
      const stores = storeName ? [storeName] : Object.keys(this.stores);
      
      for (const store of stores) {
        const data = await this.getAll(store);
        totalSize += JSON.stringify(data).length;
      }
      
      return totalSize;
      
    } catch (error) {
      throw new StorageError(
        'Failed to get storage size',
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Perform a batch operation
   * @param {Array<{operation: string, storeName: string, data: any}>} operations
   * @returns {Promise<void>}
   */
  async batch(operations) {
    const storeNames = [...new Set(operations.map(op => op.storeName))];
    const transaction = this.db.transaction(storeNames, 'readwrite');
    
    try {
      await Promise.all(operations.map(async (op) => {
        const store = transaction.objectStore(op.storeName);
        
        switch (op.operation) {
          case 'put':
            return this._promisifyRequest(store.put(op.data));
          case 'delete':
            return this._promisifyRequest(store.delete(op.key));
          case 'clear':
            return this._promisifyRequest(store.clear());
          default:
            throw new Error(`Unknown operation: ${op.operation}`);
        }
      }));
      
    } catch (error) {
      throw new StorageError(
        'Batch operation failed',
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Cache data with expiration
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<void>}
   */
  async cache(key, data, ttl = 3600) {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    await this.set('cache', {
      key,
      data,
      expiresAt,
      createdAt: new Date()
    });
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any|null>}
   */
  async getCache(key) {
    try {
      const cached = await this.get('cache', key);
      
      if (cached.expiresAt < new Date()) {
        await this.remove('cache', key);
        return null;
      }
      
      return cached.data;
      
    } catch (error) {
      if (error.code === StorageErrorCode.KEY_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Private methods

  /**
   * Check if IndexedDB is supported
   * @private
   * @returns {boolean}
   */
  _isIndexedDBSupported() {
    return 'indexedDB' in window;
  }

  /**
   * Open or create the database
   * @private
   * @returns {Promise<IDBDatabase>}
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        Object.values(this.stores).forEach(storeConfig => {
          let store;
          
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath
            });
          } else {
            store = request.transaction.objectStore(storeConfig.name);
          }
          
          // Create indexes
          storeConfig.indexes.forEach(indexConfig => {
            if (!store.indexNames.contains(indexConfig.name)) {
              store.createIndex(
                indexConfig.name,
                indexConfig.keyPath,
                { unique: indexConfig.unique }
              );
            }
          });
        });
      };
    });
  }

  /**
   * Convert IndexedDB request to Promise
   * @private
   * @param {IDBRequest} request
   * @returns {Promise<any>}
   */
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up expired cache entries
   * @private
   * @returns {Promise<void>}
   */
  async _cleanupExpiredCache() {
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiresAt');
      
      const range = IDBKeyRange.upperBound(new Date());
      const request = index.openCursor(range);
      
      await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
    }
  }
}