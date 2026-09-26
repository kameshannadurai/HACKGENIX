/**
 * SyncField Shared Authentication & RBAC Router Engine
 * Handles JWT token storage, credentials authentication, session verification, and role redirect.
 */

const AUTH_API_BASE = "http://localhost:8000/api";

const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@syncfield.demo',
    password: 'Admin@123',
    name: 'Sarah Chen',
    role: 'ADMIN',
    dashboard: 'admin.html'
  },
  officer: {
    email: 'field@syncfield.demo',
    password: 'Field@123',
    name: 'Arun Kumar',
    role: 'FIELD_WORKER',
    dashboard: 'field-officer.html'
  },
  supervisor: {
    email: 'supervisor@syncfield.demo',
    password: 'Supervisor@123',
    name: 'Marcus Brody',
    role: 'SUPERVISOR',
    dashboard: 'supervisor.html'
  }
};

class AuthEngine {
  constructor() {
    this.token = localStorage.getItem('syncfield_token') || null;
    this.user = JSON.parse(localStorage.getItem('syncfield_user') || 'null');
  }

  isLoggedIn() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  getRole() {
    return this.user ? this.user.role : null;
  }

  /**
   * Authenticates user against Spring Boot backend with graceful offline fallback
   */
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data;
        this.setSession(data.token, {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
          organizationName: data.organizationName
        });
        return { success: true, user: this.user, role: data.role };
      }
    } catch (err) {
      console.warn("Backend login offline, attempting demo credential match:", err.message);
    }

    // Demo account matching fallback when backend is starting or offline
    for (const key of Object.keys(DEMO_CREDENTIALS)) {
      const demo = DEMO_CREDENTIALS[key];
      if (demo.email.toLowerCase() === email.toLowerCase() && demo.password === password) {
        const mockToken = `DEMO-JWT-${btoa(email)}-${Date.now()}`;
        this.setSession(mockToken, {
          userId: `usr-${key}`,
          name: demo.name,
          email: demo.email,
          role: demo.role,
          organizationName: 'Mojave Solar Array Operations'
        });
        return { success: true, user: this.user, role: demo.role };
      }
    }

    throw new Error('Invalid email or password. Please use demo credentials.');
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('syncfield_token', token);
    localStorage.setItem('syncfield_user', JSON.stringify(user));
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('syncfield_token');
    localStorage.removeItem('syncfield_user');
    window.location.href = 'login.html';
  }

  /**
   * Checks current page role guard; redirects to login or appropriate dashboard if unauthorized
   */
  requireRole(requiredRoles) {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRole = this.getRole();

    // Map role variants (e.g. FIELD_WORKER / FIELD_OFFICER)
    const normalizedRole = userRole === 'FIELD_WORKER' ? 'FIELD_OFFICER' : userRole;

    const hasAccess = roles.some(r => {
      const normR = r === 'FIELD_WORKER' ? 'FIELD_OFFICER' : r;
      return normR === normalizedRole || normR === userRole;
    });

    if (!hasAccess) {
      alert(`[ACCESS RESTRICTED] RBAC Permission Check: Your role (${userRole}) does not have permission to view this dashboard.`);
      this.redirectToDashboard();
      return false;
    }

    return true;
  }

  redirectToDashboard() {
    if (!this.user) {
      window.location.href = 'login.html';
      return;
    }

    const role = this.user.role;
    if (role === 'ADMIN') {
      window.location.href = 'admin.html';
    } else if (role === 'SUPERVISOR') {
      window.location.href = 'supervisor.html';
    } else {
      window.location.href = 'field-officer.html';
    }
  }
}

window.authEngine = new AuthEngine();
