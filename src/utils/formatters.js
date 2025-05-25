// src/utils/formatters.js
export const formatCurrency = (value, withSymbol = true) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const val = Number(value);
  const symbol = withSymbol ? 'R$ ' : '';
  // Ensure exactly 2 decimal places and grouping
  return symbol + val.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2,
    useGrouping: true 
  });
};

export const formatCurrencyWithSign = (value, withSymbol = true) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const val = Number(value);
  const symbol = withSymbol ? 'R$ ' : '';
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  };
  if (val < 0) {
    return `-${symbol}${Math.abs(val).toLocaleString('pt-BR', options)}`;
  }
  return symbol + val.toLocaleString('pt-BR', options);
};

export const formatPercentage = (value, multiplyBy100 = false) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const valToFormat = multiplyBy100 ? Number(value) * 100 : Number(value);
  // Ensure exactly 2 decimal places
  return valToFormat.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
};

export const formatDays = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
    return 'N/A';
  }
  const val = Number(value);
  // Use 1 decimal place for days, or 0 if it's a whole number after rounding to 1 decimal
  const rounded = Math.round(val * 10) / 10;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }) + ' dias';
};

export const getMovementClass = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value)) || Number(value) === 0) {
    return 'text-slate-500 print:text-gray-600';
  }
  return Number(value) > 0 ? 'text-green-600 print:text-green-700' : 'text-red-600 print:text-red-700';
};

export const getMovementIndicator = (value) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value)) || Number(value) === 0) {
    return '';
  }
  return Number(value) > 0 ? '▲' : '▼';
};

export const formatMovement = (value, movementType = 'value', isPercentContext = false) => {
  if (value === null || typeof value === 'undefined' || isNaN(Number(value))) return 'N/A';

  const numValue = Number(value);

  if (movementType === 'percentage_points' || isPercentContext) {
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' p.p.';
  }

  if (movementType === 'days') {
    const rounded = Math.round(numValue * 10) / 10;
    const formatted = rounded.toLocaleString('pt-BR', {
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1
    });
    return `${formatted}`; // Just the number, "dias" will be in the label context
  }

  if (movementType === 'percentage_change') {
    return formatPercentage(numValue);
  }

  return formatCurrency(numValue, false); // Default: currency, always 2 decimal places
};