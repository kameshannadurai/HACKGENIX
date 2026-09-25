package com.syncfield.entity;

import com.syncfield.enums.FileType;
import com.syncfield.enums.SyncState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evidence_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceFile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private EvidencePackage evidencePackage;

    @Column(name = "file_id", nullable = false, unique = true)
    private String fileId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false)
    private FileType fileType;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "file_hash", nullable = false)
    private String fileHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "upload_status", nullable = false)
    @Builder.Default
    private SyncState uploadStatus = SyncState.STORED_OFFLINE;

    @Column(name = "uploaded_bytes")
    @Builder.Default
    private Long uploadedBytes = 0L;

    @Column(name = "total_bytes", nullable = false)
    private Long totalBytes;

    @Column(name = "checkpoint")
    @Builder.Default
    private Integer checkpoint = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
