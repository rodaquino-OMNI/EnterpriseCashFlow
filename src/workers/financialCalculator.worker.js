/* eslint-disable no-restricted-globals */
// src/workers/financialCalculator.worker.js

// Financial calculation functions (self-contained for worker)
const round2 = (num) => Math.round(num * 100) / 100;

// NPV (Net Present Value) calculation
const calculateNPV = (cashFlows, discountRate, initialInvestment = 0) => {
  let npv = -initialInvestment;
  
  cashFlows.forEach((cf, period) => {
    npv += cf / Math.pow(1 + discountRate, period + 1);
  });
  
  const profitabilityIndex = initialInvestment > 0 
    ? (npv + initialInvestment) / initialInvestment 
    : 0;
  
  return {
    npv: round2(npv),
    profitabilityIndex: round2(profitabilityIndex),
    presentValues: cashFlows.map((cf, i) => 
      round2(cf / Math.pow(1 + discountRate, i + 1))
    ),
  };
};

// IRR (Internal Rate of Return) calculation using Newton-Raphson method
const calculateIRR = (cashFlows, guess = 0.1) => {
  const maxIterations = 100;
  const tolerance = 0.00001;
  
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    cashFlows.forEach((cf, t) => {
      const factor = Math.pow(1 + rate, t);
      npv += cf / factor;
      dnpv -= t * cf / (factor * (1 + rate));
    });
    
    if (Math.abs(npv) < tolerance) {
      return {
        irr: round2(rate * 100), // Return as percentage
        isValid: true,
        iterations: i,
      };
    }
    
    rate = rate - npv / dnpv;
    
    // Bound the rate to prevent divergence
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return {
    irr: null,
    isValid: false,
    error: 'IRR calculation did not converge',
  };
};

// Payback Period calculation
const calculatePaybackPeriod = (cashFlows, initialInvestment) => {
  let cumulativeCashFlow = -initialInvestment;
  let paybackPeriod = 0;
  
  for (let i = 0; i < cashFlows.length; i++) {
    cumulativeCashFlow += cashFlows[i];
    
    if (cumulativeCashFlow >= 0) {
      // Calculate exact payback period with interpolation
      const previousCumulative = cumulativeCashFlow - cashFlows[i];
      const fractionOfPeriod = -previousCumulative / cashFlows[i];
      paybackPeriod = i + fractionOfPeriod;
      
      return {
        paybackPeriod: round2(paybackPeriod),
        isWithinProjectLife: true,
        cumulativeCashFlows: cashFlows.map((cf, idx) => {
          const cumSum = cashFlows.slice(0, idx + 1).reduce((a, b) => a + b, 0);
          return round2(cumSum - initialInvestment);
        }),
      };
    }
  }
  
  return {
    paybackPeriod: null,
    isWithinProjectLife: false,
    cumulativeCashFlows: cashFlows.map((cf, idx) => {
      const cumSum = cashFlows.slice(0, idx + 1).reduce((a, b) => a + b, 0);
      return round2(cumSum - initialInvestment);
    }),
  };
};

// Break-even Analysis
const calculateBreakEven = (fixedCosts, variableCostPerUnit, pricePerUnit) => {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const contributionMarginRatio = contributionMargin / pricePerUnit;
  
  if (contributionMargin <= 0) {
    return {
      breakEvenUnits: null,
      breakEvenRevenue: null,
      contributionMargin: round2(contributionMargin),
      contributionMarginRatio: round2(contributionMarginRatio * 100),
      error: 'Negative or zero contribution margin',
    };
  }
  
  const breakEvenUnits = fixedCosts / contributionMargin;
  const breakEvenRevenue = breakEvenUnits * pricePerUnit;
  
  return {
    breakEvenUnits: round2(breakEvenUnits),
    breakEvenRevenue: round2(breakEvenRevenue),
    contributionMargin: round2(contributionMargin),
    contributionMarginRatio: round2(contributionMarginRatio * 100),
    marginOfSafety: (targetRevenue) => {
      const marginOfSafety = (targetRevenue - breakEvenRevenue) / targetRevenue;
      return round2(marginOfSafety * 100);
    },
  };
};

