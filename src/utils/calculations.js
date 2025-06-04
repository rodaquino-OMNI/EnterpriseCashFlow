// src/utils/calculations.js
import { PERIOD_TYPES } from './constants.js';
import { FinancialConstraintValidator, OverrideValidator } from './financialValidators.js'; 
import { fieldDefinitions } from './fieldDefinitions.js'; 
import { formatCurrency } from './formatters.js'; // For enhanced logging

// Your enhanced parseToNumber
function parseToNumber(value, defaultValue = 0) {
    if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
        return defaultValue;
    }
    let sValue = String(value).trim();
    if (sValue === '' || sValue === '-') return defaultValue;
    sValue = sValue
        .replace(/\s*R\$\s*/gi, '')
        .replace(/[^\d\-+.,]/g, '') 
        .replace(/\.(?=\d{3}(?:[,.]|$))/g, '') 
        .replace(',', '.');
    const parsed = Number(sValue);
    return isNaN(parsed) ? defaultValue : parsed;
}

function getOverrideValue(rawPeriodInput, overrideKey) {
  const value = rawPeriodInput[overrideKey];
  // Return parsed number if valid, otherwise null. Critical for assign logic.
  if (value !== null && typeof value !== 'undefined' && String(value).trim() !== '') {
      const numValue = parseToNumber(value, NaN); // Try to parse, default to NaN if not parseable
      return !isNaN(numValue) ? numValue : null;
  }
  return null;
}

class FinancialCalculationEngine {
  constructor(periodInputRaw, previousPeriod_V_State, periodIndex, daysInPeriod) {
    this.rawInput = { ...periodInputRaw }; 
    this.previousV = previousPeriod_V_State; // This is the V object (SSOT) from previous engine's run
    this.periodIndex = periodIndex;
    this.days = daysInPeriod;
    
    /** @type {Record<string, any>} */
    this.V = {}; 
    this.auditTrail = [];
    this.validationIssues = { errors: [], warnings: [], infos: [], successes: [] };
    this.overridesAppliedSummary = {}; // For fields where an override was taken

    // Initialize V with parsed DRIVER inputs from rawInput. Overrides are handled by 'assign'.
    Object.keys(fieldDefinitions).forEach(key => {
      if (!fieldDefinitions[key].isOverride) { 
        const def = fieldDefinitions[key];
        let initialValue = (def.type === 'percentage' && this.rawInput[key] !== null && typeof this.rawInput[key] !== 'undefined') 
                            ? parseToNumber(this.rawInput[key],0) 
                            : parseToNumber(this.rawInput[key],0); 
        
        if (def.firstPeriodOnly && periodIndex > 0) {
            this.V[key] = null; // Set to null for subsequent periods
        } else {
            this.V[key] = initialValue;
        }
        // Record only if it has a value or is a P0 firstPeriodOnly field
        if (this.V[key] !== null || (def.firstPeriodOnly && periodIndex === 0)) {
            this.recordAudit(key, this.V[key], 'input_driver_parsed');
        }
      }
    });
  }

  recordAudit(field, value, source, calculatedValueIfOverridden = null, overrideKeyUsed = null) {
    this.auditTrail.push({ field, value, source, calculatedValueIfOverridden, overrideKeyUsed, t: new Date().toISOString() });
    if (source === 'override_applied') {
      if(!this.V._overridesSummary) this.V._overridesSummary = { count: 0, details: {} };
      this.V._overridesSummary.details[field] = { // Use fieldName, not overrideKey as key here
          overriddenValue: value, 
          originalCalculatedValue: calculatedValueIfOverridden, 
          sourceOverrideKey: overrideKeyUsed 
      };
      this.V._overridesSummary.count = Object.keys(this.V._overridesSummary.details).length;
      this.overridesAppliedSummary[field] = value;
    }
  }

