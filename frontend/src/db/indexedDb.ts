import Dexie, { Table } from 'dexie';
import {
  Job,
  OperationItem,
  EvidencePackageItem,
  EvidenceFileItem,
  SyncQueueItem,
  ConflictItem,
  AuditLogItem,
} from '../types';

export class SyncFieldDatabase extends Dexie {
  jobs!: Table<Job, string>;
  operations!: Table<OperationItem, string>;
  evidencePackages!: Table<EvidencePackageItem, string>;
  evidenceFiles!: Table<EvidenceFileItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  conflicts!: Table<ConflictItem, string>;
  auditLogs!: Table<AuditLogItem, string>;

  constructor() {
    super('SyncField_EvidenceVault_DB');
    this.version(1).stores({
      jobs: 'id, jobCode, assignedWorkerId, status, priority',
      operations: 'id, operationId, jobId, workerId, idempotencyKey, status, version',
      evidencePackages: 'id, packageId, operationId, status',
      evidenceFiles: 'id, fileId, packageId, fileType, uploadStatus',
      syncQueue: 'id, operationId, status, enqueuedAt',
      conflicts: 'id, operationId, status, createdAt',
      auditLogs: 'id, operationId, action, timestamp',
    });
  }
}

export const db = new SyncFieldDatabase();

// Seed initial demo data into IndexedDB if empty
export async function seedLocalDexieDatabase() {
  const count = await db.jobs.count();
  if (count > 0) return;

  const initialJobs: Job[] = [
    {
      id: 'job-solar-047',
      jobCode: 'JOB-SOLAR-047',
      title: 'Solar Panel Inspection',
      description: 'Perform comprehensive thermal check, photodiode degradation sweep, and structural mount inspection on Sector 4.',
      assetName: 'Panel #47',
      assignedWorkerId: 'worker-01',
      assignedWorkerName: 'Worker-01 (Alex Rivera)',
      status: 'ASSIGNED',
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-tower-102',
      jobCode: 'JOB-TOWER-102',
      title: 'Electrical Tower Inspection',
      description: 'High-voltage insulator integrity sweep and line tension evaluation.',
      assetName: 'Tower North-12',
      assignedWorkerId: 'worker-01',
      assignedWorkerName: 'Worker-01 (Alex Rivera)',
      status: 'ASSIGNED',
      priority: 'CRITICAL',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-hvac-305',
      jobCode: 'JOB-HVAC-305',
      title: 'HVAC Maintenance',
      description: 'Quarterly compressor valve inspection, refrigerant pressure check, and filter replacement.',
      assetName: 'Chiller Unit 4B',
      assignedWorkerId: 'worker-01',
      assignedWorkerName: 'Worker-01 (Alex Rivera)',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-ind-881',
      jobCode: 'JOB-IND-881',
      title: 'Industrial Equipment Inspection',
      description: 'Vibration analysis, bearing oil sample collection, and emergency shutdown valve audit.',
      assetName: 'Turbine Gen-3',
      assignedWorkerId: 'worker-02',
      assignedWorkerName: 'Worker-02 (Sarah Chen)',
      status: 'ASSIGNED',
      priority: 'HIGH',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-tel-550',
      jobCode: 'JOB-TEL-550',
      title: 'Telecom Tower Inspection',
      description: '5G antenna tilt verification, grounding cable corrosion test, and radome physical check.',
      assetName: '5G Repeater Mast 9',
      assignedWorkerId: 'worker-04',
      assignedWorkerName: 'Worker-04 (Elena Gomez)',
      status: 'ASSIGNED',
      priority: 'LOW',
      createdAt: new Date().toISOString(),
    },
  ];

  await db.jobs.bulkAdd(initialJobs);

  // Initial audit log
  await db.auditLogs.add({
    id: `audit-${Date.now()}`,
    action: 'VAULT_INITIALIZED',
    description: 'Local IndexedDB Evidence Vault initialized with 5 offline-cached jobs',
    timestamp: new Date().toISOString(),
  });
}
