package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.ConflictDto;
import com.syncfield.service.ConflictService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conflicts")
@RequiredArgsConstructor
public class ConflictController {

    private final ConflictService conflictService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ConflictDto.ConflictResponse>>> getConflicts() {
        return ResponseEntity.ok(ApiResponse.success(conflictService.getPendingConflicts()));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<ConflictDto.ConflictResponse>> resolveConflict(
            @PathVariable UUID id,
            @RequestBody ConflictDto.ResolveConflictRequest request) {
        try {
            ConflictDto.ConflictResponse response = conflictService.resolveConflict(id, request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }
}
