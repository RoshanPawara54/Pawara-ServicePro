package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/owner/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody CustomerCreationRequest request) {
        Customer customer = Customer.builder()
                .name(request.getName())
                .customerType(request.getCustomerType())
                .contactPerson(request.getContactPerson())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .build();
        Customer savedCustomer = customerRepository.save(customer);

        String username = request.getName().toLowerCase().replaceAll("\\s+", "");
        
        int count = 1;
        String baseUsername = username;
        while (userRepository.findByUsername(username).isPresent()) {
            username = baseUsername + count++;
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode("123")) // default password is 123
                .role("CUSTOMER")
                .customer(savedCustomer)
                .build();
        userRepository.save(user);

        if (request.getContract() != null) {
            ContractRequest cr = request.getContract();
            Contract contract = Contract.builder()
                    .customer(savedCustomer)
                    .startDate(cr.getStartDate())
                    .endDate(cr.getEndDate())
                    .monthlyPaymentAmount(cr.getMonthlyPaymentAmount())
                    .monthlyPaymentDueDate(cr.getMonthlyPaymentDueDate())
                    .status("ACTIVE")
                    .build();
            contractRepository.save(contract);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("customer", savedCustomer);
        response.put("generatedUsername", username);
        response.put("generatedPassword", "123");

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody CustomerUpdateRequest request) {
        Optional<Customer> customerOpt = customerRepository.findById(id);
        if (customerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Customer customer = customerOpt.get();
        customer.setName(request.getName());
        customer.setCustomerType(request.getCustomerType());
        customer.setContactPerson(request.getContactPerson());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        Customer updatedCustomer = customerRepository.save(customer);

        if (request.getContract() != null) {
            ContractRequest cr = request.getContract();
            Optional<Contract> contractOpt = contractRepository.findByCustomerId(id);
            Contract contract;
            if (contractOpt.isPresent()) {
                contract = contractOpt.get();
                contract.setStartDate(cr.getStartDate());
                contract.setEndDate(cr.getEndDate());
                contract.setMonthlyPaymentAmount(cr.getMonthlyPaymentAmount());
                contract.setMonthlyPaymentDueDate(cr.getMonthlyPaymentDueDate());
                contract.setStatus(cr.getStatus() != null ? cr.getStatus() : "ACTIVE");
            } else {
                contract = Contract.builder()
                        .customer(updatedCustomer)
                        .startDate(cr.getStartDate())
                        .endDate(cr.getEndDate())
                        .monthlyPaymentAmount(cr.getMonthlyPaymentAmount())
                        .monthlyPaymentDueDate(cr.getMonthlyPaymentDueDate())
                        .status("ACTIVE")
                        .build();
            }
            contractRepository.save(contract);
        }

        return ResponseEntity.ok(updatedCustomer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        customerRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/contract")
    public ResponseEntity<Contract> getCustomerContract(@PathVariable Long id) {
        return contractRepository.findByCustomerId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/payments")
    public List<Payment> getCustomerPayments(@PathVariable Long id) {
        return paymentRepository.findByCustomerIdOrderByPaymentDateDesc(id);
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<?> addCustomerPayment(@PathVariable Long id, @RequestBody PaymentRequest request) {
        Optional<Customer> customerOpt = customerRepository.findById(id);
        if (customerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Payment payment = Payment.builder()
                .customer(customerOpt.get())
                .paymentType(request.getPaymentType())
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        return ResponseEntity.ok(savedPayment);
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password cannot be empty."));
        }

        Optional<User> userOpt = userRepository.findAll().stream()
                .filter(u -> u.getCustomer() != null && id.equals(u.getCustomer().getId()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Login account for this customer was not found."));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Customer password reset successfully."));
    }

    @GetMapping("/{id}/credentials")
    public ResponseEntity<?> getCustomerCredentials(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findAll().stream()
                .filter(u -> u.getCustomer() != null && id.equals(u.getCustomer().getId()))
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of("username", userOpt.get().getUsername()));
    }

    @Data
    public static class CustomerCreationRequest {
        private String name;
        private String customerType;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private ContractRequest contract;
    }

    @Data
    public static class CustomerUpdateRequest {
        private String name;
        private String customerType;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private ContractRequest contract;
    }

    @Data
    public static class ContractRequest {
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal monthlyPaymentAmount;
        private Integer monthlyPaymentDueDate;
        private String status;
    }

    @Data
    public static class PaymentRequest {
        private String paymentType; // "CONTRACT_PAYMENT", "MATERIAL_BILL_PAYMENT"
        private BigDecimal amount;
        private LocalDate paymentDate;
        private Long referenceId;
        private String notes;
    }
}
