/**
 * SyncField Cryptographic & Fingerprinting Engine
 * Uses Web Crypto API (crypto.subtle) for real SHA-256 integrity verification,
 * tamper detection, and Merkle-style Evidence Package hashing.
 */

class CryptoEngine {
  /**
   * Compute standard SHA-256 hex digest for any string or binary buffer
   */
  static async sha256(data) {
    let buffer;
    if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data);
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (ArrayBuffer.isView(data)) {
      buffer = data.buffer;
    } else {
      buffer = new TextEncoder().encode(JSON.stringify(data));
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates unique idempotency operation ID
   * E.g. OP-2026-0047
   */
  static generateOperationId() {
    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    return `OP-${year}-${seq}`;
  }

  /**
   * Calculates comprehensive Merkle-style root fingerprint for an Evidence Package.
   * Hashes: operationId + timestamp + asset + worker + fields + mediaHashes
   */
  static async computePackageFingerprint(pkg) {
    const canonicalPayload = {
      operationId: pkg.operationId,
      jobType: pkg.jobType,
      assetId: pkg.assetId,
      workerId: pkg.workerId,
      capturedAt: pkg.capturedAt,
      gps: pkg.gps,
      checklist: pkg.checklist,
      notes: pkg.notes,
      severity: pkg.severity,
      mediaManifest: (pkg.media || []).map(m => ({
        id: m.id,
        type: m.type,
        sizeBytes: m.sizeBytes,
        hash: m.hash || 'unhashed'
      }))
    };

    const payloadString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
    return await this.sha256(payloadString);
  }

  /**
   * Verifies the cryptographic integrity of a package against its claimed fingerprint
   */
  static async verifyPackageIntegrity(pkg) {
    if (!pkg.fingerprint) {
      return { verified: false, reason: 'Missing cryptographic fingerprint.' };
    }

    const recomputed = await this.computePackageFingerprint(pkg);
    const isValid = recomputed.toLowerCase() === pkg.fingerprint.toLowerCase();

    return {
      verified: isValid,
      expected: pkg.fingerprint,
      actual: recomputed,
      timestamp: new Date().toISOString()
    };
  }
}

window.CryptoEngine = CryptoEngine;
