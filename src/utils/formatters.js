// src/utils/formatters.js
export const formatCurrency = (value, withSymbol = true) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const val = Number(value);
  const symbol = withSymbol ? 'R$ ' : '';
  return symbol + val.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export const formatPercentage = (value, multiplyBy100 = false) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const valToFormat = multiplyBy100 ? Number(value) * 100 : Number(value);
  return valToFormat.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
};

export const formatDays = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const val = Math.round(Number(value)); // Typically days are whole numbers or rounded
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) + ' dias';
};

export const getMovementClass = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value)) || Number(value) === 0) {
    return 'text-slate-500';
  }
  return Number(value) > 0 ? 'text-green-600' : 'text-red-600';
};

export const getMovementIndicator = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value)) || Number(value) === 0) {
    return '';
  }
  return Number(value) > 0 ? '▲' : '▼';
};

export const formatMovement = (value, movementType = 'value', isPercentContext = false) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) return 'N/A';

  if (movementType === 'percentage_points' || isPercentContext) {
    // If value is already a difference of percentages (e.g., 5% - 3% = 2%), format as p.p.
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' p.p.';
  }
  if (movementType === 'days') {
    return formatDays(value).replace(' dias', ''); // Just the number for "X dias" context
  }
  if (movementType === 'percentage_change') {
    return formatPercentage(value); // This is a % change, e.g., revenue grew by X%
  }
  // Default to currency (absolute value change)
  return formatCurrency(value, false);
};