/**
 * Export Panel Component
 * Provides UI for exporting reports in various formats
 */

import React, { useState, useRef } from 'react';
import { useExportService } from '../../hooks/useExportService';
import { ExportFormat } from '../../services/export/types';

export function ExportPanel({ reportData, charts = [] }) {
  const exportService = useExportService();
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.PDF);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeTimestamp: true,
    watermark: ''
  });
  
  // Get available formats and templates
  const formats = exportService.getFormats();
  const templates = exportService.getTemplates();
  
  /**
   * Handle export
   */
  const handleExport = async () => {
    // Prepare export data
    const exportData = {
      ...reportData,
      charts: exportOptions.includeCharts ? charts : []
    };
    
    // Export options
    const options = {
      format: selectedFormat,
      templateId: selectedTemplate,
      includeCharts: exportOptions.includeCharts,
      includeTimestamp: exportOptions.includeTimestamp,
      branding: {
        watermark: exportOptions.watermark ? {
          text: exportOptions.watermark,
          type: 'text'
        } : null
      }
    };
    
    const result = await exportService.exportReport(exportData, options);
    
    if (result.success) {
      console.log('Export successful:', result.fileName);
    }
  };
  
  /**
   * Handle batch export
   */
  const handleBatchExport = async () => {
    // Example: Export multiple period reports
    const reports = [
      {
        id: 'q1-report',
        name: 'Q1 Financial Report',
        data: { ...reportData, period: 'Q1 2024' },
        format: selectedFormat
      },
      {
        id: 'q2-report',
        name: 'Q2 Financial Report',
        data: { ...reportData, period: 'Q2 2024' },
        format: selectedFormat
      }
    ];
    
    const result = await exportService.exportBatch(reports, {
      createArchive: true,
      namingPattern: {
        template: '{name}_{date}'
      }
    });
    
    if (result.success) {
      console.log('Batch export successful:', result);
    }
  };
  
  /**
   * Handle preview
   */
  const handlePreview = async () => {
    const result = await exportService.previewExport(reportData, {
      format: selectedFormat,
      templateId: selectedTemplate
    });
    
    if (result.success && result.previewUrl) {
      // Open preview in new window
      window.open(result.previewUrl, '_blank');
    }
  };
  
  return (
    <div className="export-panel bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Export Report</h2>
      
      {/* Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex gap-4">
          {formats.map(format => (
            <label key={format.id} className="flex items-center">
              <input
                type="radio"
                value={format.id}
                checked={selectedFormat === format.id}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="mr-2"
              />
              <span className="flex items-center">
                <i className={`fas fa-${format.icon} mr-2`}></i>
                {format.name}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Template Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Default Template</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Export Options */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Options</h3>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeCharts}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                includeCharts: e.target.checked
              })}
              className="mr-2"
            />
            Include Charts and Graphs
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeTimestamp}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                includeTimestamp: e.target.checked
              })}
              className="mr-2"
            />
            Include Timestamp in Filename
          </label>
          
          <div className="mt-2">
            <label className="block text-sm text-gray-600 mb-1">
              Watermark Text (optional)
            </label>
            <input
              type="text"
              value={exportOptions.watermark}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                watermark: e.target.value
              })}
              placeholder="e.g., CONFIDENTIAL"
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exportService.exporting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {exportService.exporting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Exporting...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Export
            </>
          )}
        </button>
        
        <button
          onClick={handlePreview}
          disabled={exportService.exporting}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-eye mr-2"></i>
          Preview
        </button>
        
        <button
          onClick={handleBatchExport}
          disabled={exportService.exporting}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-layer-group mr-2"></i>
          Batch Export
        </button>
      </div>
      
      {/* Progress Bar */}
      {exportService.exportProgress && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-1">
            Exporting {exportService.exportProgress.completed} of {exportService.exportProgress.total} reports...
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(exportService.exportProgress.completed / exportService.exportProgress.total) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {exportService.exportError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <i className="fas fa-exclamation-circle text-red-500 mt-0.5 mr-2"></i>
            <div className="flex-1">
              <p className="text-sm text-red-800">{exportService.exportError}</p>
              <button
                onClick={exportService.clearError}
                className="text-xs text-red-600 hover:text-red-800 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Last Export Info */}
      {exportService.lastExport && (
        <div className="mt-4 text-sm text-gray-600">
          Last export: {exportService.lastExport.fileName} at {exportService.lastExport.timestamp.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * Chart Export Button Component
 * Quick export button for individual charts
 */
export function ChartExportButton({ chartRef, chartName = 'chart' }) {
  const exportService = useExportService();
  const [showOptions, setShowOptions] = useState(false);
  
  const handleExport = async (format) => {
    if (!chartRef.current) return;
    
    const result = await exportService.exportChart(chartRef.current, {
      fileName: chartName,
      format: format
    });
    
    setShowOptions(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        title="Export chart"
      >
        <i className="fas fa-download"></i>
      </button>
      
      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={() => handleExport('png')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-image mr-2"></i>
              Export as PNG
            </button>
            <button
              onClick={() => handleExport('jpeg')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-image mr-2"></i>
              Export as JPEG
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-vector-square mr-2"></i>
              Export as SVG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}