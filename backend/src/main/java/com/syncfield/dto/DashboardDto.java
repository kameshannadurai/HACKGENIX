package com.syncfield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class DashboardDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupervisorStats {
        private long totalJobs;
        private long completedJobs;
        private long pendingSync;
        private long failedSync;
        private long conflicts;
        private long verifiedEvidence;
        private long offlineOperations;
        private List<JobDto.JobResponse> recentJobs;
        private List<ConflictDto.ConflictResponse> pendingConflicts;
    }
}
