package com.syncfield.service;

import com.syncfield.dto.JobDto;
import com.syncfield.entity.Job;
import com.syncfield.entity.User;
import com.syncfield.enums.JobStatus;
import com.syncfield.enums.Priority;
import com.syncfield.repository.JobRepository;
import com.syncfield.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<JobDto.JobResponse> getAllJobs() {
        return jobRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobDto.JobResponse> getWorkerJobs(UUID workerId) {
        return jobRepository.findByAssignedWorkerId(workerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobDto.JobResponse getJobById(UUID id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + id));
        return mapToResponse(job);
    }

    @Transactional
    public JobDto.JobResponse createJob(JobDto.CreateJobRequest request) {
        User worker = null;
        if (request.getAssignedWorkerId() != null) {
            worker = userRepository.findById(request.getAssignedWorkerId())
                    .orElse(null);
        }

        Job job = Job.builder()
                .jobCode(request.getJobCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .assetName(request.getAssetName())
                .assignedWorker(worker)
                .status(JobStatus.ASSIGNED)
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .build();

        Job saved = jobRepository.save(job);
        User currentUser = authService.getCurrentUser();
        auditService.log(null, currentUser, "JOB_CREATED", "Job created: " + saved.getJobCode() + " - " + saved.getTitle(), null);

        return mapToResponse(saved);
    }

    public JobDto.JobResponse mapToResponse(Job job) {
        return JobDto.JobResponse.builder()
                .id(job.getId())
                .jobCode(job.getJobCode())
                .title(job.getTitle())
                .description(job.getDescription())
                .assetName(job.getAssetName())
                .assignedWorkerId(job.getAssignedWorker() != null ? job.getAssignedWorker().getId() : null)
                .assignedWorkerName(job.getAssignedWorker() != null ? job.getAssignedWorker().getName() : "Unassigned")
                .status(job.getStatus())
                .priority(job.getPriority())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
