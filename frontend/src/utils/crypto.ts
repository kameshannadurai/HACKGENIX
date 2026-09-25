/**
 * SHA-256 Cryptographic Hash Utility using Browser WebCrypto API
 */

export async function computeSHA256ForBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function computeSHA256ForString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSHA256ForObject(obj: Record<string, unknown>): Promise<string> {
  const jsonString = JSON.stringify(obj, Object.keys(obj).sort());
  return computeSHA256ForString(jsonString);
}

/**
 * Generate a unique Operation ID (e.g. OP-2026-0047)
 */
export function generateOperationId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `OP-2026-${randomNum}`;
}

/**
 * Generate a unique Idempotency Key
 */
export function generateIdempotencyKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
