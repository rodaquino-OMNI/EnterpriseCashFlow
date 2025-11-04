# DEVELOPER ACTION CHECKLIST
**Enterprise Cash Flow - State Management Fixes**
**Priority Order for Implementation**

---

## PHASE 1: CRITICAL FIXES (BETA BLOCKERS) ⚠️

### Week 1: Data Persistence Infrastructure

#### Task 1.1: Initialize Storage Layer (Day 1-2)
- [ ] Install dependencies (if any)
  ```bash
  # Check if any storage libs needed
  npm install
  ```

- [ ] Create StorageProvider component
  ```bash
  touch /src/context/StorageContext.jsx
  ```

- [ ] Wrap App in StorageProvider
  ```jsx
  // src/index.js
  import { StorageProvider } from './context/StorageContext';

  root.render(
    <React.StrictMode>
      <StorageProvider>
        <App />
      </StorageProvider>
    </React.StrictMode>
  );
  ```

- [ ] Initialize StorageManager on mount
  ```jsx
  // src/context/StorageContext.jsx
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    async function init() {
      await storageManager.initialize();
      setStorage(storageManager);
    }
    init();
  }, []);
  ```

- [ ] Test: Storage initializes without errors
  ```bash
  npm start
  # Check console for storage init logs
  ```

---

#### Task 1.2: Integrate Auto-Save for Input Data (Day 3-4)
- [ ] Register auto-save in App.jsx
  ```jsx
  // src/components/App.jsx
  import { useStorage } from '../hooks/useStorage';

  const { registerAutoSave, getAutoSaveState } = useStorage();

  useEffect(() => {
    const unregister = registerAutoSave(
      'currentInputData',
      () => currentInputData,
      { debounceDelay: 1000 }
    );
    return () => unregister();
  }, [currentInputData]);
  ```

- [ ] Register auto-save for calculated data
  ```jsx
  useEffect(() => {
    const unregister = registerAutoSave(
      'calculatedData',
      () => calculatedData,
      { debounceDelay: 1000 }
    );
    return () => unregister();
  }, [calculatedData]);
  ```

- [ ] Register auto-save for company info
  ```jsx
  useEffect(() => {
    const unregister = registerAutoSave(
      'companyInfo',
      () => companyInfo,
      { debounceDelay: 1000 }
    );
    return () => unregister();
  }, [companyInfo]);
  ```

- [ ] Test: Enter data, wait 1 second, check IndexedDB
  ```javascript
  // In browser console:
  // Open DevTools → Application → IndexedDB → enterpriseCashFlow_db
  // Should see autoSave entries
  ```

---

#### Task 1.3: Implement Session Recovery (Day 5-6)
- [ ] Create recovery prompt component
  ```bash
  touch /src/components/SessionRecovery.jsx
  ```

- [ ] Add recovery logic on mount
  ```jsx
  // src/components/App.jsx
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState(null);

  useEffect(() => {
    async function checkRecovery() {
      const saved = await storage.load('lastSession');
      if (saved && Date.now() - saved.timestamp < 24*60*60*1000) {
        setRecoveredSession(saved);
        setShowRecoveryPrompt(true);
      }
    }
    checkRecovery();
  }, []);

  const handleRecover = () => {
    setUserUploadedData(recoveredSession.userUploadedData);
    setCalculatedData(recoveredSession.calculatedData);
    setCompanyInfo(recoveredSession.companyInfo);
    setShowRecoveryPrompt(false);
  };
  ```

- [ ] Add recovery UI
  ```jsx
  {showRecoveryPrompt && (
    <SessionRecovery
      session={recoveredSession}
      onRecover={handleRecover}
      onDismiss={() => setShowRecoveryPrompt(false)}
    />
  )}
  ```

- [ ] Test: Enter data, close browser, reopen → Should see recovery prompt

---

#### Task 1.4: Secure API Key Storage (Day 7-8)
- [ ] Import EncryptionService
  ```jsx
  // src/components/ReportGeneratorApp.jsx
  import { storageManager } from '../services/storage';
  ```

