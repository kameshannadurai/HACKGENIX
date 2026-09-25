package com.syncfield.repository;

import com.syncfield.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OperationRepository extends JpaRepository<Operation, UUID> {
    Optional<Operation> findByOperationId(String operationId);
    Optional<Operation> findByIdempotencyKey(String idempotencyKey);
    List<Operation> findByJobId(UUID jobId);
    List<Operation> findByWorkerId(UUID workerId);
}
