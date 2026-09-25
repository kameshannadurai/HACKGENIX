import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { DemoControllerBar } from './components/DemoControllerBar';
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { Navbar } from './components/Navbar';
import { WorkerDashboardPage } from './pages/WorkerDashboardPage';
import { JobExecutionPage } from './pages/JobExecutionPage';
import { SyncCenterPage } from './pages/SyncCenterPage';
import { SupervisorDashboardPage } from './pages/SupervisorDashboardPage';
import { ConflictManagementPage } from './pages/ConflictManagementPage';
import { AuditTimelinePage } from './pages/AuditTimelinePage';
import { LoginPage } from './pages/LoginPage';
import { seedLocalDexieDatabase } from './db/indexedDb';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-mono text-sky-400">
        Loading SyncField Vault...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  useEffect(() => {
    // Seed initial Dexie database on first launch
    seedLocalDexieDatabase().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* 1. Floating Judge Demo Simulation Bar */}
      <DemoControllerBar />

      {/* 2. Persistent Network Status Monitor */}
      <NetworkStatusBar />

      {/* 3. Navigation Header */}
      <Navbar />

      {/* 4. Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <WorkerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job/:jobId"
            element={
              <ProtectedRoute>
                <JobExecutionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sync"
            element={
              <ProtectedRoute>
                <SyncCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN', 'FIELD_WORKER']}>
                <SupervisorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conflicts"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN', 'FIELD_WORKER']}>
                <ConflictManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['SUPERVISOR', 'ADMIN', 'FIELD_WORKER']}>
                <AuditTimelinePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NetworkProvider>
          <AppContent />
        </NetworkProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