// Cash Flow Projections
const projectCashFlows = (baseCashFlow, growthRate, periods, discountRate = 0) => {
  const projectedCashFlows = [];
  const presentValues = [];
  let totalPV = 0;
  
  for (let i = 0; i < periods; i++) {
    const projectedCF = baseCashFlow * Math.pow(1 + growthRate, i);
    const pv = projectedCF / Math.pow(1 + discountRate, i);
    
    projectedCashFlows.push(round2(projectedCF));
    presentValues.push(round2(pv));
    totalPV += pv;
  }
  
  return {
    projectedCashFlows,
    presentValues,
    totalPV: round2(totalPV),
    terminalValue: discountRate > growthRate 
      ? round2((projectedCashFlows[periods - 1] * (1 + growthRate)) / (discountRate - growthRate))
      : null,
  };
};

// Sensitivity Analysis
const performSensitivityAnalysis = (baseCase, variables, calculation) => {
  const results = {};
  
  Object.entries(variables).forEach(([variable, range]) => {
    results[variable] = [];
    
    range.forEach(value => {
      const scenario = { ...baseCase, [variable]: value };
      const result = calculation(scenario);
      
      results[variable].push({
        value,
        result,
        percentageChange: round2(((value - baseCase[variable]) / baseCase[variable]) * 100),
        impact: round2(((result - calculation(baseCase)) / calculation(baseCase)) * 100),
      });
    });
  });
  
  return results;
};

// Validate calculation inputs
const validateInputs = (type, data) => {
  const errors = [];
  
  switch (type) {
    case 'NPV':
      if (!data.cashFlows || !Array.isArray(data.cashFlows) || data.cashFlows.length === 0) {
        errors.push('Cash flows must be a non-empty array');
      }
      if (typeof data.discountRate !== 'number' || data.discountRate < -1) {
        errors.push('Discount rate must be a valid number greater than -100%');
      }
      break;
      
    case 'IRR':
      if (!data.cashFlows || !Array.isArray(data.cashFlows) || data.cashFlows.length < 2) {
        errors.push('Cash flows must be an array with at least 2 periods');
      }
      break;
      
    case 'PAYBACK':
      if (!data.cashFlows || !Array.isArray(data.cashFlows)) {
        errors.push('Cash flows must be an array');
      }
      if (typeof data.initialInvestment !== 'number' || data.initialInvestment <= 0) {
        errors.push('Initial investment must be a positive number');
      }
      break;
      
    case 'BREAKEVEN':
      if (typeof data.fixedCosts !== 'number' || data.fixedCosts < 0) {
        errors.push('Fixed costs must be a non-negative number');
      }
      if (typeof data.variableCostPerUnit !== 'number' || data.variableCostPerUnit < 0) {
        errors.push('Variable cost per unit must be a non-negative number');
      }
      if (typeof data.pricePerUnit !== 'number' || data.pricePerUnit <= 0) {
        errors.push('Price per unit must be a positive number');
      }
      break;
      
    case 'PROJECTION':
      if (typeof data.baseCashFlow !== 'number' || data.baseCashFlow <= 0) {
        errors.push('Base cash flow must be a positive number');
      }
      if (typeof data.growthRate !== 'number') {
        errors.push('Growth rate must be a number');
      }
      if (typeof data.periods !== 'number' || data.periods <= 0 || !Number.isInteger(data.periods)) {
        errors.push('Periods must be a positive integer');
      }
      break;
  }
  
  return errors;
};

