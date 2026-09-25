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

public class OperationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOperationRequest {
        private String operationId;
        private UUID jobId;
        private UUID workerId;
        private String idempotencyKey;
        private Integer version;
        private String deviceId;
        private Double latitude;
        private Double longitude;
        private String inspectionData;
        private LocalDateTime clientCreatedAt;
        private EvidencePackageRequest evidencePackage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvidencePackageRequest {
        private String packageId;
        private String packageHash;
        private List<EvidenceFileRequest> files;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvidenceFileRequest {
        private String fileId;
        private String fileName;
        private FileType fileType;
        private String mimeType;
        private Long fileSize;
        private String fileHash;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationResponse {
        private UUID id;
        private String operationId;
        private UUID jobId;
        private String jobTitle;
        private String assetName;
        private UUID workerId;
        private String workerName;
        private String idempotencyKey;
        private Integer version;
        private SyncState status;
        private String deviceId;
        private Double latitude;
        private Double longitude;
        private String inspectionData;
        private LocalDateTime clientCreatedAt;
        private LocalDateTime serverCreatedAt;
        private EvidenceDto.EvidencePackageResponse evidencePackage;
    }
}