  assign(fieldName, overrideKey, calculateFn, dependencies = []) {
    // This basic dependency log can be useful. A real graph solver would be complex.
    // for(const dep of dependencies) { if (typeof this.V[dep] === 'undefined') console.warn(`Calc dep issue: ${dep} for ${fieldName}`);}
    
    const calculatedValue = calculateFn();
    const override = getOverrideValue(this.rawInput, overrideKey);

    if (override !== null) {
      this.V[fieldName] = override;
      this.recordAudit(fieldName, override, 'override_applied', calculatedValue, overrideKey);
    } else {
      this.V[fieldName] = calculatedValue;
      this.recordAudit(fieldName, calculatedValue, 'calculated');
    }
    return this.V[fieldName];
  }
  
  getSourceOfValue(fieldName) {
    const auditEntries = this.auditTrail.filter(entry => entry.field === fieldName);
    const lastEntry = auditEntries[auditEntries.length - 1];
    return lastEntry ? lastEntry.source : 'unknown';
  }
  
  calculatePnl() {
    const gmPercentageForCalc = (this.V.grossMarginPercentage || 0) / 100;
    const taxRateForCalc = (this.V.incomeTaxRatePercentage || 0) / 100;

    this.assign('cogs', 'override_cogs', () => this.V.revenue * (1 - gmPercentageForCalc));
    this.assign('grossProfit', 'override_grossProfit', () => this.V.revenue - this.V.cogs);
    this.assign('ebitda', 'override_ebitda', () => this.V.grossProfit - this.V.operatingExpenses);
    this.assign('ebit', 'override_ebit', () => this.V.ebitda - this.V.depreciationAndAmortisation);
    this.assign('pbt', 'override_pbt', () => this.V.ebit + this.V.netInterestExpenseIncome + this.V.extraordinaryItems);
    this.assign('incomeTax', 'override_incomeTax', () => (this.V.pbt > 0 ? this.V.pbt * taxRateForCalc : 0));
    this.assign('netProfit', 'override_netProfit', () => this.V.pbt - this.V.incomeTax);
    
    this.V.retainedProfit = this.V.netProfit - this.V.dividendsPaid;
    this.recordAudit('retainedProfit', this.V.retainedProfit, 'calculated');
    // Store the actual tax rate decimal used for calculations in CalculatedPeriodData
    this.V.incomeTaxRatePercentageActual = taxRateForCalc; 
    this.recordAudit('incomeTaxRatePercentageActual', this.V.incomeTaxRatePercentageActual, 'derived_from_input');
  }

  calculateWorkingCapital() {
    this.V.arDaysDerived = this.V.revenue > 0 ? (this.V.accountsReceivableValueAvg / this.V.revenue) * this.days : 0;
    this.V.inventoryDaysDerived = this.V.cogs > 0 ? (this.V.inventoryValueAvg / this.V.cogs) * this.days : 0;
    this.V.apDaysDerived = this.V.cogs > 0 ? (this.V.accountsPayableValueAvg / this.V.cogs) * this.days : 0;
    
    this.recordAudit('arDaysDerived', this.V.arDaysDerived, 'derived_days');
    this.recordAudit('inventoryDaysDerived', this.V.inventoryDaysDerived, 'derived_days');
    this.recordAudit('apDaysDerived', this.V.apDaysDerived, 'derived_days');
    
    this.V.arDays = this.V.arDaysDerived; 
    this.V.invDays = this.V.inventoryDaysDerived; 
    this.V.apDays = this.V.apDaysDerived; 
    
    this.recordAudit('arDays', this.V.arDays, 'alias_for_kpi');
    this.recordAudit('invDays', this.V.invDays, 'alias_for_kpi');
    this.recordAudit('apDays', this.V.apDays, 'alias_for_kpi');
    
    this.V.workingCapitalValue = this.V.accountsReceivableValueAvg + this.V.inventoryValueAvg - this.V.accountsPayableValueAvg;
    this.recordAudit('workingCapitalValue', this.V.workingCapitalValue, 'calculated');
    
    this.V.wcDays = this.V.arDaysDerived + this.V.inventoryDaysDerived - this.V.apDaysDerived;
    this.recordAudit('wcDays', this.V.wcDays, 'calculated');
  }

