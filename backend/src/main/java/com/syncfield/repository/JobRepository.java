package com.syncfield.repository;

import com.syncfield.entity.Job;
import com.syncfield.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    Optional<Job> findByJobCode(String jobCode);
    List<Job> findByAssignedWorkerId(UUID workerId);
    List<Job> findByStatus(JobStatus status);
}
