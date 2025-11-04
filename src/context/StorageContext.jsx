/**
 * @fileoverview Storage Context Provider for global storage management
 * Provides storage manager instance and auto-save functionality to all components
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageManager } from '../services/storage/StorageManager';

// Create Storage Context
const StorageContext = createContext(null);

/**
 * Hook to access storage context
 * @returns {Object} Storage context value
 */
export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return context;
};

/**
 * Storage Provider Component
 * Initializes and provides storage manager to the application
 */
export const StorageProvider = ({ children }) => {
  const [storage, setStorage] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [saveStates, setSaveStates] = useState({});

  // Initialize storage manager on mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('Initializing StorageManager...');

        // Initialize storage manager (without encryption for now)
        await storageManager.initialize();

        setStorage(storageManager);
        setIsInitialized(true);

        console.log('StorageManager initialized successfully');

        // Set up auto-save listener to track save states
        if (storageManager.autoSave) {
          storageManager.autoSave.addListener((event) => {
            if (event.type === 'state-change') {
              setSaveStates(prev => ({
                ...prev,
                [event.key]: event.state
              }));
            }
          });
        }

      } catch (error) {
        console.error('Failed to initialize StorageManager:', error);
        setInitError(error);
      }
    };

    initializeStorage();

    // Cleanup on unmount
    return () => {
      if (storageManager && storageManager.autoSave) {
        // Save all pending data before unmount
        storageManager.autoSave.saveAll().catch(err => {
          console.error('Failed to save all data on unmount:', err);
        });
      }
    };
  }, []);

  // Register auto-save wrapper
  const registerAutoSave = useCallback((key, dataProvider, options = {}) => {
    if (!storage || !storage.autoSave) {
      console.warn('Auto-save not available');
      return () => {};
    }

    try {
      const unregister = storage.registerAutoSave(key, dataProvider, options);

      // Initialize save state for this key
      setSaveStates(prev => ({
        ...prev,
        [key]: {
          status: 'idle',
          error: null,
          lastSaved: null,
          isDirty: false
        }
      }));

      return unregister;
    } catch (error) {
      console.error(`Failed to register auto-save for ${key}:`, error);
      return () => {};
    }
  }, [storage]);

  // Get auto-save state
  const getAutoSaveState = useCallback((key) => {
    return saveStates[key] || {
      status: 'unknown',
      error: null,
      lastSaved: null,
      isDirty: false
    };
  }, [saveStates]);

  // Save preferences helper
  const savePreference = useCallback(async (key, value) => {
    if (!storage) {
      console.warn('Storage not initialized');
      return;
    }

    try {
      await storage.updatePreference(key, value);
    } catch (error) {
      console.error(`Failed to save preference ${key}:`, error);
      throw error;
    }
  }, [storage]);

  // Load preferences helper
  const loadPreferences = useCallback(async () => {
    if (!storage) {
      console.warn('Storage not initialized');
      return {};
    }

    try {
      return await storage.getPreferences();
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {};
    }
  }, [storage]);

  // Load auto-saved data
  const loadAutoSaved = useCallback(async (key) => {
    if (!storage || !storage.autoSave) {
      console.warn('Auto-save not available');
      return null;
    }

    try {
      return await storage.autoSave.load(key);
    } catch (error) {
      console.error(`Failed to load auto-saved data for ${key}:`, error);
      return null;
    }
  }, [storage]);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    if (!storage) {
      return null;
    }

    try {
      return await storage.getStorageStats();
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }, [storage]);

  // Context value
  const contextValue = {
    storage,
    isInitialized,
    initError,
    saveStates,
    registerAutoSave,
    getAutoSaveState,
    savePreference,
    loadPreferences,
    loadAutoSaved,
    getStorageStats
  };

  // Show loading state while initializing
  if (!isInitialized && !initError) {
    return (
      <div className="storage-initializing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing storage...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if initialization failed
  if (initError) {
    return (
      <div className="storage-init-error">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
            <div className="text-red-600 text-xl mb-2">⚠️ Storage Initialization Failed</div>
            <p className="text-gray-700 mb-4">
              The application failed to initialize storage. Some features may not work properly.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Error: {initError.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};

export default StorageContext;
