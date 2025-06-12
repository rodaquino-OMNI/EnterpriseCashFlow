/**
 * Secure Financial Data Hook
 * Integrates security measures for handling financial data
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  monitoringService, 
  dataValidator, 
  apiKeyManager,
  securityHeaders 
} from '../services';

export const useSecureFinancialData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Process financial data with security measures
   * @param {Object} data - Raw financial data
   * @param {string} dataType - Type of financial data
   * @returns {Object} Processed and validated data
   */
  const processFinancialData = useCallback(async (data, dataType) => {
    const stopTimer = monitoringService.startTimer('processFinancialData');
    
    try {
      setIsLoading(true);
      setError(null);

      // 1. Validate input data
      const validationResult = dataValidator.validate(dataType, data);
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // 2. Sanitize the data
      const sanitizedData = dataValidator.sanitizeFinancialData(data, dataType);

      // 3. Log the financial operation for audit
      monitoringService.auditFinancialOperation('PROCESS_FINANCIAL_DATA', {
        dataType,
        recordCount: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString(),
      });

      // 4. Track business metrics
      if (dataType === 'incomeStatement' && sanitizedData.revenue) {
        monitoringService.metricsCollector.recordBusinessMetrics({
          revenue: sanitizedData.revenue,
          profitability: {
            netMargin: sanitizedData.netIncome / sanitizedData.revenue,
          },
        });
      }

      // 5. Check security policies
      const policyCheck = monitoringService.securityMonitor.checkPolicy(
        'current-user', // In real app, get from auth context
        'process_financial_data',
        { dataType, dataSize: JSON.stringify(data).length }
      );

      if (!policyCheck.allowed) {
        throw new Error(`Security policy violation: ${policyCheck.reason}`);
      }

      return {
        success: true,
        data: sanitizedData,
        metadata: {
          processedAt: new Date().toISOString(),
          dataType,
          validated: true,
          sanitized: true,
        },
      };

    } catch (error) {
      // Log error
      monitoringService.error(error, {
        component: 'useSecureFinancialData',
        operation: 'processFinancialData',
        dataType,
      });

      setError(error.message);
      
      return {
        success: false,
        error: error.message,
        data: null,
      };

    } finally {
      setIsLoading(false);
      stopTimer({ dataType });
    }
  }, []);

  /**
   * Upload and validate financial file
   * @param {File} file - File to upload
   * @param {string} fileType - Type of file (pdf, excel)
   * @returns {Object} Upload result
   */
  const uploadFinancialFile = useCallback(async (file, fileType) => {
    const stopTimer = monitoringService.startTimer('uploadFinancialFile');
    
    try {
      setIsLoading(true);
      setError(null);

      // 1. Validate file
      const fileValidation = dataValidator.validateFileUpload(file, {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: fileType === 'pdf' 
          ? ['application/pdf']
          : ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });

      if (!fileValidation.valid) {
        throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
      }

      // 2. Log file upload for audit
      monitoringService.auditFinancialOperation('FILE_UPLOAD', {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
      });

      // 3. Track upload metrics
      monitoringService.trackMetric('file.upload.size', file.size, {
        fileType,
      });

      // 4. Check rate limiting
      const rateLimitCheck = monitoringService.securityMonitor.checkPolicy(
        'current-user',
        'file_upload',
        { fileType, fileSize: file.size }
      );

      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.reason);
      }

      return {
        success: true,
        file,
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileType,
          fileName: file.name,
          fileSize: file.size,
        },
      };

    } catch (error) {
      monitoringService.error(error, {
        component: 'useSecureFinancialData',
        operation: 'uploadFinancialFile',
        fileType,
      });

      setError(error.message);
      
      return {
        success: false,
        error: error.message,
      };

    } finally {
      setIsLoading(false);
      stopTimer({ fileType });
    }
  }, []);

  /**
   * Export financial data with security checks
   * @param {Object} data - Data to export
   * @param {string} format - Export format
   * @returns {Object} Export result
   */
  const exportFinancialData = useCallback(async (data, format) => {
    const stopTimer = monitoringService.startTimer('exportFinancialData');
    
    try {
      setIsLoading(true);
      setError(null);

      // 1. Log export operation
      monitoringService.auditFinancialOperation('DATA_EXPORT', {
        format,
        recordCount: Array.isArray(data) ? data.length : 1,
        timestamp: new Date().toISOString(),
      });

      // 2. Check export policy
      const exportPolicy = monitoringService.securityMonitor.checkPolicy(
        'current-user',
        'export_data',
        { 
          format, 
          recordCount: Array.isArray(data) ? data.length : 1,
        }
      );

      if (!exportPolicy.allowed) {
        throw new Error(exportPolicy.reason);
      }

      // 3. Sanitize data before export
      const sanitizedData = dataValidator.sanitizeFinancialData(data, 'export');

      // 4. Track export metrics
      monitoringService.trackMetric('data.export.count', 1, { format });

      return {
        success: true,
        data: sanitizedData,
        metadata: {
          exportedAt: new Date().toISOString(),
          format,
          recordCount: Array.isArray(data) ? data.length : 1,
        },
      };

    } catch (error) {
      monitoringService.error(error, {
        component: 'useSecureFinancialData',
        operation: 'exportFinancialData',
        format,
      });

      setError(error.message);
      
      return {
        success: false,
        error: error.message,
      };

    } finally {
      setIsLoading(false);
      stopTimer({ format });
    }
  }, []);

  /**
   * Make secure API call with monitoring
   * @param {string} service - AI service name
   * @param {Function} apiCall - API call function
   * @param {Object} params - API call parameters
   * @returns {Object} API response
   */
  const makeSecureApiCall = useCallback(async (service, apiCall, params) => {
    const stopTimer = monitoringService.startTimer('secureApiCall');
    
    try {
      setIsLoading(true);
      setError(null);

      // 1. Get API key
      const apiKey = apiKeyManager.getApiKey(service);
      if (!apiKey) {
        throw new Error(`No API key found for service: ${service}`);
      }

      // 2. Add security headers
      const headers = {
        ...securityHeaders.getFetchHeaders(),
        'Authorization': `Bearer ${apiKey}`,
      };

      // 3. Make API call with monitoring
      const response = await monitoringService.metricsCollector.recordTiming(
        `api.${service}.call`,
        async () => apiCall({ ...params, headers }),
        { service, operation: params.operation }
      );

      // 4. Log successful API call
      monitoringService.log(`API call successful: ${service}`, {
        service,
        operation: params.operation,
        responseTime: Date.now(),
      });

      return {
        success: true,
        data: response,
      };

    } catch (error) {
      // Track API error
      if (service) {
        apiKeyManager.trackKeyError(service);
      }

      monitoringService.error(error, {
        component: 'useSecureFinancialData',
        operation: 'makeSecureApiCall',
        service,
      });

      setError(error.message);
      
      return {
        success: false,
        error: error.message,
      };

    } finally {
      setIsLoading(false);
      stopTimer({ service });
    }
  }, []);

  /**
   * Initialize security monitoring for component
   */
  useEffect(() => {
    // Add breadcrumb for component mount
    monitoringService.errorTracker.addBreadcrumb({
      message: 'useSecureFinancialData hook mounted',
      category: 'lifecycle',
      level: 'info',
    });

    return () => {
      // Add breadcrumb for component unmount
      monitoringService.errorTracker.addBreadcrumb({
        message: 'useSecureFinancialData hook unmounted',
        category: 'lifecycle',
        level: 'info',
      });
    };
  }, []);

  return {
    isLoading,
    error,
    processFinancialData,
    uploadFinancialFile,
    exportFinancialData,
    makeSecureApiCall,
    // Expose validation utilities
    validateData: (dataType, data) => dataValidator.validate(dataType, data),
    sanitizeString: (input, options) => dataValidator.sanitizeString(input, options),
    sanitizeNumber: (input, options) => dataValidator.sanitizeNumber(input, options),
  };
};