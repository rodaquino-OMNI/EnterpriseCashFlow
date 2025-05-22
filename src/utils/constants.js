// src/utils/constants.js
export const GREY_RGB_FILL = 'FFBFBFBF';
export const BLUE_HEADER_FILL = 'FFD1E8FF';

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
  'Chave Interna'
];

export const PERIOD_TYPES = {
  anos: { label: 'Anos', days: 365, shortLabel: 'Ano' },
  trimestres: { label: 'Trimestres', days: 90, shortLabel: 'Trim.' }, // Approximation
  meses: { label: 'Meses', days: 30, shortLabel: 'Mês' }      // Approximation
};

export const MAX_PERIODS = 6;
export const MIN_PERIODS_MANUAL = 3; // For manual input mode
export const DEFAULT_PERIODS_MANUAL = 3;
export const DEFAULT_PERIODS_EXCEL = 2;

export const GENAI_API_KEY_PLACEHOLDER = "YOUR_API_KEY_HERE"; // Placeholder