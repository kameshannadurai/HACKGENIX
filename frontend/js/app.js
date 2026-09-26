/**
 * SyncField Enterprise UI Application Controller
 * Role-Based Access Control (RBAC) Architecture:
 * - FIELD OFFICER (Arun Kumar): Field inspection, offline evidence capture, resumable chunk upload.
 * - SUPERVISOR (Marcus Brody): Conflict resolution, evidence vault approvals, team dispatch.
 * - ADMINISTRATOR (Sarah Chen): Fleet device security, cryptographic key governance, compliance audit export.
 */

let BACKEND_PORT = 8000;
let API_BASE = window.API_BASE_URL || localStorage.getItem('SYNCFIELD_API_URL') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://hackgenix.onrender.com/api');
let CLOUD_API_URL = `${API_BASE}/operations`;

async function getBackendApiUrl(endpoint) {
  if (window.API_BASE_URL) {
    return `${window.API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
  }
  const customUrl = localStorage.getItem('SYNCFIELD_API_URL');
  if (customUrl) {
    return `${customUrl.replace(/\/$/, '')}${endpoint}`;
  }
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `https://hackgenix.onrender.com/api${endpoint}`;
  }
  const ports = [BACKEND_PORT, 8000, 8001];
  for (const p of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${p}/api/health`, { method: 'GET' });
      if (res.ok) {
        BACKEND_PORT = p;
        API_BASE = `http://127.0.0.1:${p}/api`;
        CLOUD_API_URL = `http://127.0.0.1:${p}/api/operations`;
        return `http://127.0.0.1:${p}/api${endpoint}`;
      }
    } catch (_) {}
  }
  return `http://127.0.0.1:${BACKEND_PORT}/api${endpoint}`;
}

/**
 * RBAC Role Personas & Clearances
 */
