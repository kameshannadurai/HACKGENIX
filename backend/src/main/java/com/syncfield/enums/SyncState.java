package com.syncfield.enums;

public enum SyncState {
    CAPTURED,
    STORED_OFFLINE,
    QUEUED,
    UPLOADING,
    PAUSED_RETRYING,
    RESUMING,
    UPLOADED,
    VERIFYING,
    VERIFIED,
    SYNCED,
    FAILED,
    CONFLICT,
    CORRUPTED,
    CANCELLED
}
