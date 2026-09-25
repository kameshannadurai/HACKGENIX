package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.JobDto;
import com.syncfield.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobDto.JobResponse>>> getAllJobs(@RequestParam(required = false) UUID workerId) {
        List<JobDto.JobResponse> jobs = workerId != null
                ? jobService.getWorkerJobs(workerId)
                : jobService.getAllJobs();
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDto.JobResponse>> getJobById(@PathVariable UUID id) {
        try {
            JobDto.JobResponse job = jobService.getJobById(id);
            return ResponseEntity.ok(ApiResponse.success(job));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JobDto.JobResponse>> createJob(@RequestBody JobDto.CreateJobRequest request) {
        try {
            JobDto.JobResponse job = jobService.createJob(request);
            return ResponseEntity.ok(ApiResponse.success(job));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }
}
