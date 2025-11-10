import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  LabelList,
  ReferenceLine,
  Area,
  AreaChart,
  Funnel,
  FunnelChart,
  Scatter,
  ScatterChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';

/**
 * Custom Layer component with proper forwardRef implementation
 * This serves as a fallback in case the Recharts Layer component isn't working correctly
 */
const CustomLayer = React.forwardRef((props, ref) => {
  return <g ref={ref} className="recharts-layer" {...props} />;
});
CustomLayer.displayName = 'CustomLayer';

/**
 * A wrapper component that provides Recharts components with proper error handling and React integration
 */
export function RechartsWrapper({ children, fallbackHeight = '350px' }) {
  // Create a context with React reference to ensure proper integration
  const RechartsContext = React.createContext({
    React,
  });
  
  return (
    <RechartsContext.Provider value={{ React }}>
      <div style={{ width: '100%', height: fallbackHeight }}>
        {children}
      </div>
    </RechartsContext.Provider>
  );
}

/**
 * Get Recharts components with proper imports and fallbacks
 */
export function useRecharts() {
  return {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Label,
    LabelList,
    ReferenceLine,
    Area,
    AreaChart,
    Funnel,
    FunnelChart,
    Scatter,
    ScatterChart,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Treemap,
    RadialBarChart,
    RadialBar,
    ComposedChart,
    Layer: CustomLayer, // Always use our custom implementation
  };
}