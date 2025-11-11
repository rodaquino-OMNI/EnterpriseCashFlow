/**
 * GridItem Component Tests
 * Test suite for GridItem component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridItem from '../GridItem.jsx';

describe('GridItem Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children', () => {
      render(
        <GridItem data-testid="item">
          <div>Item Content</div>
        </GridItem>,
      );

      const item = screen.getByTestId('item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Item Content');
    });

    test('applies grid-item class', () => {
      render(<GridItem data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveClass('grid-item');
    });

    test('defaults to full width (span 12)', () => {
      render(<GridItem data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveStyle({
        gridColumn: 'span 12',
      });
    });
  });

  describe('Breakpoint Props', () => {
    test('applies xs breakpoint', () => {
      render(<GridItem xs={6} data-testid="item" />);
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('xs-6');
      expect(item).toHaveStyle({ gridColumn: 'span 6' });
    });

    test('applies sm breakpoint', () => {
      render(<GridItem sm={4} data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveClass('sm-4');
    });

    test('applies md breakpoint', () => {
      render(<GridItem md={3} data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveClass('md-3');
    });

    test('applies lg breakpoint', () => {
      render(<GridItem lg={2} data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveClass('lg-2');
    });

    test('applies xl breakpoint', () => {
      render(<GridItem xl={1} data-testid="item" />);
      expect(screen.getByTestId('item')).toHaveClass('xl-1');
    });

    test('applies multiple breakpoints', () => {
      render(
        <GridItem xs={12} sm={6} md={4} lg={3} xl={2} data-testid="item" />,
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('xs-12');
      expect(item).toHaveClass('sm-6');
      expect(item).toHaveClass('md-4');
      expect(item).toHaveClass('lg-3');
      expect(item).toHaveClass('xl-2');
    });
  });

  describe('Custom Styles', () => {
    test('applies custom className', () => {
      render(<GridItem className="custom-item" data-testid="item" />);
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('grid-item');
      expect(item).toHaveClass('custom-item');
    });

    test('merges custom inline styles', () => {
      render(
        <GridItem
          style={{ backgroundColor: 'red', padding: '10px' }}
          data-testid="item"
        />,
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveStyle({
        backgroundColor: 'red',
        padding: '10px',
      });
    });
  });

  describe('Responsive Classes', () => {
    test('includes responsive style tag', () => {
      const { container } = render(<GridItem xs={6} />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
    });

    test('generates breakpoint styles for all columns (1-12)', () => {
      const { container } = render(<GridItem xs={6} />);
      const style = container.querySelector('style');
      const styleText = style.textContent;

      // Check for xs classes
      expect(styleText).toContain('.xs-1');
      expect(styleText).toContain('.xs-12');

      // Check for sm classes
      expect(styleText).toContain('.sm-1');
      expect(styleText).toContain('.sm-12');
    });
  });

  describe('Props Spreading', () => {
    test('spreads additional props to DOM element', () => {
      render(
        <GridItem
          data-testid="item"
          id="item-id"
          aria-label="grid item"
        />,
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveAttribute('id', 'item-id');
      expect(item).toHaveAttribute('aria-label', 'grid item');
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(<GridItem ref={ref} xs={6} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing breakpoint props gracefully', () => {
      render(<GridItem data-testid="item" />);
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('grid-item');
      expect(item).toHaveStyle({ gridColumn: 'span 12' });
    });

    test('handles single breakpoint', () => {
      render(<GridItem xs={4} data-testid="item" />);
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('xs-4');
      expect(item).not.toHaveClass('sm-4');
    });

    test('min-width style for overflow handling', () => {
      const { container } = render(<GridItem xs={6} />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('min-width: 0');
    });
  });

  describe('Display Name', () => {
    test('has correct displayName', () => {
      expect(GridItem.displayName).toBe('GridItem');
    });
  });
});
