/**
 * SyncField Simulated Cloud Sync Gateway & Storage Server
 * Simulates server-side endpoints, network latency, chunk checkpoints,
 * duplicate prevention (idempotency), conflict detection, and integrity checks.
 */

class MockSyncGateway {
  constructor() {
    this.networkMode = 'ONLINE'; // 'ONLINE' | 'WEAK_3G' | 'OFFLINE' | 'INTERMITTENT'
    this.serverOperations = new Map(); // operationId -> server record
    this.serverCheckpoints = new Map(); // operationId -> array of verified chunk indexes
    this.assetRegistry = new Map(); // assetId -> { version: number, status: string, lastModified: string }

    // Seed mock assets in server registry
    this.assetRegistry.set('Panel #47', {
      assetId: 'Panel #47',
      version: 2,
      operationalStatus: 'DEGRADED_OUTPUT',
      assignedJob: 'Solar Inverter Inspection',
      lastModifiedBy: 'Supervisor HQ',
      lastModifiedAt: new Date(Date.now() - 1800000).toISOString()
    });
  }

  setNetworkMode(mode) {
    this.networkMode = mode;
  }

  /**
   * Simulates network latency or throws error if offline
   */
  async _simulateNetworkDelay() {
    if (this.networkMode === 'OFFLINE') {
      const err = new Error('ERR_INTERNET_DISCONNECTED: Network route unavailable');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }

    if (this.networkMode === 'INTERMITTENT') {
      // 50% random chance to drop connection mid-flight
      if (Math.random() < 0.45) {
        await new Promise(r => setTimeout(r, 200));
        const err = new Error('ERR_CONNECTION_RESET: Packet drop / link degraded');
        err.code = 'INTERMITTENT_DROP';
        throw err;
      }
    }

    const latency = this.networkMode === 'WEAK_3G' ? 450 : 60;
    await new Promise(r => setTimeout(r, latency));
  }

  /**
   * Endpoint: Upload a single media chunk with checkpoint acknowledgement
   */
  async uploadChunk(operationId, chunkIndex, totalChunks, chunkHash, byteSize) {
    await this._simulateNetworkDelay();

    if (!this.serverCheckpoints.has(operationId)) {
      this.serverCheckpoints.set(operationId, new Set());
    }

    const checkpointSet = this.serverCheckpoints.get(operationId);
    checkpointSet.add(chunkIndex);

    const verifiedCount = checkpointSet.size;
    const isComplete = verifiedCount === totalChunks;

    return {
      success: true,
      operationId,
      chunkIndex,
      verifiedChunksCount: verifiedCount,
      totalChunks,
      isComplete,
      checkpointHash: chunkHash,
      serverTimestamp: new Date().toISOString()
    };
  }

  /**
   * Endpoint: Query server for existing checkpoint resume offset
   */
  async getCheckpointStatus(operationId) {
    await this._simulateNetworkDelay();
    const verified = this.serverCheckpoints.get(operationId);
    const verifiedList = verified ? Array.from(verified).sort((a, b) => a - b) : [];
    return {
      operationId,
      verifiedChunks: verifiedList,
      lastCheckpointIndex: verifiedList.length > 0 ? verifiedList[verifiedList.length - 1] : -1
    };
  }

  /**
   * Endpoint: Commit synchronized Evidence Package (with Idempotency & Conflict Check)
   */
  async commitEvidencePackage(pkg) {
    await this._simulateNetworkDelay();

    // 1. Idempotency Check (Duplicate Protection)
    if (this.serverOperations.has(pkg.operationId)) {
      const existing = this.serverOperations.get(pkg.operationId);
      return {
        status: 'DUPLICATE_PROTECTED',
        idempotent: true,
        message: `Operation ${pkg.operationId} was already committed and verified at ${existing.verifiedAt}. Duplicate ignored safely.`,
        record: existing
      };
    }

    // 2. Conflict Detection Check
    const serverAsset = this.assetRegistry.get(pkg.assetId);
    if (serverAsset && pkg.baseVersion && pkg.baseVersion < serverAsset.version) {
      // Conflict detected!
      return {
        status: 'CONFLICT_DETECTED',
        conflict: true,
        message: `Concurrent edit conflict on ${pkg.assetId}. Base version was v${pkg.baseVersion}, but server is currently at v${serverAsset.version}.`,
        serverRecord: serverAsset,
        incomingRecord: pkg
      };
    }

    // 3. Server-side Cryptographic Integrity Verification
    const serverRecomputedHash = await CryptoEngine.computePackageFingerprint(pkg);
    const isIntegrityPassed = serverRecomputedHash.toLowerCase() === pkg.fingerprint.toLowerCase();

    if (!isIntegrityPassed) {
      return {
        status: 'CORRUPTED',
        integrityPassed: false,
        message: 'Cryptographic fingerprint mismatch detected during server ingestion!',
        clientFingerprint: pkg.fingerprint,
        serverFingerprint: serverRecomputedHash
      };
    }

    // 4. Verification Successful: Store in cloud registry
    const serverStoredRecord = {
      ...pkg,
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      serverVersion: (serverAsset?.version || 1) + 1
    };

    this.serverOperations.set(pkg.operationId, serverStoredRecord);
    if (serverAsset) {
      this.assetRegistry.set(pkg.assetId, {
        ...serverAsset,
        version: serverStoredRecord.serverVersion,
        operationalStatus: pkg.severity === 'CRITICAL' ? 'OFFLINE_REPAIR_REQUIRED' : 'INSPECTION_COMPLETED',
        lastModifiedBy: pkg.workerId,
        lastModifiedAt: new Date().toISOString()
      });
    }

    return {
      status: 'VERIFIED',
      success: true,
      integrityPassed: true,
      operationId: pkg.operationId,
      receipt: `RCPT-${Date.now().toString(36).toUpperCase()}`,
      serverFingerprint: serverRecomputedHash,
      timestamp: serverStoredRecord.verifiedAt
    };
  }

  /**
   * Endpoint: Supervisor Resolve Conflict
   */
  async resolveConflict(operationId, resolutionType, resolvedData, supervisorId) {
    await this._simulateNetworkDelay();

    const record = {
      ...resolvedData,
      status: 'VERIFIED',
      resolution: {
        type: resolutionType,
        resolvedBy: supervisorId,
        resolvedAt: new Date().toISOString()
      }
    };

    this.serverOperations.set(operationId, record);
    return {
      success: true,
      record
    };
  }
}

window.mockGateway = new MockSyncGateway();
