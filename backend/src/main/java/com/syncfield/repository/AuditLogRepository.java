package com.syncfield.repository;

import com.syncfield.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByOperationIdOrderByTimestampDesc(UUID operationId);
    List<AuditLog> findTop50ByOrderByTimestampDesc();
}