  // YOUR FULLY CORRECTED calculateCashFlow METHOD
  calculateCashFlow() {
    console.log(`\n=== CASH FLOW CALCULATION DEBUG - Period ${this.periodIndex + 1} ===`);
    console.log(`[CF_DEBUG P${this.periodIndex+1}] Raw Input Opening Cash: ${this.rawInput.openingCash ? formatCurrency(parseToNumber(this.rawInput.openingCash)) : 'N/A (Not P0)'}`);
    console.log(`[CF_DEBUG P${this.periodIndex+1}] Previous Period V.closingCash from SSOT: ${this.previousV?.closingCash ? formatCurrency(this.previousV.closingCash) : (this.periodIndex === 0 ? 'N/A (First Period)' : 'ERROR/MISSING') }`);
    
    let openingCashForThisPeriod;
    if (this.periodIndex === 0) {
        openingCashForThisPeriod = parseToNumber(this.rawInput.openingCash, 0); // Directly from rawInput for P0
        console.log(`[CF_DEBUG P${this.periodIndex+1}] Using Input Opening Cash for P0: ${formatCurrency(openingCashForThisPeriod)}`);
        this.recordAudit('calculatedOpeningCash', openingCashForThisPeriod, 'input_driver_p0_cash');
    } else {
        if (!this.previousV || typeof this.previousV.closingCash === 'undefined' || this.previousV.closingCash === null) {
            console.error(`[CF_DEBUG P${this.periodIndex+1}] CRITICAL ERROR: Previous period (${this.periodIndex}) SSOT (V object) has invalid closingCash! Defaulting opening to 0.`);
            openingCashForThisPeriod = 0;
        } else {
            openingCashForThisPeriod = this.previousV.closingCash; // Use final SSOT closing cash from previous period's V
        }
        console.log(`[CF_DEBUG P${this.periodIndex+1}] Opening Cash from PREVIOUS PERIOD's final V.closingCash: ${formatCurrency(openingCashForThisPeriod)}`);
        this.recordAudit('calculatedOpeningCash', openingCashForThisPeriod, 'calculated_from_previous_ssot_v_closing_cash');
    }
    this.V.calculatedOpeningCash = openingCashForThisPeriod;
    
    const baseOperatingCashFlow = this.V.netProfit + this.V.depreciationAndAmortisation;
    this.assign('operatingCashFlow', 'override_operatingCashFlow', () => baseOperatingCashFlow);

    const currentWC = this.V.workingCapitalValue;
    const previousWC = this.previousV?.workingCapitalValue;
    let workingCapitalChangeCalculated;
    if (this.periodIndex === 0 || typeof previousWC === 'undefined' || previousWC === null) {
        workingCapitalChangeCalculated = currentWC; // First period's change is its own level
    } else {
        workingCapitalChangeCalculated = currentWC - previousWC;
    }
    this.assign('workingCapitalChange', 'override_workingCapitalChange', () => workingCapitalChangeCalculated);
    
    this.V.cashFromOpsAfterWC = this.V.operatingCashFlow - this.V.workingCapitalChange;
    this.recordAudit('cashFromOpsAfterWC', this.V.cashFromOpsAfterWC, 'calculated');
    
    this.V.netCashFlowBeforeFinancing = this.V.cashFromOpsAfterWC - this.V.capitalExpenditures; // V.capitalExpenditures is from parsed driver input
    this.recordAudit('netCashFlowBeforeFinancing', this.V.netCashFlowBeforeFinancing, 'calculated');

    const previousBankLoans = this.previousV?.totalBankLoans;
    let changeInDebtCalculated;
    if (this.periodIndex === 0 || typeof previousBankLoans === 'undefined' || previousBankLoans === null) {
        changeInDebtCalculated = this.V.totalBankLoans; // V.totalBankLoans is from parsed driver input
    } else {
        changeInDebtCalculated = this.V.totalBankLoans - previousBankLoans;
    }
    this.V.changeInDebt = changeInDebtCalculated;
    this.recordAudit('changeInDebt', this.V.changeInDebt, 'calculated');
    
    this.V.cashFlowFromFinancing = this.V.changeInDebt - this.V.dividendsPaid; // V.dividendsPaid is from parsed driver input
    this.recordAudit('cashFlowFromFinancing', this.V.cashFlowFromFinancing, 'calculated');
    
    this.V.netChangeInCash = this.V.netCashFlowBeforeFinancing + this.V.cashFlowFromFinancing;
    this.recordAudit('netChangeInCash', this.V.netChangeInCash, 'calculated');

    const calculatedDFCClosingCash = this.V.calculatedOpeningCash + this.V.netChangeInCash;
    console.log(`[CF_DEBUG P${this.periodIndex+1}] 💰 DFC BRIDGE: Opening(${formatCurrency(this.V.calculatedOpeningCash)}) + NetChange(${formatCurrency(this.V.netChangeInCash)}) = DFC_Closing_Calc(${formatCurrency(calculatedDFCClosingCash)})`);
    
    const closingCashOverride = getOverrideValue(this.rawInput, 'override_closingCash');
    console.log(`[CF_DEBUG P${this.periodIndex+1}] Override Check: rawInput.override_closingCash = "${this.rawInput.override_closingCash}", parsed as = ${closingCashOverride !== null ? formatCurrency(closingCashOverride) : 'null'}`);
    
    let finalClosingCash;
    if (closingCashOverride !== null) {
        finalClosingCash = closingCashOverride;
        this.recordAudit('closingCash', finalClosingCash, 'override_applied', calculatedDFCClosingCash, 'override_closingCash');
        console.warn(`[CF_DEBUG P${this.periodIndex+1}] 🔧 OVERRIDE APPLIED: V.closingCash set to ${formatCurrency(finalClosingCash)} (Calculated DFC was ${formatCurrency(calculatedDFCClosingCash)})`);
    } else {
        finalClosingCash = calculatedDFCClosingCash;
        this.recordAudit('closingCash', finalClosingCash, 'calculated');
        console.log(`[CF_DEBUG P${this.periodIndex+1}] Using calculated DFC closing cash for V.closingCash: ${formatCurrency(finalClosingCash)}`);
    }
    this.V.closingCash = finalClosingCash; 
    console.log(`[CF_DEBUG P${this.periodIndex+1}] VERIFICATION - V.closingCash after assignment: ${formatCurrency(this.V.closingCash)}`);
    if (Math.abs(this.V.closingCash - finalClosingCash) > 0.001) { 
        console.error(`[CF_DEBUG P${this.periodIndex+1}] 🚨 CRITICAL ASSIGNMENT FAILED! Expected V.closingCash: ${formatCurrency(finalClosingCash)}, Got: ${formatCurrency(this.V.closingCash)}`);
    }
    
    this.V.cashReconciliationDifference = (closingCashOverride !== null) ? (finalClosingCash - calculatedDFCClosingCash) : 0;
    this.recordAudit('cashReconciliationDifference', this.V.cashReconciliationDifference, 'calculated_reconciliation');
    if (this.V.cashReconciliationDifference !== 0) {
        console.log(`[CF_DEBUG P${this.periodIndex+1}]   Cash Reconciliation Difference stored: ${formatCurrency(this.V.cashReconciliationDifference)}`);
    }
    
    this.V.fundingGapOrSurplus = -this.V.netCashFlowBeforeFinancing;
    this.recordAudit('fundingGapOrSurplus', this.V.fundingGapOrSurplus, 'calculated');
    console.log(`=== END CASH FLOW DEBUG - Period ${this.periodIndex + 1} ===\n`);
  }

