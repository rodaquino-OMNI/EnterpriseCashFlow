/**
 * Component Tests for ManualDataEntry
 * Tests the manual data input form using React Testing Library
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManualDataEntry from '../InputPanel/ManualDataEntry'; // Fixed: default import
import { createMockFinancialData } from '../../__tests__/utils/testDataFactories.comprehensive';

describe('ManualDataEntry Component', () => {
  const defaultProps = {
    numberOfPeriods: 4,
    onNumberOfPeriodsChange: jest.fn(),
    periodType: 'MONTHLY',
    onPeriodTypeChange: jest.fn(),
    inputData: Array(4).fill(null).map(() => ({})),
    onInputChange: jest.fn(),
    onSubmit: jest.fn(),
    isLoading: false,
    validationErrors: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  describe('Rendering', () => {
    it('should render basic component structure', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByText('Entrada Manual de Dados - Modo Adaptativo')).toBeInTheDocument();
      expect(screen.getByLabelText(/Número de Períodos/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tipo de Período/i)).toBeInTheDocument();
    });

    it('should render driver fields table', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByText('📋 Dados Principais / Drivers Essenciais')).toBeInTheDocument();
      expect(screen.getByText('Período 1')).toBeInTheDocument();
      expect(screen.getByText('Período 4')).toBeInTheDocument();
    });

    it('should handle different number of periods', () => {
      const props = { ...defaultProps, numberOfPeriods: 2, inputData: Array(2).fill(null).map(() => ({})) };
      render(<ManualDataEntry {...props} />);
      
      expect(screen.getByText('Período 1')).toBeInTheDocument();
      expect(screen.getByText('Período 2')).toBeInTheDocument();
      expect(screen.queryByText('Período 3')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle number of periods change', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const periodsSelect = screen.getByLabelText(/Número de Períodos/i);
      await user.selectOptions(periodsSelect, '3');
      
      expect(defaultProps.onNumberOfPeriodsChange).toHaveBeenCalledWith(3);
    });

    it('should handle period type change', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const typeSelect = screen.getByLabelText(/Tipo de Período/i);
      await user.selectOptions(typeSelect, 'QUARTERLY');
      
      expect(defaultProps.onPeriodTypeChange).toHaveBeenCalledWith('QUARTERLY');
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      const firstInput = inputs[0];
      
      await user.clear(firstInput);
      await user.type(firstInput, '1000000');
      
      expect(defaultProps.onInputChange).toHaveBeenCalled();
    });
  });

  describe('Submit functionality', () => {
    it('should handle submit action', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const submitButton = screen.getByText('Gerar Relatório com Dados Atuais');
      await user.click(submitButton);
      
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('should show loading state', () => {
      const props = { ...defaultProps, isLoading: true };
      render(<ManualDataEntry {...props} />);
      
      expect(screen.getByText('Processando...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Override sections', () => {
    it('should render override sections as collapsed by default', () => {
      render(<ManualDataEntry {...defaultProps} />);
      
      expect(screen.getByText(/DRE - Itens de Resultado/)).toBeInTheDocument();
      expect(screen.getByText(/Balanço Patrimonial/)).toBeInTheDocument();
      expect(screen.getByText(/Fluxo de Caixa/)).toBeInTheDocument();
    });

    it('should expand override sections when clicked', async () => {
      const user = userEvent.setup();
      render(<ManualDataEntry {...defaultProps} />);
      
      const plSection = screen.getByText(/DRE - Itens de Resultado/);
      await user.click(plSection);
      
      // Section should expand and show additional content
      expect(screen.getByText(/Override/)).toBeInTheDocument();
    });
  });
});