/**
 * Container Component Tests
 * Test suite for Container component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Container from '../Container.jsx';

describe('Container Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children', () => {
      render(
        <Container data-testid="container">
          <div>Container Content</div>
        </Container>,
      );

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveTextContent('Container Content');
    });

    test('applies container class', () => {
      render(<Container data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveClass('container');
    });

    test('has 100% width', () => {
      render(<Container data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        width: '100%',
      });
    });

    test('centers content with margin auto', () => {
      render(<Container data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        margin: '0 auto',
      });
    });
  });

  describe('Size Prop', () => {
    test('defaults to lg size', () => {
      render(<Container data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '1024px',
      });
    });

    test('applies sm size', () => {
      render(<Container size="sm" data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '640px',
      });
    });

    test('applies md size', () => {
      render(<Container size="md" data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '768px',
      });
    });

    test('applies lg size', () => {
      render(<Container size="lg" data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '1024px',
      });
    });

    test('applies xl size', () => {
      render(<Container size="xl" data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '1280px',
      });
    });

    test('applies fluid size', () => {
      render(<Container size="fluid" data-testid="container" />);
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '100%',
      });
    });
  });

  describe('Padding', () => {
    test('applies default horizontal padding', () => {
      render(<Container data-testid="container" />);
      const container = screen.getByTestId('container');
      // Should have padding from design tokens
      expect(container.style.padding).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    test('applies custom className', () => {
      render(
        <Container className="custom-container" data-testid="container" />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveClass('container');
      expect(container).toHaveClass('custom-container');
    });

    test('merges custom inline styles', () => {
      render(
        <Container
          style={{ backgroundColor: 'purple', border: '1px solid' }}
          data-testid="container"
        />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveStyle({
        backgroundColor: 'purple',
        border: '1px solid',
      });
    });

    test('custom styles can override defaults', () => {
      render(
        <Container
          style={{ maxWidth: '500px' }}
          data-testid="container"
        />,
      );
      expect(screen.getByTestId('container')).toHaveStyle({
        maxWidth: '500px',
      });
    });
  });

  describe('Props Spreading', () => {
    test('spreads additional props to DOM element', () => {
      render(
        <Container
          data-testid="container"
          id="main-container"
          role="main"
        />,
      );
      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('id', 'main-container');
      expect(container).toHaveAttribute('role', 'main');
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(<Container ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    test('ref can access DOM properties', () => {
      const ref = React.createRef();
      render(<Container ref={ref} />);
      expect(ref.current.tagName).toBe('DIV');
    });
  });

  describe('Responsive Styles', () => {
    test('includes responsive style tag', () => {
      const { container } = render(<Container />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
    });

    test('includes media query for small screens', () => {
      const { container } = render(<Container />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('@media');
      expect(style.textContent).toContain('.container');
    });

    test('has box-sizing border-box', () => {
      const { container } = render(<Container />);
      const style = container.querySelector('style');
      expect(style.textContent).toContain('box-sizing: border-box');
    });
  });

  describe('Multiple Children', () => {
    test('renders multiple children', () => {
      render(
        <Container data-testid="container">
          <header data-testid="header">Header</header>
          <main data-testid="main">Main Content</main>
          <footer data-testid="footer">Footer</footer>
        </Container>,
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Nested Containers', () => {
    test('allows nested containers', () => {
      render(
        <Container size="xl" data-testid="outer">
          <Container size="md" data-testid="inner">
            <div>Nested Content</div>
          </Container>
        </Container>,
      );

      const outer = screen.getByTestId('outer');
      const inner = screen.getByTestId('inner');

      expect(outer).toHaveStyle({ maxWidth: '1280px' });
      expect(inner).toHaveStyle({ maxWidth: '768px' });
    });
  });

  describe('Display Name', () => {
    test('has correct displayName', () => {
      expect(Container.displayName).toBe('Container');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty children', () => {
      render(<Container data-testid="container" />);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });

    test('handles null children', () => {
      render(<Container data-testid="container">{null}</Container>);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });
  });
});
