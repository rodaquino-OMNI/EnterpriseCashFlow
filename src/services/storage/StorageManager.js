/**
 * @fileoverview Storage Manager - Main orchestrator for all storage services
 */

import { IndexedDBService } from './IndexedDBService';
import { LocalStorageService } from './LocalStorageService';
import { EncryptionService, SecureStorageWrapper } from './EncryptionService';
import { AutoSaveService } from './AutoSaveService';
import { DataExportService } from './DataExportService';
import { DataImportService } from './DataImportService';
import { StorageError, StorageErrorCode } from './StorageService';

/**
 * Main storage manager that orchestrates all storage services
 */
export class StorageManager {
  constructor(config = {}) {
    this.config = {
      encryptionEnabled: config.encryptionEnabled !== false,
      autoSaveEnabled: config.autoSaveEnabled !== false,
      ...config
    };
    
    // Initialize services
    this.indexedDB = new IndexedDBService(config.indexedDB);
    this.localStorage = new LocalStorageService(config.localStorage);
    this.encryption = new EncryptionService(config.encryption);
    this.exportService = new DataExportService(config.export);
    this.importService = new DataImportService(config.import);
    
    // Auto-save service will be initialized after storage services
    this.autoSave = null;
    
    // Secure storage wrappers
    this.secureIndexedDB = null;
    this.secureLocalStorage = null;
    
    // State
    this.initialized = false;
    this.encryptionKey = null;
  }

