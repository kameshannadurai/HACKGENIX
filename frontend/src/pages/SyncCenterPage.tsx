import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import { useNetwork } from '../contexts/NetworkContext';
import { syncEngine, SyncProgressUpdate } from '../sync/syncEngine';
import {
  RefreshCw,
  Play,
  HardDrive,
  ShieldCheck,
  PauseCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  FileText,
  Radio,
} from 'lucide-react';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { SyncState } from '../types';

export const SyncCenterPage: React.FC = () => {
  const { isOnline, restoreFullNetwork, triggerManualSync } = useNetwork();
  const [liveProgress, setLiveProgress] = useState<SyncProgressUpdate | null>(null);

  // Subscribe to live SyncEngine updates
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((update) => {
      setLiveProgress(update);
    });
    return unsubscribe;
  }, []);

  const queueItems = useLiveQuery(async () => {
    return await db.syncQueue.toArray();
  }, []) || [];

  const allOperations = useLiveQuery(async () => {
    return await db.operations.toArray();
  }, []) || [];

  const stateMachineOrder: SyncState[] = [
    'CAPTURED',
    'STORED_OFFLINE',
    'QUEUED',
    'UPLOADING',
    'PAUSED_RETRYING',
    'RESUMING',
    'UPLOADED',
    'VERIFYING',
    'VERIFIED',
    'SYNCED',
  ];

  const currentActiveState = liveProgress?.state || (queueItems.length > 0 ? queueItems[0].status : 'SYNCED');

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-900/40 text-cyan-400 border border-cyan-700/50">
                <RefreshCw className={`w-5 h-5 ${liveProgress?.state === 'UPLOADING' ? 'animate-spin' : ''}`} />
              </span>
              <div>
                <h1 className="text-xl font-black text-slate-100 tracking-tight">
                  Evidence Continuity Sync Center
                </h1>
                <p className="text-xs text-slate-400">
                  Resumable Chunk Engine • SHA-256 Verifier • Idempotent Queue
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                restoreFullNetwork();
                triggerManualSync();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Trigger Auto-Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Synchronization State Machine Visualization */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Active Continuity State Machine
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Current: <strong className="text-sky-300">{currentActiveState}</strong>
          </span>
        </div>

        {/* State Machine Flow Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {stateMachineOrder.map((st, idx) => {
            const isActive = currentActiveState === st;
            const isCompleted = stateMachineOrder.indexOf(currentActiveState) > idx;

            return (
              <div
                key={st}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'bg-sky-950/90 border-sky-500 shadow-md ring-2 ring-sky-500/40'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono font-bold mb-1 flex items-center justify-center gap-1">
                  <span>Step {idx + 1}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <p className={`text-[11px] font-bold truncate ${isActive ? 'text-sky-300' : ''}`}>
                  {st.replace('_', ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Live In-Flight Chunked Media Progress Card */}
      {liveProgress && (
        <div className="glass-panel p-5 rounded-2xl border border-sky-600/50 bg-slate-950 shadow-xl space-y-4 glow-sky">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <h3 className="text-sm font-bold text-slate-100">
                In-Flight Operation: {liveProgress.operationId}
              </h3>
            </div>
            <SyncStatusBadge status={liveProgress.state} />
          </div>

          {/* Transfer Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Transfer Progress (Resumable Chunks)</span>
              <span>
                {((liveProgress.uploadedBytes || 0) / 1024 / 1024).toFixed(1)} MB /{' '}
                {((liveProgress.totalBytes || 1) / 1024 / 1024).toFixed(1)} MB (
                {Math.round(((liveProgress.uploadedBytes || 0) / (liveProgress.totalBytes || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  liveProgress.state === 'PAUSED_RETRYING'
                    ? 'bg-amber-500'
                    : liveProgress.state === 'VERIFIED'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((liveProgress.uploadedBytes || 0) / (liveProgress.totalBytes || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Checkpoint Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Current Checkpoint</p>
              <p className="font-mono font-bold text-sky-400">
                Chunk #{liveProgress.checkpointChunk} of {liveProgress.totalChunks || 1}
              </p>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Target File</p>
              <p className="font-mono font-bold text-slate-200 truncate">
                {liveProgress.currentFile || 'Manifest & Media Package'}
              </p>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Integrity Protocol</p>
              <p className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 Validated
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Offline Sync Queue Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            Local IndexedDB Sync Queue ({queueItems.length})
          </h3>
          <span className="text-xs text-slate-400">Persistent across browser restarts</span>
        </div>

        {queueItems.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {queueItems.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{item.operationId}</span>
                    <SyncStatusBadge status={item.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enqueued: {new Date(item.enqueuedAt).toLocaleTimeString()} • Size: {((item.totalBytes || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerManualSync()}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all"
                  >
                    Sync Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">All local operations are synchronized</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              New field operations captured offline will appear here automatically
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4: Completed Synchronized Operations */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Synchronized Field Operations ({allOperations.length})
        </h3>

        <div className="divide-y divide-slate-800">
          {allOperations.map((op) => (
            <div key={op.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200">{op.operationId}</span>
                  <span className="text-xs text-sky-400 font-semibold">{op.jobTitle || 'Field Inspection'}</span>
                  <SyncStatusBadge status={op.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Worker: {op.workerName || 'Worker-01'} • Captured: {new Date(op.clientCreatedAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                  {op.evidencePackage?.files.length || 0} Evidence Files Bound
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
