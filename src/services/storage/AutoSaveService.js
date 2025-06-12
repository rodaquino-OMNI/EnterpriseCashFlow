/**
 * @fileoverview Auto-save service with debouncing and conflict resolution
 */

import { StorageError, StorageErrorCode } from './StorageService';

/**
 * Auto-save service for automatic data persistence
 */
export class AutoSaveService {
  constructor(storageService, config = {}) {
    this.storage = storageService;
    this.config = {
      debounceDelay: config.debounceDelay || 1000, // 1 second
      maxRetries: config.maxRetries || 3,
      conflictResolution: config.conflictResolution || 'latest', // 'latest', 'merge', 'prompt'
      saveIndicator: config.saveIndicator !== false,
      versioning: config.versioning !== false,
      maxVersions: config.maxVersions || 10,
      ...config
    };
    
    this.saveQueue = new Map();
    this.saveTimers = new Map();
    this.saveCallbacks = new Map();
    this.conflictHandlers = new Map();
    this.saveState = new Map();
    this.listeners = new Set();
  }

  /**
   * Initialize auto-save service
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.storage.initialize();
    
    // Set up periodic cleanup of old versions
    if (this.config.versioning) {
      this.cleanupInterval = setInterval(() => {
        this._cleanupOldVersions();
      }, 60 * 60 * 1000); // Every hour
    }
  }

  /**
   * Register data for auto-save
   * @param {string} key - Unique identifier for the data
   * @param {Function} dataProvider - Function that returns current data
   * @param {Object} options - Auto-save options
   * @returns {Function} Unregister function
   */
  register(key, dataProvider, options = {}) {
    const config = {
      ...this.config,
      ...options
    };
    
    // Store the data provider
    this.saveCallbacks.set(key, {
      dataProvider,
      config,
      lastSaved: null,
      version: 0
    });
    
    // Initialize save state
    this.saveState.set(key, {
      status: 'idle',
      error: null,
      lastSaved: null,
      isDirty: false
    });
    
    // Return unregister function
    return () => this.unregister(key);
  }

  /**
   * Unregister data from auto-save
   * @param {string} key - Data identifier
   */
  unregister(key) {
    // Clear any pending saves
    this.cancelSave(key);
    
    // Remove from registries
    this.saveCallbacks.delete(key);
    this.saveState.delete(key);
    this.saveQueue.delete(key);
    this.conflictHandlers.delete(key);
  }

  /**
   * Trigger auto-save for specific data
   * @param {string} key - Data identifier
   * @param {Object} options - Save options
   */
  triggerSave(key, options = {}) {
    const callback = this.saveCallbacks.get(key);
    if (!callback) {
      console.warn(`No auto-save registered for key: ${key}`);
      return;
    }
    
    // Update dirty state
    this._updateSaveState(key, { isDirty: true });
    
    // Clear existing timer
    if (this.saveTimers.has(key)) {
      clearTimeout(this.saveTimers.get(key));
    }
    
    // Set up debounced save
    const delay = options.immediate ? 0 : callback.config.debounceDelay;
    
    const timer = setTimeout(() => {
      this._performSave(key, options);
    }, delay);
    
    this.saveTimers.set(key, timer);
  }

  /**
   * Cancel pending save
   * @param {string} key - Data identifier
   */
  cancelSave(key) {
    if (this.saveTimers.has(key)) {
      clearTimeout(this.saveTimers.get(key));
      this.saveTimers.delete(key);
    }
    
    this.saveQueue.delete(key);
    this._updateSaveState(key, { isDirty: false });
  }

  /**
   * Force save all registered data
   * @returns {Promise<void>}
   */
  async saveAll() {
    const saves = [];
    
    for (const [key] of this.saveCallbacks) {
      saves.push(this._performSave(key, { force: true }));
    }
    
    await Promise.allSettled(saves);
  }