- [ ] Replace plain localStorage with secure storage
  ```jsx
  // REMOVE:
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('aiApiKeys_ReportGen_v3');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('aiApiKeys_ReportGen_v3', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // REPLACE WITH:
  const [apiKeys, setApiKeys] = useState({});

  useEffect(() => {
    async function loadKeys() {
      const keys = await storageManager.getPreferences();
      setApiKeys(keys.apiKeys || {});
    }
    loadKeys();
  }, []);

  useEffect(() => {
    async function saveKeys() {
      await storageManager.updatePreference('apiKeys', apiKeys);
    }
    saveKeys();
  }, [apiKeys]);
  ```

- [ ] Migrate existing keys
  ```jsx
  // One-time migration on mount
  useEffect(() => {
    const oldKeys = localStorage.getItem('aiApiKeys_ReportGen_v3');
    if (oldKeys) {
      const parsed = JSON.parse(oldKeys);
      storageManager.updatePreference('apiKeys', parsed);
      localStorage.removeItem('aiApiKeys_ReportGen_v3');
    }
  }, []);
  ```

- [ ] Test: Store API key, check localStorage → Should NOT see plain text

---

#### Task 1.5: Fix Race Condition - Excel Upload (Day 9-10)
- [ ] Add upload lock state
  ```jsx
  // src/components/ReportGeneratorApp.jsx
  const [isUploading, setIsUploading] = useState(false);
  ```

- [ ] Update handleExcelFileUpload
  ```jsx
  const handleExcelFileUpload = async (file) => {
    // Check lock
    if (isUploading) {
      console.warn('Upload already in progress');
      return;
    }

    // Acquire lock
    setIsUploading(true);

    try {
      setAppError(null);
      setValidationErrorDetails(null);
      setCalculatedData([]);

      const parseResult = await parseSmartExcelFile(file, periodType);

      // ... rest of logic

    } catch (error) {
      console.error("Error in handleExcelFileUpload:", error);
    } finally {
      // Release lock
      setIsUploading(false);
    }
  };
  ```

- [ ] Disable upload button during processing
  ```jsx
  <ExcelUploader
    onFileUpload={handleExcelFileUpload}
    isLoading={isUploading || isProcessingSomething}
    disabled={isUploading}
  />
  ```

- [ ] Test: Upload large file, try to upload another immediately → Second should be blocked

---

#### Task 1.6: Fix Race Condition - AI Analysis (Day 11)
- [ ] Add request tracking
  ```jsx
  // src/hooks/useAiAnalysis.js
  const [inFlightRequests, setInFlightRequests] = useState(new Set());
  ```

- [ ] Update performAnalysis
  ```jsx
  const performAnalysis = useCallback(async (analysisType, financialDataBundle) => {
    // Check if already in flight
    if (inFlightRequests.has(analysisType)) {
      console.warn(`${analysisType} already in progress`);
      return;
    }

    // Mark as in flight
    setInFlightRequests(prev => new Set(prev).add(analysisType));

    try {
      setLoadingStates(prev => ({ ...prev, [analysisType]: true }));
      setErrors(prev => ({ ...prev, [analysisType]: null }));

      const apiKey = apiKeys[selectedAiProviderKey] || '';
      const result = await aiService.callAiAnalysis(
        analysisType,
        financialDataBundle,
        {},
        apiKey
      );

      setAnalyses(prev => ({ ...prev, [analysisType]: result }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [analysisType]: error }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [analysisType]: false }));
      setInFlightRequests(prev => {
        const next = new Set(prev);
        next.delete(analysisType);
        return next;
      });
    }
  }, [aiService, apiKeys, selectedAiProviderKey, inFlightRequests]);
  ```

- [ ] Test: Click "Analyze" multiple times rapidly → Only one request should fire

---

### Week 2: Testing & Validation

#### Task 2.1: Write Tests (Day 12-13)
- [ ] Create test file
  ```bash
  touch /src/__tests__/integration/DataPersistence.test.js
  ```

- [ ] Test auto-save
  ```javascript
  test('saves input data automatically', async () => {
    // ... implementation
  });
  ```

- [ ] Test session recovery
  ```javascript
  test('recovers session after refresh', async () => {
    // ... implementation
  });
  ```

- [ ] Test race conditions
  ```javascript
  test('prevents concurrent Excel uploads', async () => {
    // ... implementation
  });
  ```

- [ ] Run tests
  ```bash
  npm test -- --testPathPattern=DataPersistence
  ```

---

