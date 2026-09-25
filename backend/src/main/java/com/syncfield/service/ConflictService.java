package com.syncfield.service;

import com.syncfield.dto.ConflictDto;
import com.syncfield.entity.Conflict;
import com.syncfield.entity.Operation;
import com.syncfield.entity.User;
import com.syncfield.enums.SyncState;
import com.syncfield.repository.ConflictRepository;
import com.syncfield.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConflictService {

    private final ConflictRepository conflictRepository;
    private final OperationRepository operationRepository;
    private final AuditService auditService;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<ConflictDto.ConflictResponse> getPendingConflicts() {
        return conflictRepository.findByStatus("UNRESOLVED").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Conflict createConflict(Operation operation, int localVersion, int serverVersion,
                                   String conflictType, String localData, String serverData) {
        Conflict conflict = Conflict.builder()
                .operation(operation)
                .localVersion(localVersion)
                .serverVersion(serverVersion)
                .conflictType(conflictType)
                .localData(localData)
                .serverData(serverData)
                .status("UNRESOLVED")
                .build();

        Conflict saved = conflictRepository.save(conflict);

        operation.setStatus(SyncState.CONFLICT);
        operationRepository.save(operation);

        auditService.log(
                operation,
                null,
                "CONFLICT_DETECTED",
                "Concurrent modification detected on Operation " + operation.getOperationId() + " (Local v" + localVersion + " vs Server v" + serverVersion + ")",
                "{\"conflictId\":\"" + saved.getId() + "\"}"
        );

        return saved;
    }

    @Transactional
    public ConflictDto.ConflictResponse resolveConflict(UUID conflictId, ConflictDto.ResolveConflictRequest request) {
        Conflict conflict = conflictRepository.findById(conflictId)
                .orElseThrow(() -> new IllegalArgumentException("Conflict not found: " + conflictId));

        User currentUser = authService.getCurrentUser();
        conflict.setResolution(request.getResolution());
        conflict.setResolvedBy(currentUser);
        conflict.setResolvedAt(LocalDateTime.now());
        conflict.setStatus("RESOLVED");

        Operation operation = conflict.getOperation();
        if ("KEEP_LOCAL".equalsIgnoreCase(request.getResolution())) {
            operation.setInspectionData(conflict.getLocalData());
            operation.setVersion(operation.getVersion() + 1);
        } else if ("MERGED".equalsIgnoreCase(request.getResolution()) && request.getMergedData() != null) {
            operation.setInspectionData(request.getMergedData());
            operation.setVersion(operation.getVersion() + 1);
        }
        // If KEEP_SERVER, we keep existing server data and increment version
        operation.setStatus(SyncState.SYNCED);
        operationRepository.save(operation);

        Conflict saved = conflictRepository.save(conflict);

        auditService.log(
                operation,
                currentUser,
                "CONFLICT_RESOLVED",
                "Conflict resolved via " + request.getResolution() + " by " + (currentUser != null ? currentUser.getName() : "Supervisor"),
                "{\"resolution\":\"" + request.getResolution() + "\"}"
        );

        return mapToResponse(saved);
    }

    public ConflictDto.ConflictResponse mapToResponse(Conflict c) {
        return ConflictDto.ConflictResponse.builder()
                .id(c.getId())
                .operationId(c.getOperation().getId())
                .operationCode(c.getOperation().getOperationId())
                .jobTitle(c.getOperation().getJob() != null ? c.getOperation().getJob().getTitle() : "N/A")
                .localVersion(c.getLocalVersion())
                .serverVersion(c.getServerVersion())
                .conflictType(c.getConflictType())
                .localData(c.getLocalData())
                .serverData(c.getServerData())
                .resolution(c.getResolution())
                .resolvedByName(c.getResolvedBy() != null ? c.getResolvedBy().getName() : null)
                .resolvedAt(c.getResolvedAt())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
