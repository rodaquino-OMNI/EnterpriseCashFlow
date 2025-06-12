/**
 * @fileoverview Storage service exports
 */

// Main storage manager (singleton)
export { storageManager, StorageManager } from './StorageManager';

// Storage services
export { StorageService, StorageError, StorageErrorCode } from './StorageService';
export { IndexedDBService } from './IndexedDBService';
export { LocalStorageService } from './LocalStorageService';
export { EncryptionService, SecureStorageWrapper, SENSITIVE_FIELDS, isSensitiveField } from './EncryptionService';
export { AutoSaveService } from './AutoSaveService';
export { DataExportService } from './DataExportService';
export { DataImportService } from './DataImportService';

// Data models
export * from './models';

// Convenience functions for direct usage
export const storage = {
  // Initialize storage
  async initialize(encryptionKey = null) {
    return storageManager.initialize(encryptionKey);
  },
  
  // Project operations
  async saveProject(project) {
    return storageManager.saveProject(project);
  },
  
  async getProject(projectId) {
    return storageManager.getProject(projectId);
  },
  
  async getProjects(options) {
    return storageManager.getProjects(options);
  },
  
  async deleteProject(projectId) {
    return storageManager.deleteProject(projectId);
  },
  
  // Scenario operations
  async saveScenario(scenario) {
    return storageManager.saveScenario(scenario);
  },
  
  async getScenario(scenarioId) {
    return storageManager.getScenario(scenarioId);
  },
  
  async getScenarios(options) {
    return storageManager.getScenarios(options);
  },
  
  async deleteScenario(scenarioId) {
    return storageManager.deleteScenario(scenarioId);
  },
  
  // Report operations
  async saveReport(report) {
    return storageManager.saveReport(report);
  },
  
  async getReport(reportId) {
    return storageManager.getReport(reportId);
  },
  
  async getReports(options) {
    return storageManager.getReports(options);
  },
  
  async deleteReport(reportId) {
    return storageManager.deleteReport(reportId);
  },
  
  // Preferences
  async savePreferences(preferences) {
    return storageManager.savePreferences(preferences);
  },
  
  async getPreferences() {
    return storageManager.getPreferences();
  },
  
  async updatePreference(key, value) {
    return storageManager.updatePreference(key, value);
  },
  
  // Export/Import
  async exportProject(projectId, format) {
    return storageManager.exportProject(projectId, format);
  },
  
  async exportReport(reportId, format) {
    return storageManager.exportReport(reportId, format);
  },
  
  async importData(file, options) {
    return storageManager.importData(file, options);
  },
  
  // Storage management
  async getStats() {
    return storageManager.getStorageStats();
  },
  
  async clear(includePreferences) {
    return storageManager.clearAllData(includePreferences);
  },
  
  async backup() {
    return storageManager.backup();
  },
  
  async restore(backupFile) {
    return storageManager.restore(backupFile);
  }
};