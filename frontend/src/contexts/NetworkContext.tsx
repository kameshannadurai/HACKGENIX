import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncEngine } from '../sync/syncEngine';

interface NetworkContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSimulatedInterrupted: boolean;
  toggleSimulatedOffline: () => void;
  toggleSimulatedInterrupted: () => void;
  restoreFullNetwork: () => void;
  triggerManualSync: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realOnline, setRealOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOfflineState] = useState<boolean>(false);
  const [simulatedInterrupted, setSimulatedInterruptedState] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = () => {
    const newVal = !simulatedOffline;
    setSimulatedOfflineState(newVal);
    syncEngine.setSimulatedOffline(newVal);
  };

  const toggleSimulatedInterrupted = () => {
    const newVal = !simulatedInterrupted;
    setSimulatedInterruptedState(newVal);
    syncEngine.setSimulatedInterrupted(newVal);
  };

  const restoreFullNetwork = () => {
    setSimulatedOfflineState(false);
    setSimulatedInterruptedState(false);
    syncEngine.setSimulatedOffline(false);
    syncEngine.setSimulatedInterrupted(false);
    syncEngine.triggerSync();
  };

  const triggerManualSync = () => {
    syncEngine.triggerSync();
  };

  const effectiveOnline = realOnline && !simulatedOffline;

  return (
    <NetworkContext.Provider
      value={{
        isOnline: effectiveOnline,
        isSimulatedOffline: simulatedOffline,
        isSimulatedInterrupted: simulatedInterrupted,
        toggleSimulatedOffline,
        toggleSimulatedInterrupted,
        restoreFullNetwork,
        triggerManualSync,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
