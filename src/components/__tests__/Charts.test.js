/**
 * Component Tests for Chart Components
 * Tests all chart components for rendering, data handling, and interactivity
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  CashFlowWaterfallChart,
  ProfitWaterfallChart,
  FundingStructureChart,
  WorkingCapitalTimeline,
  BaseChart,
  MarginTrendChart,
  CashFlowComponentsChart,
} from '../Charts';
import { createMockPeriodData } from '../../test-utils/testDataFactories.comprehensive.utils';

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }) => <div data-testid="bar-chart" data-periods={data?.length}>{children}</div>,
  LineChart: ({ children, data }) => <div data-testid="line-chart" data-periods={data?.length}>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  ComposedChart: ({ children, data }) => <div data-testid="composed-chart" data-periods={data?.length}>{children}</div>,
  Bar: ({ dataKey }) => <div data-testid={`bar-${dataKey}`} />,
  Line: ({ dataKey }) => <div data-testid={`line-${dataKey}`} />,
  Pie: ({ data }) => <div data-testid="pie" data-items={data?.length} />,
  Cell: () => <div data-testid="cell" />,
  XAxis: ({ dataKey }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: ({ y }) => <div data-testid="reference-line" data-y={y} />,
}));

describe('Chart Components', () => {
  const mockCalculatedData = [
    createMockPeriodData({ periodIndex: 0 }),
    createMockPeriodData({ periodIndex: 1 }),
    createMockPeriodData({ periodIndex: 2 }),
    createMockPeriodData({ periodIndex: 3 }),
  ];

  describe('BaseChart Component', () => {
    it('should render with title and children', () => {
      render(
        <BaseChart title="Test Chart" height={400}>
          <div>Chart Content</div>
        </BaseChart>,
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('Chart Content')).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      render(
        <BaseChart title="Test Chart" subtitle="Chart Subtitle">
          <div>Content</div>
        </BaseChart>,
      );

      expect(screen.getByText('Chart Subtitle')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <BaseChart title="Test" className="custom-class">
          <div>Content</div>
        </BaseChart>,
      );

      const container = screen.getByText('Test').closest('.bg-white');
      expect(container).toHaveClass('custom-class');
    });

    it('should handle loading state', () => {
      render(
        <BaseChart title="Test" loading={true}>
          <div>Content</div>
        </BaseChart>,
      );

      expect(screen.getByText(/carregando/i)).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should handle error state', () => {
      render(
        <BaseChart title="Test" error="Failed to load data">
          <div>Content</div>
        </BaseChart>,
      );

      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('should handle empty data state', () => {
      render(
        <BaseChart title="Test" empty={true}>
          <div>Content</div>
        </BaseChart>,
      );

      expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  describe('CashFlowWaterfallChart', () => {
    it('should render waterfall chart with cash flow data', () => {
      render(<CashFlowWaterfallChart data={mockCalculatedData} />);

      expect(screen.getByText(/Análise de Fluxo de Caixa/i)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-value')).toBeInTheDocument();
    });

    it('should show all cash flow components', () => {
      render(<CashFlowWaterfallChart data={mockCalculatedData} />);

      // Check for expected bars
      expect(screen.getByTestId('bar-EBITDA')).toBeInTheDocument();
      expect(screen.getByTestId('bar-workingCapitalChange')).toBeInTheDocument();
      expect(screen.getByTestId('bar-capex')).toBeInTheDocument();
      expect(screen.getByTestId('bar-financing')).toBeInTheDocument();
    });

    it('should calculate cumulative values correctly', () => {
      const customData = [{
        incomeStatement: { ebitda: 100000 },
        cashFlow: {
          workingCapitalChange: -20000,
          capex: 30000,
          financingCashFlow: -10000,
        },
      }];

      render(<CashFlowWaterfallChart data={customData} />);
      
      const chart = screen.getByTestId('bar-chart');
      expect(chart).toHaveAttribute('data-periods', '5'); // 4 components + 1 final
    });

    it('should handle missing data gracefully', () => {
      render(<CashFlowWaterfallChart data={[]} />);
      
      expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    });
  });

  describe('ProfitWaterfallChart', () => {
    it('should render profit waterfall chart', () => {
      render(<ProfitWaterfallChart data={mockCalculatedData} />);

      expect(screen.getByText(/Formação do Lucro/i)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should show profit components', () => {
      render(<ProfitWaterfallChart data={mockCalculatedData} />);

      expect(screen.getByTestId('bar-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('bar-cogs')).toBeInTheDocument();
      expect(screen.getByTestId('bar-opex')).toBeInTheDocument();
      expect(screen.getByTestId('bar-financial')).toBeInTheDocument();
      expect(screen.getByTestId('bar-taxes')).toBeInTheDocument();
    });

    it('should handle negative values correctly', () => {
      const customData = [{
        incomeStatement: {
          revenue: 1000000,
          cogs: 600000,
          operatingExpenses: 500000, // Will result in negative EBIT
          netFinancialResult: -50000,
          taxes: 0,
          netIncome: -150000,
        },
      }];

      render(<ProfitWaterfallChart data={customData} />);
      
      const chart = screen.getByTestId('bar-chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('MarginTrendChart', () => {
    it('should render margin trend lines', () => {
      render(<MarginTrendChart data={mockCalculatedData} />);

      expect(screen.getByText(/Evolução das Margens/i)).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display all margin types', () => {
      render(<MarginTrendChart data={mockCalculatedData} />);

      expect(screen.getByTestId('line-grossMargin')).toBeInTheDocument();
      expect(screen.getByTestId('line-ebitdaMargin')).toBeInTheDocument();
      expect(screen.getByTestId('line-netMargin')).toBeInTheDocument();
    });

    it('should format data for multiple periods', () => {
      render(<MarginTrendChart data={mockCalculatedData} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toHaveAttribute('data-periods', '4');
    });

    it('should handle single period data', () => {
      render(<MarginTrendChart data={[mockCalculatedData[0]]} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toHaveAttribute('data-periods', '1');
    });
  });

  describe('CashFlowComponentsChart', () => {
    it('should render stacked bar chart', () => {
      render(<CashFlowComponentsChart data={mockCalculatedData} />);

      expect(screen.getByText(/Componentes do Fluxo de Caixa/i)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should show operating, investing, and financing components', () => {
      render(<CashFlowComponentsChart data={mockCalculatedData} />);

      expect(screen.getByTestId('bar-operating')).toBeInTheDocument();
      expect(screen.getByTestId('bar-investing')).toBeInTheDocument();
      expect(screen.getByTestId('bar-financing')).toBeInTheDocument();
    });

    it('should include reference line at zero', () => {
      render(<CashFlowComponentsChart data={mockCalculatedData} />);

      const referenceLine = screen.getByTestId('reference-line');
      expect(referenceLine).toHaveAttribute('data-y', '0');
    });
  });

  describe('FundingStructureChart', () => {
    it('should render pie chart with funding sources', () => {
      const fundingData = {
        debt: 2000000,
        equity: 3000000,
        retainedEarnings: 1000000,
      };

      render(<FundingStructureChart data={fundingData} />);

      expect(screen.getByText(/Estrutura de Financiamento/i)).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should calculate percentages correctly', () => {
      const fundingData = {
        debt: 2000000,
        equity: 3000000,
        retainedEarnings: 1000000,
      };

      render(<FundingStructureChart data={fundingData} />);
      
      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-items', '3');
    });

    it('should handle zero values', () => {
      const fundingData = {
        debt: 0,
        equity: 1000000,
        retainedEarnings: 0,
      };

      render(<FundingStructureChart data={fundingData} />);
      
      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-items', '1'); // Only equity
    });

    it('should handle all zero values', () => {
      const fundingData = {
        debt: 0,
        equity: 0,
        retainedEarnings: 0,
      };

      render(<FundingStructureChart data={fundingData} />);
      
      expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
    });
  });

  describe('WorkingCapitalTimeline', () => {
    it('should render working capital metrics over time', () => {
      render(<WorkingCapitalTimeline data={mockCalculatedData} />);

      expect(screen.getByText(/Evolução do Capital de Giro/i)).toBeInTheDocument();
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should show days metrics as lines', () => {
      render(<WorkingCapitalTimeline data={mockCalculatedData} />);

      expect(screen.getByTestId('line-dso')).toBeInTheDocument();
      expect(screen.getByTestId('line-dio')).toBeInTheDocument();
      expect(screen.getByTestId('line-dpo')).toBeInTheDocument();
    });

    it('should show working capital value as bars', () => {
      render(<WorkingCapitalTimeline data={mockCalculatedData} />);

      expect(screen.getByTestId('bar-workingCapital')).toBeInTheDocument();
    });

    it('should format working capital values', () => {
      const customData = [{
        periodIndex: 0,
        workingCapital: {
          dso: 45,
          dio: 30,
          dpo: 60,
          workingCapitalValue: 150000,
        },
      }];

      render(<WorkingCapitalTimeline data={customData} />);
      
      const chart = screen.getByTestId('composed-chart');
      expect(chart).toHaveAttribute('data-periods', '1');
    });
  });

  describe('Chart Responsiveness', () => {
    it('should use ResponsiveContainer for all charts', () => {
      render(
        <>
          <CashFlowWaterfallChart data={mockCalculatedData} />
          <MarginTrendChart data={mockCalculatedData} />
          <FundingStructureChart data={{ debt: 1000000, equity: 2000000 }} />
        </>,
      );

      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle different height props', () => {
      render(
        <BaseChart title="Test" height={600}>
          <div style={{ height: '100%' }}>Content</div>
        </BaseChart>,
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Chart Interactivity', () => {
    it('should render tooltips', () => {
      render(<MarginTrendChart data={mockCalculatedData} />);
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render legends where appropriate', () => {
      render(
        <>
          <MarginTrendChart data={mockCalculatedData} />
          <CashFlowComponentsChart data={mockCalculatedData} />
        </>,
      );
      
      const legends = screen.getAllByTestId('legend');
      expect(legends.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      render(
        <>
          <CashFlowWaterfallChart data={[]} />
          <MarginTrendChart data={[]} />
          <WorkingCapitalTimeline data={[]} />
        </>,
      );

      const emptyMessages = screen.getAllByText(/sem dados/i);
      expect(emptyMessages.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle null data gracefully', () => {
      render(
        <>
          <CashFlowWaterfallChart data={null} />
          <MarginTrendChart data={null} />
        </>,
      );

      const emptyMessages = screen.getAllByText(/sem dados/i);
      expect(emptyMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle incomplete period data', () => {
      const incompleteData = [{
        periodIndex: 0,
        incomeStatement: { revenue: 1000000 },
        // Missing other required fields
      }];

      render(<MarginTrendChart data={incompleteData} />);
      
      // Should render without crashing
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive titles', () => {
      render(
        <>
          <CashFlowWaterfallChart data={mockCalculatedData} />
          <MarginTrendChart data={mockCalculatedData} />
          <FundingStructureChart data={{ debt: 1000000, equity: 2000000 }} />
        </>,
      );

      expect(screen.getByText(/Análise de Fluxo de Caixa/i)).toBeInTheDocument();
      expect(screen.getByText(/Evolução das Margens/i)).toBeInTheDocument();
      expect(screen.getByText(/Estrutura de Financiamento/i)).toBeInTheDocument();
    });

    it('should provide alt text or aria-labels for visual elements', () => {
      render(<BaseChart title="Test Chart" height={400}>
        <div role="img" aria-label="Chart visualization">Chart</div>
      </BaseChart>);

      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Chart visualization');
    });
  });

  describe('Print Support', () => {
    it('should include print-specific classes', () => {
      render(<BaseChart title="Test Chart">
        <div>Content</div>
      </BaseChart>);

      const container = screen.getByText('Test Chart').closest('.bg-white');
      expect(container).toHaveClass('print:shadow-none');
      expect(container).toHaveClass('print:break-inside-avoid');
    });
  });
});