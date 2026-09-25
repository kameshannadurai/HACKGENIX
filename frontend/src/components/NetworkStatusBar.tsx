import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { Wifi, WifiOff, RefreshCw, PauseCircle } from 'lucide-react';

export const NetworkStatusBar: React.FC = () => {
  const { isOnline, isSimulatedOffline, isSimulatedInterrupted } = useNetwork();

  if (isSimulatedInterrupted) {
    return (
      <div className="bg-amber-600/90 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md border-b border-amber-500 animate-pulse">
        <PauseCircle className="w-4 h-4" />
        <span>SIMULATED NETWORK INTERRUPTION ACTIVE — Uploads Paused at Checkpoint</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="bg-rose-600/90 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md border-b border-rose-500">
        <WifiOff className="w-4 h-4 animate-bounce" />
        <span>🔴 OFFLINE MODE ACTIVE — All Evidence Safely Stored in Local Dexie Vault</span>
        {isSimulatedOffline && <span className="bg-rose-900/80 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">Simulated</span>}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 text-emerald-400 px-4 py-1 text-[11px] font-medium flex items-center justify-between border-b border-slate-800">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span>🟢 ONLINE — Evidence Continuity Engine Ready</span>
      </div>
      <span className="text-slate-400 hidden sm:inline">Auto-Sync: Active</span>
    </div>
  );
};
