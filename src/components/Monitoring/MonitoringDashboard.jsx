/**
 * Monitoring Dashboard Component
 * Displays system health, performance metrics, and security status
 */

import React, { useState, useEffect } from 'react';
import { monitoringService } from '../../services';
import { Button } from '../ui/Button';

export const MonitoringDashboard = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [securityStats, setSecurityStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      // Get health status
      const health = monitoringService.getHealthStatus();
      setHealthStatus(health);

      // Get metrics
      const metricsData = monitoringService.metricsCollector.getAllMetrics();
      setMetrics(metricsData);

      // Get audit statistics
      const audit = monitoringService.auditLogger.getStatistics();
      setAuditStats(audit);

      // Get security statistics
      const security = monitoringService.securityMonitor.getStatistics();
      setSecurityStats(security);

      // Get performance metrics
      const performance = monitoringService.performanceMonitor.getMetricsSummary();
      setPerformanceMetrics(performance);

    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatNumber = (num) => {
    if (typeof num !== 'number') return 'N/A';
    return num.toLocaleString();
  };

  const formatDuration = (ms) => {
    if (typeof ms !== 'number') return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status) => {
    if (!status || !status.initialized) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          System Monitoring Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <Button onClick={fetchMonitoringData} size="sm" variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {healthStatus && Object.entries(healthStatus).map(([service, status]) => (
          <div key={service} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 capitalize">
                {service.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                {status.initialized ? 'Active' : 'Inactive'}
              </span>
            </div>
            {status.initialized && (
              <div className="text-sm text-gray-600">
                {Object.entries(status).map(([key, value]) => {
                  if (key === 'initialized') return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && Object.keys(performanceMetrics).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(performanceMetrics).map(([operation, data]) => (
              <div key={operation} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{operation}</h4>
                {data.stats && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Avg:</span>
                      <p className="font-medium">{formatDuration(data.stats.avg)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">P95:</span>
                      <p className="font-medium">{formatDuration(data.stats.p95)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Count:</span>
                      <p className="font-medium">{data.count}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Statistics */}
      {securityStats && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(securityStats.totalEvents)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Blocked IPs</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(securityStats.blockedIPs)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Rate Limits</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(securityStats.activeRateLimits)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Critical Events</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumber(securityStats.eventsBySeverity?.critical || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Statistics */}
      {auditStats && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Operations by Type</h4>
              <div className="space-y-2">
                {Object.entries(auditStats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-medium">{auditStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Operations</span>
                  <span className="font-medium text-red-600">
                    {auditStats.criticalOperations}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Metrics */}
      {metrics && metrics['business.revenue.total'] && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics).map(([key, data]) => {
              if (!key.startsWith('business.')) return null;
              return (
                <div key={key} className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">
                    {key.replace('business.', '').replace(/\./g, ' ')}
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {data.current !== null ? formatNumber(data.current) : 'N/A'}
                  </p>
                  {data.aggregated && (
                    <p className="text-xs text-blue-600 mt-1">
                      Avg: {formatNumber(data.aggregated.avg)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};