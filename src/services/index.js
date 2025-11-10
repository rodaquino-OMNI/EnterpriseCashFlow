/**
 * Services Module
 * Central export for all application services
 */

// Monitoring Services
export { monitoringService } from './monitoring';
export {
  LoggingService,
  ErrorTracker,
  PerformanceMonitor,
  AuditLogger,
  MetricsCollector,
  SecurityMonitor,
} from './monitoring';

// Security Services
export {
  dataValidator,
  apiKeyManager,
  securityHeaders,
  DataValidator,
  ApiKeyManager,
  SecurityHeaders,
} from './security';

// Export Services
export {
  ExportService,
  PDFExportService,
  ExcelExportService,
  BatchExportService,
  TemplateManager,
  ChartExporter,
  BrandingManager,
} from './export';

// Initialize services on import
import { monitoringService } from './monitoring';
import { apiKeyManager } from './security/apiKeyManager';
import { securityHeaders } from './security/securityHeaders';

// Auto-initialize monitoring if in browser environment
if (typeof window !== 'undefined') {
  // Initialize monitoring
  monitoringService.initialize({
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableConsole: true,
      enableFile: false,
    },
    errorTracking: {
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enableInDev: false,
    },
    performance: {
      thresholds: {
        apiCall: 3000,
        calculation: 1000,
        render: 100,
        dataProcessing: 5000,
      },
    },
    audit: {
      enablePersistence: true,
      maxLogSize: 10000,
      retentionDays: 90,
    },
    metrics: {
      aggregationIntervalMs: 60000,
      flushIntervalMs: 300000,
      enableAutoFlush: true,
    },
    security: {
      enableRateLimiting: true,
      enableIPBlocking: true,
      suspiciousPatternDetection: true,
    },
  }).catch(error => {
    console.error('Failed to initialize monitoring services:', error);
  });

  // Initialize API key manager
  apiKeyManager.initialize({
    enableRotation: true,
    rotationIntervalDays: 90,
    enableUsageTracking: true,
  }).catch(error => {
    console.error('Failed to initialize API key manager:', error);
  });

  // Apply security headers to document
  securityHeaders.applyToDocument();
}