package com.syncfield.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "conflicts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conflict {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @Column(name = "local_version", nullable = false)
    private Integer localVersion;

    @Column(name = "server_version", nullable = false)
    private Integer serverVersion;

    @Column(name = "conflict_type", nullable = false)
    private String conflictType;

    @Column(name = "local_data", columnDefinition = "TEXT", nullable = false)
    private String localData;

    @Column(name = "server_data", columnDefinition = "TEXT", nullable = false)
    private String serverData;

    @Column(name = "resolution")
    private String resolution; // KEEP_LOCAL, KEEP_SERVER, MERGED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(nullable = false)
    @Builder.Default
    private String status = "UNRESOLVED"; // UNRESOLVED, RESOLVED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