  calculateBalanceSheet() {
    // Ensure this method uses this.V.closingCash (which is now the final, possibly overridden, value)
    const initialEquityP0 = this.periodIndex === 0 ? parseToNumber(this.rawInput.initialEquity, 0) : 0;
    const equityCalc = this.periodIndex === 0 ? initialEquityP0 + this.V.retainedProfit : (this.previousV?.equity || 0) + this.V.retainedProfit;
    this.assign('equity', 'override_equity_ending', () => equityCalc);

    this.V.arValueForBS = getOverrideValue(this.rawInput, 'override_AR_ending') ?? this.V.accountsReceivableValueAvg;
    this.V.inventoryValueForBS = getOverrideValue(this.rawInput, 'override_Inventory_ending') ?? this.V.inventoryValueAvg;
    this.V.accountsPayableValueForBS = getOverrideValue(this.rawInput, 'override_AP_ending') ?? this.V.accountsPayableValueAvg;

    this.recordAudit('arValueForBS', this.V.arValueForBS, getOverrideValue(this.rawInput, 'override_AR_ending') !== null ? 'override_applied' : 'input_avg_proxy');
    this.recordAudit('inventoryValueForBS', this.V.inventoryValueForBS, getOverrideValue(this.rawInput, 'override_Inventory_ending') !== null ? 'override_applied' : 'input_avg_proxy');
    this.recordAudit('accountsPayableValueForBS', this.V.accountsPayableValueForBS, getOverrideValue(this.rawInput, 'override_AP_ending') !== null ? 'override_applied' : 'input_avg_proxy');

    const currentAssetsCalc = this.V.closingCash + this.V.arValueForBS + this.V.inventoryValueForBS;
    this.assign('estimatedCurrentAssets', 'override_totalCurrentAssets', () => currentAssetsCalc);

    const totalAssetsCalc = this.V.estimatedCurrentAssets + this.V.netFixedAssets; // netFixedAssets is from V (input_driver)
    this.assign('estimatedTotalAssets', 'override_totalAssets', () => totalAssetsCalc);
    
    const currentLiabCalc = this.V.accountsPayableValueForBS; 
    this.assign('estimatedCurrentLiabilities', 'override_totalCurrentLiabilities', () => currentLiabCalc);
    
    this.V.estimatedNonCurrentLiabilities = this.V.totalBankLoans; // totalBankLoans from V (input_driver)
    this.recordAudit('estimatedNonCurrentLiabilities', this.V.estimatedNonCurrentLiabilities, 'calculated_assumption');

    const totalLiabCalc = this.V.estimatedCurrentLiabilities + this.V.estimatedNonCurrentLiabilities;
    this.assign('estimatedTotalLiabilities', 'override_totalLiabilities', () => totalLiabCalc);
    
    console.log(`[BS_DEBUG P${this.periodIndex+1}] BEFORE final BS Diff: A=${formatCurrency(this.V.estimatedTotalAssets)}, L=${formatCurrency(this.V.estimatedTotalLiabilities)}, E=${formatCurrency(this.V.equity)}`);
    this.V.balanceSheetDifference = this.V.estimatedTotalAssets - (this.V.estimatedTotalLiabilities + this.V.equity);
    this.recordAudit('balanceSheetDifference', this.V.balanceSheetDifference, 'calculated_final_check');
    console.log(`[BS_DEBUG P${this.periodIndex+1}] AFTER final BS Diff: ${formatCurrency(this.V.balanceSheetDifference)}`);
  }

