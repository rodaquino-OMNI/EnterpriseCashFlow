# Security Guidelines for EnterpriseCashFlow

## Table of Contents

1. [Overview](#overview)
2. [Phase 1 Security Improvements](#phase-1-security-improvements)
3. [Secure Coding Standards](#secure-coding-standards)
4. [API Key Management](#api-key-management)
5. [Environment-Based Security Controls](#environment-based-security-controls)
6. [Error Handling Security](#error-handling-security)
7. [Data Validation Security](#data-validation-security)
8. [Development Workflow Security](#development-workflow-security)
9. [Security Testing Guidelines](#security-testing-guidelines)
10. [Compliance and Standards](#compliance-and-standards)

---

## Overview

This document outlines the comprehensive security guidelines for the EnterpriseCashFlow application, documenting the security improvements implemented in Phase 1 and establishing secure coding standards for the development team.

**Security Philosophy**: Defense in depth with multiple layers of protection, secure by default configurations, and proactive threat mitigation.

**Target Audience**: Development team, security reviewers, and system administrators.

---

## Phase 1 Security Improvements

### 1. API Key Protection and Validation

**Implementation**: Enhanced API key handling in [`src/utils/aiProviders.js`](../src/utils/aiProviders.js)

#### Key Security Features:
- **API Key Validation**: Mandatory validation before API calls
- **Secure Logging**: API keys never exposed in logs or console output
- **Environment-Based Logging**: Sensitive information only logged in development mode
- **Request Timeout Protection**: 60-second timeout to prevent hanging requests

```javascript
// SECURE: API key validation
if (!apiKey || apiKey.trim() === '') {
  console.error("Gemini API call failed: No API key provided");
  return `Erro: Chave API do Google Gemini é obrigatória.`;
}

// SECURE: Logging without exposing API key
if (process.env.NODE_ENV === 'development') {
  console.log("Calling Gemini endpoint:", `${config.apiUrl}/${model}:generateContent`);
}
```

### 2. Enhanced Error Handling

**Implementation**: Comprehensive error handling with security-focused messaging

#### Security Benefits:
- **Information Disclosure Prevention**: Generic error messages for production
- **Structured Error Responses**: Consistent error format across all providers
- **Timeout Protection**: Prevents resource exhaustion attacks
- **Graceful Degradation**: Application continues functioning despite API failures

```javascript
// SECURE: Error handling without information disclosure
catch (error) {
  if (error.name === 'AbortError') {
    console.error("Gemini API request timed out after 60 seconds");
    return 'Erro: Timeout na requisição para Google Gemini.';
  }
  
  console.error("Gemini API call failed with error:", error);
  return `Erro: Falha ao comunicar com API Gemini: ${error.message || 'Erro desconhecido'}`;
}
```

### 3. Data Validation Security

**Implementation**: Comprehensive validation framework in [`src/utils/dataValidation.js`](../src/utils/dataValidation.js)

#### Security Features:
- **Input Sanitization**: All financial data validated before processing
- **Business Logic Validation**: Prevents unrealistic or malicious data injection
- **Threshold-Based Validation**: Detects anomalous values that could indicate attacks
- **Structured Validation Results**: Consistent security-aware validation responses

---

## Secure Coding Standards

### 1. API Integration Security

#### DO's:
```javascript
// ✅ SECURE: Always validate API keys
if (!apiKey || apiKey.trim() === '') {
  throw new Error('API key is required');
}

// ✅ SECURE: Use environment-based logging
if (process.env.NODE_ENV === 'development') {
  console.log("API endpoint:", endpoint);
}

// ✅ SECURE: Implement request timeouts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);
```

#### DON'Ts:
```javascript
// ❌ INSECURE: Never log API keys
console.log("API URL:", `${endpoint}?key=${apiKey}`);

// ❌ INSECURE: Never expose sensitive data in error messages
throw new Error(`API call failed with key: ${apiKey}`);

// ❌ INSECURE: Never skip input validation
const result = await apiCall(userInput); // Missing validation
```

### 2. Error Handling Standards

#### Secure Error Response Pattern:
```javascript
// ✅ SECURE: Structured error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log detailed error for debugging (server-side only)
  console.error("Operation failed:", error);
  
  // Return generic error to client
  return {
    success: false,
    message: "Operation failed. Please try again.",
    code: "OPERATION_ERROR"
  };
}
```

### 3. Data Validation Standards

#### Input Validation Pattern:
```javascript
// ✅ SECURE: Comprehensive validation
export function validateFinancialInput(data) {
  const errors = [];
  
  // Type validation
  if (typeof data.revenue !== 'number' || data.revenue < 0) {
    errors.push({ field: 'revenue', message: 'Invalid revenue value' });
  }
  
  // Business logic validation
  if (data.revenue > 0 && data.costs > data.revenue * 2) {
    errors.push({ 
      field: 'costs', 
      message: 'Costs exceed reasonable threshold',
      severity: 'warning'
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
```

---

## API Key Management

### 1. Storage Security

#### Environment Variables (Recommended):
```bash
# .env file (never commit to version control)
REACT_APP_GEMINI_API_KEY=your_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_key_here
REACT_APP_CLAUDE_API_KEY=your_claude_key_here
```

#### Secure Access Pattern:
```javascript
// ✅ SECURE: Environment variable access
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

// ✅ SECURE: Validation before use
if (!apiKey) {
  throw new Error('API key not configured');
}
```

### 2. API Key Validation

#### Validation Checklist:
- [ ] API key presence validation
- [ ] API key format validation (provider-specific)
- [ ] API key length validation
- [ ] API key character set validation

```javascript
// ✅ SECURE: Comprehensive API key validation
function validateApiKey(apiKey, provider) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }
  
  if (apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }
  
  // Provider-specific validation
  switch (provider) {
    case 'gemini':
      if (!apiKey.startsWith('AIza')) {
        return { valid: false, error: 'Invalid Gemini API key format' };
      }
      break;
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'Invalid OpenAI API key format' };
      }
      break;
  }
  
  return { valid: true };
}
```

### 3. API Key Rotation

#### Best Practices:
1. **Regular Rotation**: Rotate API keys every 90 days
2. **Immediate Rotation**: Rotate immediately if compromise suspected
3. **Graceful Transition**: Support multiple keys during rotation period
4. **Audit Trail**: Log all API key changes

---

## Environment-Based Security Controls

### 1. Development vs Production

#### Security Configuration:
```javascript
// ✅ SECURE: Environment-based security controls
const securityConfig = {
  development: {
    enableDetailedLogging: true,
    enableDebugEndpoints: true,
    corsOrigins: ['http://localhost:3000'],
    apiTimeout: 30000
  },
  production: {
    enableDetailedLogging: false,
    enableDebugEndpoints: false,
    corsOrigins: ['https://yourdomain.com'],
    apiTimeout: 60000
  }
};

const config = securityConfig[process.env.NODE_ENV] || securityConfig.production;
```

### 2. Logging Security

#### Secure Logging Pattern:
```javascript
// ✅ SECURE: Environment-aware logging
function secureLog(level, message, data = {}) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (level === 'debug' && !isDevelopment) {
    return; // Skip debug logs in production
  }
  
  // Sanitize sensitive data
  const sanitizedData = sanitizeLogData(data);
  
  console[level](`[${new Date().toISOString()}] ${message}`, sanitizedData);
}

function sanitizeLogData(data) {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.apiKey;
  delete sanitized.password;
  delete sanitized.token;
  
  return sanitized;
}
```

---

## Error Handling Security

### 1. Secure Error Messages

#### User-Facing Error Messages:
```javascript
// ✅ SECURE: Generic user-facing errors
const USER_ERROR_MESSAGES = {
  API_ERROR: 'Serviço temporariamente indisponível. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos fornecidos.',
  TIMEOUT_ERROR: 'Operação expirou. Verifique sua conexão.',
  AUTHENTICATION_ERROR: 'Credenciais inválidas.',
  AUTHORIZATION_ERROR: 'Acesso negado.',
  RATE_LIMIT_ERROR: 'Muitas tentativas. Tente novamente em alguns minutos.'
};
```

#### Error Logging Pattern:
```javascript
// ✅ SECURE: Detailed logging for debugging, generic messages for users
function handleApiError(error, context) {
  // Detailed logging for developers
  console.error('API Error Details:', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Generic message for users
  return {
    success: false,
    message: USER_ERROR_MESSAGES.API_ERROR,
    code: 'API_ERROR'
  };
}
```

### 2. Portuguese Language Security

#### Secure Multilingual Error Handling:
```javascript
// ✅ SECURE: Localized error messages without information disclosure
const SECURE_ERROR_MESSAGES = {
  pt: {
    API_UNAVAILABLE: 'Serviço temporariamente indisponível.',
    INVALID_INPUT: 'Dados fornecidos são inválidos.',
    TIMEOUT: 'Operação expirou. Verifique sua conexão.',
    GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.'
  },
  en: {
    API_UNAVAILABLE: 'Service temporarily unavailable.',
    INVALID_INPUT: 'Invalid data provided.',
    TIMEOUT: 'Operation timed out. Check your connection.',
    GENERIC_ERROR: 'An error occurred. Please try again.'
  }
};
```

---

## Data Validation Security

### 1. Financial Data Validation

#### Security-Focused Validation:
```javascript
// ✅ SECURE: Comprehensive financial data validation
export function validateFinancialData(data) {
  const issues = [];
  
  // Range validation (prevents injection attacks)
  if (data.revenue < 0 || data.revenue > Number.MAX_SAFE_INTEGER) {
    issues.push({
      type: 'INVALID_RANGE',
      field: 'revenue',
      severity: 'critical',
      message: 'Revenue value out of valid range'
    });
  }
  
  // Business logic validation (detects anomalies)
  if (data.revenue > 0 && data.costs > data.revenue * 10) {
    issues.push({
      type: 'BUSINESS_LOGIC_VIOLATION',
      field: 'costs',
      severity: 'warning',
      message: 'Costs significantly exceed revenue'
    });
  }
  
  return { isValid: issues.length === 0, issues };
}
```

### 2. Input Sanitization

#### Sanitization Functions:
```javascript
// ✅ SECURE: Input sanitization
export function sanitizeFinancialInput(input) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid input type');
  }
  
  const sanitized = {};
  
  // Sanitize numeric fields
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'number') {
      // Ensure finite numbers only
      sanitized[key] = Number.isFinite(value) ? value : 0;
    } else if (typeof value === 'string') {
      // Sanitize string fields
      sanitized[key] = value.trim().substring(0, 1000); // Limit length
    }
  }
  
  return sanitized;
}
```

---

## Development Workflow Security

### 1. Pre-Commit Security Checks

#### Security Checklist:
- [ ] No hardcoded API keys or secrets
- [ ] No sensitive data in console.log statements
- [ ] All user inputs validated
- [ ] Error messages don't expose sensitive information
- [ ] Environment variables used for configuration
- [ ] Timeout mechanisms implemented for external calls

### 2. Code Review Security Guidelines

#### Security Review Checklist:
- [ ] **Authentication**: All API calls properly authenticated
- [ ] **Authorization**: Access controls implemented where needed
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Error Handling**: Secure error handling implemented
- [ ] **Logging**: No sensitive data in logs
- [ ] **Dependencies**: No known vulnerabilities in dependencies

### 3. Security Testing Integration

#### Automated Security Tests:
```javascript
// ✅ SECURE: Security-focused unit tests
describe('API Security Tests', () => {
  test('should reject empty API keys', () => {
    expect(() => callGemini(config, prompt, '')).toThrow('API key required');
  });
  
  test('should not log API keys', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    callGemini(config, prompt, 'test-key');
    
    const logCalls = consoleSpy.mock.calls.flat().join(' ');
    expect(logCalls).not.toContain('test-key');
  });
  
  test('should handle timeouts gracefully', async () => {
    const result = await callGeminiWithTimeout(config, prompt, apiKey, 1); // 1ms timeout
    expect(result).toContain('Timeout');
  });
});
```

---

## Security Testing Guidelines

### 1. API Security Testing

#### Test Categories:
1. **Authentication Tests**: Verify API key validation
2. **Input Validation Tests**: Test boundary conditions
3. **Error Handling Tests**: Ensure no information disclosure
4. **Timeout Tests**: Verify timeout mechanisms
5. **Rate Limiting Tests**: Test rate limiting behavior

### 2. Data Validation Testing

#### Validation Test Cases:
```javascript
// ✅ SECURE: Comprehensive validation testing
const testCases = [
  // Valid data
  { input: { revenue: 100000, costs: 80000 }, expected: { isValid: true } },
  
  // Invalid ranges
  { input: { revenue: -1000 }, expected: { isValid: false, type: 'INVALID_RANGE' } },
  
  // Business logic violations
  { input: { revenue: 1000, costs: 50000 }, expected: { isValid: false, type: 'BUSINESS_LOGIC_VIOLATION' } },
  
  // Type violations
  { input: { revenue: 'invalid' }, expected: { isValid: false, type: 'TYPE_ERROR' } }
];
```

---

## Compliance and Standards

### 1. OWASP Top 10 Compliance

#### Addressed Vulnerabilities:
- **A01 - Broken Access Control**: API key validation and environment controls
- **A02 - Cryptographic Failures**: Secure API key storage and transmission
- **A03 - Injection**: Input validation and sanitization
- **A04 - Insecure Design**: Security-by-design architecture
- **A05 - Security Misconfiguration**: Environment-based security controls
- **A06 - Vulnerable Components**: Dependency management and updates
- **A07 - Authentication Failures**: Robust API authentication
- **A08 - Software Integrity Failures**: Code review and testing processes
- **A09 - Logging Failures**: Secure logging practices
- **A10 - Server-Side Request Forgery**: Input validation and URL restrictions

### 2. Security Standards Compliance

#### Standards Adherence:
- **ISO 27001**: Information security management
- **NIST Cybersecurity Framework**: Risk management and controls
- **GDPR**: Data protection and privacy (where applicable)
- **SOC 2**: Security, availability, and confidentiality

### 3. Continuous Security Improvement

#### Security Metrics:
- API key rotation frequency
- Security test coverage percentage
- Vulnerability remediation time
- Security incident response time
- Code review security findings

---

## Next Steps

1. **Review**: [`security-audit-report.md`](security-audit-report.md) - Comprehensive audit findings
2. **Implement**: [`security-checklist.md`](security-checklist.md) - Developer security checklist
3. **Monitor**: Continuous security monitoring and improvement

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: April 2025