// src/components/InputPanel/__tests__/ValidationErrorPanel.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidationErrorPanel from '../ValidationErrorPanel';
import { fieldDefinitions } from '../../../utils/fieldDefinitions';

describe('ValidationErrorPanel', () => {
  const mockOnDismiss = jest.fn();

  const sampleValidationErrors = [
    {
      period: 1,
      fields: {
        revenue: 'Receita Líquida é obrigatório.',
        grossMarginPercentage: 'Margem Bruta % é obrigatório.',
        openingCash: 'Caixa Inicial (1º Período) é obrigatório.',
      },
    },
    {
      period: 2,
      fields: {
        revenue: 'Receita Líquida não pode ser negativo.',
        operatingExpenses: 'Despesas Operacionais (SG&A) é obrigatório.',
      },
    },
  ];

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  it('should not render when validationErrors is null', () => {
    const { container } = render(
      <ValidationErrorPanel validationErrors={null} onDismiss={mockOnDismiss} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render when validationErrors is empty array', () => {
    const { container } = render(
      <ValidationErrorPanel validationErrors={[]} onDismiss={mockOnDismiss} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render error panel with correct title and count', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Erros de Validação Detectados')).toBeInTheDocument();
    expect(screen.getByText(/5 campos com problemas em 2 períodos/i)).toBeInTheDocument();
  });

  it('should render period headers with error counts', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    expect(screen.getByText(/Período 1/i)).toBeInTheDocument();
    expect(screen.getByText(/3 erros/i)).toBeInTheDocument();
    expect(screen.getByText(/Período 2/i)).toBeInTheDocument();
    expect(screen.getByText(/2 erros/i)).toBeInTheDocument();
  });

  it('should expand and show field errors when period is clicked', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    // First period should be expanded by default
    expect(screen.getByText('Receita Líquida é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Margem Bruta % é obrigatório.')).toBeInTheDocument();
  });

  it('should toggle period expansion when header is clicked', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    // Period 1 is expanded by default
    expect(screen.getByText('Receita Líquida é obrigatório.')).toBeInTheDocument();

    // Click to collapse
    const period1Header = screen.getByText(/Período 1/i).closest('button');
    fireEvent.click(period1Header);

    // Errors should be hidden
    expect(screen.queryByText('Receita Líquida é obrigatório.')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(period1Header);
    expect(screen.getByText('Receita Líquida é obrigatório.')).toBeInTheDocument();
  });

  it('should display field labels from fieldDefinitions', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    expect(screen.getByText(fieldDefinitions.revenue.label)).toBeInTheDocument();
    expect(screen.getByText(fieldDefinitions.grossMarginPercentage.label)).toBeInTheDocument();
    expect(screen.getByText(fieldDefinitions.openingCash.label)).toBeInTheDocument();
  });

  it('should display field groups', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    const groups = screen.getAllByText(fieldDefinitions.revenue.group);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toBeInTheDocument();
  });

  it('should display suggestions for required fields', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    // Check that suggestion boxes exist
    const suggestionElements = screen.getAllByText(/💡/);
    expect(suggestionElements.length).toBeGreaterThan(0);
  });

  it('should display help section with correction instructions', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Como corrigir:')).toBeInTheDocument();
    expect(screen.getByText(/Via Excel:/i)).toBeInTheDocument();
    expect(screen.getByText(/Via Manual:/i)).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByLabelText('Fechar painel de erros');
    fireEvent.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onDismiss is not provided', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} />);

    expect(screen.queryByLabelText('Fechar painel de erros')).not.toBeInTheDocument();
  });

  it('should display field type indicators', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    // Check for field type badges (using getAllByText since there are multiple)
    const currencyTypes = screen.getAllByText(/Tipo: 💵 Moeda/i);
    const percentageTypes = screen.getAllByText(/Tipo: 📊 Percentual/i);

    expect(currencyTypes.length).toBeGreaterThan(0);
    expect(percentageTypes.length).toBeGreaterThan(0);
  });

  it('should show "Obrigatório" badge for required fields', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    const requiredBadges = screen.getAllByText(/⚠️ Obrigatório/i);
    expect(requiredBadges.length).toBeGreaterThan(0);
  });

  it('should show "Apenas 1º Período" badge for first-period-only fields', () => {
    render(<ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />);

    // openingCash is first period only
    expect(screen.getByText(/🔹 Apenas 1º Período/i)).toBeInTheDocument();
  });

  it('should display appropriate icons for different field groups', () => {
    const errorWithDifferentGroups = [
      {
        period: 1,
        fields: {
          revenue: 'Receita Líquida é obrigatório.',
          openingCash: 'Caixa Inicial é obrigatório.',
          capitalExpenditures: 'CAPEX é obrigatório.',
        },
      },
    ];

    render(<ValidationErrorPanel validationErrors={errorWithDifferentGroups} onDismiss={mockOnDismiss} />);

    // Check that icons are present (testing presence of emoji text)
    const content = screen.getByText(/Período 1/i).closest('.bg-white').textContent;
    expect(content).toMatch(/📊|🏦|💰/); // Should contain at least one group icon
  });

  it('should handle errors for unknown fields gracefully', () => {
    const errorWithUnknownField = [
      {
        period: 1,
        fields: {
          unknownField: 'Este campo tem um erro.',
        },
      },
    ];

    render(<ValidationErrorPanel validationErrors={errorWithUnknownField} onDismiss={mockOnDismiss} />);

    // Should display the field key if definition is not found
    expect(screen.getByText('unknownField')).toBeInTheDocument();
    expect(screen.getByText('Este campo tem um erro.')).toBeInTheDocument();
  });

  it('should display custom suggestions for percentage errors', () => {
    const percentageError = [
      {
        period: 1,
        fields: {
          grossMarginPercentage: 'Margem Bruta % deve estar entre -50% e 100%.',
        },
      },
    ];

    render(<ValidationErrorPanel validationErrors={percentageError} onDismiss={mockOnDismiss} />);

    // Check that percentage-specific suggestion is shown
    expect(screen.getByText(/Percentuais devem estar no formato numérico/i)).toBeInTheDocument();
  });

  it('should display custom suggestions for negative value errors', () => {
    const negativeValueError = [
      {
        period: 2,
        fields: {
          revenue: 'Receita Líquida não pode ser negativo.',
        },
      },
    ];

    render(<ValidationErrorPanel validationErrors={negativeValueError} onDismiss={mockOnDismiss} />);

    // Expand period 2
    const period2Header = screen.getByText(/Período 2/i).closest('button');
    fireEvent.click(period2Header);

    // Check that negative value suggestion is shown
    expect(screen.getByText(/Este campo não aceita valores negativos/i)).toBeInTheDocument();
  });

  it('should apply fade-in animation class', () => {
    const { container } = render(
      <ValidationErrorPanel validationErrors={sampleValidationErrors} onDismiss={mockOnDismiss} />
    );

    const errorPanel = container.querySelector('.animate-fade-in');
    expect(errorPanel).toBeInTheDocument();
  });
});
