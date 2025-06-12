/**
 * Security monitoring service
 * Monitors and enforces security policies, tracks security events
 */

import { v4 as uuidv4 } from 'uuid';

export class SecurityMonitor {
  constructor() {
    this.initialized = false;
    this.securityEvents = [];
    this.policies = new Map();
    this.blockedIPs = new Set();
    this.rateLimits = new Map();
    this.suspiciousPatterns = [];
  }

  /**
   * Initialize security monitoring
   * @param {Object} config - Security configuration
   */
  async initialize(config = {}) {
    const {
      enableRateLimiting = true,
      enableIPBlocking = true,
      suspiciousPatternDetection = true,
      policies = {},
    } = config;

    this.config = {
      enableRateLimiting,
      enableIPBlocking,
      suspiciousPatternDetection,
      ...config,
    };

    // Initialize default security policies
    this.initializeDefaultPolicies();

    // Load custom policies
    Object.entries(policies).forEach(([name, policy]) => {
      this.addPolicy(name, policy);
    });

    // Initialize suspicious patterns
    if (suspiciousPatternDetection) {
      this.initializeSuspiciousPatterns();
    }

    this.initialized = true;
  }

  /**
   * Initialize default security policies
   */
  initializeDefaultPolicies() {
    // Rate limiting policies
    this.addPolicy('api_rate_limit', {
      type: 'rate_limit',
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      blockDurationMs: 300000, // 5 minutes
    });

    this.addPolicy('auth_rate_limit', {
      type: 'rate_limit',
      maxRequests: 5,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 900000, // 15 minutes
    });

    // Data access policies
    this.addPolicy('export_limit', {
      type: 'data_access',
      maxExportsPerDay: 50,
      maxRecordsPerExport: 10000,
    });

    // Session policies
    this.addPolicy('session_timeout', {
      type: 'session',
      timeoutMs: 1800000, // 30 minutes
      warningMs: 300000, // 5 minutes before timeout
    });

    // Password policies
    this.addPolicy('password_policy', {
      type: 'password',
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
    });
  }

  /**
   * Initialize suspicious patterns for detection
   */
  initializeSuspiciousPatterns() {
    this.suspiciousPatterns = [
      // SQL injection patterns
      {
        name: 'sql_injection',
        patterns: [
          /(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|where|table)\b)/i,
          /(\'|\")\s*or\s*(\d+\s*=\s*\d+|\'[^\']*\'\s*=\s*\'[^\']*\')/i,
          /(\b(exec|execute)\s*\()/i,
        ],
        severity: 'high',
      },
      // XSS patterns
      {
        name: 'xss_attempt',
        patterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript\s*:/gi,
          /on\w+\s*=\s*["'][^"']*["']/gi,
        ],
        severity: 'high',
      },
      // Path traversal patterns
      {
        name: 'path_traversal',
        patterns: [
          /(\.\.[\/\\]){2,}/,
          /\.\.[\/\\]etc[\/\\]passwd/,
        ],
        severity: 'high',
      },
      // Suspicious financial patterns
      {
        name: 'unusual_amount',
        patterns: [
          /amount["\s:=]+[1-9]\d{7,}/i, // Amounts over 10 million
        ],
        severity: 'medium',
      },
    ];
  }

  /**
   * Add a security policy
   * @param {string} name - Policy name
   * @param {Object} policy - Policy configuration
   */
  addPolicy(name, policy) {
    this.policies.set(name, {
      ...policy,
      name,
      enabled: policy.enabled !== false,
    });
  }

  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   */
  logEvent(eventType, details) {
    const event = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      details: this.sanitizeEventDetails(details),
      severity: this.determineSeverity(eventType, details),
    };

    this.securityEvents.push(event);

    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }

