/**
 * Lazy-loaded Charts Module
 * Splits heavy recharts components into separate chunks for better performance
 */

import { lazy } from 'react';

// Lazy load all chart components to reduce initial bundle size
export const BaseChart = lazy(() => import('./BaseChart'));
export const CashFlowWaterfallChart = lazy(() => import('./CashFlowWaterfallChart'));
export const ProfitWaterfallChart = lazy(() => import('./ProfitWaterfallChart'));
export const FundingStructureChart = lazy(() => import('./FundingStructureChart'));
export const WorkingCapitalTimeline = lazy(() => import('./WorkingCapitalTimeline'));
export const MarginTrendChart = lazy(() => import('./MarginTrendChart'));
export const CashFlowComponentsChart = lazy(() => import('./CashFlowComponentsChart'));
export const AssetCompositionChart = lazy(() => import('./AssetCompositionChart'));
export const BalanceSheetDifferenceTrendChart = lazy(() => import('./BalanceSheetDifferenceTrendChart'));
export const CashFlowKeyMetricsTrendChart = lazy(() => import('./CashFlowKeyMetricsTrendChart'));
export const PnlVisualChart = lazy(() => import('./PnlVisualChart'));
export const WorkingCapitalDaysTrendChart = lazy(() => import('./WorkingCapitalDaysTrendChart'));
export const RechartsWrapper = lazy(() => import('./RechartsWrapper'));