  calculateKpis() {
    this.V.gmPct = this.V.revenue ? (this.V.grossProfit / this.V.revenue) * 100 : 0;
    this.V.opProfitPct = this.V.revenue ? (this.V.ebit / this.V.revenue) * 100 : 0;
    this.V.netProfitPct = this.V.revenue ? (this.V.netProfit / this.V.revenue) * 100 : 0;
    
    this.recordAudit('gmPct', this.V.gmPct, 'kpi');
    this.recordAudit('opProfitPct', this.V.opProfitPct, 'kpi');
    this.recordAudit('netProfitPct', this.V.netProfitPct, 'kpi');
    
    this.V.arPer100Revenue = this.V.revenue ? (this.V.accountsReceivableValueAvg / this.V.revenue) * 100 : 0;
    this.V.inventoryPer100Revenue = this.V.revenue ? (this.V.inventoryValueAvg / this.V.revenue) * 100 : 0;
    this.V.apPer100Revenue = this.V.cogs ? (this.V.accountsPayableValueAvg / this.V.cogs) * 100 : 0;
    this.V.wcPer100Revenue = this.V.revenue ? (this.V.workingCapitalValue / this.V.revenue) * 100 : 0;
    
    this.recordAudit('arPer100Revenue', this.V.arPer100Revenue, 'kpi');
    this.recordAudit('inventoryPer100Revenue', this.V.inventoryPer100Revenue, 'kpi');
    this.recordAudit('apPer100Revenue', this.V.apPer100Revenue, 'kpi');
    this.recordAudit('wcPer100Revenue', this.V.wcPer100Revenue, 'kpi');
  }
  
