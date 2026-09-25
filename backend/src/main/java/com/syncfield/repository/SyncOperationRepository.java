package com.syncfield.repository;

import com.syncfield.entity.SyncOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SyncOperationRepository extends JpaRepository<SyncOperation, UUID> {
    List<SyncOperation> findByOperationIdOrderByCreatedAtDesc(UUID operationId);
}