#### Task 2.2: Manual Testing (Day 14)
- [ ] Test Case 1: Manual Data Entry + Refresh
  1. Enter financial data
  2. Wait 2 seconds (auto-save)
  3. Refresh page
  4. ✅ Should see recovery prompt
  5. ✅ Data should be restored

- [ ] Test Case 2: Excel Upload + Browser Close
  1. Upload Excel file
  2. Wait for processing
  3. Close browser
  4. Reopen
  5. ✅ Should recover data

- [ ] Test Case 3: AI Analysis + Tab Close
  1. Run AI analysis
  2. Close tab
  3. Reopen app
  4. ✅ Analysis results should be cached

- [ ] Test Case 4: API Key Storage Security
  1. Enter API key
  2. Open DevTools → Application → LocalStorage
  3. ✅ Should NOT see plain text key

- [ ] Test Case 5: Race Condition - Excel
  1. Upload large Excel file
  2. Immediately upload another
  3. ✅ Second should be blocked or first cancelled

- [ ] Test Case 6: Race Condition - AI
  1. Click "Analyze"
  2. Click again rapidly
  3. ✅ Only one request should fire

---

#### Task 2.3: Code Review (Day 15)
- [ ] Review all changes with team
- [ ] Check for edge cases
- [ ] Verify error handling
- [ ] Ensure backward compatibility

---

## PHASE 2: HIGH PRIORITY FIXES

### Week 3: Context API Refactoring

#### Task 3.1: Create Contexts (Day 16-17)
- [ ] Create context files
  ```bash
  mkdir -p /src/context
  touch /src/context/FinancialDataContext.jsx
  touch /src/context/AIAnalysisContext.jsx
  touch /src/context/ConfigContext.jsx
  ```

- [ ] Implement FinancialDataContext
  ```jsx
  // src/context/FinancialDataContext.jsx
  import React, { createContext, useState, useContext } from 'react';

  const FinancialDataContext = createContext();

  export function FinancialDataProvider({ children }) {
    const [currentInputData, setCurrentInputData] = useState([]);
    const [calculatedData, setCalculatedData] = useState([]);

    return (
      <FinancialDataContext.Provider value={{
        currentInputData,
        setCurrentInputData,
        calculatedData,
        setCalculatedData
      }}>
        {children}
      </FinancialDataContext.Provider>
    );
  }

  export function useFinancialData() {
    const context = useContext(FinancialDataContext);
    if (!context) {
      throw new Error('useFinancialData must be used within FinancialDataProvider');
    }
    return context;
  }
  ```

- [ ] Similar for AIAnalysisContext
- [ ] Similar for ConfigContext

---

#### Task 3.2: Wrap App in Contexts (Day 18)
- [ ] Update index.js
  ```jsx
  // src/index.js
  import { FinancialDataProvider } from './context/FinancialDataContext';
  import { AIAnalysisProvider } from './context/AIAnalysisContext';
  import { ConfigProvider } from './context/ConfigContext';

  root.render(
    <React.StrictMode>
      <StorageProvider>
        <ConfigProvider>
          <FinancialDataProvider>
            <AIAnalysisProvider>
              <App />
            </AIAnalysisProvider>
          </FinancialDataProvider>
        </ConfigProvider>
      </StorageProvider>
    </React.StrictMode>
  );
  ```

---

#### Task 3.3: Refactor Components (Day 19-22)
- [ ] Refactor App.jsx to use contexts
  ```jsx
  // BEFORE:
  const [currentInputData, setCurrentInputData] = useState([]);

  // AFTER:
  const { currentInputData, setCurrentInputData } = useFinancialData();
  ```

- [ ] Remove prop passing
- [ ] Update child components to use contexts
- [ ] Test each component after refactoring

---

### Week 4: Memory Leaks & Optimization

#### Task 4.1: Audit useEffect Hooks (Day 23-24)
- [ ] Check all useEffect hooks for cleanup
  ```jsx
  // PATTERN:
  useEffect(() => {
    // Setup
    const subscription = something.subscribe();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [deps]);
  ```

- [ ] Add cleanup to AutoSaveService intervals
- [ ] Add cleanup to event listeners
- [ ] Add cleanup to async operations

---

