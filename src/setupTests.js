/**
 * Jest Setup File
 * Configures the test environment with necessary polyfills and global utilities
 */

import '@testing-library/jest-dom';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { TextEncoder, TextDecoder } from 'util';

// Import custom financial matchers
import './__tests__/utils/customMatchers';

// Polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure axe for accessibility testing
const axe = configureAxe({
  rules: {
    // Disable color-contrast rule for testing
    'color-contrast': { enabled: false }
  }
});

// Make axe available globally for tests
global.axe = axe;

// Extend Jest matchers with jest-axe
expect.extend({ toHaveNoViolations });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock crypto for tests
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async () => new ArrayBuffer(32),
    },
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = class FileReader {
  readAsArrayBuffer() {
    this.onload({ target: { result: new ArrayBuffer(8) } });
  }
  readAsText() {
    this.onload({ target: { result: 'file content' } });
  }
  readAsDataURL() {
    this.onload({ target: { result: 'data:text/plain;base64,ZmlsZSBjb250ZW50' } });
  }
};

// Mock Worker
global.Worker = class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = null;
  }
  postMessage(msg) {
    // Simulate worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { result: 'processed', input: msg } });
      }
    }, 0);
  }
  terminate() {}
};

// Mock performance.now if not available
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
  };
}

// Global test utilities
global.waitForAsync = (fn, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkCondition = async () => {
      try {
        const result = await fn();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Async condition timeout'));
        } else {
          setTimeout(checkCondition, 100);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    checkCondition();
  });
};

// Mock Recharts to prevent rendering issues in tests
jest.mock('recharts', () => {
  const originalModule = jest.requireActual('recharts');
  
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Increase timeout for integration tests
jest.setTimeout(10000);