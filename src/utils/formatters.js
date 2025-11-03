// src/utils/formatters.js
/**
 * Utility functions for formatting numbers and financial values
 * Brazilian Portuguese (pt-BR) locale formatting
 */

/**
 * Format a number as Brazilian Real currency
 * @param {number|string} value - The numeric value to format
 * @param {boolean} [showSymbol=true] - Whether to show the R$ symbol
 * @param {Object} [options={}] - Additional formatting options
 * @param {number} [options.precision=2] - Number of decimal places
 * @param {boolean} [options.abbreviate=true] - Whether to abbreviate large numbers
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value, showSymbol = true, options = {}) {
  const { precision = 2, abbreviate = true } = options;

  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'N/A';
  }

  const numValue = Number(value);
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);

  let formattedValue;
  let suffix = '';

  // Handle abbreviation for large numbers - check trillion threshold first
  if (abbreviate && absValue >= 999_950_000_000) { // Round up threshold for trillion
    formattedValue = absValue / 1_000_000_000_000;
    suffix = ' tri';
  } else if (abbreviate && absValue >= 999_950_000) { // Round up threshold for billion
    formattedValue = absValue / 1_000_000_000;
    suffix = ' bi';
  } else if (abbreviate && absValue >= 1_000_000) {
    formattedValue = absValue / 1_000_000;
    suffix = ' mi';
  } else {
    formattedValue = absValue;
  }

  // Format the number with Brazilian locale
  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: suffix ? (precision || 2) : precision,
    maximumFractionDigits: suffix ? (precision || 2) : precision,
    useGrouping: true,
  });

  let formatted = formatter.format(formattedValue) + suffix;

  // Add currency symbol if requested
  if (showSymbol) {
    formatted = `R$ ${formatted}`;
  }

  // Handle negative values
  if (isNegative) {
    formatted = showSymbol ? `R$ -${formatted.replace('R$ ', '')}` : `-${formatted}`;
  }

  return formatted;
}

/**
 * Format currency with explicit sign handling for negative values
 * @param {number|string} value - The numeric value to format
 * @param {boolean} [showSymbol=true] - Whether to show the R$ symbol
 * @param {Object} [options={}] - Additional formatting options
 * @returns {string} The formatted currency string with proper sign placement
 */
export function formatCurrencyWithSign(value, showSymbol = true, options = {}) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'N/A';
  }

  const numValue = Number(value);
  const isNegative = numValue < 0;
  const absValue = Math.abs(numValue);

  // Format the absolute value
  const formatted = formatCurrency(absValue, showSymbol, options);

  // Handle negative values with sign before symbol
  if (isNegative) {
    return showSymbol ? `-${formatted}` : `-${formatted}`;
  }

  return formatted;
}

/**
 * Format a number as percentage
 * @param {number|string} value - The numeric value to format
 * @param {boolean} [multiplyBy100=false] - Whether to multiply by 100 first
 * @returns {string} The formatted percentage string
 */
export function formatPercentage(value, multiplyBy100 = false) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'N/A';
  }

  const numValue = Number(value);
  const percentValue = multiplyBy100 ? numValue * 100 : numValue;

  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

  return `${formatter.format(percentValue)}%`;
}

/**
 * Format a number as days
 * @param {number|string} value - The numeric value to format
 * @returns {string} The formatted days string
 */
export function formatDays(value) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'N/A';
  }

  const numValue = Number(value);
  
  // Round to 1 decimal place first to handle precision issues
  const roundedValue = Math.round(numValue * 10) / 10;
  
  // Check if the rounded value is effectively a whole number
  if (roundedValue === Math.floor(roundedValue)) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return `${formatter.format(roundedValue)} dias`;
  } else {
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: true,
    });
    return `${formatter.format(roundedValue)} dias`;
  }
}

/**
 * Get CSS class for movement indicators based on value
 * @param {number|string} value - The numeric value
 * @returns {string} CSS class string
 */
export function getMovementClass(value) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'text-slate-500 print:text-gray-600';
  }

  const numValue = Number(value);
  
  if (numValue > 0) {
    return 'text-green-600 print:text-green-700';
  } else if (numValue < 0) {
    return 'text-red-600 print:text-red-700';
  } else {
    return 'text-slate-500 print:text-gray-600';
  }
}

/**
 * Get movement indicator arrow based on value
 * @param {number|string} value - The numeric value
 * @returns {string} Arrow indicator
 */
export function getMovementIndicator(value) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return '';
  }

  const numValue = Number(value);
  
  if (numValue > 0) {
    return '▲';
  } else if (numValue < 0) {
    return '▼';
  } else {
    return '';
  }
}

/**
 * Format movement values based on type
 * @param {number|string} value - The numeric value
 * @param {string} [type='value'] - Type of movement
 * @param {boolean} [isPercentContext=false] - Whether we're in a percentage context
 * @returns {string} The formatted movement string
 */
export function formatMovement(value, type = 'value', isPercentContext = false) {
  // Handle invalid values
  if (value === null || value === undefined || isNaN(Number(value)) || !isFinite(Number(value))) {
    return 'N/A';
  }

  const numValue = Number(value);

  // If in percent context, always use percentage points
  if (isPercentContext) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${formatter.format(numValue)} p.p.`;
  }

  switch (type) {
    case 'percentage_points': {
      const ppFormatter = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      });
      return `${ppFormatter.format(numValue)} p.p.`;
    }

    case 'days': {
      if (numValue === Math.floor(numValue)) {
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          useGrouping: true,
        }).format(numValue);
      } else {
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          useGrouping: true,
        }).format(numValue);
      }
    }

    case 'percentage_change': {
      const pcFormatter = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      });
      return `${pcFormatter.format(numValue)}%`;
    }

    default: {
      // 'value' or currency - Use formatCurrency without symbol for movements
      return formatCurrency(numValue, false, { abbreviate: true });
    }
  }
}