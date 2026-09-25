import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Cpu,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  UserCheck,
} from 'lucide-react';
import { Role } from '../types';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('worker1@syncfield.io');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      alert('Login notice: ' + err.message);
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRole = (role: Role) => {
    quickLogin(role);
    navigate('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SyncField
          </h1>
          <p className="text-xs text-slate-400">
            Offline-First Field Operations Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95"
          >
            <span>Sign In to Field Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Switchers */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <p className="text-[11px] font-bold text-center text-slate-400 uppercase tracking-wider">
            Quick Hackathon Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickRole('FIELD_WORKER')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-sky-950 border border-slate-800 hover:border-sky-700 text-slate-300 hover:text-sky-300 text-xs font-bold transition-all text-center"
            >
              Worker-01
            </button>
            <button
              onClick={() => handleQuickRole('SUPERVISOR')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-700 text-slate-300 hover:text-indigo-300 text-xs font-bold transition-all text-center"
            >
              Supervisor
            </button>
            <button
              onClick={() => handleQuickRole('ADMIN')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-purple-950 border border-slate-800 hover:border-purple-700 text-slate-300 hover:text-purple-300 text-xs font-bold transition-all text-center"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
