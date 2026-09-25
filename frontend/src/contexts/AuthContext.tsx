import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickLogin: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('syncfield_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('syncfield_user');
      }
    } else {
      // Default to Worker-01 for immediate hackathon usability
      const defaultUser: User = {
        id: 'worker-01',
        name: 'Worker-01 (Alex Rivera)',
        email: 'worker1@syncfield.io',
        role: 'FIELD_WORKER',
        organizationName: 'SyncField Demo Organization',
      };
      setUser(defaultUser);
      localStorage.setItem('syncfield_user', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedIn = await api.login(email, pass);
      setUser(loggedIn);
    } catch (e) {
      // Fallback local mock login
      const mockRole: Role = email.includes('supervisor')
        ? 'SUPERVISOR'
        : email.includes('admin')
        ? 'ADMIN'
        : 'FIELD_WORKER';

      const mockUser: User = {
        id: mockRole === 'SUPERVISOR' ? 'sup-01' : 'worker-01',
        name: mockRole === 'SUPERVISOR' ? 'Supervisor (David Vance)' : 'Worker-01 (Alex Rivera)',
        email,
        role: mockRole,
        organizationName: 'SyncField Demo Organization',
      };
      setUser(mockUser);
      localStorage.setItem('syncfield_user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: Role) => {
    let mockUser: User;
    if (role === 'SUPERVISOR') {
      mockUser = {
        id: 'sup-01',
        name: 'Supervisor (David Vance)',
        email: 'supervisor@syncfield.io',
        role: 'SUPERVISOR',
        organizationName: 'SyncField Demo Organization',
      };
    } else if (role === 'ADMIN') {
      mockUser = {
        id: 'admin-01',
        name: 'Admin (Rachel Adams)',
        email: 'admin@syncfield.io',
        role: 'ADMIN',
        organizationName: 'SyncField Demo Organization',
      };
    } else {
      mockUser = {
        id: 'worker-01',
        name: 'Worker-01 (Alex Rivera)',
        email: 'worker1@syncfield.io',
        role: 'FIELD_WORKER',
        organizationName: 'SyncField Demo Organization',
      };
    }
    setUser(mockUser);
    localStorage.setItem('syncfield_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('syncfield_user');
    localStorage.removeItem('syncfield_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
