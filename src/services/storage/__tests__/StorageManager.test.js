// src/services/storage/__tests__/StorageManager.test.js
import { StorageManager } from '../StorageManager';
import { IndexedDBService } from '../IndexedDBService';
import { LocalStorageService } from '../LocalStorageService';
import { EncryptionService } from '../EncryptionService';
import { AutoSaveService } from '../AutoSaveService';

// Mock all dependencies
jest.mock('../IndexedDBService');
jest.mock('../LocalStorageService');
jest.mock('../EncryptionService');
jest.mock('../AutoSaveService');
jest.mock('../DataExportService');
jest.mock('../DataImportService');

describe('StorageManager', () => {
  let mockIndexedDB;
  let mockLocalStorage;
  let mockEncryption;
  let mockAutoSave;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock IndexedDB
    mockIndexedDB = {
      initialize: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      getAll: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    IndexedDBService.mockImplementation(() => mockIndexedDB);

    // Mock LocalStorage
    mockLocalStorage = {
      initialize: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      getAll: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    LocalStorageService.mockImplementation(() => mockLocalStorage);

    // Mock Encryption
    mockEncryption = {
      initialize: jest.fn().mockResolvedValue(undefined),
      createSecureStorage: jest.fn((storage) => ({
        ...storage,
        encrypted: true,
      })),
    };
    EncryptionService.mockImplementation(() => mockEncryption);

    // Mock AutoSave
    mockAutoSave = {
      initialize: jest.fn().mockResolvedValue(undefined),
      triggerSave: jest.fn(),
      unregister: jest.fn(),
    };
    AutoSaveService.mockImplementation(() => mockAutoSave);
  });

  describe('constructor', () => {
    it('should create storage manager with default config', () => {
      const manager = new StorageManager();
      expect(manager.config.encryptionEnabled).toBe(true);
      expect(manager.config.autoSaveEnabled).toBe(true);
      expect(manager.initialized).toBe(false);
    });

    it('should create storage manager with custom config', () => {
      const manager = new StorageManager({
        encryptionEnabled: false,
        autoSaveEnabled: false,
      });
      expect(manager.config.encryptionEnabled).toBe(false);
      expect(manager.config.autoSaveEnabled).toBe(false);
    });

    it('should initialize all storage services', () => {
      new StorageManager();
      expect(IndexedDBService).toHaveBeenCalled();
      expect(LocalStorageService).toHaveBeenCalled();
      expect(EncryptionService).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize all services successfully', async () => {
      const manager = new StorageManager();
      await manager.initialize();

      expect(mockIndexedDB.initialize).toHaveBeenCalled();
      expect(mockLocalStorage.initialize).toHaveBeenCalled();
      expect(manager.initialized).toBe(true);
    });

    it('should initialize encryption when enabled with key', async () => {
      const manager = new StorageManager({ encryptionEnabled: true });
      await manager.initialize('encryption-key');

      expect(mockEncryption.initialize).toHaveBeenCalled();
      expect(mockEncryption.createSecureStorage).toHaveBeenCalledTimes(2);
      expect(manager.encryptionKey).toBe('encryption-key');
    });

    it('should not initialize encryption without key', async () => {
      const manager = new StorageManager({ encryptionEnabled: true });
      await manager.initialize();

      expect(mockEncryption.initialize).not.toHaveBeenCalled();
      expect(manager.encryptionKey).toBeNull();
    });

    it('should initialize auto-save when enabled', async () => {
      const manager = new StorageManager({ autoSaveEnabled: true });
      await manager.initialize();

      expect(AutoSaveService).toHaveBeenCalled();
      expect(mockAutoSave.initialize).toHaveBeenCalled();
    });

    it('should not initialize auto-save when disabled', async () => {
      const manager = new StorageManager({ autoSaveEnabled: false });
      await manager.initialize();

      expect(AutoSaveService).not.toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      const manager = new StorageManager();
      await manager.initialize();
      await manager.initialize();

      expect(mockIndexedDB.initialize).toHaveBeenCalledTimes(1);
    });

    it('should throw error on initialization failure', async () => {
      mockIndexedDB.initialize.mockRejectedValue(new Error('Init failed'));
      const manager = new StorageManager();

      await expect(manager.initialize()).rejects.toThrow('Failed to initialize storage manager');
    });
  });

  describe('getStorage', () => {
    it('should return localStorage for preferences', async () => {
      const manager = new StorageManager({ encryptionEnabled: false });
      await manager.initialize();

      const storage = manager.getStorage('preferences');
      expect(storage).toBe(mockLocalStorage);
    });

    it('should return localStorage for session data', async () => {
      const manager = new StorageManager({ encryptionEnabled: false });
      await manager.initialize();

      const storage = manager.getStorage('session');
      expect(storage).toBe(mockLocalStorage);
    });

    it('should return indexedDB for projects', async () => {
      const manager = new StorageManager({ encryptionEnabled: false });
      await manager.initialize();

      const storage = manager.getStorage('projects');
      expect(storage).toBe(mockIndexedDB);
    });

    it('should return secure storage when encryption enabled', async () => {
      const manager = new StorageManager({ encryptionEnabled: true });
      await manager.initialize('encryption-key');

      const storage = manager.getStorage('projects');
      expect(storage.encrypted).toBe(true);
    });

    it('should throw error if not initialized', () => {
      const manager = new StorageManager();

      expect(() => manager.getStorage('projects')).toThrow();
    });
  });

  describe('project management', () => {
    let manager;

    beforeEach(async () => {
      manager = new StorageManager();
      await manager.initialize();
    });

    describe('saveProject', () => {
      it('should save project successfully', async () => {
        const project = { id: 'proj-1', name: 'Test Project' };

        await manager.saveProject(project);

        expect(mockIndexedDB.set).toHaveBeenCalledWith('projects', project);
      });

      it('should trigger auto-save after saving', async () => {
        const project = { id: 'proj-1', name: 'Test Project' };

        await manager.saveProject(project);

        expect(mockAutoSave.triggerSave).toHaveBeenCalledWith('project_proj-1');
      });
    });

    describe('getProject', () => {
      it('should retrieve project by ID', async () => {
        const project = { id: 'proj-1', name: 'Test Project' };
        mockIndexedDB.get.mockResolvedValue(project);

        const result = await manager.getProject('proj-1');

        expect(mockIndexedDB.get).toHaveBeenCalledWith('projects', 'proj-1');
        expect(result).toEqual(project);
      });

      it('should return null for non-existent project', async () => {
        mockIndexedDB.get.mockResolvedValue(null);

        const result = await manager.getProject('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('getProjects', () => {
      it('should retrieve all projects', async () => {
        const projects = [
          { id: 'proj-1', name: 'Project 1' },
          { id: 'proj-2', name: 'Project 2' },
        ];
        mockIndexedDB.getAll.mockResolvedValue(projects);

        const result = await manager.getProjects();

        expect(mockIndexedDB.getAll).toHaveBeenCalledWith('projects', {});
        expect(result).toEqual(projects);
      });

      it('should retrieve projects with options', async () => {
        const options = { limit: 10, sortBy: 'name' };

        await manager.getProjects(options);

        expect(mockIndexedDB.getAll).toHaveBeenCalledWith('projects', options);
      });
    });

    describe('deleteProject', () => {
      it('should delete project and associated data', async () => {
        mockIndexedDB.query.mockResolvedValue([]);

        await manager.deleteProject('proj-1');

        expect(mockIndexedDB.remove).toHaveBeenCalledWith('projects', 'proj-1');
        expect(mockAutoSave.unregister).toHaveBeenCalledWith('project_proj-1');
      });

      it('should delete associated scenarios and reports', async () => {
        const scenarios = [{ id: 'scen-1', projectId: 'proj-1' }];
        const reports = [{ id: 'rep-1', projectId: 'proj-1' }];

        mockIndexedDB.query
          .mockResolvedValueOnce(scenarios)
          .mockResolvedValueOnce(reports);

        mockIndexedDB.get.mockResolvedValue(null);

        await manager.deleteProject('proj-1');

        expect(mockIndexedDB.remove).toHaveBeenCalledWith('scenarios', 'scen-1');
        expect(mockIndexedDB.remove).toHaveBeenCalledWith('reports', 'rep-1');
      });
    });
  });

  describe('scenario management', () => {
    let manager;

    beforeEach(async () => {
      manager = new StorageManager();
      await manager.initialize();
    });

    describe('saveScenario', () => {
      it('should save scenario successfully', async () => {
        const scenario = { id: 'scen-1', projectId: 'proj-1', name: 'Scenario 1' };
        const project = { id: 'proj-1', scenarioIds: [] };

        mockIndexedDB.get.mockResolvedValue(project);

        await manager.saveScenario(scenario);

        expect(mockIndexedDB.set).toHaveBeenCalledWith('scenarios', scenario);
      });

      it('should update project scenario list', async () => {
        const scenario = { id: 'scen-1', projectId: 'proj-1', name: 'Scenario 1' };
        const project = { id: 'proj-1', scenarioIds: [] };

        mockIndexedDB.get.mockResolvedValue(project);

        await manager.saveScenario(scenario);

        expect(project.scenarioIds).toContain('scen-1');
        expect(mockIndexedDB.set).toHaveBeenCalledWith('projects', expect.objectContaining({
          scenarioIds: ['scen-1'],
        }));
      });

      it('should trigger auto-save after saving', async () => {
        const scenario = { id: 'scen-1', projectId: 'proj-1', name: 'Scenario 1' };

        mockIndexedDB.get.mockResolvedValue({ id: 'proj-1', scenarioIds: ['scen-1'] });

        await manager.saveScenario(scenario);

        expect(mockAutoSave.triggerSave).toHaveBeenCalledWith('scenario_scen-1');
      });
    });

    describe('getScenario', () => {
      it('should retrieve scenario by ID', async () => {
        const scenario = { id: 'scen-1', projectId: 'proj-1', name: 'Scenario 1' };
        mockIndexedDB.get.mockResolvedValue(scenario);

        const result = await manager.getScenario('scen-1');

        expect(mockIndexedDB.get).toHaveBeenCalledWith('scenarios', 'scen-1');
        expect(result).toEqual(scenario);
      });
    });

    describe('getScenarios', () => {
      it('should retrieve all scenarios', async () => {
        const scenarios = [
          { id: 'scen-1', projectId: 'proj-1' },
          { id: 'scen-2', projectId: 'proj-1' },
        ];
        mockIndexedDB.getAll.mockResolvedValue(scenarios);

        const result = await manager.getScenarios();

        expect(mockIndexedDB.getAll).toHaveBeenCalledWith('scenarios', {});
        expect(result).toEqual(scenarios);
      });

      it('should retrieve scenarios by projectId', async () => {
        const scenarios = [{ id: 'scen-1', projectId: 'proj-1' }];
        mockIndexedDB.query.mockResolvedValue(scenarios);

        const result = await manager.getScenarios({ projectId: 'proj-1' });

        expect(mockIndexedDB.query).toHaveBeenCalledWith('scenarios', 'projectId', 'proj-1');
        expect(result).toEqual(scenarios);
      });
    });

    describe('deleteScenario', () => {
      it('should delete scenario', async () => {
        const scenario = { id: 'scen-1', projectId: 'proj-1' };
        mockIndexedDB.get
          .mockResolvedValueOnce(scenario)
          .mockResolvedValueOnce({ id: 'proj-1', scenarioIds: ['scen-1'] });

        mockIndexedDB.query.mockResolvedValue([]);

        await manager.deleteScenario('scen-1');

        expect(mockIndexedDB.remove).toHaveBeenCalledWith('scenarios', 'scen-1');
        expect(mockAutoSave.unregister).toHaveBeenCalledWith('scenario_scen-1');
      });

      it('should handle deletion of non-existent scenario', async () => {
        mockIndexedDB.get.mockResolvedValue(null);

        await manager.deleteScenario('non-existent');

        expect(mockIndexedDB.remove).not.toHaveBeenCalled();
      });
    });
  });

  describe('report management', () => {
    let manager;

    beforeEach(async () => {
      manager = new StorageManager();
      await manager.initialize();
    });

    describe('saveReport', () => {
      it('should save report successfully', async () => {
        const report = { id: 'rep-1', projectId: 'proj-1', name: 'Report 1' };
        const project = { id: 'proj-1', reportIds: [] };

        mockIndexedDB.get.mockResolvedValue(project);

        await manager.saveReport(report);

        expect(mockIndexedDB.set).toHaveBeenCalledWith('reports', report);
      });

      it('should update project report list', async () => {
        const report = { id: 'rep-1', projectId: 'proj-1', name: 'Report 1' };
        const project = { id: 'proj-1', reportIds: [] };

        mockIndexedDB.get.mockResolvedValue(project);

        await manager.saveReport(report);

        expect(project.reportIds).toContain('rep-1');
        expect(mockIndexedDB.set).toHaveBeenCalledWith('projects', expect.objectContaining({
          reportIds: ['rep-1'],
        }));
      });
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      const manager = new StorageManager();
      await manager.initialize();

      mockIndexedDB.set.mockRejectedValue(new Error('Storage full'));

      const project = { id: 'proj-1', name: 'Test Project' };

      await expect(manager.saveProject(project)).rejects.toThrow('Storage full');
    });
  });
});