// Main message handler
self.onmessage = function(event) {
  const { type, id, ...data } = event.data;
  
  console.log("Worker received message:", { type, id, data });
  
  try {
    let result;
    const timestamp = Date.now();
    
    // Handle different calculation types
    switch (type) {
      case 'FINANCIAL_DATA':
        // Legacy support for existing processFinancialData
        const { processFinancialData } = require('../utils/calculations.js');
        const calculatedData = processFinancialData(
          data.periodsInputDataRaw,
          data.periodTypeLabel
        );
        
        self.postMessage({
          success: true,
          data: calculatedData,
          timestamp,
          id,
        });
        return;
        
      case 'NPV':
        const npvErrors = validateInputs('NPV', data);
        if (npvErrors.length > 0) {
          throw new Error(npvErrors.join('; '));
        }
        
        result = calculateNPV(
          data.cashFlows,
          data.discountRate,
          data.initialInvestment
        );
        break;
        
      case 'IRR':
        const irrErrors = validateInputs('IRR', data);
        if (irrErrors.length > 0) {
          throw new Error(irrErrors.join('; '));
        }
        
        result = calculateIRR(data.cashFlows, data.guess);
        break;
        
      case 'PAYBACK':
        const paybackErrors = validateInputs('PAYBACK', data);
        if (paybackErrors.length > 0) {
          throw new Error(paybackErrors.join('; '));
        }
        
        result = calculatePaybackPeriod(data.cashFlows, data.initialInvestment);
        break;
        
      case 'BREAKEVEN':
        const breakEvenErrors = validateInputs('BREAKEVEN', data);
        if (breakEvenErrors.length > 0) {
          throw new Error(breakEvenErrors.join('; '));
        }
        
        result = calculateBreakEven(
          data.fixedCosts,
          data.variableCostPerUnit,
          data.pricePerUnit
        );
        break;
        
      case 'PROJECTION':
        const projectionErrors = validateInputs('PROJECTION', data);
        if (projectionErrors.length > 0) {
          throw new Error(projectionErrors.join('; '));
        }
        
        result = projectCashFlows(
          data.baseCashFlow,
          data.growthRate,
          data.periods,
          data.discountRate
        );
        break;
        
      case 'SENSITIVITY':
        result = performSensitivityAnalysis(
          data.baseCase,
          data.variables,
          data.calculation
        );
        break;
        
      case 'BATCH':
        // Process multiple calculations
        result = data.calculations.map(calc => {
          try {
            const calcResult = processCalculation(calc.type, calc.params);
            return {
              type: calc.type,
              success: true,
              result: calcResult,
            };
          } catch (error) {
            return {
              type: calc.type,
              success: false,
              error: error.message,
            };
          }
        });
        break;
        
      case 'CLEANUP':
        // Clean up any resources if needed
        result = { message: 'Resources cleaned up' };
        break;
        
      default:
        // Handle legacy format for backward compatibility
        if (data.periodsInputDataRaw) {
          const { processFinancialData } = require('../utils/calculations.js');
          const calculatedData = processFinancialData(
            data.periodsInputDataRaw,
            data.periodTypeLabel
          );
          
          self.postMessage({
            success: true,
            data: calculatedData,
            timestamp,
            id,
          });
          return;
        }
        
        throw new Error(`Unknown calculation type: ${type}`);
    }
    
    // Send successful response
    self.postMessage({
      success: true,
      type,
      result,
      timestamp,
      id,
    });
    
  } catch (error) {
    console.error("Error in financialCalculator.worker.js:", error);
    
    self.postMessage({
      success: false,
      type,
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      id,
    });
  }
};

// Helper function to process individual calculations for batch mode
function processCalculation(type, params) {
  switch (type) {
    case 'NPV':
      return calculateNPV(params.cashFlows, params.discountRate, params.initialInvestment);
    case 'IRR':
      return calculateIRR(params.cashFlows, params.guess);
    case 'PAYBACK':
      return calculatePaybackPeriod(params.cashFlows, params.initialInvestment);
    case 'BREAKEVEN':
      return calculateBreakEven(params.fixedCosts, params.variableCostPerUnit, params.pricePerUnit);
    case 'PROJECTION':
      return projectCashFlows(params.baseCashFlow, params.growthRate, params.periods, params.discountRate);
    default:
      throw new Error(`Unknown calculation type: ${type}`);
  }
}

// Performance optimization for large datasets
const optimizeForLargeDatasets = (data) => {
  // Use typed arrays for better performance with large numeric datasets
  if (Array.isArray(data) && data.length > 1000) {
    return new Float64Array(data);
  }
  return data;
};

// Export for testing (if module system is available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateNPV,
    calculateIRR,
    calculatePaybackPeriod,
    calculateBreakEven,
    projectCashFlows,
    performSensitivityAnalysis,
  };
}