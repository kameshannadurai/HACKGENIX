package com.syncfield.repository;

import com.syncfield.entity.EvidenceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvidenceFileRepository extends JpaRepository<EvidenceFile, UUID> {
    Optional<EvidenceFile> findByFileId(String fileId);
    List<EvidenceFile> findByEvidencePackageId(UUID packageId);
}
