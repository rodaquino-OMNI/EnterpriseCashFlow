/**
 * @fileoverview React hook for storage service integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage, storageManager } from '../services/storage';

/**
 * Hook for storage operations
 * @param {Object} options - Hook options
 * @returns {Object} Storage operations and state
 */
export function useStorage(options = {}) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  
  const autoSaveRefs = useRef(new Map());

  // Initialize storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        await storage.initialize(options.encryptionKey);
        setInitialized(true);
        
        // Get initial stats
        if (options.trackStats) {
          const stats = await storage.getStats();
          setStorageStats(stats);
        }
      } catch (err) {
        setError(err);
        console.error('Failed to initialize storage:', err);
      }
    };
    
    initStorage();
    
    return () => {
      // Cleanup auto-saves
      autoSaveRefs.current.forEach(unregister => unregister());
      autoSaveRefs.current.clear();
    };
  }, [options.encryptionKey, options.trackStats]);

  // Generic operation wrapper
  const performOperation = useCallback(async (operation, ...args) => {
    if (!initialized) {
      throw new Error('Storage not initialized');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(...args);
      
      // Update stats if tracking
      if (options.trackStats) {
        const stats = await storage.getStats();
        setStorageStats(stats);
      }
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initialized, options.trackStats]);

  // Project operations
  const saveProject = useCallback(async (project) => {
    return performOperation(storage.saveProject, project);
  }, [performOperation]);

  const getProject = useCallback(async (projectId) => {
    return performOperation(storage.getProject, projectId);
  }, [performOperation]);

  const getProjects = useCallback(async (queryOptions) => {
    return performOperation(storage.getProjects, queryOptions);
  }, [performOperation]);

  const deleteProject = useCallback(async (projectId) => {
    return performOperation(storage.deleteProject, projectId);
  }, [performOperation]);

  // Scenario operations
  const saveScenario = useCallback(async (scenario) => {
    return performOperation(storage.saveScenario, scenario);
  }, [performOperation]);

  const getScenario = useCallback(async (scenarioId) => {
    return performOperation(storage.getScenario, scenarioId);
  }, [performOperation]);

  const getScenarios = useCallback(async (queryOptions) => {
    return performOperation(storage.getScenarios, queryOptions);
  }, [performOperation]);

  const deleteScenario = useCallback(async (scenarioId) => {
    return performOperation(storage.deleteScenario, scenarioId);
  }, [performOperation]);

  // Report operations
  const saveReport = useCallback(async (report) => {
    return performOperation(storage.saveReport, report);
  }, [performOperation]);

  const getReport = useCallback(async (reportId) => {
    return performOperation(storage.getReport, reportId);
  }, [performOperation]);

  const getReports = useCallback(async (queryOptions) => {
    return performOperation(storage.getReports, queryOptions);
  }, [performOperation]);

  const deleteReport = useCallback(async (reportId) => {
    return performOperation(storage.deleteReport, reportId);
  }, [performOperation]);

  // Preferences
  const savePreferences = useCallback(async (preferences) => {
    return performOperation(storage.savePreferences, preferences);
  }, [performOperation]);

  const getPreferences = useCallback(async () => {
    return performOperation(storage.getPreferences);
  }, [performOperation]);

  const updatePreference = useCallback(async (key, value) => {
    return performOperation(storage.updatePreference, key, value);
  }, [performOperation]);

  // Export/Import
  const exportProject = useCallback(async (projectId, format = 'json') => {
    const blob = await performOperation(storage.exportProject, projectId, format);
    
    // Optionally auto-download
    if (options.autoDownload) {
      const filename = `project_${projectId}_${new Date().toISOString()}.${format}`;
      downloadBlob(blob, filename);
    }
    
    return blob;
  }, [performOperation, options.autoDownload]);

  const exportReport = useCallback(async (reportId, format = 'excel') => {
    const blob = await performOperation(storage.exportReport, reportId, format);
    
    // Optionally auto-download
    if (options.autoDownload) {
      const filename = `report_${reportId}_${new Date().toISOString()}.${format}`;
      downloadBlob(blob, filename);
    }
    
    return blob;
  }, [performOperation, options.autoDownload]);

  const importData = useCallback(async (file, importOptions) => {
    return performOperation(storage.importData, file, importOptions);
  }, [performOperation]);

  // Storage management
  const clearStorage = useCallback(async (includePreferences = false) => {
    return performOperation(storage.clear, includePreferences);
  }, [performOperation]);

  const backup = useCallback(async () => {
    const blob = await performOperation(storage.backup);
    
    // Optionally auto-download
    if (options.autoDownload) {
      const filename = `backup_${new Date().toISOString()}.json`;
      downloadBlob(blob, filename);
    }
    
    return blob;
  }, [performOperation, options.autoDownload]);

  const restore = useCallback(async (backupFile) => {
    return performOperation(storage.restore, backupFile);
  }, [performOperation]);

  // Auto-save registration
  const registerAutoSave = useCallback((key, dataProvider, autoSaveOptions) => {
    if (!initialized) return () => {};
    
    const unregister = storageManager.registerAutoSave(key, dataProvider, autoSaveOptions);
    autoSaveRefs.current.set(key, unregister);
    
    return () => {
      unregister();
      autoSaveRefs.current.delete(key);
    };
  }, [initialized]);

  const triggerAutoSave = useCallback((key, saveOptions) => {
    if (!initialized) return;
    
    storageManager.triggerAutoSave(key, saveOptions);
  }, [initialized]);

  const getAutoSaveState = useCallback((key) => {
    if (!initialized) return { status: 'uninitialized' };
    
    return storageManager.getAutoSaveState(key);
  }, [initialized]);

  return {
    // State
    initialized,
    loading,
    error,
    storageStats,
    
    // Project operations
    saveProject,
    getProject,
    getProjects,
    deleteProject,
    
    // Scenario operations
    saveScenario,
    getScenario,
    getScenarios,
    deleteScenario,
    
    // Report operations
    saveReport,
    getReport,
    getReports,
    deleteReport,
    
    // Preferences
    savePreferences,
    getPreferences,
    updatePreference,
    
    // Export/Import
    exportProject,
    exportReport,
    importData,
    
    // Storage management
    clearStorage,
    backup,
    restore,
    
    // Auto-save
    registerAutoSave,
    triggerAutoSave,
    getAutoSaveState
  };
}

