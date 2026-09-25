export type Role = 'FIELD_WORKER' | 'SUPERVISOR' | 'ADMIN';

export type JobStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SYNCED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SyncState =
  | 'CAPTURED'
  | 'STORED_OFFLINE'
  | 'QUEUED'
  | 'UPLOADING'
  | 'PAUSED_RETRYING'
  | 'RESUMING'
  | 'UPLOADED'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'SYNCED'
  | 'FAILED'
  | 'CONFLICT'
  | 'CORRUPTED'
  | 'CANCELLED';

export type FileType = 'PHOTO' | 'VIDEO' | 'VOICE_NOTE' | 'INSPECTION_JSON';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationName?: string;
  token?: string;
}

export interface Job {
  id: string;
  jobCode: string;
  title: string;
  description: string;
  assetName: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  status: JobStatus;
  priority: Priority;
  createdAt: string;
  updatedAt?: string;
}

export interface EvidenceFileItem {
  id: string;
  fileId: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  fileSize: number;
  fileHash: string; // SHA-256
  blob?: Blob;
  previewUrl?: string;
  uploadStatus: SyncState;
  uploadedBytes: number;
  totalBytes: number;
  checkpoint: number; // chunk index
  storagePath?: string;
  createdAt: string;
}

export interface EvidencePackageItem {
  id: string;
  packageId: string;
  operationId: string;
  packageHash: string; // Aggregate SHA-256
  status: SyncState;
  files: EvidenceFileItem[];
  createdAt: string;
  verifiedAt?: string;
}

export interface InspectionData {
  conditionRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_MAINTENANCE' | 'CRITICAL_FAILURE';
  temperatureCelsius?: number;
  voltageVDC?: number;
  physicalDamageObserved: boolean;
  notes: string;
  customChecklist?: Record<string, boolean>;
}

export interface OperationItem {
  id: string;
  operationId: string; // e.g. OP-2026-0047
  jobId: string;
  jobTitle?: string;
  assetName?: string;
  workerId: string;
  workerName?: string;
  idempotencyKey: string;
  version: number;
  status: SyncState;
  deviceId: string;
  latitude?: number;
  longitude?: number;
  inspectionData: InspectionData;
  evidencePackage?: EvidencePackageItem;
  clientCreatedAt: string;
  serverCreatedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  operationId: string;
  status: SyncState;
  retryCount: number;
  lastError?: string;
  lastCheckpoint?: number;
  totalBytes: number;
  uploadedBytes: number;
  enqueuedAt: string;
  lastAttemptAt?: string;
}

export interface ConflictItem {
  id: string;
  operationId: string;
  operationCode: string;
  jobTitle: string;
  localVersion: number;
  serverVersion: number;
  conflictType: string;
  localData: string;
  serverData: string;
  resolution?: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGED';
  resolvedByName?: string;
  resolvedAt?: string;
  status: 'UNRESOLVED' | 'RESOLVED';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  operationId?: string;
  operationCode?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  description: string;
  metadata?: string;
  timestamp: string;
}

export interface NetworkState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSimulatedInterrupted: boolean;
  effectiveType?: string;
  lastPingTime?: number;
}
