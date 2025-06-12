/**
 * Component Tests for ManualDataEntry
 * Tests the manual data input form using React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualDataEntry } from '../InputPanel/ManualDataEntry';
import { createMockFinancialData } from '../../__tests__/utils/testDataFactories.comprehensive';

describe('ManualDataEntry Component', () => {
  const defaultProps = {
    numberOfPeriods: 4,
    onDataSubmit: jest.fn(),
    onNavigate: jest.fn(),
    isSubmitting: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  describe('Rendering', () => {
    it('should render correct number of period tabs', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByText('Período 1')).toBeInTheDocument();
      expect(screen.getByText('Período 2')).toBeInTheDocument();
      expect(screen.getByText('Período 3')).toBeInTheDocument();
      expect(screen.getByText('Período 4')).toBeInTheDocument();
    });

    it('should render all required input fields', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      // Income statement fields
      expect(screen.getByLabelText(/Receita.*obrigatório/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Margem Bruta.*obrigatório/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Despesas Operacionais.*obrigatório/i)).toBeInTheDocument();
      
      // Working capital fields
      expect(screen.getByLabelText(/Prazo Médio de Recebimento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Prazo Médio de Estoques/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Prazo Médio de Pagamento/i)).toBeInTheDocument();
    });

    it('should show optional fields correctly', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByLabelText(/Depreciação/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Despesas Financeiras/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/CAPEX/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Dividendos/i)).toBeInTheDocument();
    });

    it('should handle different number of periods', () => {
      const { rerender } = render(<ManualDataEntry {...defaultProps} numberOfPeriods={2} />);
      
      expect(screen.getByText('Período 1')).toBeInTheDocument();
      expect(screen.getByText('Período 2')).toBeInTheDocument();
      expect(screen.queryByText('Período 3')).not.toBeInTheDocument();
      
      rerender(<ManualDataEntry {...defaultProps} numberOfPeriods={6} />);
      
      expect(screen.getByText('Período 6')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should switch between period tabs', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Initially on Period 1
      expect(screen.getByRole('tab', { name: 'Período 1' })).toHaveClass('bg-blue-600');
      
      // Click on Period 2
      await user.click(screen.getByText('Período 2'));
      
      expect(screen.getByRole('tab', { name: 'Período 2' })).toHaveClass('bg-blue-600');
      expect(screen.getByRole('tab', { name: 'Período 1' })).not.toHaveClass('bg-blue-600');
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const revenueInput = screen.getByLabelText(/Receita.*obrigatório/i);
      
      await user.clear(revenueInput);
      await user.type(revenueInput, '1000000');
      
      expect(revenueInput).toHaveValue(1000000);
    });

    it('should navigate between periods using navigation buttons', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Click next
      await user.click(screen.getByText('Próximo'));
      expect(screen.getByRole('tab', { name: 'Período 2' })).toHaveClass('bg-blue-600');
      
      // Click previous
      await user.click(screen.getByText('Anterior'));
      expect(screen.getByRole('tab', { name: 'Período 1' })).toHaveClass('bg-blue-600');
    });

    it('should show submit button on last period', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Navigate to last period
      await user.click(screen.getByText('Período 4'));
      
      expect(screen.getByText('Processar Dados')).toBeInTheDocument();
      expect(screen.queryByText('Próximo')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Try to submit without filling required fields
      await user.click(screen.getByText('Período 4'));
      await user.click(screen.getByText('Processar Dados'));
      
      expect(defaultProps.onDataSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/preencha todos os campos obrigatórios/i)).toBeInTheDocument();
    });

    it('should validate gross margin percentage range', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const marginInput = screen.getByLabelText(/Margem Bruta.*obrigatório/i);
      
      // Test invalid high value
      await user.clear(marginInput);
      await user.type(marginInput, '150');
      await user.tab(); // Trigger blur
      
      expect(screen.getByText(/deve estar entre 0 e 100/i)).toBeInTheDocument();
      
      // Test valid value
      await user.clear(marginInput);
      await user.type(marginInput, '45');
      await user.tab();
      
      expect(screen.queryByText(/deve estar entre 0 e 100/i)).not.toBeInTheDocument();
    });

    it('should validate negative values', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const revenueInput = screen.getByLabelText(/Receita.*obrigatório/i);
      
      await user.clear(revenueInput);
      await user.type(revenueInput, '-1000');
      await user.tab();
      
      expect(screen.getByText(/não pode ser negativo/i)).toBeInTheDocument();
    });

    it('should allow negative values for specific fields', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const debtChangeInput = screen.getByLabelText(/Variação.*Empréstimos/i);
      
      await user.clear(debtChangeInput);
      await user.type(debtChangeInput, '-50000');
      await user.tab();
      
      expect(screen.queryByText(/não pode ser negativo/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Submission', () => {
    it('should submit valid data correctly', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Fill required fields for all periods
      for (let i = 1; i <= 4; i++) {
        await user.click(screen.getByText(`Período ${i}`));
        
        await user.type(screen.getByLabelText(/Receita.*obrigatório/i), `${1000000 * i}`);
        await user.type(screen.getByLabelText(/Margem Bruta.*obrigatório/i), '45');
        await user.type(screen.getByLabelText(/Despesas Operacionais.*obrigatório/i), `${300000 * i}`);
      }
      
      // Submit
      await user.click(screen.getByText('Processar Dados'));
      
      await waitFor(() => {
        expect(defaultProps.onDataSubmit).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              revenue: 1000000,
              grossMarginPercent: 45,
              operatingExpenses: 300000
            })
          ])
        );
      });
    });

    it('should handle submission loading state', () => {
      render(<ManualDataEntry {...defaultProps} isSubmitting={true} />);
      
      const submitButton = screen.getByRole('button', { name: /processando/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/processando/i)).toBeInTheDocument();
    });

    it('should include all filled optional fields in submission', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Fill required and optional fields
      await user.type(screen.getByLabelText(/Receita.*obrigatório/i), '1000000');
      await user.type(screen.getByLabelText(/Margem Bruta.*obrigatório/i), '45');
      await user.type(screen.getByLabelText(/Despesas Operacionais.*obrigatório/i), '300000');
      await user.type(screen.getByLabelText(/Depreciação/i), '20000');
      await user.type(screen.getByLabelText(/CAPEX/i), '50000');
      
      // Navigate to last period and submit
      await user.click(screen.getByText('Período 4'));
      // Fill required fields for period 4
      await user.type(screen.getByLabelText(/Receita.*obrigatório/i), '1000000');
      await user.type(screen.getByLabelText(/Margem Bruta.*obrigatório/i), '45');
      await user.type(screen.getByLabelText(/Despesas Operacionais.*obrigatório/i), '300000');
      
      await user.click(screen.getByText('Processar Dados'));
      
      await waitFor(() => {
        expect(defaultProps.onDataSubmit).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              depreciation: 20000,
              capex: 50000
            })
          ])
        );
      });
    });
  });

  describe('Auto-save Feature', () => {
    it('should auto-save data to localStorage', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/Receita.*obrigatório/i), '1000000');
      
      // Wait for debounce
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'enterpriseCashFlow_manualEntry_draft',
          expect.stringContaining('1000000')
        );
      }, { timeout: 3500 });
    });

    it('should load saved data on mount', () => {
      const savedData = {
        periods: [
          { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 }
        ]
      };
      
      Storage.prototype.getItem.mockReturnValue(JSON.stringify(savedData));
      
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByLabelText(/Receita.*obrigatório/i)).toHaveValue(1000000);
      expect(screen.getByLabelText(/Margem Bruta.*obrigatório/i)).toHaveValue(45);
    });

    it('should clear saved data after successful submission', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Fill all required fields
      for (let i = 1; i <= 4; i++) {
        await user.click(screen.getByText(`Período ${i}`));
        await user.type(screen.getByLabelText(/Receita.*obrigatório/i), '1000000');
        await user.type(screen.getByLabelText(/Margem Bruta.*obrigatório/i), '45');
        await user.type(screen.getByLabelText(/Despesas Operacionais.*obrigatório/i), '300000');
      }
      
      await user.click(screen.getByText('Processar Dados'));
      
      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('enterpriseCashFlow_manualEntry_draft');
      });
    });
  });

  describe('Period Summary', () => {
    it('should show calculated values in summary', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      await user.type(screen.getByLabelText(/Receita.*obrigatório/i), '1000000');
      await user.type(screen.getByLabelText(/Margem Bruta.*obrigatório/i), '45');
      
      // Check if summary shows calculated values
      expect(screen.getByText(/Lucro Bruto Estimado/i)).toBeInTheDocument();
      expect(screen.getByText(/450\.000/)).toBeInTheDocument(); // 45% of 1M
    });

    it('should update summary when values change', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const revenueInput = screen.getByLabelText(/Receita.*obrigatório/i);
      const marginInput = screen.getByLabelText(/Margem Bruta.*obrigatório/i);
      
      await user.type(revenueInput, '1000000');
      await user.type(marginInput, '50');
      
      expect(screen.getByText(/500\.000/)).toBeInTheDocument(); // 50% of 1M
      
      await user.clear(marginInput);
      await user.type(marginInput, '40');
      
      expect(screen.getByText(/400\.000/)).toBeInTheDocument(); // 40% of 1M
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between fields', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const revenueInput = screen.getByLabelText(/Receita.*obrigatório/i);
      const marginInput = screen.getByLabelText(/Margem Bruta.*obrigatório/i);
      
      await user.click(revenueInput);
      await user.tab();
      
      expect(marginInput).toHaveFocus();
    });

    it('should support keyboard shortcuts for period navigation', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      // Press Ctrl+Right to go to next period
      await user.keyboard('{Control>}{ArrowRight}{/Control}');
      
      expect(screen.getByRole('tab', { name: 'Período 2' })).toHaveClass('bg-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const marginInput = screen.getByLabelText(/Margem Bruta.*obrigatório/i);
      
      await user.type(marginInput, '150');
      await user.tab();
      
      const errorMessage = screen.getByText(/deve estar entre 0 e 100/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('should have keyboard-accessible tabs', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const firstTab = screen.getByRole('tab', { name: 'Período 1' });
      await user.click(firstTab);
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Período 2' })).toHaveFocus();
    });
  });
});