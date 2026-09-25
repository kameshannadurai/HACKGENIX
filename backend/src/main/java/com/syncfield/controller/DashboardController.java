package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.ConflictDto;
import com.syncfield.dto.DashboardDto;
import com.syncfield.dto.JobDto;
import com.syncfield.enums.JobStatus;
import com.syncfield.enums.SyncState;
import com.syncfield.repository.*;
import com.syncfield.service.ConflictService;
import com.syncfield.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final JobRepository jobRepository;
    private final OperationRepository operationRepository;
    private final EvidenceFileRepository evidenceFileRepository;
    private final ConflictRepository conflictRepository;
    private final JobService jobService;
    private final ConflictService conflictService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardDto.SupervisorStats>> getDashboardStats() {
        long totalJobs = jobRepository.count();
        long completedJobs = jobRepository.findByStatus(JobStatus.COMPLETED).size() +
                jobRepository.findByStatus(JobStatus.SYNCED).size();

        long conflictsCount = conflictRepository.findByStatus("UNRESOLVED").size();

        long verifiedFiles = evidenceFileRepository.findAll().stream()
                .filter(f -> f.getUploadStatus() == SyncState.VERIFIED)
                .count();

        long pendingOperations = operationRepository.findAll().stream()
                .filter(o -> o.getStatus() == SyncState.QUEUED || o.getStatus() == SyncState.STORED_OFFLINE || o.getStatus() == SyncState.UPLOADING)
                .count();

        long failedOperations = operationRepository.findAll().stream()
                .filter(o -> o.getStatus() == SyncState.FAILED || o.getStatus() == SyncState.CORRUPTED)
                .count();

        List<JobDto.JobResponse> recentJobs = jobService.getAllJobs();
        List<ConflictDto.ConflictResponse> pendingConflicts = conflictService.getPendingConflicts();

        DashboardDto.SupervisorStats stats = DashboardDto.SupervisorStats.builder()
                .totalJobs(totalJobs)
                .completedJobs(completedJobs)
                .pendingSync(pendingOperations)
                .failedSync(failedOperations)
                .conflicts(conflictsCount)
                .verifiedEvidence(verifiedFiles)
                .offlineOperations(pendingOperations)
                .recentJobs(recentJobs)
                .pendingConflicts(pendingConflicts)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
