/**
 * @fileoverview Encryption service for sensitive data
 * Uses Web Crypto API for secure encryption/decryption
 */

import { StorageError, StorageErrorCode } from './StorageService';

/**
 * Encryption service for protecting sensitive data
 */
export class EncryptionService {
  constructor(config = {}) {
    this.algorithm = config.algorithm || 'AES-GCM';
    this.keyLength = config.keyLength || 256;
    this.saltLength = config.saltLength || 16;
    this.ivLength = config.ivLength || 12;
    this.iterations = config.iterations || 100000;
    this.crypto = window.crypto || window.msCrypto;
  }

  /**
   * Initialize encryption service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.crypto || !this.crypto.subtle) {
      throw new StorageError(
        'Web Crypto API is not available',
        StorageErrorCode.INITIALIZATION_FAILED,
      );
    }
  }

  /**
   * Generate a new encryption key from password
   * @param {string} password - User password
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(password, salt) {
    try {
      // Import password as key material
      const passwordKey = await this.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey'],
      );

      // Derive encryption key
      return await this.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: this.iterations,
          hash: 'SHA-256',
        },
        passwordKey,
        {
          name: this.algorithm,
          length: this.keyLength,
        },
        false,
        ['encrypt', 'decrypt'],
      );
    } catch (error) {
      throw new StorageError(
        'Failed to derive encryption key',
        StorageErrorCode.ENCRYPTION_FAILED,
        error,
      );
    }
  }

  /**
   * Encrypt data
   * @param {any} data - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {Promise<EncryptedData>}
   */
  async encrypt(data, password) {
    try {
      // Generate random salt and IV
      const salt = this.crypto.getRandomValues(new Uint8Array(this.saltLength));
      const iv = this.crypto.getRandomValues(new Uint8Array(this.ivLength));

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Convert data to JSON string then to bytes
      const dataString = JSON.stringify(data);
      const dataBytes = new TextEncoder().encode(dataString);

      // Encrypt data
      const encryptedBytes = await this.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv,
        },
        key,
        dataBytes,
      );

      // Return encrypted data with metadata
      return {
        encrypted: this._arrayBufferToBase64(encryptedBytes),
        salt: this._arrayBufferToBase64(salt),
        iv: this._arrayBufferToBase64(iv),
        algorithm: this.algorithm,
        iterations: this.iterations,
      };
    } catch (error) {
      throw new StorageError(
        'Failed to encrypt data',
        StorageErrorCode.ENCRYPTION_FAILED,
        error,
      );
    }
  }

  /**
   * Decrypt data
   * @param {EncryptedData} encryptedData - Encrypted data object
   * @param {string} password - Decryption password
   * @returns {Promise<any>}
   */
  async decrypt(encryptedData, password) {
    try {
      // Convert from base64
      const encryptedBytes = this._base64ToArrayBuffer(encryptedData.encrypted);
      const salt = this._base64ToArrayBuffer(encryptedData.salt);
      const iv = this._base64ToArrayBuffer(encryptedData.iv);

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Decrypt data
      const decryptedBytes = await this.crypto.subtle.decrypt(
        {
          name: encryptedData.algorithm || this.algorithm,
          iv,
        },
        key,
        encryptedBytes,
      );

      // Convert bytes to JSON
      const dataString = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(dataString);
    } catch (error) {
      throw new StorageError(
        'Failed to decrypt data',
        StorageErrorCode.DECRYPTION_FAILED,
        error,
      );
    }
  }

  /**
   * Generate a secure random key
   * @returns {Promise<string>}
   */
  async generateKey() {
    const keyBytes = this.crypto.getRandomValues(new Uint8Array(32));
    return this._arrayBufferToBase64(keyBytes);
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {Promise<string>}
   */
  async hash(data) {
    const dataBytes = new TextEncoder().encode(data);
    const hashBuffer = await this.crypto.subtle.digest('SHA-256', dataBytes);
    return this._arrayBufferToBase64(hashBuffer);
  }

  /**
   * Create a secure storage wrapper that automatically encrypts/decrypts
   * @param {StorageService} storage - Storage service to wrap
   * @param {string} password - Encryption password
   * @returns {SecureStorageWrapper}
   */
  createSecureStorage(storage, password) {
    return new SecureStorageWrapper(storage, this, password);
  }

  /**
   * Encrypt specific fields in an object
   * @param {Object} obj - Object with fields to encrypt
   * @param {string[]} fields - Field names to encrypt
   * @param {string} password - Encryption password
   * @returns {Promise<Object>}
   */
  async encryptFields(obj, fields, password) {
    const result = { ...obj };

    for (const field of fields) {
      if (obj.hasOwnProperty(field) && obj[field] !== null && obj[field] !== undefined) {
        const encrypted = await this.encrypt(obj[field], password);
        result[field] = {
          _encrypted: true,
          ...encrypted,
        };
      }
    }

    return result;
  }

  /**
   * Decrypt specific fields in an object
   * @param {Object} obj - Object with encrypted fields
   * @param {string} password - Decryption password
   * @returns {Promise<Object>}
   */
  async decryptFields(obj, password) {
    const result = { ...obj };

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value._encrypted) {
        try {
          result[key] = await this.decrypt(value, password);
        } catch (error) {
          // Keep encrypted value if decryption fails
          console.warn(`Failed to decrypt field ${key}:`, error);
        }
      }
    }

    return result;
  }

  // Private helper methods

  /**
   * Convert ArrayBuffer to base64 string
   * @private
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Secure storage wrapper that automatically encrypts/decrypts data
 */
