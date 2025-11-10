// src/utils/constants.js

// Excel Styling Constants
export const GREY_RGB_FILL = 'FFBFBFBF';
export const BLUE_HEADER_FILL = 'FFD1E8FF';
export const LIGHT_GREY_NA_FILL = 'FFE0E0E0';
export const GREY_TEXT_NA = 'FF888888';

// Custom Fill Colors for Smart Template
export const DRIVER_INPUT_FILL = 'FFD9E8FB'; // Light Blue for driver inputs
export const OVERRIDE_INPUT_FILL = 'FFFFF0CB'; // Light Yellow for override inputs
export const SECTION_HEADER_FILL = 'FFEAEAEA'; // Light Grey for section headers in template
export const MAIN_HEADER_COLOR = 'FF1E3A8A';   // Darker blue for main headers (e.g., in template generator)
export const INSTRUCTION_SHEET_COLOR = 'FF4CAF50'; // Green for instruction sheet accent

// Adjusted GREY_FILLS to include common variations from ExcelJS
export const GREY_FILLS = [
  'FFBFBFBF', // With alpha
  'BFBFBF',   // Without alpha
  // Add other common grey ARGB values if needed from user templates
];

export const HEADER_PATTERNS = [
  'Item (Chave Interna)',
  'Campo', // From our template
  'Field Key', 
  'Item',
  'Chave Interna',
];

export const PERIOD_TYPES = {
  anos: { label: 'Anos', days: 365.0, shortLabel: 'Ano', pluralLabel: 'Anos' },
  trimestres: { label: 'Trimestres', days: 91.25, shortLabel: 'Trim.', pluralLabel: 'Trimestres' },
  meses: { label: 'Meses', days: 30.4167, shortLabel: 'Mês', pluralLabel: 'Meses' },
};

export const MAX_PERIODS = 6;
export const MIN_PERIODS_MANUAL = 2;
export const DEFAULT_PERIODS_MANUAL = 3;
export const DEFAULT_PERIODS_EXCEL = 2;

export const DEFAULT_AI_PROVIDER = 'gemini';
export const GENAI_API_KEY = ''; 

// NEW: Excel Template Types
export const TEMPLATE_TYPES = {
  SMART_ADAPTIVE: 'smart_adaptive',
  BASIC_DRIVERS: 'basic_drivers',
  // ADVANCED_DRIVERS_OVERRIDES: 'advanced_drivers_overrides', // Could be another name for SMART
  // COMPLETE_STATEMENTS: 'complete_statements', // For future direct DRE/BS upload
};