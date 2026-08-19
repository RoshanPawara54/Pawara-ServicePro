package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.MaintenanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findAllByOrderByCreatedAtDesc();
    List<MaintenanceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<MaintenanceRequest> findByStatusOrderByCreatedAtDesc(String status);
}
