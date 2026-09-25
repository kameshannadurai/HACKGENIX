package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.entity.AuditLog;
import com.syncfield.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/{operationId}")
    @PreAuthorize("hasAnyRole('OFFICER', 'FIELD_WORKER', 'SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogsByOperation(@PathVariable UUID operationId) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getLogsByOperation(operationId)));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentLogs() {
        return ResponseEntity.ok(ApiResponse.success(auditService.getRecentLogs()));
    }
}
