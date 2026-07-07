package com.pawara.servicepro.repository;

import com.pawara.servicepro.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
}
