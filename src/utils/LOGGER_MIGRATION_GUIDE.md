# Logger Migration Guide

## Overview

This guide helps you migrate from `console` statements to the structured `Logger` utility for production-grade logging.

## Why Migrate?

**Security & Performance Issues with console:**
- **Production leakage**: Console statements expose sensitive data in production
- **Performance impact**: Console operations are synchronous and block the main thread
- **No filtering**: Cannot disable debug logs in production
- **No monitoring**: No integration with error tracking (Sentry)
- **Debugging noise**: Makes production debugging difficult

**Benefits of Logger:**
- ✅ **Environment-aware**: Automatically filters logs based on environment
- ✅ **Structured logging**: JSON format for production log aggregation
- ✅ **Sentry integration**: Automatic error reporting
- ✅ **Performance tracking**: Built-in timing utilities
- ✅ **Zero production noise**: No debug/info logs in production
- ✅ **Context preservation**: Metadata attached to every log

## Quick Start

### 1. Import Logger

```javascript
import Logger from './utils/Logger'; // Adjust path as needed
```

### 2. Replace console statements

| Before | After | When to Use |
|--------|-------|-------------|
| `console.log('message')` | `Logger.debug('message')` | Development debugging, trace information |
| `console.log('info')` | `Logger.info('info')` | Important informational messages |
| `console.warn('warning')` | `Logger.warn('warning')` | Warnings, deprecated features |
| `console.error('error', err)` | `Logger.error('error', err)` | Errors, exceptions |

## API Reference

### Basic Logging

```javascript
// Debug (development only)
Logger.debug('Processing user data', { userId: '123', step: 'validation' });

// Info (development & staging)
Logger.info('Operation completed successfully', { duration: 1500 });

// Warn (all environments)
Logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });

// Error (all environments + Sentry)
Logger.error('Failed to save data', error, {
  component: 'DataService',
  operation: 'save',
  userId: '123'
});
```

### Performance Timing

```javascript
// Start timer
Logger.time('database-query');

// ... perform operation ...

// End timer (logs as debug if fast, warn if slow >1000ms)
Logger.timeEnd('database-query', { query: 'SELECT * FROM users' });
```

### Sentry Integration

```javascript
// Add breadcrumb for debugging
Logger.addBreadcrumb('User clicked submit button', {
  buttonId: 'submit-form',
  formValid: true
});

// Set user context
Logger.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Clear user context (e.g., on logout)
Logger.clearUser();
```

### Configuration

```javascript
// Configure minimum log level
Logger.configure({ minLevel: 'warn' });

// Get logger status
const status = Logger.getStatus();
console.log(status);
// {
//   environment: 'production',
//   minLevel: 'warn',
//   isDevelopment: false,
//   isProduction: true,
//   isTest: false,
//   activeTimers: []
// }
```

## Migration Examples

### Example 1: Simple console.log

**Before:**
```javascript
console.log('User authenticated:', userId);
```

**After:**
```javascript
Logger.info('User authenticated', { userId });
```

### Example 2: Error handling

**Before:**
```javascript
try {
  await saveData(data);
} catch (error) {
  console.error('Save failed:', error);
  console.error('Error details:', error.message);
}
```

**After:**
```javascript
try {
  await saveData(data);
} catch (error) {
  Logger.error('Save operation failed', error, {
    component: 'DataService',
    operation: 'save',
    dataSize: data.length
  });
}
```

### Example 3: API calls

**Before:**
```javascript
console.log('Calling API:', endpoint);
const response = await fetch(endpoint);
console.log('API response:', response.status);
if (!response.ok) {
  console.error('API error:', await response.text());
}
```

**After:**
```javascript
Logger.debug('Calling API', { endpoint });
const response = await fetch(endpoint);
Logger.debug('API response received', {
  endpoint,
  status: response.status,
  statusText: response.statusText
});

if (!response.ok) {
  const errorText = await response.text();
  Logger.error('API request failed', new Error(errorText), {
    endpoint,
    status: response.status,
    component: 'APIService'
  });
}
```

### Example 4: Performance monitoring

**Before:**
```javascript
const startTime = Date.now();
await heavyOperation();
const duration = Date.now() - startTime;
console.log(`Operation took ${duration}ms`);
if (duration > 1000) {
  console.warn('Slow operation detected');
}
```

**After:**
```javascript
Logger.time('heavy-operation');
await heavyOperation();
Logger.timeEnd('heavy-operation', {
  component: 'DataProcessor',
  recordCount: records.length
});
// Automatically warns if >1000ms
```

### Example 5: Conditional logging

**Before:**
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

**After:**
```javascript
// Logger handles environment filtering automatically
Logger.debug('Debug information', { debugData });
```

## Environment Behavior

### Development
- ✅ All log levels output to console
- ✅ Human-readable format
- ✅ Full stack traces
- ❌ No Sentry (optional)

