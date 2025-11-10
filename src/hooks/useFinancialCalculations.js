import { useState, useCallback, useEffect } from 'react';
import financialCalculationService from '../services/financial/FinancialCalculationService';

/**
 * Custom hook for financial calculations
 * Provides a clean interface for React components to use financial calculations
 */
export const useFinancialCalculations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});

  // Initialize service on mount
  useEffect(() => {
    financialCalculationService.initialize().catch(err => {
      console.error('Failed to initialize financial calculation service:', err);
      setError('Failed to initialize calculation service');
    });

    // Cleanup on unmount
    return () => {
      financialCalculationService.cleanup();
    };
  }, []);

  /**
   * Calculate NPV
   */
  const calculateNPV = useCallback(async (cashFlows, discountRate, initialInvestment = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.calculateNPV(
        cashFlows,
        discountRate,
        initialInvestment,
      );
      
      setResults(prev => ({ ...prev, npv: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate IRR
   */
  const calculateIRR = useCallback(async (cashFlows, guess = 0.1) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.calculateIRR(cashFlows, guess);
      
      setResults(prev => ({ ...prev, irr: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate Payback Period
   */
  const calculatePaybackPeriod = useCallback(async (cashFlows, initialInvestment) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.calculatePaybackPeriod(
        cashFlows,
        initialInvestment,
      );
      
      setResults(prev => ({ ...prev, payback: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate Break-even
   */
  const calculateBreakEven = useCallback(async (fixedCosts, variableCostPerUnit, pricePerUnit) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.calculateBreakEven(
        fixedCosts,
        variableCostPerUnit,
        pricePerUnit,
      );
      
      setResults(prev => ({ ...prev, breakeven: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Project Cash Flows
   */
  const projectCashFlows = useCallback(async (baseCashFlow, growthRate, periods, discountRate = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.projectCashFlows(
        baseCashFlow,
        growthRate,
        periods,
        discountRate,
      );
      
      setResults(prev => ({ ...prev, projection: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate all investment metrics at once
   */
  const calculateInvestmentMetrics = useCallback(async (investmentData) => {
    setIsLoading(true);
    setError(null);

    const {
      cashFlows,
      discountRate,
      initialInvestment,
      fixedCosts,
      variableCostPerUnit,
      pricePerUnit,
    } = investmentData;

    try {
      // Prepare cash flows for IRR (include initial investment as negative)
      const irrCashFlows = [-initialInvestment, ...cashFlows];

      // Batch calculate all metrics
      const calculations = [
        {
          type: 'NPV',
          params: { cashFlows, discountRate, initialInvestment },
        },
        {
          type: 'IRR',
          params: { cashFlows: irrCashFlows },
        },
        {
          type: 'PAYBACK',
          params: { cashFlows, initialInvestment },
        },
      ];

      // Add break-even if cost data is provided
      if (fixedCosts && variableCostPerUnit && pricePerUnit) {
        calculations.push({
          type: 'BREAKEVEN',
          params: { fixedCosts, variableCostPerUnit, pricePerUnit },
        });
      }

      const batchResults = await financialCalculationService.batchCalculate(calculations);
      
      // Process results
      const metrics = {
        npv: batchResults[0].success ? batchResults[0].result : null,
        irr: batchResults[1].success ? batchResults[1].result : null,
        payback: batchResults[2].success ? batchResults[2].result : null,
        breakeven: batchResults[3]?.success ? batchResults[3].result : null,
      };

      setResults(prev => ({ ...prev, investmentMetrics: metrics }));
      return metrics;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Perform scenario analysis
   */
  const performScenarioAnalysis = useCallback(async (scenarios) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.calculateScenarioNPV(scenarios);
      
      setResults(prev => ({ ...prev, scenarios: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Run Monte Carlo simulation
   */
  const runMonteCarloSimulation = useCallback(async (parameters) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await financialCalculationService.monteCarloSimulation(parameters);
      
      setResults(prev => ({ ...prev, monteCarlo: result }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults({});
    setError(null);
  }, []);

  /**
   * Get calculation status
   */
  const getStatus = useCallback(() => {
    return financialCalculationService.getStatus();
  }, []);

  return {
    // State
    isLoading,
    error,
    results,
    
    // Individual calculations
    calculateNPV,
    calculateIRR,
    calculatePaybackPeriod,
    calculateBreakEven,
    projectCashFlows,
    
    // Composite calculations
    calculateInvestmentMetrics,
    performScenarioAnalysis,
    runMonteCarloSimulation,
    
    // Utilities
    clearResults,
    getStatus,
  };
};

/**
 * Hook for financial data processing (legacy support)
 */
export const useFinancialDataProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState(null);

  const processFinancialData = useCallback(async (periodsInputDataRaw, periodTypeLabel) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await financialCalculationService.processFinancialData(
        periodsInputDataRaw,
        periodTypeLabel,
      );
      
      setProcessedData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processFinancialData,
    isProcessing,
    processedData,
    error,
  };
};