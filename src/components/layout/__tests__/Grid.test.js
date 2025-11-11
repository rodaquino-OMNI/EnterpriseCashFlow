/**
 * Grid Component Tests
 * Comprehensive test suite for Grid orchestrator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Grid, { GridContainer, GridItem, GridColumn, Flex, Container } from '../Grid.jsx';

describe('Grid Component', () => {
  describe('Basic Rendering', () => {
    test('renders as container by default', () => {
      render(
        <Grid data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-container');
    });

    test('renders as container when container prop is true', () => {
      render(
        <Grid container data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid-container');
    });

    test('renders as item when item prop is true', () => {
      render(
        <Grid item xs={6} data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('grid-item');
    });
  });

  describe('Container Props', () => {
    test('applies spacing prop correctly', () => {
      render(
        <Grid container spacing={4} data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveStyle({ gap: '1rem' });
    });

    test('applies custom className', () => {
      render(
        <Grid container className="custom-class" data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('custom-class');
    });

    test('applies custom inline styles', () => {
      render(
        <Grid container style={{ backgroundColor: 'red' }} data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('Item Props', () => {
    test('applies responsive breakpoint props', () => {
      render(
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} data-testid="grid">
          <div>Content</div>
        </Grid>,
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass('xs-12');
      expect(grid).toHaveClass('sm-6');
      expect(grid).toHaveClass('md-4');
      expect(grid).toHaveClass('lg-3');
      expect(grid).toHaveClass('xl-2');
    });

    test('renders children correctly', () => {
      render(
        <Grid item xs={6}>
          <div data-testid="child">Child Content</div>
        </Grid>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Forward Ref', () => {
    test('forwards ref to DOM element', () => {
      const ref = React.createRef();
      render(
        <Grid ref={ref} container>
          <div>Content</div>
        </Grid>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Re-exports', () => {
    test('exports GridContainer', () => {
      expect(GridContainer).toBeDefined();
    });

    test('exports GridItem', () => {
      expect(GridItem).toBeDefined();
    });

    test('exports GridColumn', () => {
      expect(GridColumn).toBeDefined();
    });

    test('exports Flex', () => {
      expect(Flex).toBeDefined();
    });

    test('exports Container', () => {
      expect(Container).toBeDefined();
    });
  });

  describe('Nested Grid', () => {
    test('renders nested grid structure', () => {
      render(
        <Grid container spacing={2} data-testid="outer">
          <Grid item xs={12} sm={6} data-testid="item1">
            <div>Item 1</div>
          </Grid>
          <Grid item xs={12} sm={6} data-testid="item2">
            <div>Item 2</div>
          </Grid>
        </Grid>,
      );

      expect(screen.getByTestId('outer')).toHaveClass('grid-container');
      expect(screen.getByTestId('item1')).toHaveClass('grid-item');
      expect(screen.getByTestId('item2')).toHaveClass('grid-item');
    });
  });

  describe('PropTypes Validation', () => {
    test('accepts valid props without warnings', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Grid container spacing={2} xs={12}>
          <div>Content</div>
        </Grid>,
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
