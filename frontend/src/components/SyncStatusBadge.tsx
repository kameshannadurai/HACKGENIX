import React from 'react';
import { SyncState } from '../types';
import {
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  PauseCircle,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface Props {
  status: SyncState | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SyncStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case 'CAPTURED':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-slate-400" />
          CAPTURED
        </span>
      );
    case 'STORED_OFFLINE':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/80 ${sizeClasses}`}>
          <HardDrive className="w-3 h-3 text-purple-400" />
          STORED OFFLINE
        </span>
      );
    case 'QUEUED':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-400" />
          QUEUED
        </span>
      );
    case 'UPLOADING':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-950/90 text-sky-300 border border-sky-700 animate-pulse ${sizeClasses}`}>
          <ArrowUpCircle className="w-3 h-3 text-sky-400 animate-bounce" />
          UPLOADING
        </span>
      );
    case 'PAUSED_RETRYING':
      return (
        <span className={`inline-flex items-center rounded-full bg-orange-950/90 text-orange-300 border border-orange-700 ${sizeClasses}`}>
          <PauseCircle className="w-3 h-3 text-orange-400" />
          PAUSED / RETRYING
        </span>
      );
    case 'RESUMING':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-700 animate-pulse ${sizeClasses}`}>
          <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
          RESUMING FROM CHECKPOINT
        </span>
      );
    case 'UPLOADED':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-950 text-blue-300 border border-blue-800 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-blue-400" />
          UPLOADED
        </span>
      );
    case 'VERIFYING':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-950 text-teal-300 border border-teal-700 animate-pulse ${sizeClasses}`}>
          <ShieldCheck className="w-3 h-3 text-teal-400 animate-spin" />
          VERIFYING SHA-256
        </span>
      );
    case 'VERIFIED':
    case 'SYNCED':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-sm ${sizeClasses}`}>
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          INTEGRITY VERIFIED
        </span>
      );
    case 'CONFLICT':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-950/90 text-rose-300 border border-rose-700 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          CONFLICT
        </span>
      );
    case 'CORRUPTED':
    case 'FAILED':
      return (
        <span className={`inline-flex items-center rounded-full bg-red-950/90 text-red-300 border border-red-700 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 text-red-400" />
          {status}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
