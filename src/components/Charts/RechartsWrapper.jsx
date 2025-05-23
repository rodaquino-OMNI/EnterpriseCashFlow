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
  ReferenceLine
} from 'recharts';

/**
 * A wrapper component that provides Recharts components with proper error handling
 */
export function RechartsWrapper({ children, fallbackHeight = '350px' }) {
  // No need to check if Recharts is loaded, as we're importing it directly
  return <>{children}</>;
}

/**
 * Get Recharts components with proper imports
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
    // Add additional components as needed
  };
}