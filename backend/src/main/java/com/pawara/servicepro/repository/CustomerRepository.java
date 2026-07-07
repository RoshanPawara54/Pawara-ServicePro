package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}
