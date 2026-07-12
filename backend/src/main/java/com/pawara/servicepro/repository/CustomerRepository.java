package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE c.status IS NULL OR c.status <> 'TRASHED'")
    List<Customer> findNonTrashedCustomers();

    @Query("SELECT c FROM Customer c WHERE c.status = 'TRASHED' ORDER BY c.trashedAt DESC")
    List<Customer> findTrashedCustomers();
}