    // Handle high severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      this.handleHighSeverityEvent(event);
    }

    // Check for suspicious patterns
    if (this.config.suspiciousPatternDetection) {
      this.checkSuspiciousPatterns(details);
    }

    return event;
  }

  /**
   * Check security policy
   * @param {string} userId - User ID
   * @param {string} action - Action to check
   * @param {Object} context - Additional context
   * @returns {Object} Policy check result
   */
  checkPolicy(userId, action, context = {}) {
    const result = {
      allowed: true,
      reason: null,
      recommendations: [],
    };

    // Check rate limiting
    if (this.config.enableRateLimiting) {
      const rateLimitResult = this.checkRateLimit(userId, action);
      if (!rateLimitResult.allowed) {
        result.allowed = false;
        result.reason = rateLimitResult.reason;
        return result;
      }
    }

    // Check IP blocking
    if (this.config.enableIPBlocking && context.ip) {
      if (this.blockedIPs.has(context.ip)) {
        result.allowed = false;
        result.reason = 'IP address is blocked';
        return result;
      }
    }

    // Check specific policies
    const applicablePolicies = this.findApplicablePolicies(action);
    for (const policy of applicablePolicies) {
      const policyResult = this.evaluatePolicy(policy, userId, action, context);
      if (!policyResult.allowed) {
        result.allowed = false;
        result.reason = policyResult.reason;
        result.recommendations = policyResult.recommendations || [];
        break;
      }
    }

    // Log the policy check
    this.logEvent('policy_check', {
      userId,
      action,
      result,
      context,
    });

    return result;
  }

  /**
   * Check rate limit for a user/action
   * @param {string} userId - User ID
   * @param {string} action - Action being performed
   * @returns {Object} Rate limit result
   */
  checkRateLimit(userId, action) {
    const key = `${userId}:${action}`;
    const policy = this.policies.get('api_rate_limit');
    
    if (!policy || !policy.enabled) {
      return { allowed: true };
    }

    const now = Date.now();
    let userLimits = this.rateLimits.get(key);
    
    if (!userLimits) {
      userLimits = {
        requests: [],
        blocked: false,
        blockUntil: 0,
      };
      this.rateLimits.set(key, userLimits);
    }

    // Check if currently blocked
    if (userLimits.blocked && now < userLimits.blockUntil) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Blocked until ${new Date(userLimits.blockUntil).toISOString()}`,
      };
    }

    // Remove old requests outside the window
    const windowStart = now - policy.windowMs;
    userLimits.requests = userLimits.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (userLimits.requests.length >= policy.maxRequests) {
      userLimits.blocked = true;
      userLimits.blockUntil = now + policy.blockDurationMs;
      
      this.logEvent('rate_limit_exceeded', {
        userId,
        action,
        requests: userLimits.requests.length,
        limit: policy.maxRequests,
      });

      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${policy.maxRequests} requests per ${policy.windowMs / 1000} seconds`,
      };
    }

    // Add current request
    userLimits.requests.push(now);
    
    return { allowed: true };
  }

  /**
   * Check for suspicious patterns in input
   * @param {Object} data - Data to check
   */
  checkSuspiciousPatterns(data) {
    const stringData = JSON.stringify(data);
    
    this.suspiciousPatterns.forEach(patternDef => {
      patternDef.patterns.forEach(pattern => {
        if (pattern.test(stringData)) {
          this.logEvent('suspicious_pattern_detected', {
            pattern: patternDef.name,
            severity: patternDef.severity,
            data: stringData.substring(0, 200), // Truncate for security
          });
        }
      });
    });
  }

  /**
   * Block an IP address
   * @param {string} ip - IP address to block
   * @param {string} reason - Reason for blocking
   * @param {number} durationMs - Block duration in milliseconds
   */
  blockIP(ip, reason, durationMs = 3600000) {
    this.blockedIPs.add(ip);
    
    this.logEvent('ip_blocked', {
      ip,
      reason,
      durationMs,
      until: new Date(Date.now() + durationMs).toISOString(),
    });

    // Auto-unblock after duration
    setTimeout(() => {
      this.unblockIP(ip);
    }, durationMs);
  }

  /**
   * Unblock an IP address
   * @param {string} ip - IP address to unblock
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    
    this.logEvent('ip_unblocked', {
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Find applicable policies for an action
   * @param {string} action - Action to check
   * @returns {Array} Applicable policies
   */
  findApplicablePolicies(action) {
    const applicable = [];
    
    this.policies.forEach(policy => {
      if (policy.enabled && this.isPolicyApplicable(policy, action)) {
        applicable.push(policy);
      }
    });

    return applicable;
  }

  /**
   * Check if a policy is applicable to an action
   * @param {Object} policy - Policy to check
   * @param {string} action - Action being performed
   * @returns {boolean} Whether policy applies
   */
  isPolicyApplicable(policy, action) {
    // Implement policy matching logic
    if (policy.actions && Array.isArray(policy.actions)) {
      return policy.actions.includes(action);
    }
    
    if (policy.actionPattern) {
      return new RegExp(policy.actionPattern).test(action);
    }

    return true; // Default to applicable
  }

  /**
   * Evaluate a specific policy
   * @param {Object} policy - Policy to evaluate
   * @param {string} userId - User ID
   * @param {string} action - Action being performed
   * @param {Object} context - Additional context
   * @returns {Object} Policy evaluation result
   */
  evaluatePolicy(policy, userId, action, context) {
    // This would be extended based on policy type
    switch (policy.type) {
      case 'data_access':
        return this.evaluateDataAccessPolicy(policy, userId, action, context);
      case 'session':
        return this.evaluateSessionPolicy(policy, userId, context);
      case 'password':
        return this.evaluatePasswordPolicy(policy, context);
      default:
        return { allowed: true };
    }
  }

  /**
   * Evaluate data access policy
   * @param {Object} policy - Policy configuration
   * @param {string} userId - User ID
   * @param {string} action - Action being performed
   * @param {Object} context - Additional context
   * @returns {Object} Evaluation result
   */
  evaluateDataAccessPolicy(policy, userId, action, context) {
    // Implement data access policy evaluation
    if (action === 'export' && context.recordCount > policy.maxRecordsPerExport) {
      return {
        allowed: false,
        reason: `Export exceeds maximum allowed records (${policy.maxRecordsPerExport})`,
        recommendations: ['Consider filtering data or splitting into multiple exports'],
      };
    }

    return { allowed: true };
  }

  /**
   * Evaluate session policy
   * @param {Object} policy - Policy configuration
   * @param {string} userId - User ID
   * @param {Object} context - Additional context
   * @returns {Object} Evaluation result
   */
  evaluateSessionPolicy(policy, userId, context) {
    if (!context.sessionStart) return { allowed: true };

    const sessionAge = Date.now() - context.sessionStart;
    if (sessionAge > policy.timeoutMs) {
      return {
        allowed: false,
        reason: 'Session has expired',
        recommendations: ['Please log in again'],
      };
    }

    return { allowed: true };
  }

  /**
   * Evaluate password policy
   * @param {Object} policy - Policy configuration
   * @param {Object} context - Additional context
   * @returns {Object} Evaluation result
   */
  evaluatePasswordPolicy(policy, context) {
    if (!context.password) return { allowed: true };

    const password = context.password;
    const violations = [];

    if (password.length < policy.minLength) {
      violations.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('Password must contain uppercase letters');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('Password must contain lowercase letters');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      violations.push('Password must contain numbers');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      violations.push('Password must contain special characters');
    }

    if (violations.length > 0) {
      return {
        allowed: false,
        reason: 'Password does not meet security requirements',
        recommendations: violations,
      };
    }

    return { allowed: true };
  }

  /**
   * Determine event severity
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   * @returns {string} Severity level
   */
  determineSeverity(eventType, details) {
    const criticalEvents = ['suspicious_pattern_detected', 'multiple_failed_auth', 'data_breach_attempt'];
    const highEvents = ['rate_limit_exceeded', 'ip_blocked', 'unauthorized_access'];
    const mediumEvents = ['policy_violation', 'session_expired', 'weak_password'];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    if (mediumEvents.includes(eventType)) return 'medium';
    
    return 'low';
  }

  /**
   * Handle high severity events
   * @param {Object} event - Security event
   */
  handleHighSeverityEvent(event) {
    // In a production system, this would trigger alerts
    console.error('HIGH SEVERITY SECURITY EVENT:', event);
    
    // Could trigger additional actions like:
    // - Send alerts to security team
    // - Increase monitoring
    // - Automatic defensive measures
  }

  /**
   * Sanitize event details
   * @param {Object} details - Event details
   * @returns {Object} Sanitized details
   */
  sanitizeEventDetails(details) {
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get security statistics
   * @returns {Object} Security statistics
   */
  getStatistics() {
    const stats = {
      totalEvents: this.securityEvents.length,
      eventsBySeverity: {},
      eventsByType: {},
      blockedIPs: this.blockedIPs.size,
      activeRateLimits: this.rateLimits.size,
    };

    this.securityEvents.forEach(event => {
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get security monitor status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      statistics: this.getStatistics(),
      activePolicies: this.policies.size,
      recentEvents: this.securityEvents.slice(-10),
    };
  }
}