/**
 * Hook for auto-save functionality
 * @param {string} key - Auto-save key
 * @param {Function} dataProvider - Function that returns current data
 * @param {Object} options - Auto-save options
 */
export function useAutoSave(key, dataProvider, options = {}) {
  const { registerAutoSave, triggerAutoSave, getAutoSaveState } = useStorage();
  const [saveState, setSaveState] = useState({ status: 'idle' });
  
  // Register auto-save
  useEffect(() => {
    const unregister = registerAutoSave(key, dataProvider, options);
    
    // Set up state listener
    const interval = setInterval(() => {
      const state = getAutoSaveState(key);
      setSaveState(state);
    }, 1000); // Update every second
    
    return () => {
      unregister();
      clearInterval(interval);
    };
  }, [key, dataProvider, options, registerAutoSave, getAutoSaveState]);
  
  // Trigger save function
  const save = useCallback((saveOptions) => {
    triggerAutoSave(key, saveOptions);
  }, [key, triggerAutoSave]);
  
  return {
    saveState,
    save
  };
}

/**
 * Hook for storage preferences
 */
export function useStoragePreferences() {
  const { getPreferences, updatePreference } = useStorage();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getPreferences();
        setPreferences(prefs);
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [getPreferences]);
  
  // Update preference
  const update = useCallback(async (key, value) => {
    try {
      await updatePreference(key, value);
      
      // Update local state
      setPreferences(prev => {
        const keys = key.split('.');
        const updated = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        
        return updated;
      });
    } catch (err) {
      console.error('Failed to update preference:', err);
      throw err;
    }
  }, [updatePreference]);
  
  return {
    preferences,
    loading,
    updatePreference: update
  };
}

// Helper function to download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}