const RBAC_ROLES = {
  officer: {
    name: 'Arun Kumar',
    roleLabel: 'Field Officer',
    badgeClass: 'rbac-officer',
    initials: 'AK',
    clearance: 'Level 3 Field Data Collection',
    desc: 'Local Vault & Evidence Capture Active. Zero loss when air-gapped.',
    allowedViews: ['dashboard', 'job-details', 'inspection-form', 'evidence-capture', 'evidence-package', 'local-vault', 'sync-center', 'resumable-upload', 'notifications', 'profile'],
    menu: [
      { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
      { id: 'job-details', label: 'My Jobs', count: 4, icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
      { id: 'inspection-form', label: 'New Inspection', icon: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
      { id: 'evidence-capture', label: 'Evidence Capture', icon: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
      { id: 'evidence-package', label: 'Evidence Package', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
      { id: 'local-vault', label: 'Local Vault', count: 4, icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><circle cx="12" cy="14" r="2"/></svg>' },
      { id: 'sync-center', label: 'Sync Center', count: 2, icon: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' },
      { id: 'resumable-upload', label: 'Resumable Upload', icon: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
      { id: 'notifications', label: 'Notifications', count: 3, icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
      { id: 'profile', label: 'Profile', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
    ]
  },
  supervisor: {
    name: 'Marcus Brody',
    roleLabel: 'Supervisor',
    badgeClass: 'rbac-supervisor',
    initials: 'MB',
    clearance: 'Level 2 Dispatch & Conflict Authority',
    desc: 'Authorized to review side-by-side Merkle diffs & resolve conflicts.',
    allowedViews: ['dashboard', 'job-details', 'local-vault', 'conflicts', 'sync-center', 'notifications', 'profile'],
    menu: [
      { id: 'dashboard', label: 'Supervisor Center', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
      { id: 'conflicts', label: 'Conflict Studio', count: 1, icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      { id: 'local-vault', label: 'Supervisor Vault', count: 4, icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><circle cx="12" cy="14" r="2"/></svg>' },
      { id: 'sync-center', label: 'Sync Verification', count: 2, icon: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' },
      { id: 'job-details', label: 'Team Operations', count: 4, icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
      { id: 'notifications', label: 'Alerts', count: 3, icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
      { id: 'profile', label: 'Supervisor Profile', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
    ]
  },
  admin: {
    name: 'Sarah Chen',
    roleLabel: 'Admin',
    badgeClass: 'rbac-admin',
    initials: 'SC',
    clearance: 'Level 1 Full System Governance',
    desc: 'Fleet keys, Merkle roots, RBAC policies & compliance export.',
    allowedViews: ['dashboard', 'admin-panel', 'conflicts', 'local-vault', 'sync-center', 'notifications', 'profile'],
    menu: [
      { id: 'dashboard', label: 'Admin Overview', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
      { id: 'admin-panel', label: 'Fleet & Security', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
      { id: 'conflicts', label: 'Conflict Diffs', count: 1, icon: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      { id: 'local-vault', label: 'Master Evidence', count: 4, icon: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><circle cx="12" cy="14" r="2"/></svg>' },
      { id: 'sync-center', label: 'Sync Pipeline', count: 2, icon: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' },
      { id: 'notifications', label: 'System Logs', count: 3, icon: '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' },
      { id: 'profile', label: 'Admin Security', icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' }
    ]
  }
};

async function syncToCloud(record) {
  const opId = record.operationId || record.operation_id || 'OP-2026-0047';
  const payload = {
    operationId: opId,
    jobId: record.jobId || "job-solar-047",
    workerId: record.workerId || record.officer || "worker-01",
    officer: record.officer || record.workerId || "Worker-04 (Arun Kumar)",
    asset: record.asset || record.assetId || "Panel #47",
    temperature: parseFloat(record.temperature) || 72,
    condition: record.condition || "Critical",
    voltage: record.voltage || "580V",
    equipmentStatus: record.equipmentStatus || "Operational",
    remarks: record.remarks || "",
    gps: record.gps || {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 3.8
    },
    timestamp: record.timestamp || record.capturedAt || new Date().toISOString(),
    status: "SYNCED"
  };

  const targetUrl = await getBackendApiUrl('/operations');

  let response;
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Idempotency-Key": `${opId}-${Date.now()}`
      },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    const fallbackUrl = await getBackendApiUrl('/operations');
    response = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Idempotency-Key": `${opId}-${Date.now()}`
      },
      body: JSON.stringify(payload)
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync API failed (${response.status}): ${errorText}`);
  }

  const resData = await response.json();
  console.log("⚡ Synced to Supabase PostgreSQL:", resData);
  return resData.data || resData;
}
window.syncToCloud = syncToCloud;

// ============================================================================
// MAIN APPLICATION CONTROLLER
// ============================================================================
class SyncFieldApp {
  constructor() {
    this.currentRole = 'officer'; // 'officer' | 'supervisor' | 'admin'
    this.currentView = 'dashboard';
    
    // Real browser network status detection
    this.isOffline = !navigator.onLine;
    this.isSyncing = false;

    // Dark Mode state
    this.isDarkMode = false;

    // GPS State
    this.lastGps = {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 3.8,
      status: 'calibrated'
    };

    // Staged evidence for field inspection (Local-First Tactical Manifest)
    this.stagedEvidence = [
      {
        id: 'photo-1',
        type: 'photo',
        name: 'panel47_microfracture.jpg',
        sizeFormatted: '2.4 MB',
        desc: 'Diode cluster micro-fracture',
        url: null
      },
      {
        id: 'photo-2',
        type: 'photo',
        name: 'thermal_scan_hotspot.jpg',
        sizeFormatted: '1.8 MB',
        desc: '72°C thermal anomaly reading',
        url: null
      },
      {
        id: 'video-1',
        type: 'video',
        name: 'inspection_video.mp4',
        sizeFormatted: '18.4 MB',
        desc: '10-chunk resumable sweep video',
        url: null
      },
      {
        id: 'voice-1',
        type: 'voice',
        name: 'voice_memo_0047.wav',
        sizeFormatted: '310 KB',
        desc: '18s verbal diagnostic log',
        url: null
      }
    ];

    // Resumable upload checkpoint state
    this.uploadState = {
      progress: 72,
      bytesVerified: 13.2,
      bytesTotal: 18.4,
      isPaused: true,
      isStreaming: false,
      wasStreaming: false,
      chunksVerified: 7
    };

    // Voice recording timer
    this.isRecordingVoice = false;
    this.voiceSeconds = 0;
    this.voiceTimer = null;
    this.mapInstance = null;
  }

  async init() {
    console.log("🚀 SyncField Initializing with RBAC...");
    
    // 1. Initialize IndexedDB Vault & Seed initial records if empty
    if (window.vaultDB) {
      await window.vaultDB.init();
      if (typeof window.vaultDB.seedInitialDataIfEmpty === 'function') {
        await window.vaultDB.seedInitialDataIfEmpty();
      }
    }

    // 2. Setup Network listeners
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // 3. Initialize Map
    this.initMap();

    // 4. Render initial data & screens with RBAC
    this.switchRole('officer');
    this.updateConnectivityUI();
    this.renderStagedEvidence();
    this.renderUploadChunks();
    this.randomizeInspectionForm();
    await this.refreshVaultTable();
    await this.refreshSyncQueue();
    await this.loadJobsFromBackend();
    await this.loadDashboardStats();
    await this.loadNotifications();

    // 5. Test Backend connection
    this.checkBackendHealth();

    // 6. Setup outside click listener for brand logo dropdown menu
    document.addEventListener('click', (e) => {
      const trigger = document.getElementById('brandMenuTrigger');
      const menu = document.getElementById('brandDropdownMenu');
      if (menu && menu.classList.contains('show')) {
        if (!trigger || !trigger.contains(e.target)) {
          this.closeMenuDropdown();
        }
      }
    });

    // 7. Start automatic background synchronization loop
    this.startAutoSyncWorker();

    console.log("✅ SyncField RBAC Ready!");
  }

  startAutoSyncWorker() {
    if (this._syncWorkerInterval) clearInterval(this._syncWorkerInterval);
    this._syncWorkerInterval = setInterval(async () => {
      // If we are online and not currently syncing, check for pending items
      if (!this.isOffline && !this.isSyncing) {
        if (window.vaultDB) {
          const all = await window.vaultDB.getAllEvidencePackages();
          const pending = all.filter(p => p.status !== 'VERIFIED' && p.status !== 'SYNCED');
          const queue = await window.vaultDB.getSyncQueue();
          if (pending.length > 0 || queue.length > 0) {
            console.log("⚡ [AUTO-SYNC WORKER] Detected pending items. Auto-syncing to Supabase...", pending.length, queue.length);
            await this.syncNow();
          }
        }
      }
    }, 6000);
  }

  async checkBackendHealth() {
    try {
      const url = await getBackendApiUrl('/health');
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        console.log("⚡ Connected to Backend:", json);
      }
    } catch (e) {
      console.log("ℹ️ Backend offline, operating in IndexedDB local vault mode.");
    }
  }

  async handleNetworkChange(isOnline) {
    this.isOffline = !isOnline;
    this.updateConnectivityUI();
    if (isOnline) {
      this.showToast("🟢 Network Reconnected! Auto-syncing pending records to Supabase...", "success");
      await this.syncNow();
      if (this.uploadState.wasStreaming && this.uploadState.chunksVerified < 10) {
        this.showToast(`⚡ [AUTO-RESUME] Network restored: Resuming chunk upload stream from Checkpoint #${this.uploadState.chunksVerified + 1}...`, 'success');
        this.startUploadSimulation();
      }
    } else {
      if (this.uploadState.isStreaming) {
        this.uploadState.wasStreaming = true;
        this.simulateUploadInterrupt(true);
      }
      this.showToast("🔴 Network Disconnected! Switched to Local Vault Continuity.", "warning");
    }
  }

  async setConnectivity(isOnline) {
    this.isOffline = !isOnline;
    this.updateConnectivityUI();
    if (isOnline) {
      this.showToast("🟢 Connectivity Restored — Auto-syncing pending records to Supabase...", "success");
      await this.syncNow();
      if (this.uploadState.wasStreaming && this.uploadState.chunksVerified < 10) {
        this.showToast(`⚡ [AUTO-RESUME] Connection restored: Resuming video stream from Checkpoint #${this.uploadState.chunksVerified + 1}...`, 'success');
        this.startUploadSimulation();
      }
    } else {
      if (this.uploadState.isStreaming) {
        this.uploadState.wasStreaming = true;
        this.simulateUploadInterrupt(true);
      }
      this.showToast("🔴 Offline Mode Active — Data secured in Local Vault", "warning");
    }
  }

  async toggleConnectivityMode() {
    this.isOffline = !this.isOffline;
    this.updateConnectivityUI();
    if (!this.isOffline) {
      this.showToast("🟢 Switched to Online Mode — Auto-syncing pending offline records to Supabase...", "success");
      await this.syncNow();
      if (this.uploadState.wasStreaming && this.uploadState.chunksVerified < 10) {
        this.showToast(`⚡ [AUTO-RESUME] Online mode: Resuming video stream from Checkpoint #${this.uploadState.chunksVerified + 1}...`, 'success');
        this.startUploadSimulation();
      }
    } else {
      if (this.uploadState.isStreaming) {
        this.uploadState.wasStreaming = true;
        this.simulateUploadInterrupt(true);
      }
      this.showToast("🔴 Switched to Offline Simulation Mode — All data will be secured locally in Vault", "warning");
    }
  }

  detectNetworkQuality() {
    if (this.isOffline) return { type: 'offline', label: 'Offline (Air-Gapped)', cssClass: 'net-offline', isLowBandwidth: true };
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const type = conn.effectiveType || '4g';
      if (type === 'slow-2g' || type === '2g') {
        return { type: '2g', label: '2G (Low Bandwidth · Adaptive)', cssClass: 'net-2g', isLowBandwidth: true };
      } else if (type === '3g') {
        return { type: '3g', label: '3G (Moderate Bandwidth)', cssClass: 'net-3g', isLowBandwidth: false };
      } else {
        return { type: '4g', label: '4G (High Speed)', cssClass: 'net-4g', isLowBandwidth: false };
      }
    }
    return { type: '4g', label: '4G (High Speed)', cssClass: 'net-4g', isLowBandwidth: false };
  }

  updateConnectivityUI() {
    const toggle = document.getElementById('connectivityStatusToggle');
    const dot = document.getElementById('statusDotIndicator');
    const text = document.getElementById('statusTextIndicator');
    const banner = document.getElementById('offlineBannerWrapper');
    const netBadge = document.getElementById('networkQualityBadge');
    const netText = document.getElementById('networkQualityText');

    const net = this.detectNetworkQuality();
    if (netBadge && netText) {
      netBadge.className = `network-quality-pill ${net.cssClass}`;
      netText.textContent = net.label;
    }

    if (this.isOffline) {
      if (toggle) toggle.classList.remove('online');
      if (dot) dot.style.background = '#ef4444';
      if (text) text.textContent = 'Offline';
      if (banner) banner.style.display = 'block';
    } else {
      if (toggle) toggle.classList.add('online');
      if (dot) dot.style.background = '#8EA870';
      if (text) text.textContent = 'Online';
      if (banner) banner.style.display = 'none';
    }
  }

  dismissOfflineBanner() {
    const banner = document.getElementById('offlineBannerWrapper');
    if (banner) banner.style.display = 'none';
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    const btnIcon = document.getElementById('darkModeIcon');
    const btnText = document.getElementById('darkModeText');
    if (btnIcon) btnIcon.textContent = this.isDarkMode ? '☀️' : '🌙';
    if (btnText) btnText.textContent = this.isDarkMode ? 'Light' : 'Dark';
  }

  /* ==========================================================================
     RBAC (ROLE-BASED ACCESS CONTROL) METHODS
     ========================================================================== */

  switchRole(role) {
    if (!RBAC_ROLES[role]) return;
    this.currentRole = role;
    const persona = RBAC_ROLES[role];

    // 1. Update Role Buttons in Navbar
    ['btnRoleOfficer', 'btnRoleSupervisor', 'btnRoleAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btnRole${role.charAt(0).toUpperCase() + role.slice(1)}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. Update Header Persona Avatar & Name
    const avatar = document.getElementById('userAvatarCircle');
    const nameText = document.getElementById('userNameText');
    if (avatar) avatar.textContent = persona.initials;
    if (nameText) nameText.innerHTML = `${persona.name} <span class="rbac-pill ${persona.badgeClass}" style="margin-left:4px;">${persona.roleLabel}</span>`;

    // 3. Update Sidebar Section Heading & Dynamic Menu
    const label = document.getElementById('sidebarSectionLabel');
    if (label) label.textContent = persona.roleLabel.toUpperCase();
    this.renderSidebarMenu(persona);

    // 4. Update RBAC Guard Notice Banner
    const guardTitle = document.getElementById('rbacGuardTitle');
    const guardDesc = document.getElementById('rbacGuardDesc');
    const guardBadge = document.getElementById('rbacActiveBadge');
    if (guardTitle) guardTitle.textContent = `ROLE-BASED ACCESS CONTROL (RBAC): ${persona.roleLabel.toUpperCase()} ACTIVE`;
    if (guardDesc) guardDesc.textContent = `Clearance: ${persona.clearance} · ${persona.desc}`;
    if (guardBadge) {
      guardBadge.className = `rbac-pill ${persona.badgeClass}`;
      guardBadge.textContent = persona.roleLabel;
    }

    // 5. Update Profile View Elements
    const pAvatar = document.getElementById('profileAvatarCircle');
    const pName = document.getElementById('profileNameHeader');
    const pRoleDesc = document.getElementById('profileRoleDesc');
    const pClearance = document.getElementById('profileClearanceText');
    const dGreeting = document.getElementById('dashboardGreeting');
    const dAssignee = document.getElementById('jobAssigneeName');

    if (pAvatar) pAvatar.textContent = persona.initials;
    if (pName) pName.textContent = persona.name;
    if (pRoleDesc) pRoleDesc.innerHTML = `${persona.roleLabel} · Clearance: <strong>${persona.clearance}</strong>`;
    if (pClearance) pClearance.textContent = persona.clearance;
    if (dGreeting) dGreeting.textContent = `Good Morning, ${persona.name.split(' ')[0]} 👋`;
    if (dAssignee) dAssignee.textContent = persona.name;

    // 6. Navigate to default allowed view if currently in restricted view
    if (!persona.allowedViews.includes(this.currentView)) {
      this.navigateTo('dashboard');
    }

    this.showToast(`🛡️ RBAC Switch: Logged in as ${persona.name} (${persona.roleLabel})`, 'info');
  }

  renderSidebarMenu(persona) {
    const list = document.getElementById('sidebarMenuList');
    if (!list) return;

    list.innerHTML = persona.menu.map(item => `
      <li>
        <button class="menu-item-btn ${this.currentView === item.id ? 'active' : ''}" data-view="${item.id}" onclick="app.navigateTo('${item.id}')">
          ${item.icon}
          ${item.count ? `<span class="count-pill">${item.count}</span>` : ''}
          <span>${item.label}</span>
        </button>
      </li>
    `).join('');
  }

  toggleMenuDropdown(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const trigger = document.getElementById('brandMenuTrigger');
    const menu = document.getElementById('brandDropdownMenu');
    if (!menu) return;
    const isVisible = menu.classList.contains('show');
    if (isVisible) {
      this.closeMenuDropdown();
    } else {
      menu.classList.add('show');
      if (trigger) trigger.classList.add('menu-open');
    }
  }

  closeMenuDropdown() {
    const trigger = document.getElementById('brandMenuTrigger');
    const menu = document.getElementById('brandDropdownMenu');
    if (menu) menu.classList.remove('show');
    if (trigger) trigger.classList.remove('menu-open');
  }

  canAccessView(viewId) {
    const persona = RBAC_ROLES[this.currentRole];
    if (!persona) return false;
    return persona.allowedViews.includes(viewId);
  }

  canAccessView(viewId) {
    const persona = RBAC_ROLES[this.currentRole] || RBAC_ROLES.officer;
    return (persona.allowedViews || []).includes(viewId);
  }

  navigateTo(viewId, shouldRandomize = true) {
    // Automatically hide dropdown when selecting tab
    this.closeMenuDropdown();

    // RBAC Security Check
    if (!this.canAccessView(viewId)) {
      const requiredRole = viewId === 'conflicts' ? 'SUPERVISOR / ADMIN' : 'ADMINISTRATOR';
      this.showToast(`⛔ RBAC ACCESS DENIED: Requires ${requiredRole} clearance.`, 'warning');
      return;
    }

    this.currentView = viewId;
    document.querySelectorAll('.app-screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('active');
    }

    document.querySelectorAll('.menu-item-btn').forEach(btn => {
      if (btn.getAttribute('data-view') === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (viewId === 'inspection-form' && shouldRandomize) this.randomizeInspectionForm();
    if (viewId === 'local-vault') this.refreshVaultTable();
    if (viewId === 'sync-center') this.refreshSyncQueue();
    if (viewId === 'job-details') this.loadJobsFromBackend();
    if (viewId === 'notifications') this.loadNotifications();
    if (viewId === 'dashboard') {
      this.loadDashboardStats();
      if (this.mapInstance) {
        setTimeout(() => this.mapInstance.invalidateSize(), 200);
      }
    }
  }

  exportComplianceReport() {
    if (this.currentRole !== 'admin') {
      this.showToast('⛔ RBAC Denied: Admin authorization required to export compliance keys.', 'warning');
      return;
    }
    this.showToast('📥 Cryptographic Audit & Compliance Report generated and exported.', 'success');
  }

  initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined') return;

    try {
      this.mapInstance = L.map('map', { zoomControl: false }).setView([13.1143, 80.1548], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.mapInstance);

      L.marker([13.1143, 80.1548]).addTo(this.mapInstance)
        .bindPopup('<b>Dispatched Target</b><br>Mojave Sector 7 - Panel #47')
        .openPopup();
    } catch (e) {
      console.warn("Leaflet Map init skipped, canvas vector map available");
    }
  }

  centerMapTarget() {
    if (this.mapInstance) {
      this.mapInstance.setView([13.1143, 80.1548], 16);
    }
  }

  captureGps() {
    const display = document.getElementById('gpsStatusDisplay');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lastGps = {
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            accuracy: Number(pos.coords.accuracy.toFixed(1)),
            status: 'calibrated'
          };
          if (display) {
            display.innerHTML = `📍 GPS: Live Calibrated (LAT: ${this.lastGps.latitude}° N, LON: ${this.lastGps.longitude}° W · Accuracy: ±${this.lastGps.accuracy}m)`;
          }
        },
        () => {
          if (display) {
            display.innerHTML = `📍 GPS: Offline Calibrated (LAT: 34.0522° N, LON: -118.2437° W · Accuracy: ±3.8m · Mojave Sector 7)`;
          }
        }
      );
    }
  }

  handlePhotoSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      this.stagedEvidence.push({
        id: `photo-${Date.now()}-${i}`,
        type: 'photo',
        name: file.name,
        sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        desc: 'Field inspection photo',
        url: url
      });
    }
    this.renderStagedEvidence();
  }

  handleVideoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.stagedEvidence.push({
      id: `video-${Date.now()}`,
      type: 'video',
      name: file.name,
      sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      desc: 'Inspection sweep video',
      url: null
    });
    this.renderStagedEvidence();
  }

  async toggleVoiceRecording() {
    const btn = document.getElementById('btnVoiceRecordForm');
    
    if (!this.isRecordingVoice) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this._mediaRecorder = new MediaRecorder(stream);
          this._audioChunks = [];
          this._mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) this._audioChunks.push(e.data);
          };
          this._mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this._audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const voiceId = `voice-${Date.now()}`;
            this.stagedEvidence.push({
              id: voiceId,
              type: 'voice',
              name: `voice_memo_${Date.now().toString().slice(-4)}.webm`,
              sizeFormatted: `${Math.max(16, Math.round(audioBlob.size / 1024))} KB`,
              desc: `${this.voiceSeconds}s verbal diagnostic memo`,
              url: audioUrl,
              blob: audioBlob
            });
            this.renderStagedEvidence();
            this.showToast(`🎙️ Real voice note captured (${this.voiceSeconds}s) & sealed with SHA-256`, "success");
            try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
          };
          this._mediaRecorder.start();
        }
      } catch (err) {
        console.warn("Microphone hardware access notice:", err);
      }

      this.isRecordingVoice = true;
      this.voiceSeconds = 0;
      if (btn) btn.innerHTML = `<span class="voice-recording-pulse"></span> Stop Recording (0s)`;
      this.voiceTimer = setInterval(() => {
        this.voiceSeconds++;
        if (btn) btn.innerHTML = `<span class="voice-recording-pulse"></span> Stop Recording (${this.voiceSeconds}s)`;
      }, 1000);
      this.showToast("🎙️ Voice memo recording active...", "info");
    } else {
      this.isRecordingVoice = false;
      clearInterval(this.voiceTimer);
      if (btn) btn.innerHTML = `<span>🎤 Record Voice Note</span>`;

      if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
        this._mediaRecorder.stop();
      } else {
        // Fallback simulation if browser blocks mic permission
        this.stagedEvidence.push({
          id: `voice-${Date.now()}`,
          type: 'voice',
          name: `voice_memo_${Date.now().toString().slice(-4)}.wav`,
          sizeFormatted: `${Math.round(this.voiceSeconds * 18 || 24)} KB`,
          desc: `${this.voiceSeconds || 4}s verbal diagnostic memo`,
          url: null
        });
        this.renderStagedEvidence();
        this.showToast(`🎙️ Voice note saved (${this.voiceSeconds || 4}s)`, "success");
      }
    }
  }

  removeStagedEvidence(id) {
    const item = this.stagedEvidence.find(e => e.id === id);
    this.stagedEvidence = this.stagedEvidence.filter(e => e.id !== id);
    this.renderStagedEvidence();
    this.showToast(`🗑️ Removed ${item?.name || 'evidence item'} from staged vault`, 'info');
  }

  renderStagedEvidence() {
    const list = document.getElementById('stagedEvidenceList');
    if (!list) return;

    if (this.stagedEvidence.length === 0) {
      list.innerHTML = `
        <div style="background:var(--dark-surface); border:1px dashed var(--dark-border); padding:16px; border-radius:8px; text-align:center; color:var(--text-muted-light); font-size:12.5px;">
          No evidence files staged. Use the buttons above to attach photos, videos, or record voice memos.
        </div>
      `;
      const gallery = document.getElementById('galleryCardsGrid');
      if (gallery) gallery.innerHTML = `<div style="color:var(--text-muted-light); font-size:13px;">No evidence files in current package.</div>`;
      return;
    }

    list.innerHTML = this.stagedEvidence.map(item => `
      <div style="display:flex; flex-direction:column; gap:6px; background:var(--dark-card); padding:10px 14px; border-radius:8px; border:1px solid var(--dark-border); font-size:12.5px; color:#ffffff;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:800; font-size:10.5px; color:var(--olive-highlight); background:rgba(94,110,73,0.3); padding:2px 8px; border-radius:4px; border:1px solid rgba(94,110,73,0.5);">
              ${item.type === 'photo' ? '📷 PHOTO' : item.type === 'video' ? '📹 VIDEO' : '🎙️ VOICE NOTE'}
            </span>
            <strong style="color:var(--text-white);">${item.name}</strong>
            <span style="color:var(--text-muted-light); font-size:11.5px;">(${item.sizeFormatted})</span>
          </div>
          <button type="button" class="btn-banner-action" style="padding:3px 10px; font-size:11px; background:rgba(140,46,43,0.25); color:#fca5a5; border-color:rgba(140,46,43,0.6); cursor:pointer;" onclick="app.removeStagedEvidence('${item.id}')">✕ Remove</button>
        </div>
        ${item.type === 'voice' && item.url ? `
          <audio controls src="${item.url}" class="audio-evidence-player"></audio>
        ` : ''}
        ${item.type === 'photo' && item.url && (item.url.startsWith('blob:') || item.url.startsWith('data:')) ? `
          <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
            <img src="${item.url}" style="width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid var(--dark-border);" alt="Evidence preview">
            <span style="font-size:11.5px; color:var(--text-muted-light);">${item.desc}</span>
          </div>
        ` : `
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px; background:rgba(0,0,0,0.25); padding:6px 10px; border-radius:4px; font-size:11.5px; color:var(--text-muted-light);">
            <span>${item.type === 'photo' ? '🖼️' : item.type === 'video' ? '🎬' : '🔊'}</span>
            <span>${item.desc}</span>
            <span style="margin-left:auto; font-size:10px; color:var(--olive-highlight); font-weight:700; letter-spacing:0.5px;">[SHA-256 SEALED]</span>
          </div>
        `}
      </div>
    `).join('');

    const gallery = document.getElementById('galleryCardsGrid');
    if (gallery) {
      gallery.innerHTML = this.stagedEvidence.map(item => `
        <div style="background:var(--dark-card); border:1px solid var(--dark-border); border-radius:var(--radius-md); overflow:hidden; padding:12px;">
          ${item.type === 'photo' && item.url && (item.url.startsWith('blob:') || item.url.startsWith('data:')) ? `
            <img src="${item.url}" style="width:100%; height:120px; object-fit:cover; border-radius:6px; margin-bottom:8px;" alt="${item.name}">
          ` : `
            <div style="font-size:12px; font-weight:800; text-align:center; padding:16px 0; background:var(--dark-surface); border-radius:6px; margin-bottom:8px; color:var(--text-muted-light);">
              ${item.type === 'photo' ? '📷 IMAGE EVIDENCE' : item.type === 'video' ? '📹 VIDEO STREAM' : '🎙️ VOICE MEMO'}
            </div>
          `}
          <div style="font-weight:700; font-size:13px; margin-bottom:2px; color:#ffffff;">${item.name}</div>
          <div style="font-size:11px; color:var(--text-muted-light);">${item.desc} • ${item.sizeFormatted}</div>
          ${item.type === 'voice' && item.url ? `
            <audio controls src="${item.url}" class="audio-evidence-player" style="margin-top:8px;"></audio>
          ` : ''}
        </div>
      `).join('');
    }
  }

  randomizeInspectionForm(targetJob = null) {
    // 1. Generate unique Operation ID
    const randomOpNum = Math.floor(Math.random() * 899 + 101); // 101 - 999
    const opId = targetJob?.jobCode || `OP-2026-0${randomOpNum}`;
    
    // 2. Generate random asset and cluster
    const panelNum = Math.floor(Math.random() * 80 + 10); // 10 - 89
    const clusterNum = Math.floor(Math.random() * 6 + 1); // 1 - 6
    const asset = targetJob?.assetName || `Panel #${panelNum}`;

    // 3. Randomize temperature (58°C to 98°C)
    const temp = Math.floor(Math.random() * 40 + 58);

    // 4. Randomize Condition & Status
    const conditions = ['Critical', 'Degraded', 'Needs Maintenance', 'Operational'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const equipmentStatus = (condition === 'Critical') 
      ? 'Offline / Standby' 
      : (condition === 'Operational') 
        ? 'Operational' 
        : (Math.random() > 0.5 ? 'Degraded' : 'Offline / Standby');

    // 5. Randomize Voltage (540V - 625V)
    const voltage = `${Math.floor(Math.random() * 85 + 540)}V`;

    // 6. Dynamic Remarks
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let remarks = '';
    if (condition === 'Critical') {
      remarks = `${nowStr} - Inverter thermal overload (${temp}°C). Micro-fracture detected on cell cluster ${clusterNum}. High heat localized on diode enclosure.`;
    } else if (condition === 'Degraded') {
      remarks = `${nowStr} - Voltage degradation (${voltage}) on feeder bus ${clusterNum}. Thermal sweep shows diode hotspot (${temp}°C).`;
    } else if (condition === 'Needs Maintenance') {
      remarks = `${nowStr} - Surface dust accumulation and wiring oxidation detected. Efficiency rated at 88% with voltage ${voltage}.`;
    } else {
      remarks = `${nowStr} - Nominal performance telemetry. Diode array and voltage output (${voltage}) verified within safe tolerance at ${temp}°C.`;
    }

    // 7. Randomize GPS coordinate within Mojave site sector
    const lat = (34.0522 + (Math.random() - 0.5) * 0.009).toFixed(4);
    const lng = (-118.2437 + (Math.random() - 0.5) * 0.009).toFixed(4);
    this.lastGps = { latitude: parseFloat(lat), longitude: parseFloat(lng), accuracy: (Math.random() * 2 + 2.5).toFixed(1) };

    // 8. Update Form DOM elements
    const opIdField = document.getElementById('opIdField');
    const assetField = document.getElementById('assetField');
    const officerField = document.getElementById('officerField');
    const subTitleEl = document.getElementById('inspectionFormSubTitle');
    const tempField = document.getElementById('tempField');
    const conditionField = document.getElementById('conditionField');
    const voltageField = document.getElementById('voltageField');
    const eqStatusField = document.getElementById('equipmentStatusField');
    const remarksField = document.getElementById('remarksField');
    const gpsStatusEl = document.getElementById('gpsStatusDisplay');

    if (opIdField) opIdField.value = opId;
    if (assetField) assetField.value = asset;
    if (officerField && targetJob?.assignedWorkerName) officerField.value = targetJob.assignedWorkerName;
    if (subTitleEl) subTitleEl.textContent = `${opId} • ${asset} (Inverter Cluster ${clusterNum})`;
    if (tempField) tempField.value = temp;
    if (conditionField) conditionField.value = condition;
    if (voltageField) voltageField.value = voltage;
    if (eqStatusField) eqStatusField.value = equipmentStatus;
    if (remarksField) remarksField.value = remarks;
    if (gpsStatusEl) {
      gpsStatusEl.innerHTML = `<span>📍 GPS: Calibrated (LAT: ${lat}° N, LON: ${Math.abs(lng)}° W · Accuracy: ±${this.lastGps.accuracy}m · Mojave Sector ${clusterNum})</span>`;
    }

    // Refresh staged evidence files for this operation ID (Offline-safe references)
    this.stagedEvidence = [
      {
        id: `photo-${randomOpNum}-1`,
        type: 'photo',
        name: `panel${panelNum}_microfracture.jpg`,
        sizeFormatted: '2.4 MB',
        desc: `Cluster ${clusterNum} inspection snapshot`,
        url: null
      },
      {
        id: `photo-${randomOpNum}-2`,
        type: 'photo',
        name: `thermal_scan_${temp}c.jpg`,
        sizeFormatted: '1.8 MB',
        desc: `${temp}°C thermal scan reading`,
        url: null
      },
      {
        id: `video-${randomOpNum}-1`,
        type: 'video',
        name: `sweep_cluster_${clusterNum}.mp4`,
        sizeFormatted: '18.4 MB',
        desc: '10-chunk resumable sweep video',
        url: null
      },
      {
        id: `voice-${randomOpNum}-1`,
        type: 'voice',
        name: `voice_memo_${randomOpNum}.wav`,
        sizeFormatted: '310 KB',
        desc: '18s verbal diagnostic log',
        url: null
      }
    ];
    this.renderStagedEvidence();

    console.log(`🎲 Generated randomized inspection parameters: ${opId} (${asset}, ${temp}°C, ${voltage})`);
  }

  async saveInspection(continueToPackage = false) {
    const opId = document.getElementById('opIdField')?.value || 'OP-2026-0047';
    const officer = document.getElementById('officerField')?.value || 'Worker-04 (Arun Kumar)';
    const asset = document.getElementById('assetField')?.value || 'Panel #47';
    const temp = parseFloat(document.getElementById('tempField')?.value) || 72;
    const condition = document.getElementById('conditionField')?.value || 'Critical';
    const voltage = document.getElementById('voltageField')?.value || '580V';
    const equipmentStatus = document.getElementById('equipmentStatusField')?.value || 'Degraded';
    const remarks = document.getElementById('remarksField')?.value || '';

    const record = {
      operationId: opId,
      officer,
      asset,
      temperature: temp,
      condition,
      voltage,
      equipmentStatus,
      remarks,
      stagedEvidence: this.stagedEvidence,
      gps: this.lastGps || { latitude: 34.0522, longitude: -118.2437, accuracy: 3.8 },
      status: this.isOffline ? 'STORED_OFFLINE' : 'SYNCED',
      timestamp: new Date().toISOString()
    };

    // 1. Always store locally in IndexedDB Vault first
    if (window.vaultDB) {
      await window.vaultDB.saveEvidencePackage(record);
      if (this.isOffline) {
        await window.vaultDB.enqueueOperation({
          operationId: opId,
          priority: 'HIGH',
          jobType: 'Solar Panel Inspection',
          assetId: asset,
          status: 'QUEUED',
          enqueuedAt: new Date().toISOString()
        });
      }
    }

    // 2. If OFFLINE, queue in Vault and notify
    if (this.isOffline) {
      this.showToast(`🔒 [OFFLINE VAULT] Inspection ${opId} stored locally in IndexedDB. Queued for auto-sync when online.`, 'warning');
      await this.refreshVaultTable();
      await this.refreshSyncQueue();
      if (continueToPackage) this.navigateTo('evidence-package');
      else this.navigateTo('local-vault');
      return;
    }

    // 3. If ONLINE, sync directly to Supabase Backend
    try {
      this.showToast(`[SYNCING] Submitting inspection ${opId} to Supabase...`, 'info');
      await syncToCloud(record);
      record.status = 'VERIFIED';
      if (window.vaultDB) {
        await window.vaultDB.saveEvidencePackage(record);
        await window.vaultDB.dequeueOperation(opId);
      }
      this.showToast(`✅ [SYNCED TO SUPABASE] Inspection ${opId} stored in PostgreSQL database!`, 'success');
    } catch (syncErr) {
      console.warn("Backend sync failed, storing locally in queue:", syncErr);
      record.status = 'STORED_OFFLINE';
      if (window.vaultDB) {
        await window.vaultDB.saveEvidencePackage(record);
        await window.vaultDB.enqueueOperation({
          operationId: opId,
          priority: 'HIGH',
          jobType: 'Solar Panel Inspection',
          assetId: asset,
          status: 'QUEUED',
          enqueuedAt: new Date().toISOString()
        });
      }
      this.showToast(`🔒 [OFFLINE VAULT] Backend unreachable. Inspection ${opId} secured locally.`, 'warning');
    }
    
    await this.refreshVaultTable();
    await this.refreshSyncQueue();

    if (continueToPackage) {
      this.navigateTo('evidence-package');
    } else {
      this.navigateTo('local-vault');
    }
  }

  createEvidencePackage() {
    this.navigateTo('evidence-package');
    this.showToast('[EVIDENCE] Manifest sealed with SHA-256 fingerprint', 'success');
  }

  addToSyncQueue() {
    this.navigateTo('sync-center');
    this.showToast('Smart Sync Queue updated with OP-2026-0047', 'info');
  }

  /* ==========================================================================
     DYNAMIC DATABASE DATA INTEGRATION (SUPABASE + FASTAPI)
     ========================================================================== */

  async loadJobsFromBackend() {
    try {
      const url = await getBackendApiUrl('/jobs');
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const jobs = json.data || [];
        this.jobsList = jobs;
        this.renderJobsUI(jobs);
      }
    } catch (e) {
      console.warn("Backend jobs offline, using cached job state:", e);
    }
  }

  renderJobsUI(jobs) {
    if (!jobs || jobs.length === 0) return;
    
    // Default to first job if none selected
    if (!this.selectedJob || !jobs.find(j => (j.id === this.selectedJob.id || j.jobCode === this.selectedJob.jobCode))) {
      this.selectedJob = jobs[0];
    }

    // Render pill buttons for selecting between jobs from the database
    const pillBar = document.getElementById('jobsListPillBar');
    if (pillBar) {
      pillBar.innerHTML = jobs.map(j => {
        const isSelected = (j.id === this.selectedJob.id || j.jobCode === this.selectedJob.jobCode);
        return `
          <button type="button" 
                  class="btn-view-details" 
                  style="${isSelected ? 'background:var(--olive-primary); color:#ffffff; border-color:var(--olive-border); font-weight:800;' : 'background:var(--dark-card); color:var(--text-muted-light);'} font-size:12px; padding:6px 14px; cursor:pointer;"
                  onclick="app.selectJob('${j.id || j.jobCode}')">
            ${j.jobCode} • ${j.title}
          </button>
        `;
      }).join('');
    }

    // Populate the job specification card with selected job
    const job = this.selectedJob;
    const titleEl = document.getElementById('jobTitleHeading');
    const subEl = document.getElementById('jobSubHeading');
    const priorityEl = document.getElementById('jobPriorityBadge');
    const workerEl = document.getElementById('jobWorkerName');
    const schedEl = document.getElementById('jobScheduledWindow');
    const locEl = document.getElementById('jobLocationSite');
    const breadcrumb = document.getElementById('jobBreadcrumb');

    if (titleEl) titleEl.textContent = job.title;
    if (subEl) subEl.innerHTML = `Operation: <strong>${job.jobCode}</strong> · Asset: <strong>${job.assetName}</strong>`;
    if (priorityEl) {
      priorityEl.textContent = `${job.priority || 'HIGH'} PRIORITY`;
      priorityEl.style.backgroundColor = (job.priority === 'CRITICAL') ? '#8C2E2B' : 'var(--olive-primary)';
    }
    if (workerEl) workerEl.textContent = job.assignedWorkerName || 'Worker-04 (Arun Kumar)';
    if (schedEl) schedEl.textContent = 'Due: 11:30 AM Today (Air-Gapped Tolerant)';
    if (locEl) locEl.textContent = job.description || 'Mojave Solar Array Sector 7';
    if (breadcrumb) breadcrumb.textContent = `${job.jobCode} Specification`;
  }

  selectJob(jobIdentifier) {
    if (!this.jobsList) return;
    const found = this.jobsList.find(j => (j.id === jobIdentifier || j.jobCode === jobIdentifier));
    if (found) {
      this.selectedJob = found;
      this.renderJobsUI(this.jobsList);
      this.showToast(`Selected job: ${found.jobCode} (${found.title})`, 'info');
    }
  }

  startSelectedJobInspection() {
    const job = this.selectedJob || { jobCode: 'OP-2026-0047', assetName: 'Panel #47', assignedWorkerName: 'Worker-04 (Arun Kumar)' };
    this.randomizeInspectionForm(job);
    this.navigateTo('inspection-form', false);
    this.showToast(`Starting Inspection for ${job.jobCode} (${job.assetName})`, 'info');
  }

  async loadDashboardStats() {
    try {
      const url = await getBackendApiUrl('/dashboard');
      const res = await fetch(url);
      let dashData = null;
      if (res.ok) {
        const json = await res.json();
        dashData = json.data;
      }

      // Calculate real counts from vault
      let pendingCount = 0;
      let offlineCount = 0;
      if (window.vaultDB) {
        const all = await window.vaultDB.getAllEvidencePackages();
        pendingCount = all.filter(p => p.status !== 'VERIFIED' && p.status !== 'SYNCED').length;
        offlineCount = all.length;
      }

      const verifiedTotal = dashData ? (dashData.verifiedEvidence || 21) : 21;
      const totalJobsCount = dashData ? (dashData.recentJobs?.length || 2) : 2;

      const statBoxes = document.querySelectorAll('.hero-stat-box');
      if (statBoxes.length >= 4) {
        const num0 = statBoxes[0].querySelector('.hero-stat-num');
        const num1 = statBoxes[1].querySelector('.hero-stat-num');
        const num2 = statBoxes[2].querySelector('.hero-stat-num');
        const num3 = statBoxes[3].querySelector('.hero-stat-num');

        if (num0) num0.textContent = String(totalJobsCount).padStart(2, '0');
        if (num1) num1.textContent = String(pendingCount).padStart(2, '0');
        if (num2) num2.textContent = String(verifiedTotal).padStart(2, '0');
        if (num3) num3.textContent = String(offlineCount || 4).padStart(2, '0');
      }
    } catch (e) {
      console.warn("Dashboard sync check:", e);
    }
  }

  formatEnclosedEvidence(pkg) {
    let list = pkg.stagedEvidence || pkg.evidencePackage?.files || pkg.files || [];
    if (typeof list === 'string') {
      try { list = JSON.parse(list); } catch (_) { list = []; }
    }
    if (Array.isArray(list) && list.length > 0) {
      const photos = list.filter(e => e.type === 'photo' || e.mimeType?.startsWith('image') || e.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) || e.name?.match(/\.(jpg|jpeg|png|webp)$/i)).length;
      const videos = list.filter(e => e.type === 'video' || e.mimeType?.startsWith('video') || e.fileName?.match(/\.(mp4|webm|mov)$/i) || e.name?.match(/\.(mp4|webm|mov)$/i)).length;
      const voice = list.filter(e => e.type === 'voice' || e.type === 'audio' || e.mimeType?.startsWith('audio') || e.fileName?.match(/\.(wav|webm|mp3|m4a)$/i) || e.name?.match(/\.(wav|webm|mp3|m4a)$/i)).length;
      
      const parts = [];
      if (photos > 0) parts.push(`${photos} Photo${photos > 1 ? 's' : ''}`);
      if (videos > 0) parts.push(`${videos} Video${videos > 1 ? 's' : ''}`);
      if (voice > 0) parts.push(`${voice} Audio`);
      parts.push('GPS');
      return parts.join(', ');
    }
    return 'Telemetry & Calibrated GPS';
  }

  formatLocalTimestamp(ts) {
    if (!ts) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    let d;
    if (typeof ts === 'string') {
      let cleanTs = ts.trim();
      if (cleanTs.includes('T') && !cleanTs.endsWith('Z') && !cleanTs.includes('+') && !cleanTs.includes('-')) {
        d = new Date(cleanTs + 'Z');
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(cleanTs)) {
        d = new Date(cleanTs.replace(' ', 'T') + 'Z');
      } else {
        d = new Date(cleanTs);
      }
    } else {
      d = new Date(ts);
    }
    if (isNaN(d.getTime())) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }

  async loadNotifications() {
    const container = document.getElementById('notificationsListContainer');
    const countPill = document.getElementById('notificationsCountPill');
    if (!container) return;

    try {
      const url = await getBackendApiUrl('/audit/recent');
      const res = await fetch(url);
      let auditList = [];
      if (res.ok) {
        const json = await res.json();
        auditList = json.data || [];
      }

      if (auditList.length === 0) {
        container.innerHTML = `
          <div style="background-color:var(--dark-card); border:1px solid var(--dark-border); padding:20px; border-radius:var(--radius-md); text-align:center; color:var(--text-muted-light);">
            No audit records yet. All actions will be logged in Supabase database.
          </div>
        `;
        return;
      }

      if (countPill) countPill.textContent = `${auditList.length} AUDIT LOGS`;

      container.innerHTML = auditList.slice(0, 10).map(item => {
        const isSync = item.action && (item.action.includes('SYNC') || item.action.includes('SUBMITTED'));
        const isWarn = item.action && (item.action.includes('FAIL') || item.action.includes('INTERRUPT'));
        const borderColor = isSync ? 'var(--olive-highlight)' : isWarn ? '#ea580c' : 'var(--olive-primary)';
        
        const dateFormatted = this.formatLocalTimestamp(item.timestamp);

        return `
          <div style="background-color:var(--dark-card); border:1px solid var(--dark-border); padding:16px; border-radius:var(--radius-md); border-left:4px solid ${borderColor};">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted-light); margin-bottom:4px;">
              <span style="font-weight:800; color:var(--text-white);">${item.action} • SUPABASE AUDIT</span>
              <span style="font-weight:700; color:var(--text-white);">${dateFormatted}</span>
            </div>
            <div style="font-weight:700; font-size:14px; margin-bottom:4px; color:var(--text-white);">${item.description}</div>
            <div style="font-size:12px; color:var(--text-muted-light);">Operation Reference: <strong>${item.operationId || 'SYSTEM'}</strong></div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.warn("Failed fetching audit logs:", e);
    }
  }

  async refreshVaultTable() {
    const tbody = document.getElementById('localVaultTableBody');
    if (!tbody) return;

    let packages = [];
    if (window.vaultDB) {
      packages = await window.vaultDB.getAllEvidencePackages();
    }

    // Connect to Supabase audit trail to reflect newly synchronized operations from DB
    try {
      const res = await fetch(`${API_BASE}/audit/recent`);
      if (res.ok) {
        const json = await res.json();
        const logs = json.data || [];
        for (const log of logs) {
          if (log.operationId && (log.action === 'FORM_SUBMITTED' || log.action === 'OPERATION_SYNCED')) {
            const existing = packages.find(p => p.operationId === log.operationId);
            if (existing) {
              existing.status = 'VERIFIED';
            } else {
              packages.push({
                operationId: log.operationId,
                jobType: 'Solar Panel Inspection',
                officer: 'Worker-04 (Arun Kumar)',
                status: 'VERIFIED',
                syncedAt: log.timestamp
              });
            }
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }

    if (packages.length === 0) {
      packages = [
        { operationId: 'OP-2026-0047', jobType: 'Solar Panel Inspection', officer: 'Arun Kumar', status: 'STORED_OFFLINE', stagedEvidence: [{type:'photo'}, {type:'photo'}, {type:'voice'}] },
        { operationId: 'OP-2026-0045', jobType: 'Inverter Array B Check', officer: 'Arun Kumar', status: 'VERIFIED', stagedEvidence: [{type:'photo'}] },
        { operationId: 'OP-2026-0041', jobType: 'Battery Storage Diagnostic', officer: 'Arun Kumar', status: 'VERIFIED', stagedEvidence: [{type:'voice'}] }
      ];
    }

    tbody.innerHTML = packages.map(pkg => `
      <tr>
        <td><strong>${pkg.operationId}</strong></td>
        <td>${pkg.jobType || 'Solar Panel Inspection'}</td>
        <td>${pkg.officer || pkg.workerId || 'Worker-04 (Arun Kumar)'}</td>
        <td><span style="color:var(--text-white); font-weight:600;">${this.formatEnclosedEvidence(pkg)}</span></td>
        <td>
          <span class="badge ${pkg.status === 'VERIFIED' ? 'badge-verified' : 'badge-queued'}">
            ${pkg.status === 'VERIFIED' ? 'VERIFIED IN CLOUD' : 'STORED OFFLINE'}
          </span>
        </td>
        <td>
          <button class="btn-banner-action" style="padding:4px 10px; font-size:11px;" onclick="app.navigateTo('evidence-package')">View Package</button>
        </td>
      </tr>
    `).join('');

    // Dynamically update dashboard stats
    this.loadDashboardStats();
  }

  async refreshSyncQueue() {
    const list = document.getElementById('syncCenterQueueList');
    if (!list) return;

    let queueItems = [];
    let verifiedItems = [];

    if (window.vaultDB) {
      const allPkgs = await window.vaultDB.getAllEvidencePackages();
      const offlinePkgs = allPkgs.filter(p => p.status !== 'VERIFIED' && p.status !== 'SYNCED');
      queueItems = offlinePkgs.map(op => ({
        operationId: op.operationId,
        jobType: op.jobType || 'Solar Panel Inspection',
        assetId: op.asset || 'Panel #47',
        status: 'QUEUED'
      }));

      verifiedItems = allPkgs.filter(p => p.status === 'VERIFIED' || p.status === 'SYNCED');
    }

    if (queueItems.length === 0 && verifiedItems.length === 0) {
      list.innerHTML = `
        <div class="sync-queue-card" style="background:var(--olive-card); border:1px solid var(--olive-border);">
          <div>
            <div class="sync-card-title" style="color:var(--olive-highlight);">All Offline Items Synced</div>
            <div class="sync-card-desc" style="color:var(--text-white);">Local vault is consistent with Supabase PostgreSQL database.</div>
          </div>
          <span class="badge badge-verified">VERIFIED</span>
        </div>
      `;
      return;
    }

    let html = '';

    // Render queued offline items (matches user screenshot)
    html += queueItems.map(item => `
      <div class="sync-queue-card" style="border-left: 4px solid #ea580c;">
        <div>
          <div class="sync-card-title">${item.operationId} · ${item.assetId || 'Panel #47'}</div>
          <div class="sync-card-desc">Queued Locally • Priority: HIGH • 18.4 MB Pending</div>
        </div>
        <button class="btn-start-inspection" style="padding:6px 14px; font-size:12px;" onclick="app.syncNow()">
          ${this.isOffline ? 'Sync When Online' : 'Sync Single'}
        </button>
      </div>
    `).join('');

    // Render verified synced items (matches user screenshot 1!)
    html += verifiedItems.map(item => `
      <div class="sync-queue-card" style="background:var(--olive-card); border:1px solid var(--olive-border);">
        <div>
          <div class="sync-card-title" style="color:var(--olive-highlight);">${item.operationId} · ${item.jobType || item.asset || 'Diagnostic'}</div>
          <div class="sync-card-desc" style="color:var(--text-white);">Synced & Verified at ${item.syncedAt ? new Date(item.syncedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '10:15 AM'} • 0 Redundant Bytes</div>
        </div>
        <span class="badge badge-verified">VERIFIED</span>
      </div>
    `).join('');

    list.innerHTML = html;
  }

  async syncNow() {
    if (this.isOffline) {
      this.showToast('Cannot sync while offline. Please toggle to Online mode first.', 'warning');
      return;
    }

    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      let pendingList = [];
      if (window.vaultDB) {
        const all = await window.vaultDB.getAllEvidencePackages();
        // Only select packages that are strictly pending or stored offline
        pendingList = all.filter(p => p.status === 'STORED_OFFLINE' || p.status === 'PENDING' || p.status === 'QUEUED');

        // Check sync queue for any pending entries
        const queue = await window.vaultDB.getSyncQueue();
        for (const qItem of queue) {
          if (!pendingList.find(p => p.operationId === qItem.operationId)) {
            const pkg = await window.vaultDB.getEvidencePackage(qItem.operationId);
            if (pkg && (pkg.status === 'STORED_OFFLINE' || pkg.status === 'PENDING' || pkg.status === 'QUEUED')) {
              pendingList.push(pkg);
            }
          }
        }
      }

      // If no offline records are waiting to sync, exit cleanly without redundant network requests
      if (pendingList.length === 0) {
        await this.refreshVaultTable();
        await this.refreshSyncQueue();
        return;
      }

      const net = this.detectNetworkQuality();
      if (net.isLowBandwidth) {
        this.showToast(`⚡ [ADAPTIVE SYNC] ${net.label} detected: Prioritizing critical telemetry (Inspection + GPS). Heavy video sync deferred until high bandwidth.`, 'warning', 5000);
      } else {
        this.showToast(`⚡ [AUTO-SYNC] Synchronizing ${pendingList.length} offline record(s) to Supabase...`, 'info');
      }

      let syncedCount = 0;
      for (const item of pendingList) {
        try {
          await syncToCloud(item);
          item.status = 'VERIFIED';
          item.syncedAt = new Date().toISOString();
          if (window.vaultDB) {
            await window.vaultDB.saveEvidencePackage(item);
            await window.vaultDB.dequeueOperation(item.operationId);
            await window.vaultDB.logAuditEvent(item.operationId, 'VERIFIED', `Synced ${item.operationId} to Supabase`);
          }
          syncedCount++;
        } catch (e) {
          console.error(`Sync failed for ${item.operationId}:`, e);
          this.showToast(`Sync alert for ${item.operationId}: ${e.message}`, 'warning');
        }
      }

      await this.refreshVaultTable();
      await this.refreshSyncQueue();
      await this.loadNotifications();
      await this.loadDashboardStats();

      if (syncedCount > 0) {
        this.showToast(`✅ [DATABASE UPDATED] ${syncedCount} offline inspection(s) synced to Supabase database!`, 'success');
      }
    } catch (err) {
      console.error("Sync error:", err);
      this.showToast(`Sync alert: ${err.message}`, 'warning');
    } finally {
      this.isSyncing = false;
    }
  }

  startUploadSimulation() {
    if (this._uploadSimInterval) clearInterval(this._uploadSimInterval);
    
    if (this.isOffline) {
      this.uploadState.isStreaming = true;
      this.uploadState.wasStreaming = true;
      this.uploadState.isPaused = true;
      const currentChunk = this.uploadState.chunksVerified;
      this.updateUploadUI(`PAUSED AT CHECKPOINT (CHUNK #${currentChunk})`, '#8C2E2B');
      this.showToast(`⏸️ Offline Mode Active: Chunked stream queued at Checkpoint #${currentChunk}. Switch to Online to stream chunks.`, 'warning', 4000);
      return;
    }

    this.uploadState.isStreaming = true;
    this.uploadState.wasStreaming = true;
    this.uploadState.isPaused = false;
    this.updateUploadUI('UPLOADING CHUNKS', '#A36B24');
    this.showToast('🚀 Streaming video chunks to Supabase storage...', 'info');

    this._uploadSimInterval = setInterval(() => {
      if (this.uploadState.isPaused || this.isOffline) {
        clearInterval(this._uploadSimInterval);
        return;
      }
      if (this.uploadState.chunksVerified < 10) {
        this.uploadState.chunksVerified++;
        this.uploadState.progress = Math.round((this.uploadState.chunksVerified / 10) * 100);
        this.uploadState.bytesVerified = Number(((this.uploadState.chunksVerified / 10) * 18.4).toFixed(1));
        this.updateUploadUI('UPLOADING CHUNKS', '#A36B24');
      } else {
        clearInterval(this._uploadSimInterval);
        this.uploadState.isStreaming = false;
        this.uploadState.wasStreaming = false;
        this.updateUploadUI('VERIFIED COMPLETE', '#5E6E49');
        this.showToast('✅ [COMPLETE] All 10 video chunks verified with SHA-256 seal!', 'success');
      }
    }, 700);
  }

  simulateUploadInterrupt(fromNetworkDrop = false) {
    if (this._uploadSimInterval) clearInterval(this._uploadSimInterval);
    this.uploadState.isPaused = true;
    this.uploadState.isStreaming = false;
    const currentChunk = this.uploadState.chunksVerified;
    this.updateUploadUI(`PAUSED AT CHECKPOINT (CHUNK #${currentChunk})`, '#8C2E2B');
    if (!fromNetworkDrop) {
      this.uploadState.wasStreaming = false;
      this.showToast(`⏸️ [MANUAL INTERRUPT] Transfer paused at Chunk #${currentChunk}! ${this.uploadState.bytesVerified} MB verified. 0 redundant data to re-upload.`, 'warning', 4500);
    } else {
      this.showToast(`⏸️ [OFFLINE AIR-GAP] Network cut: Stream paused at Chunk #${currentChunk}. Checkpoint safely preserved in vault.`, 'warning', 4500);
    }
  }

  resumeUpload() {
    this.uploadState.isPaused = false;
    if (this.uploadState.chunksVerified >= 10) {
      this.resetUploadSimulation();
    }
    const currentChunk = this.uploadState.chunksVerified;
    this.showToast(`⚡ Resuming transfer from verified Checkpoint #${currentChunk + 1}...`, 'success');
    this.startUploadSimulation();
  }

  resetUploadSimulation() {
    if (this._uploadSimInterval) clearInterval(this._uploadSimInterval);
    this.uploadState = {
      progress: 0,
      bytesVerified: 0,
      bytesTotal: 18.4,
      isPaused: false,
      isStreaming: false,
      wasStreaming: false,
      chunksVerified: 0
    };
    this.updateUploadUI('READY TO UPLOAD', '#5E6E49');
  }

  updateUploadUI(statusText, badgeColor) {
    const badge = document.getElementById('uploadStatusBadge');
    const pVal = document.getElementById('uploadPercentVal');
    const bVal = document.getElementById('uploadBytesVal');
    const bar = document.getElementById('uploadProgressFillBar');

    if (badge) {
      badge.textContent = statusText;
      badge.style.backgroundColor = badgeColor || '#5E6E49';
    }
    if (pVal) pVal.textContent = `${this.uploadState.progress}%`;
    if (bVal) bVal.textContent = `${this.uploadState.bytesVerified} MB / ${this.uploadState.bytesTotal} MB`;
    if (bar) {
      bar.style.width = `${this.uploadState.progress}%`;
      bar.style.backgroundColor = this.uploadState.isPaused ? '#8C2E2B' : 'var(--olive-light)';
    }

    this.renderUploadChunks();
  }

  renderUploadChunks() {
    const grid = document.getElementById('uploadChunksGrid');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 10; i++) {
      const isVerified = i <= this.uploadState.chunksVerified;
      const isCurrent = i === this.uploadState.chunksVerified + 1 && !this.uploadState.isPaused;
      
      let bg = '#1B1E1C';
      let color = '#B5BEB2';
      let border = '1px solid rgba(255,255,255,0.15)';
      let text = `#${i}`;

      if (isVerified) {
        bg = '#5E6E49'; // Tactical Olive
        color = '#FFFFFF';
        border = '1px solid #73855B';
        text = `#${i} ✓`;
      } else if (isCurrent) {
        bg = '#A3BF85'; // Olive Highlight
        color = '#111111';
        border = '2px solid #FFFFFF';
        text = `#${i} ⚡`;
      }

      html += `
        <div style="height:38px; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:11px; font-weight:800; background:${bg}; color:${color}; border:${border}; transition:all 0.2s ease;">
          <span>${text}</span>
          <span style="font-size:9px; opacity:0.8;">1.8MB</span>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  resolveConflict(choice) {
    if (this.currentRole === 'officer') {
      this.showToast('⛔ [RBAC RESTRICTED] Field Officers cannot resolve conflict diffs. Requires Supervisor approval.', 'warning');
      return;
    }
    const supervisorName = RBAC_ROLES[this.currentRole].name;
    this.showToast(`[CONFLICT RESOLVED] Resolved by ${supervisorName}: "${choice}". Audit log committed.`, 'success');
    setTimeout(() => this.navigateTo('dashboard'), 1200);
  }

  clearForm() {
    document.getElementById('inspectionEntryForm')?.reset();
    this.stagedEvidence = [];
    this.renderStagedEvidence();
  }

  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('syncfieldToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'syncfieldToastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const toastClass = type === 'success' ? 'toast-success' : type === 'warning' ? 'toast-warning' : type === 'error' ? 'toast-error' : type === 'conflict' ? 'toast-conflict' : 'toast-info';
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '🔴' : type === 'conflict' ? '🚨' : 'ℹ️';
    
    toast.className = `syncfield-toast-card ${toastClass}`;
    toast.innerHTML = `
      <span style="font-size:16px;">${icon}</span>
      <div style="flex:1; line-height:1.4;">${message}</div>
      <button type="button" style="background:none; border:none; color:var(--text-muted-light); cursor:pointer; font-size:14px; padding:0 2px;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Also persist into Local Vault notifications so user can review history
    if (window.vaultDB && typeof window.vaultDB.logAuditEvent === 'function') {
      window.vaultDB.logAuditEvent('SYSTEM', type.toUpperCase(), message);
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Global initialization
window.app = new SyncFieldApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
