/**
 * GridColumn Component Tests
 * Test suite for legacy GridColumn component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridColumn from '../GridColumn.jsx';

describe('GridColumn Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children', () => {
      render(
        <GridColumn data-testid="column">
          <div>Column Content</div>
        </GridColumn>,
      );

      const column = screen.getByTestId('column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveTextContent('Column Content');
    });

    test('applies grid-column class', () => {
      render(<GridColumn data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveClass('grid-column');
    });

    test('defaults to span 12', () => {
      render(<GridColumn data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumn: 'span 12',
      });
    });
  });

  describe('Span Prop - Simple Number', () => {
    test('applies numeric span', () => {
      render(<GridColumn span={6} data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumn: 'span 6',
      });
    });

    test('applies span 1', () => {
      render(<GridColumn span={1} data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumn: 'span 1',
      });
    });

    test('applies span 12', () => {
      render(<GridColumn span={12} data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumn: 'span 12',
      });
    });
  });

  describe('Span Prop - Responsive Object', () => {
    test('applies responsive span values', () => {
      render(
        <GridColumn
          span={{ xs: 12, sm: 6, md: 4 }}
          data-testid="column"
        />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveStyle({ gridColumn: 'span 12' });
    });

    test('includes responsive styles in style tag', () => {
      const { container } = render(
        <GridColumn span={{ xs: 12, sm: 6, md: 4 }} />,
      );
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('@media');
    });
  });

  describe('Offset Prop - Simple Number', () => {
    test('applies no offset by default', () => {
      render(<GridColumn data-testid="column" />);
      const column = screen.getByTestId('column');
      expect(column.style.gridColumnStart).toBe('');
    });

    test('applies numeric offset', () => {
      render(<GridColumn offset={2} data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumnStart: '3',
      });
    });

    test('applies offset 1', () => {
      render(<GridColumn offset={1} data-testid="column" />);
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumnStart: '2',
      });
    });

    test('handles offset 0', () => {
      render(<GridColumn offset={0} data-testid="column" />);
      const column = screen.getByTestId('column');
      expect(column.style.gridColumnStart).toBe('');
    });
  });

  describe('Offset Prop - Responsive Object', () => {
    test('applies responsive offset values', () => {
      render(
        <GridColumn
          offset={{ xs: 1, sm: 2, md: 3 }}
          data-testid="column"
        />,
      );
      expect(screen.getByTestId('column')).toHaveStyle({
        gridColumnStart: '2',
      });
    });

    test('ignores zero offsets in responsive object', () => {
      render(
        <GridColumn
          offset={{ xs: 0, sm: 2 }}
          data-testid="column"
        />,
      );
      const column = screen.getByTestId('column');
      expect(column.style.gridColumnStart).toBe('');
    });
  });

  describe('Combined Span and Offset', () => {
    test('applies both span and offset', () => {
      render(
        <GridColumn span={4} offset={2} data-testid="column" />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveStyle({
        gridColumn: 'span 4',
        gridColumnStart: '3',
      });
    });

    test('applies responsive span and offset', () => {
      render(
        <GridColumn
          span={{ xs: 12, sm: 6 }}
          offset={{ xs: 0, sm: 3 }}
          data-testid="column"
        />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveStyle({
        gridColumn: 'span 12',
      });
    });
  });

  describe('Custom Styles', () => {
    test('applies custom className', () => {
      render(
        <GridColumn className="custom-column" data-testid="column" />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveClass('grid-column');
      expect(column).toHaveClass('custom-column');
    });

    test('merges custom inline styles', () => {
      render(
        <GridColumn
          style={{ backgroundColor: 'green', margin: '10px' }}
          data-testid="column"
        />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveStyle({
        backgroundColor: 'green',
        margin: '10px',
      });
    });
  });

  describe('Props Spreading', () => {
    test('spreads additional props to DOM element', () => {
      render(
        <GridColumn
          data-testid="column"
          id="column-id"
          role="gridcell"
        />,
      );
      const column = screen.getByTestId('column');
      expect(column).toHaveAttribute('id', 'column-id');
      expect(column).toHaveAttribute('role', 'gridcell');
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(<GridColumn ref={ref} span={6} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Responsive Styles', () => {
    test('includes style tag with responsive CSS', () => {
      const { container } = render(
        <GridColumn span={{ xs: 12, md: 6 }} />,
      );
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('.grid-column');
    });

    test('min-width style for overflow handling', () => {
      const { container } = render(<GridColumn span={6} />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('min-width: 0');
    });
  });

  describe('Display Name', () => {
    test('has correct displayName', () => {
      expect(GridColumn.displayName).toBe('GridColumn');
    });
  });

  describe('Edge Cases', () => {
    test('handles all breakpoints', () => {
      render(
        <GridColumn
          span={{ xs: 12, sm: 10, md: 8, lg: 6, xl: 4, '2xl': 2 }}
          data-testid="column"
        />,
      );
      expect(screen.getByTestId('column')).toBeInTheDocument();
    });

    test('handles empty responsive object', () => {
      render(<GridColumn span={{}} data-testid="column" />);
      expect(screen.getByTestId('column')).toBeInTheDocument();
    });
  });
});
