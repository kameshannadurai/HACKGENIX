import React from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { db } from '../db/indexedDb';
import {
  WifiOff,
  PauseOctagon,
  RotateCcw,
  Zap,
  Split,
  Layers,
} from 'lucide-react';

export const DemoControllerBar: React.FC = () => {
  const {
    isSimulatedOffline,
    isSimulatedInterrupted,
    toggleSimulatedOffline,
    toggleSimulatedInterrupted,
    restoreFullNetwork,
  } = useNetwork();

  const injectDemoConflict = async () => {
    const op = await db.operations.first();
    const opId = op?.id || 'op-demo-conflict';
    const opCode = op?.operationId || 'OP-2026-0047';

    await db.conflicts.put({
      id: `conflict-${Date.now()}`,
      operationId: opId,
      operationCode: opCode,
      jobTitle: 'Solar Panel Inspection #47',
      localVersion: 2,
      serverVersion: 3,
      conflictType: 'CONCURRENT_INSPECTION_EDIT',
      localData: JSON.stringify({
        conditionRating: 'NEEDS_MAINTENANCE',
        temperatureCelsius: 68.4,
        notes: 'Worker-01: Thermal hot-spot detected on Cell 12. Bypass diode replacement required.',
        timestamp: new Date().toISOString(),
      }),
      serverData: JSON.stringify({
        conditionRating: 'CRITICAL_FAILURE',
        temperatureCelsius: 82.1,
        notes: 'Supervisor Review: Cell 12 delamination detected. Urgent full junction box swap required.',
        timestamp: new Date(Date.now() - 600000).toISOString(),
      }),
      status: 'UNRESOLVED',
      createdAt: new Date().toISOString(),
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      operationId: opId,
      operationCode: opCode,
      action: 'CONFLICT_INJECTED',
      description: `Simulated concurrent modification conflict injected on ${opCode} (Local v2 vs Server v3)`,
      timestamp: new Date().toISOString(),
    });

    alert('Demo Conflict Injected! Navigate to Conflict Management or Supervisor Dashboard to inspect and resolve.');
  };

  return (
    <header className="bg-slate-950/95 border-b border-sky-900/40 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 font-bold border border-sky-700/60 uppercase tracking-wider text-[11px]">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Judge Demo Bar
        </span>
        <span className="text-slate-400 hidden md:inline text-[11px]">
          Simulate 3-minute hackathon offline-first continuity workflow
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Button 1: Simulate Network Loss */}
        <button
          onClick={toggleSimulatedOffline}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
            isSimulatedOffline
              ? 'bg-rose-600 text-white shadow-rose-900/50 shadow-md ring-2 ring-rose-400'
              : 'bg-slate-800 text-rose-300 hover:bg-rose-950 border border-rose-900/60'
          }`}
          title="Disconnect network to test offline persistence and Dexie queue"
        >
          <WifiOff className="w-3.5 h-3.5" />
          {isSimulatedOffline ? 'OFFLINE ACTIVE' : 'Simulate Network Loss'}
        </button>

        {/* Button 2: Interrupt Upload */}
        <button
          onClick={toggleSimulatedInterrupted}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
            isSimulatedInterrupted
              ? 'bg-amber-600 text-white shadow-amber-900/50 shadow-md ring-2 ring-amber-400'
              : 'bg-slate-800 text-amber-300 hover:bg-amber-950 border border-amber-900/60'
          }`}
          title="Interrupt active media upload to test chunk checkpointing"
        >
          <PauseOctagon className="w-3.5 h-3.5" />
          {isSimulatedInterrupted ? 'PAUSE AT CHECKPOINT' : 'Interrupt Upload'}
        </button>

        {/* Button 3: Restore Network & Resume */}
        <button
          onClick={restoreFullNetwork}
          className="flex items-center gap-1 px-2.5 py-1 rounded font-medium bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 shadow-sm transition-all"
          title="Restore full connectivity and auto-trigger resume from verified checkpoint"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore & Resume
        </button>

        {/* Button 4: Inject Demo Conflict */}
        <button
          onClick={injectDemoConflict}
          className="flex items-center gap-1 px-2 py-1 rounded font-medium bg-purple-900/60 text-purple-200 hover:bg-purple-800 border border-purple-700/60 transition-all text-[11px]"
          title="Inject a version conflict between field worker and supervisor"
        >
          <Split className="w-3 h-3 text-purple-300" />
          Inject Conflict
        </button>
      </div>
    </header>
  );
};
