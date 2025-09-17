import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import { useAuth } from '../../pages/contexts/AuthContext';
import { ConnectionLoader } from './Loaders';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      setShowStatus(false);
      return;
    }

    const handleConnectionStatus = (data) => {
      setIsConnected(data.connected);
      setShowStatus(!data.connected);
      setIsReconnecting(false);
      
      // Hide success status after 3 seconds
      if (data.connected) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    const handleConnectionError = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    const handleAuthError = () => {
      setIsConnected(false);
      setShowStatus(true);
    };

    // Register socket event listeners
    socketService.on('connection_status', handleConnectionStatus);
    socketService.on('connection_error', handleConnectionError);
    socketService.on('auth_error', handleAuthError);

    // Initial check
    setIsConnected(socketService.isConnected());

    return () => {
      socketService.off('connection_status', handleConnectionStatus);
      socketService.off('connection_error', handleConnectionError);
      socketService.off('auth_error', handleAuthError);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || !showStatus) {
    return null;
  }

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 ${
      showStatus ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className={`mx-4 mt-2 p-3 rounded-lg shadow-lg ${
        isConnected 
          ? 'bg-green-100 border border-green-400 text-green-700'
          : 'bg-red-100 border border-red-400 text-red-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              {isConnected ? 'Connected to StudyHive' : 'Connection Lost'}
            </span>
          </div>
          
          {!isConnected && (
            isReconnecting ? (
              <ConnectionLoader message="Reconnecting..." size="sm" />
            ) : (
              <button
                onClick={async () => {
                  setIsReconnecting(true);
                  const token = localStorage.getItem('studyhive_token');
                  if (token) {
                    try {
                      await socketService.reconnect(token);
                    } catch (error) {
                      console.error('Reconnection failed:', error);
                      setIsReconnecting(false);
                    }
                  } else {
                    setIsReconnecting(false);
                  }
                }}
                className="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 rounded-md transition-colors"
              >
                Reconnect
              </button>
            )
          )}
        </div>
        
        {!isConnected && (
          <p className="text-sm mt-1 opacity-90">
            Real-time features are temporarily unavailable. 
            Check your internet connection.
          </p>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
