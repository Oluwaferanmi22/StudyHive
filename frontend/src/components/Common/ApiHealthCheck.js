import React, { useState } from 'react';
import api from '../../api';

const ApiHealthCheck = () => {
  const [status, setStatus] = useState('idle'); // idle, checking, success, error
  const [result, setResult] = useState(null);

  const checkHealth = async () => {
    setStatus('checking');
    setResult(null);

    try {
      // Test basic API connectivity
      const startTime = Date.now();
      const response = await api.get('/health');
      const endTime = Date.now();
      
      if (response.data) {
        setStatus('success');
        setResult({
          message: response.data.message || 'API is healthy',
          responseTime: endTime - startTime,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        throw new Error('No response data');
      }
    } catch (error) {
      setStatus('error');
      setResult({
        message: error.response?.data?.message || error.message || 'Connection failed',
        status: error.response?.status || 0,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔍';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Backend API Health Check
      </h3>
      
      <div className="text-center mb-4">
        <button
          onClick={checkHealth}
          disabled={status === 'checking'}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
        >
          {status === 'checking' ? 'Checking...' : 'Check Connection'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">{getStatusIcon()}</span>
            <span className="font-medium">
              {status === 'success' ? 'Connected' : 'Connection Failed'}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <p><strong>Message:</strong> {result.message}</p>
            <p><strong>Time:</strong> {result.timestamp}</p>
            
            {result.responseTime && (
              <p><strong>Response Time:</strong> {result.responseTime}ms</p>
            )}
            
            {result.status && result.status !== 0 && (
              <p><strong>Status Code:</strong> {result.status}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Backend URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
        <p>Socket URL: {process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'}</p>
      </div>
    </div>
  );
};

export default ApiHealthCheck;
