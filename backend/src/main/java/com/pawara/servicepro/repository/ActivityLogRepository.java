package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop5ByOrderByCreatedAtDesc();
    List<ActivityLog> findAllByOrderByCreatedAtDesc();
}