export class SecureStorageWrapper {
  constructor(storage, encryptionService, password) {
    this.storage = storage;
    this.encryption = encryptionService;
    this.password = password;
    this.encryptedKeys = new Set();
  }

  /**
   * Initialize the secure storage
   */
  async initialize() {
    await this.storage.initialize();
    await this.encryption.initialize();
  }

  /**
   * Store encrypted data
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {Object} options - Storage options
   */
  async set(key, data, options = {}) {
    const encrypted = await this.encryption.encrypt(data, this.password);
    await this.storage.set(key, encrypted, options);
    this.encryptedKeys.add(key);
  }

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {Promise<any>}
   */
  async get(key) {
    const encrypted = await this.storage.get(key);
    
    if (this.encryptedKeys.has(key) || (encrypted && encrypted.encrypted)) {
      return await this.encryption.decrypt(encrypted, this.password);
    }
    
    return encrypted;
  }

  /**
   * Remove data
   * @param {string} key - Storage key
   */
  async remove(key) {
    await this.storage.remove(key);
    this.encryptedKeys.delete(key);
  }

  /**
   * Clear all data
   */
  async clear() {
    await this.storage.clear();
    this.encryptedKeys.clear();
  }

  /**
   * Get all keys
   * @returns {Promise<string[]>}
   */
  async keys() {
    return await this.storage.keys();
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    return await this.storage.has(key);
  }

  /**
   * Get storage size
   * @returns {Promise<number>}
   */
  async getSize() {
    return await this.storage.getSize();
  }

  /**
   * Change encryption password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(newPassword) {
    const keys = await this.keys();
    
    // Re-encrypt all data with new password
    for (const key of keys) {
      if (this.encryptedKeys.has(key)) {
        try {
          const data = await this.get(key);
          const encrypted = await this.encryption.encrypt(data, newPassword);
          await this.storage.set(key, encrypted);
        } catch (error) {
          console.error(`Failed to re-encrypt key ${key}:`, error);
          throw error;
        }
      }
    }
    
    this.password = newPassword;
  }
}

/**
 * @typedef {Object} EncryptedData
 * @property {string} encrypted - Base64 encoded encrypted data
 * @property {string} salt - Base64 encoded salt
 * @property {string} iv - Base64 encoded initialization vector
 * @property {string} algorithm - Encryption algorithm used
 * @property {number} iterations - PBKDF2 iterations
 */

/**
 * Sensitive field definitions for automatic encryption
 */
export const SENSITIVE_FIELDS = {
  user: ['apiKeys', 'password', 'tokens'],
  financial: ['bankAccount', 'taxId', 'ssn'],
  personal: ['email', 'phone', 'address'],
};

/**
 * Check if a field should be encrypted based on its name
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
export function isSensitiveField(fieldName) {
  const lowerFieldName = fieldName.toLowerCase();
  
  return Object.values(SENSITIVE_FIELDS).some(fields =>
    fields.some(field => lowerFieldName.includes(field.toLowerCase())),
  );
}