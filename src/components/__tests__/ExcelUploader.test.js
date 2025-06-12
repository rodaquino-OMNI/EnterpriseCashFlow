/**
 * Component Tests for ExcelUploader
 * Tests the Excel file upload and parsing functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcelUploader } from '../InputPanel/ExcelUploader';
import { useExcelParser } from '../../hooks/useExcelParser';
import { useLibrary } from '../../hooks/useLibrary';
import { createMockExcelData } from '../../__tests__/utils/testDataFactories.comprehensive';

// Mock hooks
jest.mock('../../hooks/useExcelParser');
jest.mock('../../hooks/useLibrary');

// Mock ExcelJS
const mockExcelJS = {
  Workbook: jest.fn()
};

describe('ExcelUploader Component', () => {
  const defaultProps = {
    numberOfPeriods: 4,
    onDataSubmit: jest.fn(),
    onNavigate: jest.fn()
  };

  const mockParseExcelData = jest.fn();
  const mockGenerateTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup hook mocks
    useLibrary.mockReturnValue({
      ExcelJS: mockExcelJS,
      isLoading: false,
      error: null
    });

    useExcelParser.mockReturnValue({
      parseExcelData: mockParseExcelData,
      generateTemplate: mockGenerateTemplate,
      isParsing: false,
      parsingError: null
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Rendering', () => {
    it('should render upload area and instructions', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/arraste e solte/i)).toBeInTheDocument();
      expect(screen.getByText(/escolher arquivo/i)).toBeInTheDocument();
      expect(screen.getByText(/formatos aceitos.*xlsx.*xls/i)).toBeInTheDocument();
    });

    it('should render template download button', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/baixar modelo excel/i)).toBeInTheDocument();
    });

    it('should show library loading state', () => {
      useLibrary.mockReturnValue({
        ExcelJS: null,
        isLoading: true,
        error: null
      });

      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/carregando biblioteca excel/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /baixar modelo/i })).toBeDisabled();
    });

    it('should show library error state', () => {
      useLibrary.mockReturnValue({
        ExcelJS: null,
        isLoading: false,
        error: new Error('Failed to load ExcelJS')
      });

      render(<ExcelUploader {...defaultProps} />);
      
      expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load exceljs/i)).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('should handle file selection via button click', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['excel content'], 'financial-data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45 }
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      expect(mockParseExcelData).toHaveBeenCalledWith(expect.any(ArrayBuffer));
    });

    it('should handle drag and drop', async () => {
      render(<ExcelUploader {...defaultProps} />);
      
      const dropZone = screen.getByText(/arraste e solte/i).closest('div');
      const file = new File(['excel content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45 }
      ]);

      // Simulate drag over
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] }
      });
      expect(dropZone).toHaveClass('border-blue-400');

      // Simulate drop
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });

      await waitFor(() => {
        expect(mockParseExcelData).toHaveBeenCalled();
      });
    });

    it('should validate file type', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const invalidFile = new File(['text content'], 'document.pdf', {
        type: 'application/pdf'
      });

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, invalidFile);

      expect(screen.getByText(/formato de arquivo inválido/i)).toBeInTheDocument();
      expect(mockParseExcelData).not.toHaveBeenCalled();
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file1 = new File(['content1'], 'file1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file2 = new File(['content2'], 'file2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45 }
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, [file1, file2]);

      // Should only process the first file
      expect(mockParseExcelData).toHaveBeenCalledTimes(1);
    });

    it('should show file size validation error', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      // Create a file larger than 10MB
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], 
        'large-file.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, largeFile);

      expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument();
      expect(mockParseExcelData).not.toHaveBeenCalled();
    });
  });

  describe('File Processing', () => {
    it('should show progress during parsing', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Make parsing take some time
      let resolveParser;
      mockParseExcelData.mockImplementation(() => 
        new Promise(resolve => { resolveParser = resolve; })
      );

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      // Progress should be shown
      expect(screen.getByText(/processando.*data.xlsx/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Complete parsing
      act(() => {
        resolveParser([{ revenue: 1000000 }]);
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should display parsed data preview', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 },
        { revenue: 1100000, grossMarginPercent: 46, operatingExpenses: 320000 }
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/dados extraídos com sucesso/i)).toBeInTheDocument();
        expect(screen.getByText(/2 períodos encontrados/i)).toBeInTheDocument();
      });

      // Check preview table
      expect(screen.getByText('Período 1')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.000.000,00')).toBeInTheDocument();
      expect(screen.getByText('45,00%')).toBeInTheDocument();
    });

    it('should handle parsing errors', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockRejectedValue(new Error('Invalid Excel format'));

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/erro ao processar/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid excel format/i)).toBeInTheDocument();
      });
    });

    it('should validate parsed data completeness', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Return incomplete data
      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000 }, // Missing required fields
        { grossMarginPercent: 45 } // Missing revenue
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/dados incompletos/i)).toBeInTheDocument();
        expect(screen.getByText(/campos obrigatórios ausentes/i)).toBeInTheDocument();
      });
    });

    it('should handle wrong number of periods', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} numberOfPeriods={4} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Return different number of periods
      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 },
        { revenue: 1100000, grossMarginPercent: 46, operatingExpenses: 320000 }
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/número de períodos não corresponde/i)).toBeInTheDocument();
        expect(screen.getByText(/esperado: 4.*encontrado: 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Submission', () => {
    it('should submit parsed data', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const parsedData = [
        { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 },
        { revenue: 1100000, grossMarginPercent: 46, operatingExpenses: 320000 },
        { revenue: 1200000, grossMarginPercent: 47, operatingExpenses: 340000 },
        { revenue: 1300000, grossMarginPercent: 48, operatingExpenses: 360000 }
      ];

      mockParseExcelData.mockResolvedValue(parsedData);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/usar estes dados/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/usar estes dados/i));

      expect(defaultProps.onDataSubmit).toHaveBeenCalledWith(parsedData);
    });

    it('should allow re-upload after error', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file1 = new File(['content'], 'file1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // First upload fails
      mockParseExcelData.mockRejectedValueOnce(new Error('Parse error'));

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file1);

      await waitFor(() => {
        expect(screen.getByText(/tentar novamente/i)).toBeInTheDocument();
      });

      // Second upload succeeds
      const file2 = new File(['content'], 'file2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValueOnce([
        { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 }
      ]);

      await user.click(screen.getByText(/tentar novamente/i));
      await user.upload(input, file2);

      await waitFor(() => {
        expect(screen.getByText(/dados extraídos com sucesso/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Download', () => {
    it('should generate and download template', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} numberOfPeriods={4} />);
      
      const mockWorkbook = {
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
        }
      };
      
      mockGenerateTemplate.mockResolvedValue(mockWorkbook);

      // Create mock anchor element
      const mockAnchor = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      jest.spyOn(mockAnchor, 'click');

      await user.click(screen.getByText(/baixar modelo excel/i));

      await waitFor(() => {
        expect(mockGenerateTemplate).toHaveBeenCalledWith(4);
        expect(mockAnchor.download).toBe('modelo_dados_financeiros_4_periodos.xlsx');
        expect(mockAnchor.click).toHaveBeenCalled();
      });

      document.createElement.mockRestore();
    });

    it('should handle template generation errors', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      mockGenerateTemplate.mockRejectedValue(new Error('Template generation failed'));

      await user.click(screen.getByText(/baixar modelo excel/i));

      await waitFor(() => {
        expect(screen.getByText(/erro ao gerar modelo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      const fileInput = screen.getByTestId('excel-file-input');
      expect(fileInput).toHaveAttribute('aria-label', 'Selecionar arquivo Excel');
      
      const dropZone = screen.getByText(/arraste e solte/i).closest('div');
      expect(dropZone).toHaveAttribute('role', 'button');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const dropZone = screen.getByText(/arraste e solte/i).closest('div');
      
      // Focus drop zone
      await user.tab();
      expect(dropZone).toHaveFocus();

      // Activate with Enter key
      await user.keyboard('{Enter}');
      // File input should be triggered (can't test actual dialog)
    });

    it('should announce upload progress to screen readers', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const file = new File(['content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      mockParseExcelData.mockResolvedValue([
        { revenue: 1000000, grossMarginPercent: 45, operatingExpenses: 300000 }
      ]);

      const input = screen.getByTestId('excel-file-input');
      await user.upload(input, file);

      await waitFor(() => {
        const successMessage = screen.getByText(/dados extraídos com sucesso/i);
        expect(successMessage.closest('[role="alert"]')).toBeInTheDocument();
      });
    });
  });

  describe('Visual States', () => {
    it('should show hover state on drop zone', async () => {
      const user = userEvent.setup();
      render(<ExcelUploader {...defaultProps} />);
      
      const dropZone = screen.getByText(/arraste e solte/i).closest('div');
      
      await user.hover(dropZone);
      expect(dropZone).toHaveClass('hover:bg-gray-50');
    });

    it('should show active drag state', () => {
      render(<ExcelUploader {...defaultProps} />);
      
      const dropZone = screen.getByText(/arraste e solte/i).closest('div');
      
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('border-blue-400');
      expect(dropZone).toHaveClass('bg-blue-50');

      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('border-blue-400');
    });
  });
});