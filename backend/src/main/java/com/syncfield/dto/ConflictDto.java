package com.syncfield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class ConflictDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictResponse {
        private UUID id;
        private UUID operationId;
        private String operationCode;
        private String jobTitle;
        private Integer localVersion;
        private Integer serverVersion;
        private String conflictType;
        private String localData;
        private String serverData;
        private String resolution;
        private String resolvedByName;
        private LocalDateTime resolvedAt;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveConflictRequest {
        private String resolution; // KEEP_LOCAL, KEEP_SERVER, MERGED
        private String mergedData;
    }
}
