/**
 * @fileoverview LocalStorage implementation for user settings and preferences
 */

import { StorageService, StorageError, StorageErrorCode } from './StorageService';

/**
 * LocalStorage service implementation
 * Used for storing user preferences, settings, and small data
 */
export class LocalStorageService extends StorageService {
  constructor(config = {}) {
    super(config);
    
    this.maxSize = config.maxSize || 5 * 1024 * 1024; // 5MB default limit
    this.compressionEnabled = config.compression !== false;
  }

  /**
   * Initialize LocalStorage service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (!this._isLocalStorageSupported()) {
        throw new StorageError(
          'LocalStorage is not supported in this browser',
          StorageErrorCode.INITIALIZATION_FAILED,
        );
      }

      // Test localStorage availability
      const testKey = `${this.config.namespace}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Clean up expired items
      await this._cleanupExpired();
      
    } catch (error) {
      throw new StorageError(
        'Failed to initialize LocalStorage',
        StorageErrorCode.INITIALIZATION_FAILED,
        error,
      );
    }
  }

  /**
   * Store data with optional expiration
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {Object} options - Storage options
   * @returns {Promise<void>}
   */
  async set(key, data, options = {}) {
    try {
      const namespacedKey = this._createKey(key);
      
      const wrapper = {
        data,
        timestamp: Date.now(),
        version: this.config.version,
        compressed: false,
      };

      if (options.expiresIn) {
        wrapper.expiresAt = Date.now() + options.expiresIn;
      }

      let serialized = JSON.stringify(wrapper);

      // Check size and compress if needed
      if (this.compressionEnabled && serialized.length > 1024) {
        const compressed = this._compress(serialized);
        if (compressed.length < serialized.length) {
          wrapper.data = compressed;
          wrapper.compressed = true;
          serialized = JSON.stringify(wrapper);
        }
      }

      // Check against size limit
      const currentSize = await this.getSize();
      const newSize = currentSize + serialized.length;
      
      if (newSize > this.maxSize) {
        throw new StorageError(
          'Storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED,
        );
      }

      localStorage.setItem(namespacedKey, serialized);
      
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === StorageErrorCode.QUOTA_EXCEEDED) {
        throw new StorageError(
          'Storage quota exceeded',
          StorageErrorCode.QUOTA_EXCEEDED,
          error,
        );
      }
      throw new StorageError(
        'Failed to store data',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieve data from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const namespacedKey = this._createKey(key);
      const item = localStorage.getItem(namespacedKey);

      if (!item) {
        throw new StorageError(
          `Key not found: ${key}`,
          StorageErrorCode.KEY_NOT_FOUND,
        );
      }

      const wrapper = JSON.parse(item);

      // Check expiration
      if (wrapper.expiresAt && wrapper.expiresAt < Date.now()) {
        await this.remove(key);
        throw new StorageError(
          `Key expired: ${key}`,
          StorageErrorCode.KEY_NOT_FOUND,
        );
      }

      // Decompress if needed
      if (wrapper.compressed) {
        wrapper.data = JSON.parse(this._decompress(wrapper.data));
      }

      return wrapper.data;
      
    } catch (error) {
      if (error.code === StorageErrorCode.KEY_NOT_FOUND) {
        throw error;
      }
      throw new StorageError(
        'Failed to retrieve data',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Remove data from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      const namespacedKey = this._createKey(key);
      localStorage.removeItem(namespacedKey);
      
    } catch (error) {
      throw new StorageError(
        'Failed to remove data',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Clear all data from this namespace
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const keys = await this.keys();
      
      keys.forEach(key => {
        const namespacedKey = this._createKey(key);
        localStorage.removeItem(namespacedKey);
      });
      
    } catch (error) {
      throw new StorageError(
        'Failed to clear data',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Get all keys in this namespace
   * @returns {Promise<string[]>}
   */
  async keys() {
    try {
      const keys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const parsedKey = this._parseKey(key);
        
        if (parsedKey) {
          keys.push(parsedKey);
        }
      }
      
      return keys;
      
    } catch (error) {
      throw new StorageError(
        'Failed to get keys',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    const namespacedKey = this._createKey(key);
    return localStorage.getItem(namespacedKey) !== null;
  }

  /**
   * Get storage size for this namespace
   * @returns {Promise<number>} Size in bytes
   */
  async getSize() {
    try {
      let totalSize = 0;
      const keys = await this.keys();
      
      keys.forEach(key => {
        const namespacedKey = this._createKey(key);
        const item = localStorage.getItem(namespacedKey);
        if (item) {
          totalSize += item.length;
        }
      });
      
      return totalSize;
      
    } catch (error) {
      throw new StorageError(
        'Failed to get storage size',
        StorageErrorCode.UNKNOWN_ERROR,
        error,
      );
    }
  }

  /**
   * Store user preferences
   * @param {Object} preferences - User preferences object
   * @returns {Promise<void>}
   */
  async setPreferences(preferences) {
    await this.set('userPreferences', preferences, { expiresIn: 365 * 24 * 60 * 60 * 1000 }); // 1 year
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>}
   */
  async getPreferences() {
    try {
      return await this.get('userPreferences');
    } catch (error) {
      if (error.code === StorageErrorCode.KEY_NOT_FOUND) {
        return this._getDefaultPreferences();
      }
      throw error;
    }
  }

  /**
   * Update specific preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {Promise<void>}
   */
  async updatePreference(key, value) {
    const preferences = await this.getPreferences();
    
    // Handle nested keys (e.g., 'theme.mode')
    const keys = key.split('.');
    let current = preferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    await this.setPreferences(preferences);
  }

  /**
   * Store session data
   * @param {string} key - Session key
   * @param {any} data - Session data
   * @returns {Promise<void>}
   */
  async setSession(key, data) {
    await this.set(`session_${key}`, data, { expiresIn: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  /**
   * Get session data
   * @param {string} key - Session key
   * @returns {Promise<any>}
   */
  async getSession(key) {
    try {
      return await this.get(`session_${key}`);
    } catch (error) {
      if (error.code === StorageErrorCode.KEY_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Clear all session data
   * @returns {Promise<void>}
   */
  async clearSession() {
    const keys = await this.keys();
    
    await Promise.all(
      keys
        .filter(key => key.startsWith('session_'))
        .map(key => this.remove(key)),
    );
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    const keys = await this.keys();
    const size = await this.getSize();
    
    const stats = {
      totalKeys: keys.length,
      totalSize: size,
      sizeLimit: this.maxSize,
      usagePercentage: (size / this.maxSize) * 100,
      keysByType: {},
      expiredKeys: 0,
    };

    // Analyze keys
    for (const key of keys) {
      const namespacedKey = this._createKey(key);
      const item = localStorage.getItem(namespacedKey);
      
      if (item) {
        try {
          const wrapper = JSON.parse(item);
          
          // Check expiration
          if (wrapper.expiresAt && wrapper.expiresAt < Date.now()) {
            stats.expiredKeys++;
          }
          
          // Categorize keys
          const keyType = key.split('_')[0] || 'other';
          stats.keysByType[keyType] = (stats.keysByType[keyType] || 0) + 1;
          
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return stats;
  }

  // Private methods

  /**
   * Check if LocalStorage is supported and available
   * @private
   * @returns {boolean}
   */
  _isLocalStorageSupported() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clean up expired items
   * @private
   * @returns {Promise<void>}
   */
  async _cleanupExpired() {
    const keys = await this.keys();
    
    for (const key of keys) {
      try {
        const namespacedKey = this._createKey(key);
        const item = localStorage.getItem(namespacedKey);
        
        if (item) {
          const wrapper = JSON.parse(item);
          
          if (wrapper.expiresAt && wrapper.expiresAt < Date.now()) {
            localStorage.removeItem(namespacedKey);
          }
        }
      } catch (e) {
        // Ignore errors and continue cleanup
      }
    }
  }

  /**
   * Get default user preferences
   * @private
   * @returns {Object}
   */
  _getDefaultPreferences() {
    return {
      theme: 'light',
      locale: 'en-US',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'thousand-comma',
      autoSave: true,
      autoSaveInterval: 60, // seconds
      aiProvider: {
        defaultProvider: 'openai',
        apiKeys: {}, // Will be encrypted
        preferences: {},
      },
      exportSettings: {
        defaultFormat: 'excel',
        includeCharts: true,
        includeAnalysis: true,
      },
      notifications: {
        enabled: true,
        types: {
          autoSave: true,
          analysisComplete: true,
          errors: true,
        },
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReaderOptimized: false,
      },
      privacy: {
        analyticsEnabled: true,
        crashReportingEnabled: true,
      },
    };
  }

  /**
   * Simple compression using LZString-like algorithm
   * @private
   * @param {string} data - Data to compress
   * @returns {string} Compressed data
   */
  _compress(data) {
    // Simple RLE compression for demo
    // In production, use a proper compression library like lz-string
    return data
      .replace(/(.)\1+/g, (match, char) => `${char}${match.length}`)
      .replace(/(\d+)/g, '|$1|');
  }

  /**
   * Decompress data
   * @private
   * @param {string} compressed - Compressed data
   * @returns {string} Decompressed data
   */
  _decompress(compressed) {
    // Simple RLE decompression for demo
    // In production, use a proper compression library like lz-string
    return compressed
      .replace(/\|(\d+)\|/g, '$1')
      .replace(/(.)(\\d+)/g, (match, char, count) => char.repeat(parseInt(count)));
  }
}