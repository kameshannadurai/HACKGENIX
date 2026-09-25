package com.syncfield.dto;

import com.syncfield.enums.SyncState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class ChunkUploadDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InitUploadRequest {
        private String fileId;
        private String packageId;
        private String fileName;
        private Long fileSize;
        private String mimeType;
        private String fileHash;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InitUploadResponse {
        private String fileId;
        private Integer lastCheckpoint;
        private Long uploadedBytes;
        private SyncState status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChunkResponse {
        private String fileId;
        private Integer chunkIndex;
        private Long uploadedBytes;
        private Long totalBytes;
        private Boolean isComplete;
        private SyncState status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyFileRequest {
        private String fileId;
        private String expectedHash;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyFileResponse {
        private String fileId;
        private String calculatedHash;
        private String expectedHash;
        private Boolean isMatch;
        private SyncState status;
    }
}
