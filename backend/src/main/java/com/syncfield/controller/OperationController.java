package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.OperationDto;
import com.syncfield.service.OperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationController {

    private final OperationService operationService;

    @PostMapping
    public ResponseEntity<ApiResponse<OperationDto.OperationResponse>> createOrSyncOperation(
            @RequestBody OperationDto.CreateOperationRequest request) {
        try {
            OperationDto.OperationResponse response = operationService.createOrSyncOperation(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OperationDto.OperationResponse>> getOperation(@PathVariable UUID id) {
        try {
            OperationDto.OperationResponse response = operationService.getOperation(id);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OperationDto.OperationResponse>>> getAllOperations() {
        return ResponseEntity.ok(ApiResponse.success(operationService.getAllOperations()));
    }
}
