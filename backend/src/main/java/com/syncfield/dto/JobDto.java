package com.syncfield.dto;

import com.syncfield.enums.JobStatus;
import com.syncfield.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class JobDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobResponse {
        private UUID id;
        private String jobCode;
        private String title;
        private String description;
        private String assetName;
        private UUID assignedWorkerId;
        private String assignedWorkerName;
        private JobStatus status;
        private Priority priority;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateJobRequest {
        private String jobCode;
        private String title;
        private String description;
        private String assetName;
        private UUID assignedWorkerId;
        private Priority priority;
    }
}