#### Task 4.2: Test for Memory Leaks (Day 25)
- [ ] Use React DevTools Profiler
  1. Open DevTools → Profiler
  2. Start recording
  3. Use app (enter data, upload files, etc.)
  4. Stop recording
  5. Check for growing memory usage

- [ ] Fix any leaks found

---

## PHASE 3: IMPROVEMENTS

### Week 5-6: AI Request Caching & Undo/Redo

#### Task 5.1: Implement AI Result Caching (Day 26-28)
- [ ] Add cache check in useAiAnalysis
  ```jsx
  // Before API call:
  const cacheKey = `${analysisType}_${hash(financialDataBundle)}`;
  const cached = await storage.getCache(cacheKey);
  if (cached) {
    setAnalyses(prev => ({ ...prev, [analysisType]: cached }));
    return;
  }

  // After API call:
  await storage.cache(cacheKey, result, 3600); // 1 hour TTL
  ```

- [ ] Test: Run analysis, run again → Should use cached result

---

#### Task 5.2: Implement Undo/Redo (Day 29-33)
- [ ] Create history manager
  ```bash
  touch /src/utils/historyManager.js
  ```

- [ ] Implement command pattern
- [ ] Add undo/redo buttons
- [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)

---

## TESTING CHECKLIST

### Before Each Commit:
- [ ] Run linter
  ```bash
  npm run lint
  ```
- [ ] Run tests
  ```bash
  npm test
  ```
- [ ] Test in browser manually
- [ ] Check console for errors

### Before Push:
- [ ] Run full test suite
  ```bash
  npm test -- --coverage
  ```
- [ ] Check code coverage (target: > 80%)
- [ ] Test in incognito mode (fresh state)
- [ ] Test with React DevTools Profiler

---

## MONITORING SETUP

### Add Monitoring Hooks (Post-Fix)
- [ ] Track auto-save success/failure
  ```jsx
  monitoringService.trackMetric('storage.autoSave.success', 1);
  ```

- [ ] Track session recovery rate
  ```jsx
  monitoringService.trackMetric('storage.sessionRecovery.success', 1);
  ```

- [ ] Track data loss prevented
  ```jsx
  monitoringService.trackMetric('user.dataLoss.prevented', 1);
  ```

- [ ] Track AI cache hit rate
  ```jsx
  monitoringService.trackMetric('ai.cacheHit', 1, { savings: 0.30 });
  ```

---

## DEPLOYMENT CHECKLIST

### Before Beta Release:
- [ ] All Phase 1 tasks complete
- [ ] All Phase 2 tasks complete
- [ ] Test coverage > 80%
- [ ] Manual testing complete
- [ ] Code review approved
- [ ] Monitoring setup complete
- [ ] User communication plan ready
- [ ] Rollback plan documented

### Beta Release:
- [ ] Limited release (50-100 users)
- [ ] Monitor metrics closely
- [ ] Gather feedback
- [ ] Fix critical issues within 24 hours

### Full Release:
- [ ] All Phase 3 tasks complete
- [ ] Beta feedback incorporated
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete

---

## QUICK REFERENCE

### Key Files to Modify:
1. `/src/index.js` - Add context providers
2. `/src/components/App.jsx` - Integrate storage, contexts
3. `/src/components/ReportGeneratorApp.jsx` - Secure API keys, fix races
4. `/src/hooks/useAiAnalysis.js` - Fix race condition
5. `/src/context/` - New context files

### Key Services to Use:
- `storageManager` - Main storage orchestrator
- `storageManager.registerAutoSave()` - Auto-save registration
- `storageManager.getPreferences()` - Get user prefs
- `storageManager.updatePreference()` - Update prefs

### Testing Commands:
```bash
npm test                     # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
npm run lint                # Lint check
```

### Debugging:
```javascript
// Check auto-save state
const state = storage.getAutoSaveState('currentInputData');
console.log(state); // { status: 'saved', lastSaved: Date, isDirty: false }

// Check storage stats
const stats = await storage.getStorageStats();
console.log(stats); // { indexedDB: {...}, localStorage: {...} }

// Check IndexedDB
// Open DevTools → Application → IndexedDB → enterpriseCashFlow_db
```

---

**Start Date:** TBD
**Target Completion:** Phase 1 (2 weeks) + Phase 2 (2 weeks) = 4 weeks minimum
**Full Completion:** 6-8 weeks with testing and Phase 3
