package com.syncfield.entity;

import com.syncfield.enums.SyncState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "evidence_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidencePackage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id", nullable = false, unique = true)
    private Operation operation;

    @Column(name = "package_id", nullable = false, unique = true)
    private String packageId;

    @Column(name = "package_hash", nullable = false)
    private String packageHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SyncState status = SyncState.STORED_OFFLINE;

    @OneToMany(mappedBy = "evidencePackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EvidenceFile> files = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
}
