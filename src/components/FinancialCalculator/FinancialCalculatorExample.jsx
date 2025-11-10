import React, { useState } from 'react';
import { useFinancialCalculations } from '../../hooks/useFinancialCalculations';
import { PerformanceMonitor, debounce } from '../../utils/performanceOptimizations';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Line } from 'react-chartjs-2';

/**
 * Example component demonstrating the Financial Calculator integration
 */
const FinancialCalculatorExample = () => {
  const {
    isLoading,
    error,
    results,
    calculateInvestmentMetrics,
    performScenarioAnalysis,
    runMonteCarloSimulation,
    clearResults,
  } = useFinancialCalculations();

  const [activeTab, setActiveTab] = useState(0);
  const [investmentData, setInvestmentData] = useState({
    initialInvestment: 1000000,
    cashFlows: [250000, 300000, 350000, 400000, 450000],
    discountRate: 0.12,
    fixedCosts: 500000,
    variableCostPerUnit: 50,
    pricePerUnit: 100,
  });

  const [scenarios, setScenarios] = useState({
    optimistic: {
      cashFlows: [300000, 400000, 500000, 600000, 700000],
      discountRate: 0.10,
      initialInvestment: 1000000,
    },
    realistic: {
      cashFlows: [250000, 300000, 350000, 400000, 450000],
      discountRate: 0.12,
      initialInvestment: 1000000,
    },
    pessimistic: {
      cashFlows: [150000, 180000, 200000, 220000, 240000],
      discountRate: 0.15,
      initialInvestment: 1000000,
    },
  });

  // Debounced calculation function
  const debouncedCalculate = React.useCallback(
    debounce(async () => {
      const { result, performance } = await PerformanceMonitor.measureAsync(
        'Investment Metrics Calculation',
        () => calculateInvestmentMetrics(investmentData),
      );
      
      console.log(`Calculation completed in ${performance.durationMs}ms`);
    }, 500),
    [investmentData, calculateInvestmentMetrics],
  );

  // Handle input changes
  const handleInputChange = (field, value) => {
    setInvestmentData(prev => ({
      ...prev,
      [field]: field === 'cashFlows' ? value.split(',').map(Number) : Number(value),
    }));
  };

  // Run calculations
  const handleCalculate = () => {
    debouncedCalculate();
  };

  const handleScenarioAnalysis = async () => {
    await performScenarioAnalysis(scenarios);
  };

  const handleMonteCarloSimulation = async () => {
    const parameters = {
      baseCase: {
        cashFlows: investmentData.cashFlows,
        discountRate: investmentData.discountRate,
        initialInvestment: investmentData.initialInvestment,
      },
      variables: {
        discountRate: { min: 0.08, max: 0.16, distribution: 'uniform' },
        initialInvestment: { min: 900000, max: 1100000, distribution: 'normal' },
      },
      iterations: 1000,
      confidenceLevel: 0.95,
    };

    await runMonteCarloSimulation(parameters);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Financial Calculator Example
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Investment Parameters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Initial Investment (R$)"
                type="number"
                value={investmentData.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount Rate (%)"
                type="number"
                value={investmentData.discountRate * 100}
                onChange={(e) => handleInputChange('discountRate', e.target.value / 100)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cash Flows (comma-separated)"
                value={investmentData.cashFlows.join(',')}
                onChange={(e) => handleInputChange('cashFlows', e.target.value)}
                helperText="Enter annual cash flows separated by commas"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fixed Costs (R$)"
                type="number"
                value={investmentData.fixedCosts}
                onChange={(e) => handleInputChange('fixedCosts', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Variable Cost/Unit (R$)"
                type="number"
                value={investmentData.variableCostPerUnit}
                onChange={(e) => handleInputChange('variableCostPerUnit', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price/Unit (R$)"
                type="number"
                value={investmentData.pricePerUnit}
                onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Calculate Metrics'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleScenarioAnalysis}
              disabled={isLoading}
            >
              Run Scenario Analysis
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleMonteCarloSimulation}
              disabled={isLoading}
            >
              Monte Carlo Simulation
            </Button>
            
            <Button
              variant="text"
              onClick={clearResults}
              disabled={isLoading}
            >
              Clear Results
            </Button>
          </Box>
        </CardContent>
      </Card>

      {results.investmentMetrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Investment Metrics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    NPV
                  </Typography>
                  <Typography variant="h5" color={results.investmentMetrics.npv?.npv > 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(results.investmentMetrics.npv?.npv || 0)}
                  </Typography>
                  <Typography variant="caption">
                    PI: {results.investmentMetrics.npv?.profitabilityIndex?.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    IRR
                  </Typography>
                  <Typography variant="h5">
                    {formatPercentage(results.investmentMetrics.irr?.irr)}
                  </Typography>
                  <Typography variant="caption">
                    {results.investmentMetrics.irr?.isValid ? 'Valid' : 'Invalid'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Payback Period
                  </Typography>
                  <Typography variant="h5">
                    {results.investmentMetrics.payback?.paybackPeriod?.toFixed(2) || 'N/A'} years
                  </Typography>
                  <Typography variant="caption">
                    {results.investmentMetrics.payback?.isWithinProjectLife ? 'Achievable' : 'Not achievable'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Break-even
                  </Typography>
                  <Typography variant="h5">
                    {results.investmentMetrics.breakeven?.breakEvenUnits?.toLocaleString() || 'N/A'} units
                  </Typography>
                  <Typography variant="caption">
                    {formatCurrency(results.investmentMetrics.breakeven?.breakEvenRevenue || 0)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {results.scenarios && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Analysis
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Scenario</TableCell>
                    <TableCell align="right">NPV</TableCell>
                    <TableCell align="right">Profitability Index</TableCell>
                    <TableCell align="right">Decision</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(results.scenarios).map(([scenario, data]) => (
                    <TableRow key={scenario}>
                      <TableCell>{scenario.charAt(0).toUpperCase() + scenario.slice(1)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.npv)}</TableCell>
                      <TableCell align="right">{data.profitabilityIndex?.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {data.npv > 0 ? (
                          <Typography color="success.main">Accept</Typography>
                        ) : (
                          <Typography color="error.main">Reject</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {results.monteCarlo && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monte Carlo Simulation Results
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Statistical Summary
                </Typography>
                
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Mean NPV</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.mean)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Median NPV</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.median)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Standard Deviation</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.standardDeviation)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>95% Confidence Interval</TableCell>
                      <TableCell align="right">
                        {formatCurrency(results.monteCarlo.confidenceInterval.lower)} - {formatCurrency(results.monteCarlo.confidenceInterval.upper)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Probability of Success</TableCell>
                      <TableCell align="right">{formatPercentage(results.monteCarlo.probabilityOfSuccess * 100)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Percentiles
                </Typography>
                
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>5th Percentile</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.percentiles.p5)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>25th Percentile</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.percentiles.p25)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>75th Percentile</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.percentiles.p75)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>95th Percentile</TableCell>
                      <TableCell align="right">{formatCurrency(results.monteCarlo.percentiles.p95)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FinancialCalculatorExample;