/**
 * Flex Component Tests
 * Test suite for Flex container component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Flex from '../Flex.jsx';

describe('Flex Component', () => {
  describe('Basic Rendering', () => {
    test('renders with children', () => {
      render(
        <Flex data-testid="flex">
          <div>Flex Content</div>
        </Flex>,
      );

      const flex = screen.getByTestId('flex');
      expect(flex).toBeInTheDocument();
      expect(flex).toHaveTextContent('Flex Content');
    });

    test('applies flex-container class', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveClass('flex-container');
    });

    test('has display flex', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({ display: 'flex' });
    });
  });

  describe('Direction Prop', () => {
    test('defaults to row', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexDirection: 'row',
      });
    });

    test('applies column direction', () => {
      render(<Flex direction="column" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexDirection: 'column',
      });
    });

    test('applies row-reverse direction', () => {
      render(<Flex direction="row-reverse" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexDirection: 'row-reverse',
      });
    });

    test('applies column-reverse direction', () => {
      render(<Flex direction="column-reverse" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexDirection: 'column-reverse',
      });
    });

    test('handles responsive direction object', () => {
      render(
        <Flex
          direction={{ xs: 'column', md: 'row' }}
          data-testid="flex"
        />,
      );
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexDirection: 'column',
      });
    });
  });

  describe('Justify Prop', () => {
    test('defaults to flex-start', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        justifyContent: 'flex-start',
      });
    });

    test('applies center justify', () => {
      render(<Flex justify="center" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        justifyContent: 'center',
      });
    });

    test('applies space-between justify', () => {
      render(<Flex justify="space-between" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        justifyContent: 'space-between',
      });
    });

    test('applies flex-end justify', () => {
      render(<Flex justify="flex-end" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        justifyContent: 'flex-end',
      });
    });

    test('handles responsive justify object', () => {
      render(
        <Flex
          justify={{ xs: 'flex-start', md: 'center' }}
          data-testid="flex"
        />,
      );
      expect(screen.getByTestId('flex')).toHaveStyle({
        justifyContent: 'flex-start',
      });
    });
  });

  describe('Align Prop', () => {
    test('defaults to stretch', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        alignItems: 'stretch',
      });
    });

    test('applies center align', () => {
      render(<Flex align="center" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        alignItems: 'center',
      });
    });

    test('applies flex-start align', () => {
      render(<Flex align="flex-start" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        alignItems: 'flex-start',
      });
    });

    test('applies baseline align', () => {
      render(<Flex align="baseline" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        alignItems: 'baseline',
      });
    });

    test('handles responsive align object', () => {
      render(
        <Flex
          align={{ xs: 'stretch', md: 'center' }}
          data-testid="flex"
        />,
      );
      expect(screen.getByTestId('flex')).toHaveStyle({
        alignItems: 'stretch',
      });
    });
  });

  describe('Wrap Prop', () => {
    test('defaults to nowrap', () => {
      render(<Flex data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexWrap: 'nowrap',
      });
    });

    test('applies wrap', () => {
      render(<Flex wrap="wrap" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexWrap: 'wrap',
      });
    });

    test('applies wrap-reverse', () => {
      render(<Flex wrap="wrap-reverse" data-testid="flex" />);
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexWrap: 'wrap-reverse',
      });
    });

    test('handles responsive wrap object', () => {
      render(
        <Flex
          wrap={{ xs: 'nowrap', md: 'wrap' }}
          data-testid="flex"
        />,
      );
      expect(screen.getByTestId('flex')).toHaveStyle({
        flexWrap: 'nowrap',
      });
    });
  });

  describe('Gap Prop', () => {
    test('defaults to md gap', () => {
      render(<Flex data-testid="flex" />);
      const flex = screen.getByTestId('flex');
      // md gap maps to spacing[4] from design tokens
      expect(flex.style.gap).toBeTruthy();
    });

    test('applies xs gap', () => {
      render(<Flex gap="xs" data-testid="flex" />);
      expect(screen.getByTestId('flex').style.gap).toBeTruthy();
    });

    test('applies sm gap', () => {
      render(<Flex gap="sm" data-testid="flex" />);
      expect(screen.getByTestId('flex').style.gap).toBeTruthy();
    });

    test('applies lg gap', () => {
      render(<Flex gap="lg" data-testid="flex" />);
      expect(screen.getByTestId('flex').style.gap).toBeTruthy();
    });

    test('applies xl gap', () => {
      render(<Flex gap="xl" data-testid="flex" />);
      expect(screen.getByTestId('flex').style.gap).toBeTruthy();
    });
  });

  describe('Combined Props', () => {
    test('applies multiple props together', () => {
      render(
        <Flex
          direction="column"
          justify="center"
          align="center"
          gap="lg"
          data-testid="flex"
        />,
      );
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveStyle({
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      });
    });
  });

  describe('Custom Styles', () => {
    test('applies custom className', () => {
      render(<Flex className="custom-flex" data-testid="flex" />);
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveClass('flex-container');
      expect(flex).toHaveClass('custom-flex');
    });

    test('merges custom inline styles', () => {
      render(
        <Flex
          style={{ backgroundColor: 'yellow', padding: '15px' }}
          data-testid="flex"
        />,
      );
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveStyle({
        backgroundColor: 'yellow',
        padding: '15px',
      });
    });
  });

  describe('Props Spreading', () => {
    test('spreads additional props to DOM element', () => {
      render(
        <Flex
          data-testid="flex"
          id="flex-id"
          aria-label="flex container"
        />,
      );
      const flex = screen.getByTestId('flex');
      expect(flex).toHaveAttribute('id', 'flex-id');
      expect(flex).toHaveAttribute('aria-label', 'flex container');
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(<Flex ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Responsive Styles', () => {
    test('includes responsive style tag', () => {
      const { container } = render(
        <Flex direction={{ xs: 'column', md: 'row' }} />,
      );
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
    });

    test('generates media queries for responsive props', () => {
      const { container } = render(
        <Flex direction={{ xs: 'column', md: 'row' }} />,
      );
      const style = container.querySelector('style');
      expect(style.textContent).toContain('@media');
    });
  });

  describe('Multiple Children', () => {
    test('renders multiple children', () => {
      render(
        <Flex data-testid="flex">
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </Flex>,
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('Display Name', () => {
    test('has correct displayName', () => {
      expect(Flex.displayName).toBe('Flex');
    });
  });
});
