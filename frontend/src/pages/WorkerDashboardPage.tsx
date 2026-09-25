import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  HardDrive,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { Job, Priority } from '../types';

export const WorkerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Live query jobs from IndexedDB
  const jobs = useLiveQuery(async () => {
    return await db.jobs.toArray();
  }, []) || [];

  const queuedOperations = useLiveQuery(async () => {
    return await db.syncQueue.toArray();
  }, []) || [];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assetName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority =
      selectedPriority === 'ALL' || job.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-medium bg-sky-950 text-sky-300 border border-sky-800 rounded">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-black text-slate-100 tracking-tight">
                  Field Operations Hub
                </h1>
                <p className="text-xs text-slate-400">
                  Technician: <strong className="text-slate-200">{user?.name}</strong> • Org: <strong className="text-slate-200">{user?.organizationName || 'SyncField'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Jobs</p>
                <p className="text-base font-extrabold text-white leading-none">{jobs.length}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Local Queue</p>
                <p className="text-base font-extrabold text-amber-400 leading-none">{queuedOperations.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search job code, asset, or title..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedPriority === p
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-sky-500/50 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800/70">
                  {job.jobCode}
                </span>
                <div className="flex items-center gap-1.5">
                  {getPriorityBadge(job.priority)}
                </div>
              </div>

              {/* Title & Asset */}
              <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors mb-1">
                {job.title}
              </h3>
              <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Asset Target: <span className="text-slate-200">{job.assetName}</span>
              </p>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Footer / Action */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{job.status}</span>
              </div>

              <Link
                to={`/job/${job.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 group-hover:translate-x-0.5 transition-all"
              >
                <span>Open Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No matching jobs found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search filter</p>
        </div>
      )}
    </div>
  );
};
