package com.syncfield.service;

import com.syncfield.dto.ChunkUploadDto;
import com.syncfield.entity.EvidenceFile;
import com.syncfield.enums.SyncState;
import com.syncfield.repository.EvidenceFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final StorageService storageService;
    private final EvidenceFileRepository evidenceFileRepository;
    private final AuditService auditService;

    @Transactional
    public ChunkUploadDto.VerifyFileResponse verifyFileIntegrity(String fileId, String expectedHash) {
        EvidenceFile evidenceFile = evidenceFileRepository.findByFileId(fileId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence file not found: " + fileId));

        Path filePath = storageService.getFilePath(fileId, evidenceFile.getFileName());

        try {
            String calculatedHash = storageService.computeFileHash(filePath);
            boolean isMatch = calculatedHash.equalsIgnoreCase(expectedHash);

            if (isMatch) {
                evidenceFile.setUploadStatus(SyncState.VERIFIED);
                evidenceFile.setFileHash(calculatedHash);
                evidenceFile.setStoragePath(filePath.toString());
                evidenceFileRepository.save(evidenceFile);

                auditService.log(
                        evidenceFile.getEvidencePackage().getOperation(),
                        null,
                        "INTEGRITY_VERIFIED",
                        "SHA-256 Verified for " + evidenceFile.getFileName() + " (" + calculatedHash.substring(0, 8) + "...)",
                        "{\"fileId\":\"" + fileId + "\",\"hash\":\"" + calculatedHash + "\"}"
                );

                return ChunkUploadDto.VerifyFileResponse.builder()
                        .fileId(fileId)
                        .calculatedHash(calculatedHash)
                        .expectedHash(expectedHash)
                        .isMatch(true)
                        .status(SyncState.VERIFIED)
                        .build();
            } else {
                evidenceFile.setUploadStatus(SyncState.CORRUPTED);
                evidenceFileRepository.save(evidenceFile);

                auditService.log(
                        evidenceFile.getEvidencePackage().getOperation(),
                        null,
                        "INTEGRITY_CORRUPTED",
                        "Hash mismatch for " + evidenceFile.getFileName() + ". Expected: " + expectedHash + " but got: " + calculatedHash,
                        "{\"fileId\":\"" + fileId + "\",\"expected\":\"" + expectedHash + "\",\"calculated\":\"" + calculatedHash + "\"}"
                );

                return ChunkUploadDto.VerifyFileResponse.builder()
                        .fileId(fileId)
                        .calculatedHash(calculatedHash)
                        .expectedHash(expectedHash)
                        .isMatch(false)
                        .status(SyncState.CORRUPTED)
                        .build();
            }
        } catch (IOException e) {
            log.error("Error reading file for verification", e);
            return ChunkUploadDto.VerifyFileResponse.builder()
                    .fileId(fileId)
                    .calculatedHash("ERROR")
                    .expectedHash(expectedHash)
                    .isMatch(false)
                    .status(SyncState.FAILED)
                    .build();
        }
    }
}
