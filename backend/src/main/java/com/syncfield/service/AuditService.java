package com.syncfield.service;

import com.syncfield.entity.AuditLog;
import com.syncfield.entity.Operation;
import com.syncfield.entity.User;
import com.syncfield.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog log(Operation operation, User user, String action, String description, String metadata) {
        log.info("[AUDIT] Action: {}, Description: {}, Operation: {}",
                action, description, operation != null ? operation.getOperationId() : "N/A");

        AuditLog auditLog = AuditLog.builder()
                .operation(operation)
                .user(user)
                .action(action)
                .description(description)
                .metadata(metadata)
                .build();

        return auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getLogsByOperation(UUID operationId) {
        return auditLogRepository.findByOperationIdOrderByTimestampDesc(operationId);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
