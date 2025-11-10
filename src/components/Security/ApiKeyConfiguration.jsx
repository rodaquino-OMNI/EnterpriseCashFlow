/**
 * API Key Configuration Component
 * Manages API keys for AI services with security features
 */

import React, { useState, useEffect } from 'react';
import { apiKeyManager, monitoringService } from '../../services';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormField } from '../ui/FormField';

export const ApiKeyConfiguration = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
  });
  const [registeredServices, setRegisteredServices] = useState([]);
  const [keyStatuses, setKeyStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Load registered services
    const services = apiKeyManager.getRegisteredServices();
    setRegisteredServices(services);

    // Check key statuses
    const statuses = {};
    ['openai', 'anthropic', 'gemini'].forEach(service => {
      statuses[service] = services.includes(service);
    });
    setKeyStatuses(statuses);

    // Listen for key rotation events
    const handleRotationRequired = (event) => {
      const { service } = event.detail;
      setMessage({
        type: 'warning',
        text: `API key rotation required for ${service}. Please update the key.`,
      });
    };

    window.addEventListener('apiKeyRotationRequired', handleRotationRequired);
    return () => {
      window.removeEventListener('apiKeyRotationRequired', handleRotationRequired);
    };
  }, []);

  const handleSaveKey = async (service) => {
    const stopTimer = monitoringService.startTimer('saveApiKey');
    
    try {
      setLoading(true);
      setMessage(null);

      const apiKey = apiKeys[service];
      if (!apiKey) {
        throw new Error('Please enter an API key');
      }

      // Validate key format
      if (!apiKeyManager.validateKeyFormat(service, apiKey)) {
        throw new Error('Invalid API key format');
      }

      // Register or update the key
      if (keyStatuses[service]) {
        // Update existing key
        const existingKeys = Array.from(apiKeyManager.keys.values());
        const existingKey = existingKeys.find(k => k.service === service && k.active);
        if (existingKey) {
          apiKeyManager.updateApiKey(existingKey.id, apiKey);
        }
      } else {
        // Register new key
        apiKeyManager.registerApiKey(service, apiKey, {
          addedBy: 'user',
          addedAt: new Date().toISOString(),
        });
      }

      // Log the operation
      monitoringService.auditFinancialOperation('API_KEY_UPDATE', {
        service,
        action: keyStatuses[service] ? 'update' : 'register',
        timestamp: new Date().toISOString(),
      });

      // Update status
      setKeyStatuses(prev => ({ ...prev, [service]: true }));
      setApiKeys(prev => ({ ...prev, [service]: '' })); // Clear input
      
      setMessage({
        type: 'success',
        text: `API key for ${service} saved successfully`,
      });

    } catch (error) {
      monitoringService.error(error, {
        component: 'ApiKeyConfiguration',
        operation: 'saveApiKey',
        service,
      });

      setMessage({
        type: 'error',
        text: error.message,
      });
    } finally {
      setLoading(false);
      stopTimer({ service });
    }
  };

  const handleRemoveKey = async (service) => {
    try {
      setMessage(null);

      // Find and revoke the key
      const keys = Array.from(apiKeyManager.keys.values());
      const activeKey = keys.find(k => k.service === service && k.active);
      
      if (activeKey) {
        apiKeyManager.revokeApiKey(activeKey.id);
        
        // Log the operation
        monitoringService.auditFinancialOperation('API_KEY_REVOKE', {
          service,
          timestamp: new Date().toISOString(),
        });

        setKeyStatuses(prev => ({ ...prev, [service]: false }));
        
        setMessage({
          type: 'success',
          text: `API key for ${service} removed`,
        });
      }
    } catch (error) {
      monitoringService.error(error, {
        component: 'ApiKeyConfiguration',
        operation: 'removeApiKey',
        service,
      });

      setMessage({
        type: 'error',
        text: error.message,
      });
    }
  };

  const handleExportKeys = async () => {
    try {
      const exportData = apiKeyManager.exportKeys();
      
      // Create download
      const blob = new Blob([exportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-keys-backup-${new Date().toISOString().split('T')[0]}.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export
      monitoringService.auditFinancialOperation('API_KEYS_EXPORT', {
        timestamp: new Date().toISOString(),
      });

      setMessage({
        type: 'success',
        text: 'API keys exported successfully',
      });
    } catch (error) {
      monitoringService.error(error, {
        component: 'ApiKeyConfiguration',
        operation: 'exportKeys',
      });

      setMessage({
        type: 'error',
        text: 'Failed to export API keys',
      });
    }
  };

  const getKeyStatus = (service) => {
    if (!keyStatuses[service]) return 'Not configured';
    
    // Get usage stats
    const keys = Array.from(apiKeyManager.keys.values());
    const activeKey = keys.find(k => k.service === service && k.active);
    if (!activeKey) return 'Not configured';

    const stats = apiKeyManager.getKeyUsageStats(activeKey.id);
    if (stats) {
      return `Active (${stats.requests} requests)`;
    }
    
    return 'Active';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          API Key Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Securely manage API keys for AI services. Keys are encrypted and stored locally.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : message.type === 'warning'
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-red-50 text-red-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(apiKeys).map(([service, value]) => (
          <div key={service} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900 capitalize">
                  {service} API
                </h3>
                <p className="text-sm text-gray-500">
                  Status: {getKeyStatus(service)}
                </p>
              </div>
              {keyStatuses[service] && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveKey(service)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <FormField label={`${service} API Key`}>
                <div className="relative">
                  <Input
                    type={showKeys[service] ? 'text' : 'password'}
                    value={value}
                    onChange={(e) =>
                      setApiKeys(prev => ({ ...prev, [service]: e.target.value }))
                    }
                    placeholder={keyStatuses[service] ? '••••••••••••••••' : 'Enter API key'}
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowKeys(prev => ({ ...prev, [service]: !prev[service] }))
                    }
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showKeys[service] ? 'Hide' : 'Show'}
                  </button>
                </div>
              </FormField>

              <Button
                onClick={() => handleSaveKey(service)}
                disabled={loading || !value}
                size="sm"
                className="w-full"
              >
                {keyStatuses[service] ? 'Update Key' : 'Save Key'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Backup & Security
            </h3>
            <p className="text-sm text-gray-500">
              Export encrypted backup of all API keys
            </p>
          </div>
          <Button
            onClick={handleExportKeys}
            variant="secondary"
            size="sm"
            disabled={registeredServices.length === 0}
          >
            Export Keys
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Security Information
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• API keys are encrypted using AES-256 encryption</li>
          <li>• Keys are stored locally in your browser</li>
          <li>• Automatic key rotation reminders every 90 days</li>
          <li>• All key operations are logged for audit purposes</li>
        </ul>
      </div>
    </div>
  );
};