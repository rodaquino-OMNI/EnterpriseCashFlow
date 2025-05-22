/* eslint-disable no-restricted-globals */
// src/workers/financialCalculator.worker.js
import { processFinancialData } from '../utils/calculations.js'; 
// Note: Ensure your bundler (if used for workers) can handle this import path,
// or you might need to inline processFinancialData or use a different import mechanism for workers.
// For simple cases, you might even copy the processFinancialData function directly into this worker file.

self.onmessage = function(event) {
  const { periodsInputDataRaw, periodTypeLabel } = event.data;

  console.log("Worker received data:", { periodsInputDataRaw, periodTypeLabel });

  try {
    // Assuming processFinancialData is available in this scope
    // If not, and you can't use modules directly in your worker setup,
    // you might need to make processFinancialData a global function or pass its source.
    const calculatedData = processFinancialData(periodsInputDataRaw, periodTypeLabel);

    self.postMessage({
      success: true,
      data: calculatedData,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error("Error in financialCalculator.worker.js:", error);
    self.postMessage({
      success: false,
      error: error.message,
      stack: error.stack, // Send stack for better debugging
      timestamp: Date.now()
    });
  }
};