  run() {
    const overrideValidationResults = OverrideValidator.validateOverrideConsistency(this.rawInput);
    this.validationIssues.errors.push(...overrideValidationResults.errors);
    this.validationIssues.warnings.push(...overrideValidationResults.warnings);

    this.calculatePnl();
    this.calculateWorkingCapital();
    this.calculateCashFlow(); 
    this.calculateBalanceSheet();
    this.calculateKpis();

    const periodFinancialConstraints = FinancialConstraintValidator.validateAllStatements(this.V, this.previousV);
    this.validationIssues.errors.push(...periodFinancialConstraints.errors);
    this.validationIssues.warnings.push(...periodFinancialConstraints.warnings);
    this.validationIssues.infos.push(...(periodFinancialConstraints.infos || []));
    this.validationIssues.successes.push(...(periodFinancialConstraints.successes || []));

    // Construct the final SSOT object for this period
    const finalResult = {};
    // First, copy all original parsed inputs (from rawInput for record-keeping)
    Object.keys(this.rawInput).forEach(key => {
      if (fieldDefinitions[key] || key.startsWith('override_')) {
        finalResult[key] = this.rawInput[key]; // Store original string/null value
      }
    });
    // Then, spread all final values from V (calculated or overridden, all parsed to numbers)
    Object.assign(finalResult, this.V);
    
    // Ensure specific aliases and display formats for percentages are from V
    finalResult.gmPct = this.V.gmPct; 
    finalResult.opProfitPct = this.V.opProfitPct;
    finalResult.netProfitPct = this.V.netProfitPct;
    finalResult.incomeTaxRatePercentageActual = this.V.incomeTaxRatePercentageActual; // Store the 0-1 decimal rate
    // The input periodInput.incomeTaxRatePercentage (0-100) is already in finalResult from rawInput spread

    finalResult.arDays = this.V.arDaysDerived;
    finalResult.invDays = this.V.inventoryDaysDerived;
    finalResult.apDays = this.V.apDaysDerived;
    finalResult.wcDays = this.V.wcDays;
    // Keep original openingCash & initialEquity inputs for P0, but DFC uses calculatedOpeningCash
    finalResult.openingCash = this.periodIndex === 0 ? parseToNumber(this.rawInput.openingCash, 0) : this.V.calculatedOpeningCash;
    finalResult.initialEquity = this.periodIndex === 0 ? parseToNumber(this.rawInput.initialEquity, 0) : null;
    
    // Add metadata
    finalResult._auditTrail = this.auditTrail;
    finalResult._validationIssues = this.validationIssues;
    finalResult._overridesSummary = this.V._overridesSummary || { count: 0, details: {} };
    finalResult._periodIndex = this.periodIndex;
    finalResult._isFirstPeriod = this.periodIndex === 0;
    finalResult._isLastPeriod = false;
    finalResult._calculationTimestamp = new Date().toISOString();
    
    console.log(`[ENGINE_RUN P${this.periodIndex+1}] Final SSOT: closingCash=${formatCurrency(finalResult.closingCash)}, BS_Diff=${formatCurrency(finalResult.balanceSheetDifference)}`);
    return finalResult;
  }
}