### Production
- ❌ `debug` - Not logged
- ❌ `info` - Not logged
- ✅ `warn` - Sent to Sentry
- ✅ `error` - Console + Sentry
- ✅ JSON format for log aggregation

### Test
- ❌ `debug` - Not logged
- ❌ `info` - Not logged
- ❌ `warn` - Not logged
- ✅ `error` - Logged only

## Best Practices

### 1. Use appropriate log levels

```javascript
// ✅ Good
Logger.debug('Cache hit', { key, value });
Logger.info('User login successful', { userId, timestamp });
Logger.warn('Deprecation warning', { feature, replacement });
Logger.error('Database connection failed', error, { host, port });

// ❌ Bad
Logger.error('User clicked button'); // Not an error
Logger.debug('Critical payment failed'); // Should be error
```

### 2. Add contextual metadata

```javascript
// ✅ Good - rich context
Logger.error('Payment processing failed', error, {
  component: 'PaymentService',
  operation: 'processPayment',
  userId: user.id,
  amount: payment.amount,
  currency: payment.currency,
  transactionId: transaction.id
});

// ❌ Bad - no context
Logger.error('Payment failed', error);
```

### 3. Don't log sensitive data

```javascript
// ❌ Bad - exposes sensitive data
Logger.info('User authenticated', {
  username: user.username,
  password: user.password, // NEVER log passwords
  creditCard: user.creditCard // NEVER log PII
});

// ✅ Good - safe logging
Logger.info('User authenticated', {
  userId: user.id,
  username: user.username,
  authMethod: 'password'
});
```

### 4. Use performance timing for slow operations

```javascript
// ✅ Good
Logger.time('database-migration');
await runMigration();
Logger.timeEnd('database-migration', { tables: tableCount });

// ❌ Bad - manual timing
const start = Date.now();
await runMigration();
console.log(`Took ${Date.now() - start}ms`);
```

## Automated Migration

You can use find-and-replace to speed up migration:

### VSCode (Regex find/replace)

1. **Find:** `console\.log\((.*?)\)`
   **Replace:** `Logger.debug($1)`

2. **Find:** `console\.warn\((.*?)\)`
   **Replace:** `Logger.warn($1)`

3. **Find:** `console\.error\((.*?), ?(.*?)\)`
   **Replace:** `Logger.error($1, $2)`

### Command Line (sed)

```bash
# Replace console.log with Logger.debug
find src -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.log(/Logger.debug(/g'

# Replace console.warn with Logger.warn
find src -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.warn(/Logger.warn(/g'

# Replace console.error with Logger.error
find src -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.error(/Logger.error(/g'
```

### Add Logger import to files

```bash
# Add import statement after existing imports
find src -name "*.js" -o -name "*.jsx" | xargs grep -l "Logger\." | while read file; do
  if ! grep -q "import Logger" "$file"; then
    # Add import after first import block
    sed -i '' '/^import .* from/a\
import Logger from '"'"'./utils/Logger'"'"';
' "$file"
  fi
done
```

## Testing with Logger

Logger automatically silences logs in test environment (except errors):

```javascript
// In tests
describe('MyComponent', () => {
  it('should handle errors', () => {
    // Logger.debug and Logger.info won't output
    // Logger.error will still output for debugging test failures

    const component = new MyComponent();
    expect(() => component.riskyOperation()).toThrow();
  });
});
```

## Troubleshooting

### Issue: "Logger is not defined"

**Solution:** Add import statement:
```javascript
import Logger from './utils/Logger';
```

### Issue: Logs not appearing in development

**Solution:** Check log level configuration:
```javascript
Logger.configure({ minLevel: 'debug' });
```

### Issue: Too many logs in console

**Solution:** Increase minimum log level:
```javascript
Logger.configure({ minLevel: 'info' }); // or 'warn'
```

### Issue: Errors not going to Sentry

**Solution:** Ensure Sentry is initialized in your app:
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Current Migration Status

**Console statements found:** 211
**Files affected:** 59

**Top files needing migration:**
1. `src/utils/aiProviders.js` - 40 statements
2. `src/hooks/useGeminiApi.js` - 16 statements
3. `src/hooks/useAiService.js` - 11 statements
4. `src/context/StorageContext.jsx` - 10 statements
5. `src/services/monitoring/*` - 8 statements

## Next Steps

1. ✅ Logger utility created and tested (35/35 tests passing)
2. ✅ ESLint configured to warn on console usage
3. ⏳ Migrate console statements file-by-file
4. ⏳ Run tests after each file migration
5. ⏳ Verify no console statements remain: `grep -r "console\." src/`

## Support

For questions or issues with the Logger utility:
- Review tests: `/Users/rodrigo/claude-projects/EnterpriseCashFlow/src/utils/__tests__/Logger.test.js`
- Check implementation: `/Users/rodrigo/claude-projects/EnterpriseCashFlow/src/utils/Logger.js`
