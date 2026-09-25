import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import {
  Clock,
  ShieldCheck,
  HardDrive,
  WifiOff,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  PauseCircle,
  Play,
  Layers,
  Search,
} from 'lucide-react';
import { AuditLogItem } from '../types';

export const AuditTimelinePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const logs = useLiveQuery(async () => {
    return await db.auditLogs.reverse().toArray();
  }, []) || [];

  const filteredLogs = logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.operationCode && log.operationCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'EVIDENCE_PACKAGE_CREATED':
      case 'VAULT_INITIALIZED':
        return <HardDrive className="w-4 h-4 text-purple-400" />;
      case 'UPLOAD_PAUSED_AT_CHECKPOINT':
        return <PauseCircle className="w-4 h-4 text-amber-400" />;
      case 'MEDIA_INTEGRITY_VERIFIED':
      case 'INTEGRITY_VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'CONFLICT_DETECTED':
      case 'CONFLICT_INJECTED':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'CONFLICT_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case 'OPERATION_FULLY_SYNCED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-sky-400" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('VERIFIED') || action.includes('SYNCED')) {
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
    if (action.includes('PAUSED') || action.includes('WARNING')) {
      return 'bg-amber-950 text-amber-300 border-amber-800';
    }
    if (action.includes('CONFLICT') || action.includes('ERROR')) {
      return 'bg-rose-950 text-rose-300 border-rose-800';
    }
    return 'bg-sky-950 text-sky-300 border-sky-800';
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/80">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                Immutable Audit Timeline
              </h1>
              <p className="text-xs text-slate-400">
                Minute-by-minute cryptographic trace of all field actions & sync transitions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter audit events by action, operation code, or message..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
        {filteredLogs.map((logItem) => (
          <div key={logItem.id} className="relative group">
            {/* Timeline Dot Icon */}
            <div className="absolute -left-[35px] sm:-left-[43px] top-1 p-1.5 rounded-xl bg-slate-950 border border-slate-700 shadow-md group-hover:border-sky-500 transition-colors">
              {getActionIcon(logItem.action)}
            </div>

            {/* Event Content Card */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getActionBadgeColor(logItem.action)}`}>
                    {logItem.action}
                  </span>
                  {logItem.operationCode && (
                    <span className="font-mono text-xs font-bold text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {logItem.operationCode}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(logItem.timestamp).toLocaleTimeString()} ({new Date(logItem.timestamp).toLocaleDateString()})
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {logItem.description}
              </p>

              {logItem.metadata && (
                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-850 overflow-x-auto">
                  {logItem.metadata}
                </pre>
              )}
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No matching audit logs found.
          </div>
        )}
      </div>
    </div>
  );
};
