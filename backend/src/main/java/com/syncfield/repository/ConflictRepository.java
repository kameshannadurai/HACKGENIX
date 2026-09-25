package com.syncfield.repository;

import com.syncfield.entity.Conflict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConflictRepository extends JpaRepository<Conflict, UUID> {
    List<Conflict> findByStatus(String status);
    List<Conflict> findByOperationId(UUID operationId);
}
