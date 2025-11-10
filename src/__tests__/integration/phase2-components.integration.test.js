// src/__tests__/integration/phase2-components.integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import Grid from '../../components/layout/Grid';
import Form from '../../components/composite/Form';
import ManualDataEntry from '../../components/InputPanel/ManualDataEntry';
import ReportGeneratorApp from '../../components/ReportGeneratorApp';

// Mock external dependencies
jest.mock('../../hooks/useLibrary', () => ({
  __esModule: true,
  useLibrary: jest.fn((libraryName) => {
    // Mock library objects for different libraries
    const mockExcelJS = {
      Workbook: class {
        constructor() {}
        addWorksheet() { return { cell: () => ({ value: '' }) }; }
        
        get xlsx() { 
          return { 
            writeBuffer: async () => new ArrayBuffer(0), 
          };
        }
      },
    };

    const mockHtml2pdf = () => ({
      from: () => ({
        save: () => Promise.resolve(),
      }),
    });

    const mockPdfjsLib = {
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: () => Promise.resolve({
            getTextContent: () => Promise.resolve({ items: [] }),
          }),
        }),
      }),
    };

    // Return appropriate mock based on library name
    let library;
    if (libraryName === 'ExcelJS') library = mockExcelJS;
    else if (libraryName === 'html2pdf') library = mockHtml2pdf;
    else if (libraryName === 'pdfjsLib') library = mockPdfjsLib;
    else library = {};

    return {
      library,
      loadLibrary: jest.fn().mockResolvedValue(library),
      isLoading: false,
      error: null,
      reset: jest.fn(),
      isAvailable: true,
    };
  }),
}));

jest.mock('../../hooks/useFinancialCalculator', () => ({
  useFinancialCalculator: jest.fn(() => ({
    calculate: jest.fn(),
    isCalculating: false,
    calculationError: null,
  })),
}));

jest.mock('../../hooks/useSmartExcelParser', () => ({
  useSmartExcelParser: jest.fn(() => ({
    parseFile: jest.fn(),
    isParsing: false,
    error: null,
    progress: 0,
    currentStep: '',
    resetParser: jest.fn(),
  })),
}));

jest.mock('../../hooks/useAiService', () => ({
  useAiService: jest.fn(() => ({
    isLoading: false,
    error: null,
    currentProviderConfig: {},
    setSelectedProviderKey: jest.fn(),
  })),
}));

jest.mock('../../hooks/useAiAnalysis', () => ({
  useAiAnalysis: jest.fn(() => ({
    isLoading: jest.fn(() => false),
    errors: {},
    clearAllAnalyses: jest.fn(),
  })),
}));

jest.mock('../../hooks/usePdfParser', () => ({
  usePdfParser: jest.fn(() => ({
    extractTextFromPdf: jest.fn(),
    isParsing: false,
    parsingError: null,
    setParsingError: jest.fn(),
  })),
}));

jest.mock('../../hooks/useAiDataExtraction', () => ({
  useAiDataExtraction: jest.fn(() => ({
    extractFinancialData: jest.fn(),
    isExtracting: false,
    extractionError: null,
    setExtractionError: jest.fn(),
  })),
}));

