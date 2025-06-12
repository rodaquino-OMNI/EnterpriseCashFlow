/**
 * Export Service Hook
 * Provides export functionality to React components
 */

import { useState, useCallback, useMemo } from 'react';
import { ExportService } from '../services/export';

export function useExportService(options = {}) {
  // Initialize export service
  const exportService = useMemo(() => new ExportService(options), []);
  
  // State
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [lastExport, setLastExport] = useState(null);
  
  /**
   * Export report
   */
  const exportReport = useCallback(async (data, exportOptions = {}) => {
    setExporting(true);
    setExportError(null);
    
    try {
      const result = await exportService.export(data, exportOptions);
      
      if (result.success) {
        setLastExport({
          fileName: result.fileName,
          format: exportOptions.format || 'pdf',
          timestamp: new Date()
        });
        
        // Update statistics
        exportService.updateStatistics(result);
      } else {
        setExportError(result.error || 'Export failed');
      }
      
      return result;
    } catch (error) {
      setExportError(error.message);
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
    }
  }, [exportService]);
  
  /**
   * Export multiple reports
   */
  const exportBatch = useCallback(async (reports, batchOptions = {}) => {
    setExporting(true);
    setExportError(null);
    setExportProgress({ total: reports.length, completed: 0 });
    
    try {
      const result = await exportService.exportBatch(reports, {
        ...batchOptions,
        onProgress: (progress) => {
          setExportProgress(progress);
        }
      });
      
      if (!result.success) {
        setExportError(result.error || 'Batch export failed');
      }
      
      return result;
    } catch (error) {
      setExportError(error.message);
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }, [exportService]);
  
  /**
   * Export chart
   */
  const exportChart = useCallback(async (chartElement, chartOptions = {}) => {
    setExporting(true);
    setExportError(null);
    
    try {
      const result = await exportService.exportChart(chartElement, chartOptions);
      
      if (!result.success) {
        setExportError(result.error || 'Chart export failed');
      }
      
      return result;
    } catch (error) {
      setExportError(error.message);
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
    }
  }, [exportService]);
  
  /**
   * Export with template
   */
  const exportWithTemplate = useCallback(async (data, templateId, exportOptions = {}) => {
    return await exportReport(data, {
      ...exportOptions,
      templateId
    });
  }, [exportReport]);
  
  /**
   * Preview export
   */
  const previewExport = useCallback(async (data, previewOptions = {}) => {
    setExporting(true);
    setExportError(null);
    
    try {
      const result = await exportService.preview(data, previewOptions);
      
      if (!result.success) {
        setExportError(result.error || 'Preview failed');
      }
      
      return result;
    } catch (error) {
      setExportError(error.message);
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
    }
  }, [exportService]);
  
  /**
   * Get templates
   */
  const getTemplates = useCallback((category) => {
    return exportService.getTemplates(category);
  }, [exportService]);
  
  /**
   * Create custom template
   */
  const createTemplate = useCallback((template) => {
    try {
      return exportService.createTemplate(template);
    } catch (error) {
      setExportError(error.message);
      return null;
    }
  }, [exportService]);
  
  /**
   * Update template
   */
  const updateTemplate = useCallback((templateId, updates) => {
    try {
      return exportService.updateTemplate(templateId, updates);
    } catch (error) {
      setExportError(error.message);
      return null;
    }
  }, [exportService]);
  
  /**
   * Delete template
   */
  const deleteTemplate = useCallback((templateId) => {
    try {
      return exportService.deleteTemplate(templateId);
    } catch (error) {
      setExportError(error.message);
      return false;
    }
  }, [exportService]);
  
  /**
   * Get branding
   */
  const getBranding = useCallback(() => {
    return exportService.getBranding();
  }, [exportService]);
  
  /**
   * Update branding
   */
  const updateBranding = useCallback((branding) => {
    exportService.updateBranding(branding);
  }, [exportService]);
  
  /**
   * Get export formats
   */
  const getFormats = useCallback(() => {
    return exportService.getFormats();
  }, [exportService]);
  
  /**
   * Get export statistics
   */
  const getStatistics = useCallback(() => {
    return exportService.getStatistics();
  }, [exportService]);
  
  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setExportError(null);
  }, []);
  
  return {
    // Export functions
    exportReport,
    exportBatch,
    exportChart,
    exportWithTemplate,
    previewExport,
    
    // Template management
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    
    // Branding
    getBranding,
    updateBranding,
    
    // Utilities
    getFormats,
    getStatistics,
    clearError,
    
    // State
    exporting,
    exportProgress,
    exportError,
    lastExport
  };
}