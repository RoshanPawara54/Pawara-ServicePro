package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findAllByOrderByCreatedAtDesc();
    List<Bill> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<Bill> findByMaintenanceRequestId(Long maintenanceRequestId);
    List<Bill> findByBillTypeOrderByCreatedAtDesc(String billType);
    Optional<Bill> findTopByOrderByCreatedAtDesc();
}
