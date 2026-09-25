/**
 * Resumable Media Chunker Utility
 * Standard Chunk Size: 1MB (1024 * 1024 bytes)
 */

export const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export interface FileChunk {
  index: number;
  startByte: number;
  endByte: number;
  totalBytes: number;
  totalChunks: number;
  blob: Blob;
}

export function sliceFileIntoChunks(fileOrBlob: Blob, chunkSize = CHUNK_SIZE): FileChunk[] {
  const totalBytes = fileOrBlob.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));
  const chunks: FileChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const startByte = i * chunkSize;
    const endByte = Math.min(startByte + chunkSize, totalBytes);
    const chunkBlob = fileOrBlob.slice(startByte, endByte);

    chunks.push({
      index: i,
      startByte,
      endByte,
      totalBytes,
      totalChunks,
      blob: chunkBlob,
    });
  }

  return chunks;
}
