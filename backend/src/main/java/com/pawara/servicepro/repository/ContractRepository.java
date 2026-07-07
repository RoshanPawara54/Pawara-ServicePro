package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    Optional<Contract> findByCustomerId(Long customerId);
}
