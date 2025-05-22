// src/hooks/useFinancialCalculator.js
import { useState, useCallback } from 'react';
import { processFinancialData } from '../utils/calculations';

export function useFinancialCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  const calculate = useCallback(async (periodsInputDataRaw, periodTypeLabel) => {
    setIsCalculating(true);
    setCalculationError(null);
    try {
      const result = processFinancialData(periodsInputDataRaw, periodTypeLabel);
      return result;
    } catch (err) {
      setCalculationError(err);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return {
    calculate,
    isCalculating,
    calculationError,
  };
}