export function processFinancialData(periodsInputDataRaw, periodTypeLabel) {
  if (!periodsInputDataRaw || periodsInputDataRaw.length === 0) return [];
  const daysInPeriod = PERIOD_TYPES[periodTypeLabel]?.days || 365;
  const results = [];
  let previousPeriod_V_State = null; // Store the V object from previous engine

  for (let i = 0; i < periodsInputDataRaw.length; i++) {
    try {
        const engine = new FinancialCalculationEngine(periodsInputDataRaw[i], previousPeriod_V_State, i, daysInPeriod);
        const calculatedPeriod = engine.run();
        if (i === periodsInputDataRaw.length - 1) {
            calculatedPeriod._isLastPeriod = true;
        }
        results.push(calculatedPeriod);
        previousPeriod_V_State = engine.V; // Pass the *current* engine's final V state for the *next* iteration
    } catch (error) { 
        console.error(`[processFinancialData] CRITICAL ERROR Processing Period ${i + 1}:`, error);
        results.push({ 
            ...(periodsInputDataRaw[i] || {}), _periodIndex: i, _calculationError: error.message,
            _validationIssues: { errors: [{type: 'ENGINE_FATAL_ERROR', message: `Erro Crítico Motor Cálculo: ${error.message}`, severity: 'critical'}], warnings:[], infos:[], successes:[] }
        });
        previousPeriod_V_State = null; // Reset on critical error to prevent cascading bad data
    }
  }
  return results;
}

export function diagnoseBalanceSheetDifference(calculatedData) {
  if (!calculatedData || calculatedData.length === 0) return null;
  const latest = calculatedData[calculatedData.length - 1];
  if (!latest || typeof latest.balanceSheetDifference === 'undefined') return null;
  
  const diagnosis = {
    periodIndex: latest._periodIndex,
    balanceSheetDifference: latest.balanceSheetDifference,
    components: {
      totalAssets: latest.estimatedTotalAssets,
      totalLiabilities: latest.estimatedTotalLiabilities,
      equity: latest.equity,
      totalLiabilitiesAndEquity: (latest.estimatedTotalLiabilities || 0) + (latest.equity || 0)
    },
    breakdown: {
      assets: {
        currentAssets: latest.estimatedCurrentAssets,
        fixedAssets: latest.netFixedAssets,
        cash: latest.closingCash,
        accountsReceivable: latest.arValueForBS,
        inventory: latest.inventoryValueForBS
      },
      liabilities: {
        currentLiabilities: latest.estimatedCurrentLiabilities,
        nonCurrentLiabilities: latest.estimatedNonCurrentLiabilities,
        accountsPayable: latest.accountsPayableValueForBS,
        bankLoans: latest.totalBankLoans
      }
    },
    overrides: latest._overridesSummary || {},
    validationIssues: latest._validationIssues || { errors: [], warnings: [] },
    recommendations: []
  };
  
  if (Math.abs(diagnosis.balanceSheetDifference) > 1000) {
    diagnosis.recommendations.push('Revisar inputs de Balanço para identificar possíveis inconsistências');
  }
  
  return diagnosis;
}