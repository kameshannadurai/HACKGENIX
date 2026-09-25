import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowRightLeft,
  Clock,
  ShieldAlert,
  Save,
  Check,
  Split,
  Layers,
} from 'lucide-react';
import { ConflictItem } from '../types';

export const ConflictManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGED'>('MERGED');
  const [mergedNotes, setMergedNotes] = useState<string>('');

  const conflicts = useLiveQuery(async () => {
    return await db.conflicts.toArray();
  }, []) || [];

  const handleSelectConflict = (c: ConflictItem) => {
    setSelectedConflict(c);
    try {
      const local = JSON.parse(c.localData);
      const server = JSON.parse(c.serverData);
      setMergedNotes(
        `Merged Resolution: Combined Field Diagnosis\n- Local: ${local.notes || ''}\n- Server: ${server.notes || ''}`
      );
    } catch (e) {
      setMergedNotes('Merged Field Inspection Record');
    }
  };

  const handleResolve = async () => {
    if (!selectedConflict) return;

    try {
      selectedConflict.status = 'RESOLVED';
      selectedConflict.resolution = resolutionMode;
      selectedConflict.resolvedByName = user?.name || 'Supervisor (David Vance)';
      selectedConflict.resolvedAt = new Date().toISOString();

      await db.conflicts.put(selectedConflict);

      // Audit Log
      await db.auditLogs.add({
        id: `audit-${Date.now()}`,
        operationId: selectedConflict.operationId,
        operationCode: selectedConflict.operationCode,
        action: 'CONFLICT_RESOLVED',
        description: `Conflict on ${selectedConflict.operationCode} resolved via ${resolutionMode} by ${user?.name || 'Supervisor'}`,
        metadata: JSON.stringify({ resolution: resolutionMode, mergedNotes }),
        timestamp: new Date().toISOString(),
      });

      alert(`Conflict on ${selectedConflict.operationCode} successfully resolved!`);
      setSelectedConflict(null);
    } catch (err: any) {
      alert('Error resolving conflict: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/80">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                Conflict Detection & Resolution Engine
              </h1>
              <p className="text-xs text-slate-400">
                Multi-device Offline Version Reconciliation • 3-Way Merge Interface
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Conflict List + 3-Way Diff Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Conflict List */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detected Conflicts ({conflicts.length})
          </h2>

          <div className="space-y-2">
            {conflicts.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConflict(c)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedConflict?.id === c.id
                    ? 'bg-sky-950/80 border-sky-500 shadow-md ring-1 ring-sky-400'
                    : c.status === 'RESOLVED'
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900 border-rose-900/60 hover:border-rose-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-400">{c.operationCode}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'RESOLVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1">{c.jobTitle}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Local v{c.localVersion} ↔ Server v{c.serverVersion}
                </p>
              </div>
            ))}

            {conflicts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                No active conflicts detected. Click "Inject Conflict" on the demo bar to test!
              </div>
            )}
          </div>
        </div>

        {/* 3-Way Diff Workspace */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          {selectedConflict ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Conflict Resolution: {selectedConflict.operationCode}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedConflict.jobTitle}</p>
                </div>
                <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded text-amber-400 border border-slate-800">
                  Type: {selectedConflict.conflictType}
                </span>
              </div>

              {/* Side by Side Diffs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Local Version (Field Worker) */}
                <div className="bg-slate-900/90 rounded-xl p-4 border border-sky-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">
                      📱 Local Version (v{selectedConflict.localVersion})
                    </span>
                    <span className="text-[10px] text-slate-400">Worker-01 Device</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedConflict.localData}
                  </pre>
                </div>

                {/* Server Version (Supervisor / Cloud) */}
                <div className="bg-slate-900/90 rounded-xl p-4 border border-purple-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">
                      ☁️ Server Version (v{selectedConflict.serverVersion})
                    </span>
                    <span className="text-[10px] text-slate-400">Cloud Repository</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedConflict.serverData}
                  </pre>
                </div>
              </div>

              {/* Resolution Strategy Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-300">Choose Resolution Strategy:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setResolutionMode('KEEP_LOCAL')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      resolutionMode === 'KEEP_LOCAL'
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Keep Local (v{selectedConflict.localVersion})
                  </button>

                  <button
                    onClick={() => setResolutionMode('KEEP_SERVER')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      resolutionMode === 'KEEP_SERVER'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Keep Server (v{selectedConflict.serverVersion})
                  </button>

                  <button
                    onClick={() => setResolutionMode('MERGED')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      resolutionMode === 'MERGED'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    3-Way Merge
                  </button>
                </div>
              </div>

              {/* Editable Merge Area */}
              {resolutionMode === 'MERGED' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Merged Inspection Findings & Action Plan:
                  </label>
                  <textarea
                    rows={4}
                    value={mergedNotes}
                    onChange={(e) => setMergedNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Submit Resolution */}
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleResolve}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Resolution & Update Audit Log</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <Split className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs font-bold text-slate-400">Select a conflict from the list to reconcile</p>
              <p className="text-[11px]">
                Compare field technician telemetry against server records and choose keep or merge
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
