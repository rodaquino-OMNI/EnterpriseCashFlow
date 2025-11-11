/**
 * GridContainer Component Tests
 * Test suite for GridContainer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridContainer from '../GridContainer.jsx';

describe('GridContainer Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children', () => {
      render(
        <GridContainer data-testid="container">
          <div>Child Content</div>
        </GridContainer>,
      );

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent('Child Content');
    });

    test('applies grid-container class', () => {
      render(<GridContainer data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveClass('grid-container');
    });

    test('has correct display style', () => {
      render(<GridContainer data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ display: 'grid' });
    });

    test('has 12-column grid template', () => {
      render(<GridContainer data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        gridTemplateColumns: 'repeat(12, 1fr)',
      });
    });
  });

  describe('Spacing', () => {
    test('applies default spacing (0)', () => {
      render(<GridContainer data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ gap: '0px' });
    });

    test('applies spacing value 2', () => {
      render(<GridContainer spacing={2} data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ gap: '0.5rem' });
    });

    test('applies spacing value 4', () => {
      render(<GridContainer spacing={4} data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ gap: '1rem' });
    });

    test('applies spacing value 8', () => {
      render(<GridContainer spacing={8} data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ gap: '2rem' });
    });

    test('applies maximum spacing value 10', () => {
      render(<GridContainer spacing={10} data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({ gap: '2.5rem' });
    });
  });

  describe('Custom Styles', () => {
    test('applies custom className', () => {
      render(
        <GridContainer className="custom-grid" data-testid="container" />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('grid-container');
      expect(container).toHaveClass('custom-grid');
    });

    test('merges custom inline styles', () => {
      render(
        <GridContainer
          style={{ backgroundColor: 'blue', padding: '20px' }}
          data-testid="container"
        />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveStyle({
        backgroundColor: 'blue',
        padding: '20px',
      });
    });

    test('custom styles override defaults', () => {
      render(
        <GridContainer
          style={{ maxWidth: '800px' }}
          data-testid="container"
        />,
      );
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '800px',
      });
    });
  });

  describe('Props Spreading', () => {
    test('spreads additional props to DOM element', () => {
      render(
        <GridContainer
          data-testid="container"
          id="custom-id"
          aria-label="grid container"
        />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('id', 'custom-id');
      expect(container).toHaveAttribute('aria-label', 'grid container');
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(<GridContainer ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('ref can access DOM methods', () => {
      const ref = React.createRef();
      render(<GridContainer ref={ref} />);
      expect(typeof ref.current.querySelector).toBe('function');
    });
  });

  describe('Responsive Behavior', () => {
    test('includes responsive style tag', () => {
      const { container } = render(<GridContainer />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('.grid-container');
    });

    test('includes breakpoint media queries', () => {
      const { container } = render(<GridContainer />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('@media');
    });
  });

  describe('Multiple Children', () => {
    test('renders multiple children', () => {
      render(
        <GridContainer data-testid="container">
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </GridContainer>,
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    test('has correct displayName', () => {
      expect(GridContainer.displayName).toBe('GridContainer');
    });
  });
});
