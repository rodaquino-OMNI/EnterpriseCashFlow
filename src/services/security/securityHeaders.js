/**
 * Security Headers and Content Security Policy Configuration
 * Implements security best practices for web applications
 */

export class SecurityHeaders {
  constructor() {
    this.cspDirectives = this.getDefaultCSPDirectives();
    this.headers = this.getDefaultHeaders();
  }

  /**
   * Get default Content Security Policy directives
   * @returns {Object} CSP directives
   */
  getDefaultCSPDirectives() {
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React in development
        "'unsafe-eval'", // Required for React DevTools
        "https://cdn.jsdelivr.net", // For external libraries if needed
        "https://unpkg.com",
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        "https://fonts.googleapis.com",
      ],
      'img-src': [
        "'self'",
        "data:", // For base64 images
        "blob:", // For blob URLs
        "https:",
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      'connect-src': [
        "'self'",
        "https://api.openai.com", // OpenAI API
        "https://api.anthropic.com", // Anthropic API
        "https://generativelanguage.googleapis.com", // Google AI API
        "https://gemini.google.com", // Gemini API
        "wss:", // WebSocket connections
      ],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'self'"],
      'frame-src': ["'none'"],
      'worker-src': ["'self'", "blob:"], // For web workers
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'upgrade-insecure-requests': [],
    };
  }

  /**
   * Get default security headers
   * @returns {Object} Security headers
   */
  getDefaultHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.getPermissionsPolicy(),
    };
  }

  /**
   * Get permissions policy
   * @returns {string} Permissions policy string
   */
  getPermissionsPolicy() {
    const policies = {
      'accelerometer': '()',
      'camera': '()',
      'geolocation': '()',
      'gyroscope': '()',
      'magnetometer': '()',
      'microphone': '()',
      'payment': '()',
      'usb': '()',
      'interest-cohort': '()', // FLoC opt-out
    };

    return Object.entries(policies)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
  }

  /**
   * Build CSP header string
   * @param {Object} customDirectives - Custom directives to merge
   * @returns {string} CSP header value
   */
  buildCSP(customDirectives = {}) {
    const directives = { ...this.cspDirectives, ...customDirectives };
    
    return Object.entries(directives)
      .map(([directive, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          return `${directive} ${values.join(' ')}`;
        } else if (values.length === 0) {
          return directive;
        }
        return null;
      })
      .filter(Boolean)
      .join('; ');
  }

  /**
   * Apply security headers to the document
   * Note: This only works for meta tags, actual headers need server configuration
   */
  applyToDocument() {
    if (typeof document === 'undefined') return;

    // Apply CSP via meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = this.buildCSP();
    document.head.appendChild(cspMeta);

    // Apply other security-related meta tags
    const metaTags = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    };

    Object.entries(metaTags).forEach(([name, content]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  }

  /**
   * Get headers for fetch requests
   * @returns {Object} Headers object
   */
  getFetchHeaders() {
    return {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
    };
  }

  /**
   * Generate nonce for inline scripts
   * @returns {string} Nonce value
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  /**
   * Add nonce to CSP for inline scripts
   * @param {string} nonce - Nonce value
   */
  addScriptNonce(nonce) {
    if (!this.cspDirectives['script-src'].includes(`'nonce-${nonce}'`)) {
      this.cspDirectives['script-src'].push(`'nonce-${nonce}'`);
    }
  }

  /**
   * Get security headers for Express/Node.js
   * @returns {Function} Express middleware
   */
  getExpressMiddleware() {
    return (req, res, next) => {
      // Set security headers
      Object.entries(this.headers).forEach(([name, value]) => {
        res.setHeader(name, value);
      });

      // Set CSP header
      res.setHeader('Content-Security-Policy', this.buildCSP());

      // Generate and set nonce for this request
      const nonce = this.generateNonce();
      res.locals.nonce = nonce;
      
      // Add nonce to CSP
      const cspWithNonce = this.buildCSP({
        'script-src': [...this.cspDirectives['script-src'], `'nonce-${nonce}'`],
      });
      res.setHeader('Content-Security-Policy', cspWithNonce);

      next();
    };
  }

  /**
   * Get security configuration for Create React App
   * @returns {Object} Environment variables for CRA
   */
  getCRAConfig() {
    return {
      INLINE_RUNTIME_CHUNK: false, // Prevents inline scripts
      GENERATE_SOURCEMAP: false, // Disable source maps in production
    };
  }

  /**
   * Validate CSP violations
   * @param {Object} violation - CSP violation report
   */
  handleCSPViolation(violation) {
    console.warn('CSP Violation:', {
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      originalPolicy: violation.originalPolicy,
      sourceFile: violation.sourceFile,
      lineNumber: violation.lineNumber,
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      this.reportViolation(violation);
    }
  }

  /**
   * Report CSP violation to monitoring service
   * @param {Object} violation - CSP violation data
   */
  reportViolation(violation) {
    // Implementation would send to your monitoring service
    fetch('/api/security/csp-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        violation,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }

  /**
   * Get recommended security practices
   * @returns {Object} Security recommendations
   */
  getSecurityRecommendations() {
    return {
      headers: {
        required: [
          'Content-Security-Policy',
          'Strict-Transport-Security',
          'X-Content-Type-Options',
          'X-Frame-Options',
        ],
        recommended: [
          'X-XSS-Protection',
          'Referrer-Policy',
          'Permissions-Policy',
        ],
      },
      practices: [
        'Use HTTPS everywhere',
        'Implement proper authentication',
        'Validate and sanitize all inputs',
        'Use secure session management',
        'Implement rate limiting',
        'Regular security audits',
        'Keep dependencies updated',
        'Use environment variables for secrets',
        'Implement proper error handling',
        'Use secure cookie flags',
      ],
      tools: [
        'npm audit for dependency scanning',
        'ESLint security plugins',
        'OWASP ZAP for security testing',
        'Mozilla Observatory for header analysis',
      ],
    };
  }

  /**
   * Audit current security headers
   * @returns {Object} Audit results
   */
  auditHeaders() {
    const results = {
      score: 0,
      maxScore: 0,
      missing: [],
      present: [],
      recommendations: [],
    };

    // Check for required headers
    const requiredHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
    ];

    requiredHeaders.forEach(header => {
      results.maxScore += 25;
      if (this.headers[header]) {
        results.score += 25;
        results.present.push(header);
      } else {
        results.missing.push(header);
        results.recommendations.push(`Add ${header} header`);
      }
    });

    // Check for recommended headers
    const recommendedHeaders = [
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
    ];

    recommendedHeaders.forEach(header => {
      results.maxScore += 10;
      if (this.headers[header]) {
        results.score += 10;
        results.present.push(header);
      } else {
        results.recommendations.push(`Consider adding ${header} header`);
      }
    });

    results.percentage = Math.round((results.score / results.maxScore) * 100);
    results.grade = this.calculateGrade(results.percentage);

    return results;
  }

  /**
   * Calculate security grade
   * @param {number} percentage - Score percentage
   * @returns {string} Letter grade
   */
  calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeaders();

// CSP violation report handler
if (typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (e) => {
    securityHeaders.handleCSPViolation({
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber,
    });
  });
}