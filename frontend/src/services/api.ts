import {
  Job,
  OperationItem,
  EvidenceFileItem,
  ConflictItem,
  AuditLogItem,
  User,
} from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('syncfield_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Health
  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Auth
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Login failed');
    }
    const data = json.data;
    const user: User = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      organizationName: data.organizationName,
      token: data.token,
    };
    localStorage.setItem('syncfield_token', data.token);
    localStorage.setItem('syncfield_user', JSON.stringify(user));
    return user;
  },

  // Jobs
  async getJobs(workerId?: string): Promise<Job[]> {
    const url = workerId ? `${API_BASE}/jobs?workerId=${workerId}` : `${API_BASE}/jobs`;
    const res = await fetch(url, { headers: getHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  // Operations Sync
  async syncOperation(op: OperationItem): Promise<OperationItem> {
    const res = await fetch(`${API_BASE}/operations`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Idempotency-Key': op.idempotencyKey,
      },
      body: JSON.stringify({
        operationId: op.operationId,
        jobId: op.jobId,
        workerId: op.workerId,
        idempotencyKey: op.idempotencyKey,
        version: op.version,
        deviceId: op.deviceId,
        latitude: op.latitude,
        longitude: op.longitude,
        inspectionData: JSON.stringify(op.inspectionData),
        clientCreatedAt: op.clientCreatedAt,
        evidencePackage: op.evidencePackage
          ? {
              packageId: op.evidencePackage.packageId,
              packageHash: op.evidencePackage.packageHash,
              files: op.evidencePackage.files.map((f) => ({
                fileId: f.fileId,
                fileName: f.fileName,
                fileType: f.fileType,
                mimeType: f.mimeType,
                fileSize: f.fileSize,
                fileHash: f.fileHash,
              })),
            }
          : null,
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error || 'Failed to sync operation');
    }
    return json.data;
  },

  // Resumable Chunk Upload
  async initChunkUpload(file: EvidenceFileItem, packageId: string) {
    const res = await fetch(`${API_BASE}/evidence/init`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        fileId: file.fileId,
        packageId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileHash: file.fileHash,
      }),
    });
    return res.json();
  },

  async uploadChunk(
    fileId: string,
    fileName: string,
    chunkIndex: number,
    totalChunks: number,
    totalBytes: number,
    chunkBlob: Blob
  ) {
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('fileName', fileName);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('totalBytes', totalBytes.toString());
    formData.append('file', chunkBlob, `${fileId}.part${chunkIndex}`);

    const token = localStorage.getItem('syncfield_token');
    const res = await fetch(`${API_BASE}/evidence/chunk`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return res.json();
  },

  async verifyFileIntegrity(fileId: string, expectedHash: string) {
    const res = await fetch(`${API_BASE}/evidence/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileId, expectedHash }),
    });
    return res.json();
  },

  // Conflicts
  async getConflicts(): Promise<ConflictItem[]> {
    const res = await fetch(`${API_BASE}/conflicts`, { headers: getHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async resolveConflict(conflictId: string, resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGED', mergedData?: string) {
    const res = await fetch(`${API_BASE}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ resolution, mergedData }),
    });
    return res.json();
  },

  // Audit
  async getRecentAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/audit/recent`, { headers: getHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  // Dashboard Stats
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: getHeaders() });
    const json = await res.json();
    return json.data;
  },
};
