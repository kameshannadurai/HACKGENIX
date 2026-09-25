package com.syncfield.repository;

import com.syncfield.entity.EvidencePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvidencePackageRepository extends JpaRepository<EvidencePackage, UUID> {
    Optional<EvidencePackage> findByPackageId(String packageId);
    Optional<EvidencePackage> findByOperationId(UUID operationId);
}
