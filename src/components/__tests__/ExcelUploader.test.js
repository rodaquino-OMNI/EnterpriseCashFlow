/**
 * Component Tests for ExcelUploader
 * Tests the Excel file upload and parsing functionality
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExcelUploader from '../InputPanel/ExcelUploader';

// Mock the ExcelTemplateSelector component
jest.mock('../InputPanel/ExcelTemplateSelector', () => {
  return function MockExcelTemplateSelector({ onTemplateDownloadRequest, isLoading }) {
    return (
      <div data-testid="excel-template-selector">
        <button 
          onClick={() => onTemplateDownloadRequest('SMART_ADAPTIVE')}
          disabled={isLoading}
          data-testid="template-download-button"
        >
          Baixar Modelo Excel
        </button>
      </div>
    );
  };
});

describe('ExcelUploader Component', () => {
  const defaultProps = {
    onTemplateDownloadRequest: jest.fn(),
    onFileUpload: jest.fn(),
    isLoading: false,
    isExcelJsLoading: false,
    excelJsError: null,
    currentAppNumberOfPeriods: 4,
    currentAppPeriodType: 'months',
    onNumberOfPeriodsChange: jest.fn(),
    onPeriodTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload area and instructions', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/entrada de dados via excel/i)).toBeInTheDocument();
      expect(screen.getByText(/carregar planilha excel/i)).toBeInTheDocument();
    });

    it('should show loading state when ExcelJS is loading', () => {
      render(<ExcelUploader {...defaultProps} isExcelJsLoading={true} />);
      
      const uploadLabel = screen.getByText(/carregar planilha excel/i).closest('label');
      expect(uploadLabel).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should show error state when ExcelJS fails to load', () => {
      const error = new Error('Failed to load ExcelJS');
      render(<ExcelUploader {...defaultProps} excelJsError={error} />);
      
      expect(screen.getByText(/erro com exceljs/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load exceljs/i)).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['excel content'], 'financial-data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      await user.upload(input, file);

      expect(defaultProps.onFileUpload).toHaveBeenCalledWith(file);
    });

    it('should clear input after file selection', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['excel content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      await user.upload(input, file);

      expect(input.value).toBe('');
    });

    it('should disable upload when loading', () => {
      render(<ExcelUploader {...defaultProps} isLoading={true} />);
      
      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should disable upload when ExcelJS is loading', () => {
      render(<ExcelUploader {...defaultProps} isExcelJsLoading={true} />);
      
      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      expect(input).toBeDisabled();
    });

    it('should accept Excel file types', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      expect(input).toHaveAttribute('accept', '.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe('Template Download', () => {
    it('should call template download handler when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const downloadButton = screen.getByTestId('template-download-button');
      await user.click(downloadButton);

      expect(defaultProps.onTemplateDownloadRequest).toHaveBeenCalledWith('SMART_ADAPTIVE');
    });

    it('should disable template download when ExcelJS is loading', () => {
      render(<ExcelUploader {...defaultProps} isExcelJsLoading={true} />);
      
      const downloadButton = screen.getByTestId('template-download-button');
      expect(downloadButton).toBeDisabled();
    });

    it('should disable template download when processing', () => {
      render(<ExcelUploader {...defaultProps} isLoading={true} />);
      
      const downloadButton = screen.getByTestId('template-download-button');
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display ExcelJS loading error', () => {
      const error = new Error('Library failed to load');
      render(<ExcelUploader {...defaultProps} excelJsError={error} />);
      
      expect(screen.getByText(/erro com exceljs/i)).toBeInTheDocument();
      expect(screen.getByText(/library failed to load/i)).toBeInTheDocument();
    });

    it('should not show error when ExcelJS loads successfully', () => {
      render(<ExcelUploader {...defaultProps} excelJsError={null} />);
      
      expect(screen.queryByText(/erro com exceljs/i)).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render ExcelTemplateSelector component', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByTestId('excel-template-selector')).toBeInTheDocument();
    });

    it('should pass correct props to template selector', () => {
      render(<ExcelUploader {...defaultProps} currentAppNumberOfPeriods={6} />);
      
      expect(screen.getByTestId('excel-template-selector')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      const input = screen.getByRole('button', { name: /carregar planilha excel/i }).querySelector('input');
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveClass('hidden');
    });

    it('should have proper button labels', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/carregar planilha excel/i)).toBeInTheDocument();
      expect(screen.getByText(/baixar modelo excel/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show processing state when isLoading is true', () => {
      render(<ExcelUploader {...defaultProps} isLoading={true} />);
      
      const uploadLabel = screen.getByText(/carregar planilha excel/i).closest('label');
      expect(uploadLabel).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should show library loading state when isExcelJsLoading is true', () => {
      render(<ExcelUploader {...defaultProps} isExcelJsLoading={true} />);
      
      const uploadLabel = screen.getByText(/carregar planilha excel/i).closest('label');
      expect(uploadLabel).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Props Validation', () => {
    it('should handle different period types', () => {
      render(<ExcelUploader {...defaultProps} currentAppPeriodType="quarters" />);
      
      expect(screen.getByText(/entrada de dados via excel/i)).toBeInTheDocument();
    });

    it('should handle different numbers of periods', () => {
      render(<ExcelUploader {...defaultProps} currentAppNumberOfPeriods={8} />);
      
      expect(screen.getByText(/entrada de dados via excel/i)).toBeInTheDocument();
    });
  });
});