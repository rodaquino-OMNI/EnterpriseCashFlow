import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the worker environment
const mockPostMessage = jest.fn();
const mockWorkerScope = {
  postMessage: mockPostMessage,
  onmessage: null,
};

// Mock the calculations module
jest.mock('../../utils/calculations.js', () => ({
  processFinancialData: jest.fn(),
}));

describe('Financial Calculator Worker', () => {
  let originalSelf;

  beforeEach(() => {
    // Store original self
    originalSelf = global.self;
    // Set up worker mock
    global.self = mockWorkerScope;
    mockPostMessage.mockClear();
    jest.clearAllMocks();
    // Reset module cache to allow worker code to re-execute
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original self
    global.self = originalSelf;
  });

  describe('Basic Worker Functionality', () => {
    it('should handle successful calculation messages', async () => {
      // Import after setting up mocks
      const { processFinancialData } = await import('../../utils/calculations.js');
      
      // Mock successful calculation
      const mockCalculatedData = {
        periodIndex: 0,
        incomeStatement: { revenue: 1000000, netIncome: 200000 },
        cashFlow: { operatingCashFlow: 250000 },
      };
      processFinancialData.mockReturnValue(mockCalculatedData);

      // Import worker
      await import('../../workers/financialCalculator.worker.js');

      // Simulate message
      const messageData = {
        periodsInputDataRaw: [{ revenue: 1000000 }],
        periodTypeLabel: 'MONTHLY',
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify response
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: true,
        data: mockCalculatedData,
        timestamp: expect.any(Number),
      });
    });

    it('should handle calculation errors gracefully', async () => {
      const { processFinancialData } = await import('../../utils/calculations.js');
      
      // Mock error
      const error = new Error('Calculation failed');
      processFinancialData.mockImplementation(() => {
        throw error;
      });

      // Import worker
      await import('../../workers/financialCalculator.worker.js');

      // Simulate message
      const messageData = {
        periodsInputDataRaw: [{ revenue: -1000 }],
        periodTypeLabel: 'MONTHLY',
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify error response
      expect(mockPostMessage).toHaveBeenCalledWith({
        success: false,
        error: 'Calculation failed',
        stack: expect.any(String),
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Advanced Financial Calculations', () => {
    it('should handle NPV calculation message', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'NPV',
        cashFlows: [100000, 150000, 200000, 250000],
        discountRate: 0.1,
        initialInvestment: 500000,
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify NPV calculation
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'NPV',
          result: expect.objectContaining({
            npv: expect.any(Number),
            profitabilityIndex: expect.any(Number),
          }),
        }),
      );
    });

    it('should handle IRR calculation message', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'IRR',
        cashFlows: [-500000, 100000, 150000, 200000, 250000],
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify IRR calculation
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'IRR',
          result: expect.objectContaining({
            irr: expect.any(Number),
            isValid: true,
          }),
        }),
      );
    });

    it('should handle payback period calculation', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'PAYBACK',
        cashFlows: [100000, 150000, 200000, 250000],
        initialInvestment: 400000,
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify payback calculation
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'PAYBACK',
          result: expect.objectContaining({
            paybackPeriod: expect.any(Number),
            isWithinProjectLife: true,
          }),
        }),
      );
    });

    it('should handle break-even analysis', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'BREAKEVEN',
        fixedCosts: 500000,
        variableCostPerUnit: 50,
        pricePerUnit: 100,
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify break-even calculation
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'BREAKEVEN',
          result: expect.objectContaining({
            breakEvenUnits: expect.any(Number),
            breakEvenRevenue: expect.any(Number),
            contributionMargin: expect.any(Number),
          }),
        }),
      );
    });

    it('should handle cash flow projections', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'PROJECTION',
        baseCashFlow: 100000,
        growthRate: 0.1,
        periods: 5,
        discountRate: 0.08,
      };

      mockWorkerScope.onmessage({ data: messageData });

      // Verify projection calculation
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'PROJECTION',
          result: expect.objectContaining({
            projectedCashFlows: expect.any(Array),
            presentValues: expect.any(Array),
            totalPV: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe('Performance and Large Dataset Handling', () => {
    it('should handle large dataset calculations efficiently', async () => {
      const { processFinancialData } = await import('../../utils/calculations.js');
      
      // Create large dataset
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        revenue: 1000000 + i * 10000,
        operatingExpenses: 600000 + i * 5000,
      }));

      processFinancialData.mockReturnValue(largeDataset);

      await import('../../workers/financialCalculator.worker.js');

      const startTime = Date.now();

      mockWorkerScope.onmessage({
        data: {
          periodsInputDataRaw: largeDataset,
          periodTypeLabel: 'MONTHLY',
        },
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time
      expect(processingTime).toBeLessThan(1000); // 1 second max
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: largeDataset,
        }),
      );
    });

    it('should batch process multiple calculation types', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'BATCH',
        calculations: [
          {
            type: 'NPV',
            params: {
              cashFlows: [100000, 150000, 200000],
              discountRate: 0.1,
              initialInvestment: 300000,
            },
          },
          {
            type: 'IRR',
            params: {
              cashFlows: [-300000, 100000, 150000, 200000],
            },
          },
          {
            type: 'PAYBACK',
            params: {
              cashFlows: [100000, 150000, 200000],
              initialInvestment: 300000,
            },
          },
        ],
      };

      mockWorkerScope.onmessage({ data: messageData });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'BATCH',
          results: expect.arrayContaining([
            expect.objectContaining({ type: 'NPV' }),
            expect.objectContaining({ type: 'IRR' }),
            expect.objectContaining({ type: 'PAYBACK' }),
          ]),
        }),
      );
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate NPV inputs', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const invalidMessages = [
        {
          type: 'NPV',
          cashFlows: [], // Empty cash flows
          discountRate: 0.1,
        },
        {
          type: 'NPV',
          cashFlows: [100000],
          discountRate: -0.5, // Negative discount rate
        },
        {
          type: 'NPV',
          cashFlows: ['invalid'], // Non-numeric values
          discountRate: 0.1,
        },
      ];

      invalidMessages.forEach((messageData) => {
        mockPostMessage.mockClear();
        mockWorkerScope.onmessage({ data: messageData });

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.any(String),
          }),
        );
      });
    });

    it('should handle unknown calculation types', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messageData = {
        type: 'UNKNOWN_TYPE',
        data: {},
      };

      mockWorkerScope.onmessage({ data: messageData });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Unknown calculation type'),
        }),
      );
    });

    it('should handle thread safety for concurrent calculations', async () => {
      await import('../../workers/financialCalculator.worker.js');

      const messages = [
        {
          type: 'NPV',
          id: 'calc1',
          cashFlows: [100000, 150000],
          discountRate: 0.1,
        },
        {
          type: 'IRR',
          id: 'calc2',
          cashFlows: [-200000, 100000, 150000],
        },
      ];

      // Send multiple messages quickly
      messages.forEach((msg) => {
        mockWorkerScope.onmessage({ data: msg });
      });

      // Verify both calculations completed
      expect(mockPostMessage).toHaveBeenCalledTimes(2);
      
      const calls = mockPostMessage.mock.calls;
      const calc1Result = calls.find(call => call[0].id === 'calc1');
      const calc2Result = calls.find(call => call[0].id === 'calc2');

      expect(calc1Result).toBeDefined();
      expect(calc2Result).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources after calculation', async () => {
      await import('../../workers/financialCalculator.worker.js');

      // Create a large calculation
      const largeCalculation = {
        type: 'PROJECTION',
        baseCashFlow: 1000000,
        growthRate: 0.05,
        periods: 100, // Large number of periods
        discountRate: 0.08,
      };

      mockWorkerScope.onmessage({ data: largeCalculation });

      // Verify calculation completed
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'PROJECTION',
        }),
      );

      // Send cleanup message
      mockWorkerScope.onmessage({ data: { type: 'CLEANUP' } });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          type: 'CLEANUP',
          message: 'Resources cleaned up',
        }),
      );
    });
  });
});