package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final MaintenanceRequestRepository requestRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<?> getDashboardStats() {
        List<MaintenanceRequest> pendingRequests = requestRepository.findByStatusOrderByCreatedAtDesc("PENDING");

        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        List<Contract> activeContracts = contractRepository.findAll().stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .collect(Collectors.toList());

        List<PaymentReminder> reminders = new ArrayList<>();

        for (Contract contract : activeContracts) {
            Customer customer = contract.getCustomer();
            
            List<Payment> customerPayments = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(customer.getId());
            boolean paidThisMonth = customerPayments.stream()
                    .filter(p -> "CONTRACT_PAYMENT".equalsIgnoreCase(p.getPaymentType()))
                    .anyMatch(p -> p.getPaymentDate().getMonthValue() == currentMonth && p.getPaymentDate().getYear() == currentYear);

            if (!paidThisMonth) {
                int dueDay = contract.getMonthlyPaymentDueDate();
                LocalDate dueDate;
                try {
                    dueDate = LocalDate.of(currentYear, currentMonth, Math.min(dueDay, today.lengthOfMonth()));
                } catch (Exception e) {
                    dueDate = LocalDate.of(currentYear, currentMonth, today.lengthOfMonth());
                }
                boolean isOverdue = today.isAfter(dueDate);

                reminders.add(PaymentReminder.builder()
                        .customerId(customer.getId())
                        .customerName(customer.getName())
                        .customerType(customer.getCustomerType())
                        .amount(contract.getMonthlyPaymentAmount())
                        .dueDate(dueDate)
                        .dueDay(dueDay)
                        .isOverdue(isOverdue)
                        .build());
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingRequestsCount", pendingRequests.size());
        stats.put("pendingRequests", pendingRequests);
        stats.put("paymentReminders", reminders);
        stats.put("totalActiveContracts", activeContracts.size());

        return ResponseEntity.ok(stats);
    }

    @Data
    @Builder
    public static class PaymentReminder {
        private Long customerId;
        private String customerName;
        private String customerType;
        private BigDecimal amount;
        private LocalDate dueDate;
        private int dueDay;
        private boolean isOverdue;
    }
}
