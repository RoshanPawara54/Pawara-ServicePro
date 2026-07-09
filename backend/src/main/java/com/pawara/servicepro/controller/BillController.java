package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequiredArgsConstructor
public class BillController {

    private final BillRepository billRepository;
    private final CustomerRepository customerRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    // --- Owner APIs ---

    @GetMapping("/api/owner/bills")
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    @GetMapping("/api/owner/bills/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/owner/bills")
    public ResponseEntity<?> createBill(@RequestBody BillCreationRequest request) {
        String prefix = "BIL";
        if ("SHOP_QUOTATION".equals(request.getBillType())) {
            prefix = "QUO";
        } else if ("MAINTENANCE_MATERIAL_BILL".equals(request.getBillType())) {
            prefix = "MB";
        }
        
        long count = billRepository.count() + 1000 + new Random().nextInt(9000);
        String billNumber = prefix + "-" + count;

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        }

        MaintenanceRequest maintenanceRequest = null;
        if (request.getMaintenanceRequestId() != null) {
            maintenanceRequest = requestRepository.findById(request.getMaintenanceRequestId()).orElse(null);
        }

        BigDecimal aggregateCost = BigDecimal.ZERO;
        BigDecimal aggregateTotal = BigDecimal.ZERO;

        List<BillItem> billItems = new ArrayList<>();
        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .billType(request.getBillType())
                .customerName(request.getCustomerName())
                .customer(customer)
                .maintenanceRequest(maintenanceRequest)
                .labourCharge(request.getLabourCharge() != null ? request.getLabourCharge() : BigDecimal.ZERO)
                .status(request.getStatus())
                .build();

        if (request.getItems() != null) {
            for (ItemRequest ir : request.getItems()) {
                BigDecimal totalItemPrice = ir.getUnitPrice().multiply(ir.getQuantity());
                
                BigDecimal itemCost = ir.getUnitCost() != null ? ir.getUnitCost() : BigDecimal.ZERO;
                BigDecimal totalItemCost = itemCost.multiply(ir.getQuantity());
                
                aggregateCost = aggregateCost.add(totalItemCost);
                aggregateTotal = aggregateTotal.add(totalItemPrice);

                BillItem item = BillItem.builder()
                        .bill(bill)
                        .itemName(ir.getItemName())
                        .quantity(ir.getQuantity())
                        .unitPrice(ir.getUnitPrice())
                        .unitCost(itemCost)
                        .totalPrice(totalItemPrice)
                        .build();
                billItems.add(item);
            }
        }

        bill.setItems(billItems);
        bill.setMaterialCost(aggregateCost);
        
        BigDecimal grandTotal = aggregateTotal.add(bill.getLabourCharge());
        bill.setTotalAmount(grandTotal);

        Bill savedBill = billRepository.save(bill);

        if (maintenanceRequest != null && "MAINTENANCE_MATERIAL_BILL".equals(request.getBillType())) {
            maintenanceRequest.setStatus("COMPLETED");
            requestRepository.save(maintenanceRequest);
        }

        if ("PAID".equals(savedBill.getStatus()) && customer != null) {
            String pType = "SHOP_BILL".equals(savedBill.getBillType()) ? "SHOP_BILL_PAYMENT" : "MATERIAL_BILL_PAYMENT";
            Payment payment = Payment.builder()
                    .customer(customer)
                    .paymentType(pType)
                    .amount(savedBill.getTotalAmount())
                    .paymentDate(LocalDate.now())
                    .referenceId(savedBill.getId())
                    .notes("Payment recorded during invoice creation: " + savedBill.getBillNumber())
                    .build();
            paymentRepository.save(payment);
        }

        return ResponseEntity.ok(savedBill);
    }

    @PutMapping("/api/owner/bills/{id}/convert")
    public ResponseEntity<?> convertQuotationToBill(@PathVariable Long id) {
        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        if (!"SHOP_QUOTATION".equals(bill.getBillType())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only quotations can be converted to bills"));
        }

        bill.setBillType("SHOP_BILL");
        bill.setStatus("BILL");
        bill.setBillNumber("BIL-" + bill.getBillNumber().split("-")[1]);
        
        Bill updatedBill = billRepository.save(bill);
        return ResponseEntity.ok(updatedBill);
    }

    @PutMapping("/api/owner/bills/{id}/pay")
    public ResponseEntity<?> markBillAsPaid(@PathVariable Long id) {
        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        bill.setStatus("PAID");
        Bill updatedBill = billRepository.save(bill);

        if (bill.getCustomer() != null) {
            Payment payment = Payment.builder()
                    .customer(bill.getCustomer())
                    .paymentType("MATERIAL_BILL_PAYMENT")
                    .amount(bill.getTotalAmount())
                    .paymentDate(LocalDate.now())
                    .referenceId(bill.getId())
                    .notes("Payment recorded for bill: " + bill.getBillNumber())
                    .build();
            paymentRepository.save(payment);
        }

        return ResponseEntity.ok(updatedBill);
    }

    @DeleteMapping("/api/owner/bills/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable Long id) {
        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        if (bill.getMaintenanceRequest() != null) {
            MaintenanceRequest request = bill.getMaintenanceRequest();
            request.setStatus("PENDING");
            requestRepository.save(request);
        }

        if (bill.getCustomer() != null) {
            List<Payment> associatedPayments = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(bill.getCustomer().getId());
            for (Payment p : associatedPayments) {
                if (Objects.equals(p.getReferenceId(), bill.getId()) && "MATERIAL_BILL_PAYMENT".equals(p.getPaymentType())) {
                    paymentRepository.delete(p);
                }
            }
        }

        billRepository.delete(bill);
        return ResponseEntity.ok(Map.of("message", "Bill deleted successfully"));
    }

    @PutMapping("/api/customer/bills/{id}/pay")
    public ResponseEntity<?> customerPayBill(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        if (!bill.getCustomer().getId().equals(userOpt.get().getCustomer().getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized to pay this bill"));
        }

        bill.setStatus("PAID");
        Bill updatedBill = billRepository.save(bill);

        Payment payment = Payment.builder()
                .customer(bill.getCustomer())
                .paymentType("MATERIAL_BILL_PAYMENT")
                .amount(bill.getTotalAmount())
                .paymentDate(LocalDate.now())
                .referenceId(bill.getId())
                .notes("Payment recorded by customer: " + bill.getBillNumber())
                .build();
        paymentRepository.save(payment);

        return ResponseEntity.ok(updatedBill);
    }

    // --- Customer APIs ---

    @GetMapping("/api/customer/bills")
    public ResponseEntity<?> getCustomerBills() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        List<Bill> bills = billRepository.findByCustomerIdOrderByCreatedAtDesc(
                userOpt.get().getCustomer().getId()
        );
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/api/customer/bills/{id}")
    public ResponseEntity<?> getCustomerBillById(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        if (!bill.getCustomer().getId().equals(userOpt.get().getCustomer().getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthorized to view this bill"));
        }

        return ResponseEntity.ok(bill);
    }

    @Data
    public static class BillCreationRequest {
        private String billType;
        private String customerName;
        private Long customerId;
        private Long maintenanceRequestId;
        private BigDecimal labourCharge;
        private String status;
        private List<ItemRequest> items;
    }

    @Data
    public static class ItemRequest {
        private String itemName;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal unitCost;
    }
}
