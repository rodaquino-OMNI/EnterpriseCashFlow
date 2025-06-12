/**
 * Export Service Module
 * Exports all export-related services and utilities
 */

// Main export service
export { ExportService } from './ExportService';

// Individual export services
export { PDFExportService } from './PDFExportService';
export { ExcelExportService } from './ExcelExportService';
export { BatchExportService } from './BatchExportService';

// Template management
export { TemplateManager } from './templates/TemplateManager';
export { defaultTemplates, templateCategories } from './templates/defaultTemplates';

// Utilities
export { ChartExporter } from './utils/ChartExporter';
export { BrandingManager } from './utils/BrandingManager';

// Types
export * from './types';

// Default export - main service
import { ExportService } from './ExportService';
export default ExportService;