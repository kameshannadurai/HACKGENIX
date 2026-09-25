package com.syncfield.dto;

import com.syncfield.enums.FileType;
import com.syncfield.enums.SyncState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class EvidenceDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvidencePackageResponse {
        private UUID id;
        private String packageId;
        private String packageHash;
        private SyncState status;
        private LocalDateTime createdAt;
        private LocalDateTime verifiedAt;
        private List<EvidenceFileResponse> files;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvidenceFileResponse {
        private UUID id;
        private String fileId;
        private String fileName;
        private FileType fileType;
        private String mimeType;
        private Long fileSize;
        private String storagePath;
        private String fileHash;
        private SyncState uploadStatus;
        private Long uploadedBytes;
        private Long totalBytes;
        private Integer checkpoint;
        private LocalDateTime createdAt;
    }
}