  /**
   * Get save state for specific data
   * @param {string} key - Data identifier
   * @returns {Object} Save state
   */
  getSaveState(key) {
    return this.saveState.get(key) || {
      status: 'unknown',
      error: null,
      lastSaved: null,
      isDirty: false
    };
  }

  /**
   * Register conflict handler
   * @param {string} key - Data identifier
   * @param {Function} handler - Conflict resolution handler
   */
  registerConflictHandler(key, handler) {
    this.conflictHandlers.set(key, handler);
  }

  /**
   * Add save state listener
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Load saved data
   * @param {string} key - Data identifier
   * @returns {Promise<any>}
   */
  async load(key) {
    try {
      const storageKey = this._getStorageKey(key);
      const saved = await this.storage.get('autoSave', storageKey);
      
      if (saved && saved.data) {
        this._updateSaveState(key, {
          lastSaved: saved.timestamp,
          isDirty: false
        });
        
        return saved.data;
      }
      
      return null;
    } catch (error) {
      if (error.code !== StorageErrorCode.KEY_NOT_FOUND) {
        console.error(`Failed to load auto-saved data for ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * Get version history
   * @param {string} key - Data identifier
   * @returns {Promise<Array>}
   */
  async getVersionHistory(key) {
    if (!this.config.versioning) {
      return [];
    }
    
    try {
      const versions = await this.storage.query('autoSave', 'entityId', key);
      
      return versions
        .filter(v => v.entityType === 'version')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.config.maxVersions);
    } catch (error) {
      console.error(`Failed to get version history for ${key}:`, error);
      return [];
    }
  }

  /**
   * Restore specific version
   * @param {string} key - Data identifier
   * @param {string} versionId - Version ID
   * @returns {Promise<any>}
   */
  async restoreVersion(key, versionId) {
    try {
      const version = await this.storage.get('autoSave', versionId);
      
      if (!version || version.entityId !== key) {
        throw new Error('Version not found');
      }
      
      // Save current as new version before restoring
      await this._saveVersion(key);
      
      // Restore the version
      const callback = this.saveCallbacks.get(key);
      if (callback && callback.dataProvider) {
        // Notify about restoration
        this._notifyListeners({
          type: 'version-restored',
          key,
          versionId,
          data: version.data
        });
      }
      
      return version.data;
    } catch (error) {
      throw new StorageError(
        'Failed to restore version',
        StorageErrorCode.UNKNOWN_ERROR,
        error
      );
    }
  }

  /**
   * Clean up the service
   */
  destroy() {
    // Cancel all pending saves
    for (const [key] of this.saveTimers) {
      this.cancelSave(key);
    }
    
    // Clear interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear all data
    this.saveCallbacks.clear();
    this.saveState.clear();
    this.saveQueue.clear();
    this.conflictHandlers.clear();
    this.listeners.clear();
  }

  // Private methods

  /**
   * Perform the actual save operation
   * @private
   */
  async _performSave(key, options = {}) {
    const callback = this.saveCallbacks.get(key);
    if (!callback) return;
    
    // Update state
    this._updateSaveState(key, { status: 'saving' });
    
    let retries = 0;
    const maxRetries = options.force ? 1 : callback.config.maxRetries;
    
    while (retries < maxRetries) {
      try {
        // Get current data
        const data = await callback.dataProvider();
        
        if (!data) {
          this._updateSaveState(key, {
            status: 'idle',
            isDirty: false,
            error: 'No data to save'
          });
          return;
        }
        
        // Check for conflicts
        const hasConflict = await this._checkForConflicts(key, data);
        
        if (hasConflict && !options.force) {
          const resolved = await this._resolveConflict(key, data);
          if (!resolved) {
            this._updateSaveState(key, {
              status: 'conflict',
              error: 'Save conflict'
            });
            return;
          }
        }
        
        // Save current version if versioning is enabled
        if (callback.config.versioning) {
          await this._saveVersion(key);
        }
        
        // Prepare save data
        const saveData = {
          id: this._getStorageKey(key),
          entityType: 'autosave',
          entityId: key,
          data,
          timestamp: new Date(),
          version: callback.version + 1,
          checksum: await this._calculateChecksum(data)
        };
        
        // Save to storage
        await this.storage.set('autoSave', saveData);
        
        // Update callback info
        callback.lastSaved = new Date();
        callback.version = saveData.version;
        
        // Update state
        this._updateSaveState(key, {
          status: 'saved',
          lastSaved: callback.lastSaved,
          isDirty: false,
          error: null
        });
        
        // Notify listeners
        this._notifyListeners({
          type: 'save-complete',
          key,
          timestamp: callback.lastSaved
        });
        
        return;
        
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          this._updateSaveState(key, {
            status: 'error',
            error: error.message
          });
          
          this._notifyListeners({
            type: 'save-error',
            key,
            error
          });
          
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  /**
   * Check for save conflicts
   * @private
   */
  async _checkForConflicts(key, currentData) {
    try {
      const storageKey = this._getStorageKey(key);
      const saved = await this.storage.get('autoSave', storageKey);
      
      if (!saved) return false;
      
      const callback = this.saveCallbacks.get(key);
      if (!callback) return false;
      
      // Check if saved version is newer
      if (saved.version > callback.version) {
        return true;
      }
      
      // Check if data has been modified externally
      const currentChecksum = await this._calculateChecksum(currentData);
      const savedChecksum = saved.checksum;
      
      return savedChecksum && savedChecksum !== currentChecksum && 
             saved.timestamp > callback.lastSaved;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Resolve save conflict
   * @private
   */
  async _resolveConflict(key, currentData) {
    const handler = this.conflictHandlers.get(key);
    
    if (handler) {
      return await handler(currentData);
    }
    
    switch (this.config.conflictResolution) {
      case 'latest':
        return true; // Overwrite with current data
        
      case 'merge':
        // Implement merge logic if possible
        console.warn('Merge conflict resolution not implemented');
        return false;
        
      case 'prompt':
        // Would need UI integration
        console.warn('Prompt conflict resolution requires UI handler');
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Save version
   * @private
   */
  async _saveVersion(key) {
    if (!this.config.versioning) return;
    
    try {
      const storageKey = this._getStorageKey(key);
      const current = await this.storage.get('autoSave', storageKey);
      
      if (!current || !current.data) return;
      
      const versionData = {
        id: `${key}_version_${Date.now()}`,
        entityType: 'version',
        entityId: key,
        data: current.data,
        timestamp: new Date(),
        version: current.version
      };
      
      await this.storage.set('autoSave', versionData);
    } catch (error) {
      console.error(`Failed to save version for ${key}:`, error);
    }
  }

  /**
   * Clean up old versions
   * @private
   */
  async _cleanupOldVersions() {
    if (!this.config.versioning) return;
    
    try {
      for (const [key] of this.saveCallbacks) {
        const versions = await this.getVersionHistory(key);
        
        if (versions.length > this.config.maxVersions) {
          const toDelete = versions.slice(this.config.maxVersions);
          
          for (const version of toDelete) {
            await this.storage.remove('autoSave', version.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old versions:', error);
    }
  }

  /**
   * Calculate checksum for data
   * @private
   */
  async _calculateChecksum(data) {
    const str = JSON.stringify(data);
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get storage key
   * @private
   */
  _getStorageKey(key) {
    return `autosave_${key}`;
  }

  /**
   * Update save state
   * @private
   */
  _updateSaveState(key, updates) {
    const currentState = this.saveState.get(key) || {};
    const newState = { ...currentState, ...updates };
    
    this.saveState.set(key, newState);
    
    this._notifyListeners({
      type: 'state-change',
      key,
      state: newState
    });
  }

  /**
   * Notify listeners
   * @private
   */
  _notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in auto-save listener:', error);
      }
    });
  }
}