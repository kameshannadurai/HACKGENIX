package com.syncfield.service;

import com.syncfield.dto.EvidenceDto;
import com.syncfield.dto.OperationDto;
import com.syncfield.entity.*;
import com.syncfield.enums.SyncState;
import com.syncfield.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationService {

    private final OperationRepository operationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EvidencePackageRepository evidencePackageRepository;
    private final EvidenceFileRepository evidenceFileRepository;
    private final ConflictService conflictService;
    private final AuditService auditService;
    private final AuthService authService;

    @Transactional
    public OperationDto.OperationResponse createOrSyncOperation(OperationDto.CreateOperationRequest request) {
        // Idempotency check
        Optional<Operation> existingByIdempotency = operationRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existingByIdempotency.isPresent()) {
            log.info("Idempotent hit for key: {}", request.getIdempotencyKey());
            return mapToResponse(existingByIdempotency.get());
        }

        // Check if existing operation with same operation_id exists (Conflict Check)
        Optional<Operation> existingByOpId = operationRepository.findByOperationId(request.getOperationId());
        if (existingByOpId.isPresent()) {
            Operation serverOp = existingByOpId.get();
            int serverVersion = serverOp.getVersion() != null ? serverOp.getVersion() : 1;
            int clientVersion = request.getVersion() != null ? request.getVersion() : 1;

            if (clientVersion < serverVersion || !Objects.equals(serverOp.getInspectionData(), request.getInspectionData())) {
                log.warn("Conflict detected for Operation: {}", request.getOperationId());
                conflictService.createConflict(
                        serverOp,
                        clientVersion,
                        serverVersion,
                        "VERSION_OR_DATA_DIVERGENCE",
                        request.getInspectionData() != null ? request.getInspectionData() : "{}",
                        serverOp.getInspectionData() != null ? serverOp.getInspectionData() : "{}"
                );
                return mapToResponse(serverOp);
            }
        }

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.getJobId()));

        User worker = userRepository.findById(request.getWorkerId())
                .orElse(null);

        Operation operation = Operation.builder()
                .operationId(request.getOperationId())
                .job(job)
                .worker(worker)
                .idempotencyKey(request.getIdempotencyKey())
                .version(request.getVersion() != null ? request.getVersion() : 1)
                .status(SyncState.SYNCED)
                .deviceId(request.getDeviceId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .inspectionData(request.getInspectionData())
                .clientCreatedAt(request.getClientCreatedAt() != null ? request.getClientCreatedAt() : LocalDateTime.now())
                .build();

        Operation savedOp = operationRepository.save(operation);

        // Process Evidence Package if present
        if (request.getEvidencePackage() != null) {
            OperationDto.EvidencePackageRequest pkgReq = request.getEvidencePackage();
            EvidencePackage pkg = EvidencePackage.builder()
                    .operation(savedOp)
                    .packageId(pkgReq.getPackageId())
                    .packageHash(pkgReq.getPackageHash())
                    .status(SyncState.SYNCED)
                    .verifiedAt(LocalDateTime.now())
                    .build();

            EvidencePackage savedPkg = evidencePackageRepository.save(pkg);

            if (pkgReq.getFiles() != null) {
                for (OperationDto.EvidenceFileRequest fileReq : pkgReq.getFiles()) {
                    EvidenceFile file = EvidenceFile.builder()
                            .evidencePackage(savedPkg)
                            .fileId(fileReq.getFileId())
                            .fileName(fileReq.getFileName())
                            .fileType(fileReq.getFileType())
                            .mimeType(fileReq.getMimeType())
                            .fileSize(fileReq.getFileSize())
                            .fileHash(fileReq.getFileHash())
                            .uploadStatus(SyncState.VERIFIED)
                            .totalBytes(fileReq.getFileSize())
                            .uploadedBytes(fileReq.getFileSize())
                            .checkpoint(100)
                            .build();
                    evidenceFileRepository.save(file);
                }
            }
        }

        auditService.log(
                savedOp,
                worker,
                "OPERATION_SYNCED",
                "Operation " + savedOp.getOperationId() + " synchronized successfully with " + (request.getEvidencePackage() != null ? request.getEvidencePackage().getFiles().size() : 0) + " evidence items",
                "{\"operationId\":\"" + savedOp.getOperationId() + "\"}"
        );

        return mapToResponse(savedOp);
    }

    @Transactional(readOnly = true)
    public OperationDto.OperationResponse getOperation(UUID id) {
        Operation op = operationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operation not found: " + id));
        return mapToResponse(op);
    }

    @Transactional(readOnly = true)
    public List<OperationDto.OperationResponse> getAllOperations() {
        return operationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OperationDto.OperationResponse mapToResponse(Operation op) {
        Optional<EvidencePackage> pkgOpt = evidencePackageRepository.findByOperationId(op.getId());
        EvidenceDto.EvidencePackageResponse pkgResp = null;

        if (pkgOpt.isPresent()) {
            EvidencePackage pkg = pkgOpt.get();
            List<EvidenceDto.EvidenceFileResponse> files = pkg.getFiles() != null ? pkg.getFiles().stream()
                    .map(f -> EvidenceDto.EvidenceFileResponse.builder()
                            .id(f.getId())
                            .fileId(f.getFileId())
                            .fileName(f.getFileName())
                            .fileType(f.getFileType())
                            .mimeType(f.getMimeType())
                            .fileSize(f.getFileSize())
                            .storagePath(f.getStoragePath())
                            .fileHash(f.getFileHash())
                            .uploadStatus(f.getUploadStatus())
                            .uploadedBytes(f.getUploadedBytes())
                            .totalBytes(f.getTotalBytes())
                            .checkpoint(f.getCheckpoint())
                            .createdAt(f.getCreatedAt())
                            .build())
                    .collect(Collectors.toList()) : Collections.emptyList();

            pkgResp = EvidenceDto.EvidencePackageResponse.builder()
                    .id(pkg.getId())
                    .packageId(pkg.getPackageId())
                    .packageHash(pkg.getPackageHash())
                    .status(pkg.getStatus())
                    .createdAt(pkg.getCreatedAt())
                    .verifiedAt(pkg.getVerifiedAt())
                    .files(files)
                    .build();
        }

        return OperationDto.OperationResponse.builder()
                .id(op.getId())
                .operationId(op.getOperationId())
                .jobId(op.getJob() != null ? op.getJob().getId() : null)
                .jobTitle(op.getJob() != null ? op.getJob().getTitle() : "N/A")
                .assetName(op.getJob() != null ? op.getJob().getAssetName() : "N/A")
                .workerId(op.getWorker() != null ? op.getWorker().getId() : null)
                .workerName(op.getWorker() != null ? op.getWorker().getName() : "Unassigned")
                .idempotencyKey(op.getIdempotencyKey())
                .version(op.getVersion())
                .status(op.getStatus())
                .deviceId(op.getDeviceId())
                .latitude(op.getLatitude())
                .longitude(op.getLongitude())
                .inspectionData(op.getInspectionData())
                .clientCreatedAt(op.getClientCreatedAt())
                .serverCreatedAt(op.getServerCreatedAt())
                .evidencePackage(pkgResp)
                .build();
    }
}