  /**
   * Initialize the storage manager
   * @param {string} encryptionKey - Optional encryption key
   * @returns {Promise<void>}
   */
  async initialize(encryptionKey = null) {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize base storage services
      await Promise.all([
        this.indexedDB.initialize(),
        this.localStorage.initialize()
      ]);
      
      // Initialize encryption if enabled
      if (this.config.encryptionEnabled && encryptionKey) {
        await this.encryption.initialize();
        this.encryptionKey = encryptionKey;
        
        // Create secure storage wrappers
        this.secureIndexedDB = this.encryption.createSecureStorage(
          this.indexedDB,
          encryptionKey
        );
        this.secureLocalStorage = this.encryption.createSecureStorage(
          this.localStorage,
          encryptionKey
        );
      }
      
      // Initialize auto-save service
      if (this.config.autoSaveEnabled) {
        const primaryStorage = this.config.encryptionEnabled && this.encryptionKey
          ? this.secureIndexedDB
          : this.indexedDB;
          
        this.autoSave = new AutoSaveService(primaryStorage, this.config.autoSave);
        await this.autoSave.initialize();
      }
      
      this.initialized = true;
      
    } catch (error) {
      throw new StorageError(
        'Failed to initialize storage manager',
        StorageErrorCode.INITIALIZATION_FAILED,
        error
      );
    }
  }

  /**
   * Get the appropriate storage service for data type
   * @param {string} dataType - Type of data (projects, scenarios, reports, preferences)
   * @returns {StorageService}
   */
  getStorage(dataType) {
    this._ensureInitialized();
    
    // Use LocalStorage for preferences and small data
    if (dataType === 'preferences' || dataType === 'session') {
      return this.config.encryptionEnabled && this.encryptionKey
        ? this.secureLocalStorage
        : this.localStorage;
    }
    
    // Use IndexedDB for large data
    return this.config.encryptionEnabled && this.encryptionKey
      ? this.secureIndexedDB
      : this.indexedDB;
  }

  // Project Management

  /**
   * Save a project
   * @param {Object} project - Project data
   * @returns {Promise<void>}
   */
  async saveProject(project) {
    this._ensureInitialized();
    
    const storage = this.getStorage('projects');
    await storage.set('projects', project);
    
    // Trigger auto-save if enabled
    if (this.autoSave) {
      this.autoSave.triggerSave(`project_${project.id}`);
    }
  }

  /**
   * Get a project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>}
   */
  async getProject(projectId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('projects');
    return await storage.get('projects', projectId);
  }

  /**
   * Get all projects
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getProjects(options = {}) {
    this._ensureInitialized();
    
    const storage = this.getStorage('projects');
    return await storage.getAll('projects', options);
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @returns {Promise<void>}
   */
  async deleteProject(projectId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('projects');
    
    // Delete project
    await storage.remove('projects', projectId);
    
    // Delete associated scenarios and reports
    const scenarios = await this.getScenarios({ projectId });
    const reports = await this.getReports({ projectId });
    
    await Promise.all([
      ...scenarios.map(s => this.deleteScenario(s.id)),
      ...reports.map(r => this.deleteReport(r.id))
    ]);
    
    // Cancel auto-save
    if (this.autoSave) {
      this.autoSave.unregister(`project_${projectId}`);
    }
  }

  // Scenario Management

  /**
   * Save a scenario
   * @param {Object} scenario - Scenario data
   * @returns {Promise<void>}
   */
  async saveScenario(scenario) {
    this._ensureInitialized();
    
    const storage = this.getStorage('scenarios');
    await storage.set('scenarios', scenario);
    
    // Update project's scenario list
    const project = await this.getProject(scenario.projectId);
    if (project && !project.scenarioIds.includes(scenario.id)) {
      project.scenarioIds.push(scenario.id);
      project.updatedAt = new Date();
      await this.saveProject(project);
    }
    
    // Trigger auto-save
    if (this.autoSave) {
      this.autoSave.triggerSave(`scenario_${scenario.id}`);
    }
  }

  /**
   * Get a scenario by ID
   * @param {string} scenarioId - Scenario ID
   * @returns {Promise<Object>}
   */
  async getScenario(scenarioId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('scenarios');
    return await storage.get('scenarios', scenarioId);
  }

  /**
   * Get scenarios
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getScenarios(options = {}) {
    this._ensureInitialized();
    
    const storage = this.getStorage('scenarios');
    
    if (options.projectId) {
      return await storage.query('scenarios', 'projectId', options.projectId);
    }
    
    return await storage.getAll('scenarios', options);
  }

  /**
   * Delete a scenario
   * @param {string} scenarioId - Scenario ID
   * @returns {Promise<void>}
   */
  async deleteScenario(scenarioId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('scenarios');
    const scenario = await this.getScenario(scenarioId);
    
    if (!scenario) return;
    
    // Remove from storage
    await storage.remove('scenarios', scenarioId);
    
    // Update project
    const project = await this.getProject(scenario.projectId);
    if (project) {
      project.scenarioIds = project.scenarioIds.filter(id => id !== scenarioId);
      project.updatedAt = new Date();
      await this.saveProject(project);
    }
    
    // Delete associated reports
    const reports = await this.getReports({ scenarioId });
    await Promise.all(reports.map(r => this.deleteReport(r.id)));
    
    // Cancel auto-save
    if (this.autoSave) {
      this.autoSave.unregister(`scenario_${scenarioId}`);
    }
  }

  // Report Management

  /**
   * Save a report
   * @param {Object} report - Report data
   * @returns {Promise<void>}
   */
  async saveReport(report) {
    this._ensureInitialized();
    
    const storage = this.getStorage('reports');
    await storage.set('reports', report);
    
    // Update project's report list
    const project = await this.getProject(report.projectId);
    if (project && !project.reportIds.includes(report.id)) {
      project.reportIds.push(report.id);
      project.updatedAt = new Date();
      await this.saveProject(project);
    }
  }

  /**
   * Get a report by ID
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>}
   */
  async getReport(reportId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('reports');
    return await storage.get('reports', reportId);
  }

  /**
   * Get reports
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  async getReports(options = {}) {
    this._ensureInitialized();
    
    const storage = this.getStorage('reports');
    
    if (options.projectId) {
      return await storage.query('reports', 'projectId', options.projectId);
    }
    
    if (options.scenarioId) {
      return await storage.query('reports', 'scenarioId', options.scenarioId);
    }
    
    return await storage.getAll('reports', options);
  }

  /**
   * Delete a report
   * @param {string} reportId - Report ID
   * @returns {Promise<void>}
   */
  async deleteReport(reportId) {
    this._ensureInitialized();
    
    const storage = this.getStorage('reports');
    const report = await this.getReport(reportId);
    
    if (!report) return;
    
    // Remove from storage
    await storage.remove('reports', reportId);
    
    // Update project
    const project = await this.getProject(report.projectId);
    if (project) {
      project.reportIds = project.reportIds.filter(id => id !== reportId);
      project.updatedAt = new Date();
      await this.saveProject(project);
    }
  }

  // User Preferences

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async savePreferences(preferences) {
    this._ensureInitialized();
    
    const storage = this.getStorage('preferences');
    await storage.setPreferences(preferences);
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>}
   */
  async getPreferences() {
    this._ensureInitialized();
    
    const storage = this.getStorage('preferences');
    return await storage.getPreferences();
  }

  /**
   * Update specific preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   * @returns {Promise<void>}
   */
  async updatePreference(key, value) {
    this._ensureInitialized();
    
    const storage = this.getStorage('preferences');
    await storage.updatePreference(key, value);
  }

  // Auto-save Management

  /**
   * Register data for auto-save
   * @param {string} key - Data key
   * @param {Function} dataProvider - Function that returns current data
   * @param {Object} options - Auto-save options
   * @returns {Function} Unregister function
   */
  registerAutoSave(key, dataProvider, options = {}) {
    this._ensureInitialized();
    
    if (!this.autoSave) {
      throw new Error('Auto-save is not enabled');
    }
    
    return this.autoSave.register(key, dataProvider, options);
  }

  /**
   * Trigger auto-save
   * @param {string} key - Data key
   * @param {Object} options - Save options
   */
  triggerAutoSave(key, options = {}) {
    this._ensureInitialized();
    
    if (!this.autoSave) {
      throw new Error('Auto-save is not enabled');
    }
    
    this.autoSave.triggerSave(key, options);
  }

  /**
   * Get auto-save state
   * @param {string} key - Data key
   * @returns {Object} Save state
   */
  getAutoSaveState(key) {
    this._ensureInitialized();
    
    if (!this.autoSave) {
      return { status: 'disabled' };
    }
    
    return this.autoSave.getSaveState(key);
  }

  // Data Export/Import

  /**
   * Export project data
   * @param {string} projectId - Project ID
   * @param {string} format - Export format
   * @returns {Promise<Blob>}
   */
  async exportProject(projectId, format = 'json') {
    this._ensureInitialized();
    
    const project = await this.getProject(projectId);
    const scenarios = await this.getScenarios({ projectId });
    const reports = await this.getReports({ projectId });
    
    return await this.exportService.exportProject(project, scenarios, reports, format);
  }

  /**
   * Export report
   * @param {string} reportId - Report ID
   * @param {string} format - Export format
   * @returns {Promise<Blob>}
   */
  async exportReport(reportId, format = 'excel') {
    this._ensureInitialized();
    
    const report = await this.getReport(reportId);
    return await this.exportService.exportReport(report, format);
  }

  /**
   * Import data from file
   * @param {File} file - File to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>}
   */
  async importData(file, options = {}) {
    this._ensureInitialized();
    
    const data = await this.importService.import(file, options);
    
    // Save imported data
    if (data.project) {
      await this.saveProject(data.project);
    }
    
    if (data.scenarios) {
      for (const scenario of data.scenarios) {
        await this.saveScenario(scenario);
      }
    }
    
    if (data.reports) {
      for (const report of data.reports) {
        await this.saveReport(report);
      }
    }
    
    return data;
  }

  // Storage Management

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    this._ensureInitialized();
    
    const [indexedDBSize, localStorageSize, localStorageStats] = await Promise.all([
      this.indexedDB.getSize(),
      this.localStorage.getSize(),
      this.localStorage.getStats()
    ]);
    
    const [projectCount, scenarioCount, reportCount] = await Promise.all([
      this.indexedDB.keys('projects').then(keys => keys.length),
      this.indexedDB.keys('scenarios').then(keys => keys.length),
      this.indexedDB.keys('reports').then(keys => keys.length)
    ]);
    
    return {
      indexedDB: {
        size: indexedDBSize,
        projects: projectCount,
        scenarios: scenarioCount,
        reports: reportCount
      },
      localStorage: localStorageStats,
      total: {
        size: indexedDBSize + localStorageSize,
        items: projectCount + scenarioCount + reportCount + localStorageStats.totalKeys
      }
    };
  }

  /**
   * Clear all data
   * @param {boolean} includePreferences - Whether to clear preferences
   * @returns {Promise<void>}
   */
  async clearAllData(includePreferences = false) {
    this._ensureInitialized();
    
    // Clear IndexedDB
    await this.indexedDB.clear();
    
    // Clear LocalStorage
    if (includePreferences) {
      await this.localStorage.clear();
    } else {
      // Clear everything except preferences
      const preferences = await this.getPreferences();
      await this.localStorage.clear();
      await this.savePreferences(preferences);
    }
    
    // Clear auto-save
    if (this.autoSave) {
      this.autoSave.destroy();
      await this.autoSave.initialize();
    }
  }

  /**
   * Backup all data
   * @returns {Promise<Blob>}
   */
  async backup() {
    this._ensureInitialized();
    
    const projects = await this.getProjects();
    const scenarios = await this.getScenarios();
    const reports = await this.getReports();
    const preferences = await this.getPreferences();
    
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        projects,
        scenarios,
        reports,
        preferences
      }
    };
    
    return await this.exportService.exportJSON(backupData);
  }

  /**
   * Restore from backup
   * @param {File} backupFile - Backup file
   * @returns {Promise<void>}
   */
  async restore(backupFile) {
    this._ensureInitialized();
    
    const backup = await this.importService.importJSON(
      await backupFile.text()
    );
    
    if (!backup.data) {
      throw new Error('Invalid backup file');
    }
    
    // Clear existing data
    await this.clearAllData(true);
    
    // Restore data
    const { projects, scenarios, reports, preferences } = backup.data;
    
    if (projects) {
      for (const project of projects) {
        await this.saveProject(project);
      }
    }
    
    if (scenarios) {
      for (const scenario of scenarios) {
        await this.saveScenario(scenario);
      }
    }
    
    if (reports) {
      for (const report of reports) {
        await this.saveReport(report);
      }
    }
    
    if (preferences) {
      await this.savePreferences(preferences);
    }
  }

  /**
   * Change encryption password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changeEncryptionPassword(oldPassword, newPassword) {
    this._ensureInitialized();
    
    if (!this.config.encryptionEnabled) {
      throw new Error('Encryption is not enabled');
    }
    
    if (this.encryptionKey !== oldPassword) {
      throw new Error('Invalid current password');
    }
    
    // Re-encrypt all data with new password
    if (this.secureIndexedDB) {
      await this.secureIndexedDB.changePassword(newPassword);
    }
    
    if (this.secureLocalStorage) {
      await this.secureLocalStorage.changePassword(newPassword);
    }
    
    this.encryptionKey = newPassword;
  }

  /**
   * Destroy the storage manager
   */
  destroy() {
    if (this.autoSave) {
      this.autoSave.destroy();
    }
    
    if (this.indexedDB) {
      this.indexedDB.close();
    }
    
    this.initialized = false;
  }

  // Private methods

  /**
   * Ensure storage manager is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Storage manager is not initialized');
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export all storage-related classes and utilities
export { StorageService, StorageError, StorageErrorCode } from './StorageService';
export { IndexedDBService } from './IndexedDBService';
export { LocalStorageService } from './LocalStorageService';
export { EncryptionService, SecureStorageWrapper } from './EncryptionService';
export { AutoSaveService } from './AutoSaveService';
export { DataExportService } from './DataExportService';
export { DataImportService } from './DataImportService';
export * from './models';