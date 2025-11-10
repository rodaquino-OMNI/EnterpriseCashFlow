/**
 * @fileoverview Abstract Storage Service Interface
 * Defines the contract for all storage implementations
 */

/**
 * Abstract base class for storage services
 * @abstract
 */
export class StorageService {
  constructor(config = {}) {
    if (new.target === StorageService) {
      throw new Error('StorageService is an abstract class and cannot be instantiated directly');
    }
    
    this.config = {
      namespace: 'enterpriseCashFlow',
      version: '1.0.0',
      ...config,
    };
  }

  /**
   * Initialize the storage service
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Store data with a key
   * @abstract
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @returns {Promise<void>}
   */
  async set(key, data) {
    throw new Error('set() must be implemented by subclass');
  }

  /**
   * Retrieve data by key
   * @abstract
   * @param {string} key - Storage key
   * @returns {Promise<any>}
   */
  async get(key) {
    throw new Error('get() must be implemented by subclass');
  }

  /**
   * Remove data by key
   * @abstract
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    throw new Error('remove() must be implemented by subclass');
  }

  /**
   * Clear all stored data
   * @abstract
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('clear() must be implemented by subclass');
  }

  /**
   * Get all keys
   * @abstract
   * @returns {Promise<string[]>}
   */
  async keys() {
    throw new Error('keys() must be implemented by subclass');
  }

  /**
   * Check if key exists
   * @abstract
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    throw new Error('has() must be implemented by subclass');
  }

  /**
   * Get storage size
   * @abstract
   * @returns {Promise<number>}
   */
  async getSize() {
    throw new Error('getSize() must be implemented by subclass');
  }

  /**
   * Create a namespaced key
   * @protected
   * @param {string} key - Original key
   * @returns {string} Namespaced key
   */
  _createKey(key) {
    return `${this.config.namespace}_${key}`;
  }

  /**
   * Parse a namespaced key
   * @protected
   * @param {string} namespacedKey - Namespaced key
   * @returns {string|null} Original key or null if not from this namespace
   */
  _parseKey(namespacedKey) {
    const prefix = `${this.config.namespace}_`;
    if (namespacedKey.startsWith(prefix)) {
      return namespacedKey.substring(prefix.length);
    }
    return null;
  }
}

/**
 * Storage event types
 */
export const StorageEventType = {
  SET: 'storage:set',
  GET: 'storage:get',
  REMOVE: 'storage:remove',
  CLEAR: 'storage:clear',
  ERROR: 'storage:error',
};

/**
 * Storage error class
 */
export class StorageError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Storage error codes
 */
export const StorageErrorCode = {
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
  INVALID_DATA: 'INVALID_DATA',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};