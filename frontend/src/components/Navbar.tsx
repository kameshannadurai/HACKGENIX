import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import {
  ShieldAlert,
  HardDrive,
  RefreshCw,
  FolderLock,
  FileSpreadsheet,
  Clock,
  Layers,
  UserCheck,
  LogOut,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { Role } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, quickLogin, logout } = useAuth();
  const location = useLocation();

  const queueCount = useLiveQuery(async () => {
    return await db.syncQueue.count();
  }, []) || 0;

  const conflictCount = useLiveQuery(async () => {
    return await db.conflicts.where('status').equals('UNRESOLVED').count();
  }, []) || 0;

  const isWorker = role === 'FIELD_WORKER';
  const isSupervisor = role === 'SUPERVISOR' || role === 'ADMIN';

  return (
    <nav className="glass-panel border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-9 z-40">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-sky-400 via-cyan-200 to-white bg-clip-text text-transparent">
                SyncField
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-sky-950 text-sky-400 rounded border border-sky-800">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Evidence Continuity Engine
            </p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            location.pathname === '/'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isWorker ? 'My Jobs' : 'Worker App'}</span>
        </Link>

        <Link
          to="/sync"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 relative transition-all ${
            location.pathname === '/sync'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Center</span>
          {queueCount > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5 animate-pulse">
              {queueCount}
            </span>
          )}
        </Link>

        {isSupervisor && (
          <>
            <Link
              to="/supervisor"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                location.pathname === '/supervisor'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Evidence Vault</span>
            </Link>

            <Link
              to="/conflicts"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 relative transition-all ${
                location.pathname === '/conflicts'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Conflicts</span>
              {conflictCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {conflictCount}
                </span>
              )}
            </Link>

            <Link
              to="/audit"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                location.pathname === '/audit'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Timeline</span>
            </Link>
          </>
        )}
      </div>

      {/* User & Role Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          <div className="text-left hidden sm:block">
            <p className="text-[11px] font-bold text-slate-200 leading-none truncate max-w-[130px]">
              {user?.name || 'Worker-01'}
            </p>
            <p className="text-[9px] text-sky-400 font-semibold uppercase tracking-wider leading-none mt-0.5">
              {role || 'FIELD_WORKER'}
            </p>
          </div>
        </div>

        {/* Quick Role Switch Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => quickLogin('FIELD_WORKER')}
            className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
              role === 'FIELD_WORKER'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Switch role to Field Worker"
          >
            Worker
          </button>
          <button
            onClick={() => quickLogin('SUPERVISOR')}
            className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
              role === 'SUPERVISOR'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title="Switch role to Supervisor"
          >
            Supervisor
          </button>
        </div>
      </div>
    </nav>
  );
};
