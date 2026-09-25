package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.ChunkUploadDto;
import com.syncfield.dto.EvidenceDto;
import com.syncfield.entity.EvidenceFile;
import com.syncfield.entity.EvidencePackage;
import com.syncfield.enums.SyncState;
import com.syncfield.repository.EvidenceFileRepository;
import com.syncfield.repository.EvidencePackageRepository;
import com.syncfield.service.StorageService;
import com.syncfield.service.VerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
@Slf4j
public class EvidenceController {

    private final StorageService storageService;
    private final VerificationService verificationService;
    private final EvidenceFileRepository evidenceFileRepository;
    private final EvidencePackageRepository evidencePackageRepository;

    @PostMapping("/init")
    public ResponseEntity<ApiResponse<ChunkUploadDto.InitUploadResponse>> initUpload(
            @RequestBody ChunkUploadDto.InitUploadRequest request) {
        Optional<EvidenceFile> fileOpt = evidenceFileRepository.findByFileId(request.getFileId());
        int checkpoint = 0;
        long uploaded = 0L;
        SyncState status = SyncState.UPLOADING;

        if (fileOpt.isPresent()) {
            EvidenceFile file = fileOpt.get();
            checkpoint = file.getCheckpoint() != null ? file.getCheckpoint() : 0;
            uploaded = file.getUploadedBytes() != null ? file.getUploadedBytes() : 0;
            status = file.getUploadStatus();
        }

        ChunkUploadDto.InitUploadResponse resp = ChunkUploadDto.InitUploadResponse.builder()
                .fileId(request.getFileId())
                .lastCheckpoint(checkpoint)
                .uploadedBytes(uploaded)
                .status(status)
                .build();

        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @PostMapping("/chunk")
    public ResponseEntity<ApiResponse<ChunkUploadDto.ChunkResponse>> uploadChunk(
            @RequestParam("fileId") String fileId,
            @RequestParam("fileName") String fileName,
            @RequestParam("chunkIndex") Integer chunkIndex,
            @RequestParam("totalChunks") Integer totalChunks,
            @RequestParam("totalBytes") Long totalBytes,
            @RequestParam("file") MultipartFile fileChunk) {
        try {
            byte[] bytes = fileChunk.getBytes();
            Path path = storageService.appendChunk(fileId, fileName, chunkIndex, bytes);
            long currentSize = storageService.getFileSize(fileId, fileName);

            boolean isComplete = chunkIndex >= (totalChunks - 1) || currentSize >= totalBytes;

            Optional<EvidenceFile> fileOpt = evidenceFileRepository.findByFileId(fileId);
            if (fileOpt.isPresent()) {
                EvidenceFile ef = fileOpt.get();
                ef.setCheckpoint(chunkIndex + 1);
                ef.setUploadedBytes(currentSize);
                ef.setUploadStatus(isComplete ? SyncState.UPLOADED : SyncState.UPLOADING);
                evidenceFileRepository.save(ef);
            }

            ChunkUploadDto.ChunkResponse response = ChunkUploadDto.ChunkResponse.builder()
                    .fileId(fileId)
                    .chunkIndex(chunkIndex)
                    .uploadedBytes(currentSize)
                    .totalBytes(totalBytes)
                    .isComplete(isComplete)
                    .status(isComplete ? SyncState.UPLOADED : SyncState.UPLOADING)
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IOException e) {
            log.error("Failed to append chunk", e);
            return ResponseEntity.badRequest().body(ApiResponse.failure("Failed to save chunk: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<ChunkUploadDto.VerifyFileResponse>> verifyFile(
            @RequestBody ChunkUploadDto.VerifyFileRequest request) {
        try {
            ChunkUploadDto.VerifyFileResponse response = verificationService.verifyFileIntegrity(
                    request.getFileId(), request.getExpectedHash());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvidenceFile>> getEvidenceFile(@PathVariable UUID id) {
        return evidenceFileRepository.findById(id)
                .map(f -> ResponseEntity.ok(ApiResponse.success(f)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/package/{packageId}")
    public ResponseEntity<ApiResponse<EvidencePackage>> getEvidencePackage(@PathVariable String packageId) {
        return evidencePackageRepository.findByPackageId(packageId)
                .map(p -> ResponseEntity.ok(ApiResponse.success(p)))
                .orElse(ResponseEntity.notFound().build());
    }
}
