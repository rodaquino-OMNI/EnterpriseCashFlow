module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/setup/accessibilityUtils\\.js$',
    '/src/__tests__/setup/customMatchers\\.js$',
    '/__tests__/utils/(?!.*\\.test\\.)',
    '/__tests__/factories/(?!.*\\.test\\.)',
    '/test-utils/'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
    '!src/serviceWorker.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/calculations.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/utils/financialValidators.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  testTimeout: 30000, // Increased from 10s to 30s for worker tests and integration tests
  globals: {
    'process.env': {
      NODE_ENV: 'test',
    },
  },
};