/**
 * FinancialCalculationService
 * 
 * Service wrapper for the financial calculation web worker
 * Provides a clean API for performing financial calculations
 * with automatic worker management and performance optimization
 */

class FinancialCalculationService {
  constructor() {
    this.worker = null;
    this.pendingCalculations = new Map();
    this.calculationId = 0;
    this.isInitialized = false;
  }

  /**
   * Initialize the worker
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.worker = new Worker('/src/workers/financialCalculator.worker.js');
      
      this.worker.onmessage = (event) => {
        const { id, success, error, ...data } = event.data;
        const pending = this.pendingCalculations.get(id);
        
        if (pending) {
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error));
          }
          this.pendingCalculations.delete(id);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending calculations
        this.pendingCalculations.forEach((pending) => {
          pending.reject(error);
        });
        this.pendingCalculations.clear();
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      throw error;
    }
  }

  /**
   * Send a calculation request to the worker
   */
  async sendCalculation(type, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const id = `calc_${++this.calculationId}`;
    
    return new Promise((resolve, reject) => {
      this.pendingCalculations.set(id, { resolve, reject });
      
      this.worker.postMessage({
        id,
        type,
        ...data,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingCalculations.has(id)) {
          this.pendingCalculations.delete(id);
          reject(new Error('Calculation timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Calculate NPV (Net Present Value)
   * @param {number[]} cashFlows - Array of cash flows
   * @param {number} discountRate - Discount rate (as decimal, e.g., 0.1 for 10%)
   * @param {number} initialInvestment - Initial investment amount
   * @returns {Promise<{npv: number, profitabilityIndex: number, presentValues: number[]}>}
   */
  async calculateNPV(cashFlows, discountRate, initialInvestment = 0) {
    const result = await this.sendCalculation('NPV', {
      cashFlows,
      discountRate,
      initialInvestment,
    });
    return result.result;
  }

  /**
   * Calculate IRR (Internal Rate of Return)
   * @param {number[]} cashFlows - Array of cash flows (first should be negative)
   * @param {number} guess - Initial guess for IRR (default 0.1)
   * @returns {Promise<{irr: number, isValid: boolean, iterations?: number, error?: string}>}
   */
  async calculateIRR(cashFlows, guess = 0.1) {
    const result = await this.sendCalculation('IRR', {
      cashFlows,
      guess,
    });
    return result.result;
  }

  /**
   * Calculate Payback Period
   * @param {number[]} cashFlows - Array of positive cash flows
   * @param {number} initialInvestment - Initial investment amount
   * @returns {Promise<{paybackPeriod: number|null, isWithinProjectLife: boolean, cumulativeCashFlows: number[]}>}
   */
  async calculatePaybackPeriod(cashFlows, initialInvestment) {
    const result = await this.sendCalculation('PAYBACK', {
      cashFlows,
      initialInvestment,
    });
    return result.result;
  }

  /**
   * Calculate Break-even Analysis
   * @param {number} fixedCosts - Total fixed costs
   * @param {number} variableCostPerUnit - Variable cost per unit
   * @param {number} pricePerUnit - Selling price per unit
   * @returns {Promise<{breakEvenUnits: number, breakEvenRevenue: number, contributionMargin: number, contributionMarginRatio: number}>}
   */
  async calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit) {
    const result = await this.sendCalculation('BREAKEVEN', {
      fixedCosts,
      variableCostPerUnit,
      pricePerUnit,
    });
    return result.result;
  }

  /**
   * Project Cash Flows
   * @param {number} baseCashFlow - Initial cash flow
   * @param {number} growthRate - Growth rate (as decimal)
   * @param {number} periods - Number of periods to project
   * @param {number} discountRate - Discount rate for PV calculation (optional)
   * @returns {Promise<{projectedCashFlows: number[], presentValues: number[], totalPV: number, terminalValue: number|null}>}
   */
  async projectCashFlows(baseCashFlow, growthRate, periods, discountRate = 0) {
    const result = await this.sendCalculation('PROJECTION', {
      baseCashFlow,
      growthRate,
      periods,
      discountRate,
    });
    return result.result;
  }

  /**
   * Perform Sensitivity Analysis
   * @param {object} baseCase - Base case parameters
   * @param {object} variables - Variables to test with their ranges
   * @param {function} calculation - Calculation function (will be serialized)
   * @returns {Promise<object>} - Sensitivity analysis results
   */
  async performSensitivityAnalysis(baseCase, variables, calculation) {
    const result = await this.sendCalculation('SENSITIVITY', {
      baseCase,
      variables,
      calculation: calculation.toString(), // Serialize function
    });
    return result.result;
  }

  /**
   * Process Financial Data (legacy support)
   * @param {array} periodsInputDataRaw - Raw period data
   * @param {string} periodTypeLabel - Period type (MONTHLY, QUARTERLY, YEARLY)
   * @returns {Promise<array>} - Processed financial data
   */
  async processFinancialData(periodsInputDataRaw, periodTypeLabel) {
    const result = await this.sendCalculation('FINANCIAL_DATA', {
      periodsInputDataRaw,
      periodTypeLabel,
    });
    return result.data;
  }

  /**
   * Batch calculate multiple financial metrics
   * @param {array} calculations - Array of calculation requests
   * @returns {Promise<array>} - Array of results
   */
  async batchCalculate(calculations) {
    const result = await this.sendCalculation('BATCH', {
      calculations,
    });
    return result.result;
  }

  /**
   * Advanced NPV with multiple scenarios
   * @param {object} scenarios - Multiple scenarios with different parameters
   * @returns {Promise<object>} - NPV results for each scenario
   */
  async calculateScenarioNPV(scenarios) {
    const calculations = Object.entries(scenarios).map(([name, scenario]) => ({
      type: 'NPV',
      name,
      params: {
        cashFlows: scenario.cashFlows,
        discountRate: scenario.discountRate,
        initialInvestment: scenario.initialInvestment,
      },
    }));

    const results = await this.batchCalculate(calculations);
    
    return results.reduce((acc, result, index) => {
      const name = calculations[index].name;
      acc[name] = result.success ? result.result : { error: result.error };
      return acc;
    }, {});
  }

  /**
   * Monte Carlo simulation for project valuation
   * @param {object} parameters - Simulation parameters
   * @returns {Promise<object>} - Simulation results
   */
  async monteCarloSimulation(parameters) {
    const {
      baseCase,
      variables,
      iterations = 1000,
      confidenceLevel = 0.95,
    } = parameters;

    // Generate random scenarios
    const scenarios = [];
    for (let i = 0; i < iterations; i++) {
      const scenario = { ...baseCase };
      
      Object.entries(variables).forEach(([key, config]) => {
        const { min, max, distribution = 'uniform' } = config;
        
        if (distribution === 'uniform') {
          scenario[key] = min + Math.random() * (max - min);
        } else if (distribution === 'normal') {
          // Simple Box-Muller transform for normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const mean = (min + max) / 2;
          const stdDev = (max - min) / 6; // 99.7% within range
          scenario[key] = mean + z0 * stdDev;
        }
      });
      
      scenarios.push(scenario);
    }

    // Calculate NPV for each scenario
    const calculations = scenarios.map((scenario, index) => ({
      type: 'NPV',
      params: {
        cashFlows: scenario.cashFlows,
        discountRate: scenario.discountRate,
        initialInvestment: scenario.initialInvestment,
      },
    }));

    const results = await this.batchCalculate(calculations);
    
    // Analyze results
    const npvValues = results
      .filter(r => r.success)
      .map(r => r.result.npv)
      .sort((a, b) => a - b);

    const mean = npvValues.reduce((a, b) => a + b, 0) / npvValues.length;
    const variance = npvValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / npvValues.length;
    const stdDev = Math.sqrt(variance);
    
    const lowerIndex = Math.floor((1 - confidenceLevel) / 2 * npvValues.length);
    const upperIndex = Math.floor((1 + confidenceLevel) / 2 * npvValues.length);

    return {
      iterations,
      successfulIterations: npvValues.length,
      mean,
      median: npvValues[Math.floor(npvValues.length / 2)],
      standardDeviation: stdDev,
      minimum: npvValues[0],
      maximum: npvValues[npvValues.length - 1],
      confidenceInterval: {
        level: confidenceLevel,
        lower: npvValues[lowerIndex],
        upper: npvValues[upperIndex],
      },
      percentiles: {
        p5: npvValues[Math.floor(0.05 * npvValues.length)],
        p25: npvValues[Math.floor(0.25 * npvValues.length)],
        p75: npvValues[Math.floor(0.75 * npvValues.length)],
        p95: npvValues[Math.floor(0.95 * npvValues.length)],
      },
      probabilityOfSuccess: npvValues.filter(v => v > 0).length / npvValues.length,
    };
  }

  /**
   * Calculate financial ratios from statements
   * @param {object} financialStatements - Income statement, balance sheet, cash flow
   * @returns {Promise<object>} - Financial ratios
   */
  async calculateFinancialRatios(financialStatements) {
    // This can use the existing processFinancialData or be extended
    const { incomeStatement, balanceSheet, cashFlow } = financialStatements;
    
    // Reuse existing calculation logic
    const result = await this.processFinancialData(
      [financialStatements],
      'YEARLY'
    );
    
    return result[0].ratios;
  }

  /**
   * Clean up worker resources
   */
  async cleanup() {
    if (this.worker) {
      await this.sendCalculation('CLEANUP', {});
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.pendingCalculations.clear();
    }
  }

  /**
   * Get calculation status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pendingCalculations: this.pendingCalculations.size,
      totalCalculations: this.calculationId,
    };
  }
}

// Create singleton instance
const financialCalculationService = new FinancialCalculationService();

export default financialCalculationService;

// Also export the class for testing
export { FinancialCalculationService };