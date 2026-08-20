package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class CustomerPortalController {

    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Get the logged-in customer's active contract.
     */
    @GetMapping("/api/customer/contract")
    public ResponseEntity<?> getMyContract() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        Long customerId = userOpt.get().getCustomer().getId();
        Optional<Contract> contractOpt = contractRepository.findByCustomerId(customerId);

        if (contractOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(contractOpt.get());
    }

    /**
     * Get the logged-in customer's payment history.
     */
    @GetMapping("/api/customer/payments")
    public ResponseEntity<?> getMyPayments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        Long customerId = userOpt.get().getCustomer().getId();
        List<Payment> payments = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customerId);

        return ResponseEntity.ok(payments);
    }

    /**
     * Get the logged-in customer's profile details.
     */
    @GetMapping("/api/customer/profile")
    public ResponseEntity<?> getMyProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        return ResponseEntity.ok(userOpt.get().getCustomer());
    }
}