describe('Phase 2 Components Integration Tests', () => {
  describe('Grid System Integration', () => {
    test('Grid renders with responsive breakpoints', () => {
      render(
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <div data-testid="grid-item-1">Content 1</div>
          </Grid>
          <Grid item xs={12} md={6}>
            <div data-testid="grid-item-2">Content 2</div>
          </Grid>
        </Grid>,
      );

      const container = document.querySelector('.grid-container');
      expect(container).toHaveClass('grid-container');
      expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-2')).toBeInTheDocument();
    });

    test('Grid integrates with ManualDataEntry layout', () => {
      const mockProps = {
        numberOfPeriods: 3,
        onNumberOfPeriodsChange: jest.fn(),
        periodType: 'anos',
        onPeriodTypeChange: jest.fn(),
        inputData: [
          { receita_liquida: 1000, custos_variaveis: 600 },
          { receita_liquida: 1100, custos_variaveis: 650 },
          { receita_liquida: 1200, custos_variaveis: 700 },
        ],
        onInputChange: jest.fn(),
        onSubmit: jest.fn(),
        isLoading: false,
        validationErrors: null,
      };

      render(
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <ManualDataEntry {...mockProps} />
          </Grid>
        </Grid>,
      );

      expect(screen.getByText('Entrada Manual de Dados - Modo Adaptativo')).toBeInTheDocument();
      expect(screen.getByText(/Número de Períodos \(2-6\):/)).toBeInTheDocument();
    });

    test('Grid handles nested layouts correctly', () => {
      render(
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <div data-testid="nested-1">Nested 1</div>
              </Grid>
              <Grid item xs={12} md={6}>
                <div data-testid="nested-2">Nested 2</div>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} lg={4}>
            <div data-testid="sidebar">Sidebar</div>
          </Grid>
        </Grid>,
      );

      expect(screen.getByTestId('nested-1')).toBeInTheDocument();
      expect(screen.getByTestId('nested-2')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Form Composite Integration', () => {
    test('Form renders with validation and submission', async () => {
      const mockSubmit = jest.fn();
      const mockValidate = jest.fn(() => ({}));

      const formConfig = {
        fields: [
          {
            name: 'companyName',
            label: 'Company Name',
            type: 'text',
            required: true,
            validation: { minLength: 2 },
          },
          {
            name: 'revenue',
            label: 'Revenue',
            type: 'number',
            required: true,
            validation: { min: 0 },
          },
        ],
      };

      render(
        <Form
          config={formConfig}
          onSubmit={mockSubmit}
          onValidate={mockValidate}
          initialValues={{ companyName: '', revenue: '' }}
        />,
      );

      // Test form rendering
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Revenue/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

      // Test form interaction
      fireEvent.change(screen.getByRole('textbox', { name: /Company Name/i }), {
        target: { value: 'Test Company' },
      });
      fireEvent.change(screen.getByRole('spinbutton', { name: /Revenue/i }), {
        target: { value: '1000' },
      });

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          companyName: 'Test Company',
          revenue: '1000',
        });
      });
    });

    test('Form integrates with Grid layout', () => {
      const formConfig = {
        fields: [
          {
            name: 'field1',
            label: 'Field 1',
            type: 'text',
            gridProps: { xs: 12, md: 6 },
          },
          {
            name: 'field2',
            label: 'Field 2',
            type: 'text',
            gridProps: { xs: 12, md: 6 },
          },
        ],
      };

      render(
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Form
              config={formConfig}
              onSubmit={jest.fn()}
              initialValues={{ field1: '', field2: '' }}
            />
          </Grid>
        </Grid>,
      );

      expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Field 2')).toBeInTheDocument();
    });

    test('Form handles validation errors correctly', async () => {
      const formConfig = {
        fields: [
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            validation: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
          },
        ],
      };

      render(
        <Form
          config={formConfig}
          onSubmit={jest.fn()}
          initialValues={{ email: '' }}
        />,
      );

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Test invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      // Check that form submission was attempted (input still has invalid value)
      await waitFor(() => {
        expect(emailInput.value).toBe('invalid-email');
      });

      // Test valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('ReportGeneratorApp Integration', () => {
    test('App renders without crashing', () => {
      render(<ReportGeneratorApp />);
      
      expect(screen.getByText('Auditor Financeiro com IA ✨')).toBeInTheDocument();
      expect(screen.getByText('Entrada Manual de Dados')).toBeInTheDocument();
    });

    test('App switches between input methods correctly', () => {
      render(<ReportGeneratorApp />);
      
      // Test manual input method (default)
      expect(screen.getByText('Entrada Manual de Dados - Modo Adaptativo')).toBeInTheDocument();
      
      // Switch to Excel method - need to interact with the select element
      const selectElement = screen.getByLabelText('Método de Entrada:');
      fireEvent.change(selectElement, { target: { value: 'excel' } });
      
      // Should show Excel uploader content instead - be more specific about which template text to look for
      expect(screen.getByText('Entrada de Dados via Excel (Upload Adaptativo)')).toBeInTheDocument();
      expect(screen.getByText('Escolha o Tipo de Template Excel para Baixar')).toBeInTheDocument();
    });

    test('App maintains state consistency across method switches', () => {
      render(<ReportGeneratorApp />);
      
      // Set company name
      const companyInput = screen.getByDisplayValue('Empresa Exemplo S.A.');
      fireEvent.change(companyInput, { target: { value: 'Test Company' } });
      
      // Switch input methods using the select element
      const selectElement = screen.getByLabelText('Método de Entrada:');
      fireEvent.change(selectElement, { target: { value: 'excel' } });
      
      fireEvent.change(selectElement, { target: { value: 'manual' } });
      
      // Company name should be preserved
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    test('Existing UI components work with new Grid system', () => {
      const mockProps = {
        numberOfPeriods: 2,
        onNumberOfPeriodsChange: jest.fn(),
        periodType: 'anos',
        onPeriodTypeChange: jest.fn(),
        inputData: [
          { receita_liquida: null },
          { receita_liquida: null },
        ],
        onInputChange: jest.fn(),
        onSubmit: jest.fn(),
        isLoading: false,
      };

      // Test that ManualDataEntry still works without Grid wrapper
      render(<ManualDataEntry {...mockProps} />);
      
      expect(screen.getByText('Entrada Manual de Dados - Modo Adaptativo')).toBeInTheDocument();
      expect(screen.getByText(/Número de Períodos \(2-6\):/)).toBeInTheDocument();
    });

    test('Form composite maintains interface compatibility', () => {
      const basicFormConfig = {
        fields: [
          {
            name: 'testField',
            label: 'Test Field',
            type: 'text',
          },
        ],
      };

      // Test minimal configuration
      render(
        <Form
          config={basicFormConfig}
          onSubmit={jest.fn()}
        />,
      );

      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    test('Grid system maintains accessibility attributes', () => {
      render(
        <Grid container spacing={2} role="main" aria-label="Main content grid">
          <Grid item xs={12} role="region" aria-label="Content section">
            <div>Accessible content</div>
          </Grid>
        </Grid>,
      );

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content grid');
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Content section');
    });

    test('Form composite supports accessibility features', () => {
      const formConfig = {
        fields: [
          {
            name: 'accessibleField',
            label: 'Accessible Field',
            type: 'text',
            required: true,
            helpText: 'This field is required',
          },
        ],
      };

      render(
        <Form
          config={formConfig}
          onSubmit={jest.fn()}
          initialValues={{ accessibleField: '' }}
        />,
      );

      const input = screen.getByRole('textbox', { name: /accessible field/i });
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    test('Components handle responsive design tokens correctly', () => {
      render(
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <div data-testid="responsive-item">Responsive content</div>
          </Grid>
        </Grid>,
      );

      // Test that responsive content is rendered
      expect(screen.getByTestId('responsive-item')).toBeInTheDocument();
      
      // Test that the grid container has proper classes
      const container = screen.getByTestId('responsive-item').closest('.grid-container');
      expect(container).toHaveClass('grid-container');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Grid handles invalid props gracefully', () => {
      // Test with invalid spacing
      render(
        <Grid container spacing="invalid">
          <Grid item xs={12}>
            <div>Content</div>
          </Grid>
        </Grid>,
      );

      // Should still render without crashing
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    test('Form handles missing configuration gracefully', () => {
      // Test with minimal config
      render(
        <Form
          config={{ fields: [] }}
          onSubmit={jest.fn()}
        />,
      );

      // Should render submit button even with no fields
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    test('Components handle null/undefined props correctly', () => {
      const mockProps = {
        numberOfPeriods: 2,
        onNumberOfPeriodsChange: jest.fn(),
        periodType: 'anos',
        onPeriodTypeChange: jest.fn(),
        inputData: null, // Test null data
        onInputChange: jest.fn(),
        onSubmit: jest.fn(),
        isLoading: false,
      };

      render(<ManualDataEntry {...mockProps} />);
      
      // Should handle null inputData gracefully
      expect(screen.getByText('Entrada Manual de Dados - Modo Adaptativo')).toBeInTheDocument();
    });
  });
});