/**
 * API Key Management Service
 * Handles secure storage, rotation, and validation of API keys for AI services
 */

import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export class ApiKeyManager {
  constructor() {
    this.keys = new Map();
    this.encryptionKey = this.generateEncryptionKey();
    this.keyRotationSchedule = new Map();
    this.keyUsageStats = new Map();
  }

  /**
   * Initialize API key manager
   * @param {Object} config - Configuration options
   */
  async initialize(config = {}) {
    const {
      enableRotation = true,
      rotationIntervalDays = 90,
      enableUsageTracking = true,
    } = config;

    this.config = {
      enableRotation,
      rotationIntervalDays,
      enableUsageTracking,
    };

    // Load existing keys from secure storage
    this.loadKeysFromStorage();

    // Set up key rotation if enabled
    if (enableRotation) {
      this.scheduleKeyRotation();
    }
  }

  /**
   * Generate encryption key for API key storage
   * @returns {string} Encryption key
   */
  generateEncryptionKey() {
    // In production, this should be derived from environment variables or secure key management
    const envKey = process.env.REACT_APP_ENCRYPTION_KEY;
    if (envKey) {
      return envKey;
    }
    
    // Generate a default key (not recommended for production)
    console.warn('Using default encryption key. Set REACT_APP_ENCRYPTION_KEY for production.');
    return CryptoJS.SHA256('default-encryption-key-' + window.location.hostname).toString();
  }

  /**
   * Register an API key
   * @param {string} service - Service name (e.g., 'openai', 'anthropic')
   * @param {string} apiKey - The API key
   * @param {Object} metadata - Additional metadata
   * @returns {string} Key ID
   */
  registerApiKey(service, apiKey, metadata = {}) {
    const keyId = uuidv4();
    const encryptedKey = this.encryptApiKey(apiKey);
    
    const keyData = {
      id: keyId,
      service,
      encryptedKey,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        lastRotated: new Date().toISOString(),
        version: 1,
      },
      active: true,
    };

    this.keys.set(keyId, keyData);
    this.saveKeysToStorage();

    // Initialize usage stats
    if (this.config.enableUsageTracking) {
      this.keyUsageStats.set(keyId, {
        requests: 0,
        errors: 0,
        lastUsed: null,
      });
    }

    // Schedule rotation if enabled
    if (this.config.enableRotation) {
      this.scheduleKeyRotationForKey(keyId);
    }

    return keyId;
  }

  /**
   * Get API key for a service
   * @param {string} service - Service name
   * @returns {string|null} Decrypted API key
   */
  getApiKey(service) {
    // Find active key for service
    const keyData = Array.from(this.keys.values()).find(
      key => key.service === service && key.active
    );

    if (!keyData) {
      console.error(`No active API key found for service: ${service}`);
      return null;
    }

    // Track usage
    if (this.config.enableUsageTracking) {
      this.trackKeyUsage(keyData.id);
    }

    // Decrypt and return
    return this.decryptApiKey(keyData.encryptedKey);
  }

  /**
   * Get API key by ID
   * @param {string} keyId - Key ID
   * @returns {string|null} Decrypted API key
   */
  getApiKeyById(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData || !keyData.active) {
      return null;
    }

    // Track usage
    if (this.config.enableUsageTracking) {
      this.trackKeyUsage(keyId);
    }

    return this.decryptApiKey(keyData.encryptedKey);
  }

  /**
   * Update API key
   * @param {string} keyId - Key ID
   * @param {string} newApiKey - New API key
   */
  updateApiKey(keyId, newApiKey) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Keep old version for rollback
    keyData.previousVersions = keyData.previousVersions || [];
    keyData.previousVersions.push({
      encryptedKey: keyData.encryptedKey,
      rotatedAt: new Date().toISOString(),
      version: keyData.metadata.version,
    });

    // Update key
    keyData.encryptedKey = this.encryptApiKey(newApiKey);
    keyData.metadata.lastRotated = new Date().toISOString();
    keyData.metadata.version += 1;

    this.saveKeysToStorage();

    // Reschedule rotation
    if (this.config.enableRotation) {
      this.scheduleKeyRotationForKey(keyId);
    }
  }

  /**
   * Rotate API key
   * @param {string} keyId - Key ID
   * @param {string} newApiKey - New API key
   */
  async rotateApiKey(keyId, newApiKey) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Log rotation event
    console.log(`Rotating API key for service: ${keyData.service}`);

    // Update the key
    this.updateApiKey(keyId, newApiKey);

    // Notify about rotation
    this.notifyKeyRotation(keyData.service, keyId);
  }

  /**
   * Revoke API key
   * @param {string} keyId - Key ID
   */
  revokeApiKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      return;
    }

    keyData.active = false;
    keyData.metadata.revokedAt = new Date().toISOString();
    
    this.saveKeysToStorage();

    // Cancel rotation schedule
    this.cancelKeyRotation(keyId);
  }

  /**
   * Encrypt API key
   * @param {string} apiKey - API key to encrypt
   * @returns {string} Encrypted API key
   */
  encryptApiKey(apiKey) {
    return CryptoJS.AES.encrypt(apiKey, this.encryptionKey).toString();
  }

  /**
   * Decrypt API key
   * @param {string} encryptedKey - Encrypted API key
   * @returns {string} Decrypted API key
   */
  decryptApiKey(encryptedKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Track key usage
   * @param {string} keyId - Key ID
   */
  trackKeyUsage(keyId) {
    const stats = this.keyUsageStats.get(keyId);
    if (stats) {
      stats.requests++;
      stats.lastUsed = new Date().toISOString();
    }
  }

  /**
   * Track key error
   * @param {string} keyId - Key ID
   */
  trackKeyError(keyId) {
    const stats = this.keyUsageStats.get(keyId);
    if (stats) {
      stats.errors++;
    }
  }

  /**
   * Get key usage statistics
   * @param {string} keyId - Key ID
   * @returns {Object|null} Usage statistics
   */
  getKeyUsageStats(keyId) {
    return this.keyUsageStats.get(keyId) || null;
  }

  /**
   * Schedule key rotation
   */
  scheduleKeyRotation() {
    this.keys.forEach((keyData, keyId) => {
      if (keyData.active) {
        this.scheduleKeyRotationForKey(keyId);
      }
    });
  }

  /**
   * Schedule rotation for specific key
   * @param {string} keyId - Key ID
   */
  scheduleKeyRotationForKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) return;

    // Cancel existing schedule
    this.cancelKeyRotation(keyId);

    // Calculate next rotation date
    const lastRotated = new Date(keyData.metadata.lastRotated);
    const nextRotation = new Date(lastRotated);
    nextRotation.setDate(nextRotation.getDate() + this.config.rotationIntervalDays);

    // Schedule rotation
    const timeUntilRotation = nextRotation.getTime() - Date.now();
    if (timeUntilRotation > 0) {
      const timeout = setTimeout(() => {
        this.notifyKeyRotationRequired(keyData.service, keyId);
      }, timeUntilRotation);

      this.keyRotationSchedule.set(keyId, timeout);
    }
  }

  /**
   * Cancel key rotation schedule
   * @param {string} keyId - Key ID
   */
  cancelKeyRotation(keyId) {
    const timeout = this.keyRotationSchedule.get(keyId);
    if (timeout) {
      clearTimeout(timeout);
      this.keyRotationSchedule.delete(keyId);
    }
  }

  /**
   * Notify about key rotation
   * @param {string} service - Service name
   * @param {string} keyId - Key ID
   */
  notifyKeyRotation(service, keyId) {
    // In production, this would trigger notifications
    console.log(`API key rotated for service: ${service} (ID: ${keyId})`);
    
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apiKeyRotated', {
        detail: { service, keyId },
      }));
    }
  }

  /**
   * Notify that key rotation is required
   * @param {string} service - Service name
   * @param {string} keyId - Key ID
   */
  notifyKeyRotationRequired(service, keyId) {
    console.warn(`API key rotation required for service: ${service} (ID: ${keyId})`);
    
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apiKeyRotationRequired', {
        detail: { service, keyId },
      }));
    }
  }

  /**
   * Validate API key format
   * @param {string} service - Service name
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Whether the key format is valid
   */
  validateKeyFormat(service, apiKey) {
    const patterns = {
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9]{48}$/,
      gemini: /^[a-zA-Z0-9\-_]{39}$/,
      // Add more patterns as needed
    };

    const pattern = patterns[service];
    if (!pattern) {
      // Unknown service, basic validation
      return apiKey && apiKey.length > 10;
    }

    return pattern.test(apiKey);
  }

  /**
   * Load keys from storage
   */
  loadKeysFromStorage() {
    try {
      const stored = localStorage.getItem('ecf_api_keys');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach(keyData => {
          this.keys.set(keyData.id, keyData);
        });
      }
    } catch (error) {
      console.error('Failed to load API keys from storage:', error);
    }
  }

  /**
   * Save keys to storage
   */
  saveKeysToStorage() {
    try {
      const data = Array.from(this.keys.values());
      localStorage.setItem('ecf_api_keys', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save API keys to storage:', error);
    }
  }

  /**
   * Export keys (for backup)
   * @returns {string} Encrypted export data
   */
  exportKeys() {
    const data = {
      keys: Array.from(this.keys.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  /**
   * Import keys
   * @param {string} encryptedData - Encrypted export data
   */
  importKeys(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

      data.keys.forEach(keyData => {
        this.keys.set(keyData.id, keyData);
      });

      this.saveKeysToStorage();
    } catch (error) {
      console.error('Failed to import keys:', error);
      throw new Error('Invalid import data');
    }
  }

  /**
   * Get all services with registered keys
   * @returns {Array} List of services
   */
  getRegisteredServices() {
    const services = new Set();
    this.keys.forEach(keyData => {
      if (keyData.active) {
        services.add(keyData.service);
      }
    });
    return Array.from(services);
  }

  /**
   * Clear all keys
   */
  clearAllKeys() {
    this.keys.clear();
    this.keyUsageStats.clear();
    this.keyRotationSchedule.forEach(timeout => clearTimeout(timeout));
    this.keyRotationSchedule.clear();
    this.saveKeysToStorage();
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();