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
    private final BillItemRepository billItemRepository;
    private final CustomerRepository customerRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final com.pawara.servicepro.service.ActivityLogService activityLogService;

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
            if (customer != null && !"ACTIVE".equals(customer.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cannot create bills for inactive or trashed customers."));
            }
        }

        MaintenanceRequest maintenanceRequest = null;
        if (request.getMaintenanceRequestId() != null) {
            maintenanceRequest = requestRepository.findById(request.getMaintenanceRequestId()).orElse(null);
        }

        BigDecimal aggregateCost = BigDecimal.ZERO;
        BigDecimal aggregateTotal = BigDecimal.ZERO;

        java.time.LocalDateTime createdAtVal = null;
        if (request.getCreatedAt() != null && !request.getCreatedAt().isEmpty()) {
            try {
                createdAtVal = java.time.LocalDate.parse(request.getCreatedAt()).atTime(java.time.LocalTime.now());
            } catch (Exception e) {
                // fallback
            }
        }

        List<BillItem> billItems = new ArrayList<>();
        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .billType(request.getBillType())
                .customerName(request.getCustomerName())
                .customerAddress(request.getCustomerAddress())
                .createdAt(createdAtVal)
                .customer(customer)
                .maintenanceRequest(maintenanceRequest)
                .labourCharge(request.getLabourCharge() != null ? request.getLabourCharge() : BigDecimal.ZERO)
                .status(request.getStatus())
                .businessName(request.getBusinessName())
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
            
            // Also log request completion
            activityLogService.logActivity("Maintenance Request Completed", maintenanceRequest.getCustomer().getName() + "'s maintainance request Completed");
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

        // Log bill creation
        String targetName = savedBill.getCustomer() != null ? savedBill.getCustomer().getName() : savedBill.getCustomerName();
        if ("SHOP_BILL".equals(savedBill.getBillType())) {
            activityLogService.logActivity("Bill Created", targetName + " Bill Created");
        } else if ("SHOP_QUOTATION".equals(savedBill.getBillType())) {
            activityLogService.logActivity("Quotation Created", targetName + " Quotation Created");
        } else if ("MAINTENANCE_MATERIAL_BILL".equals(savedBill.getBillType())) {
            activityLogService.logActivity("Material Bill Generated", targetName + " Material Bill Generated");
        }

        return ResponseEntity.ok(savedBill);
    }

    @PutMapping("/api/owner/bills/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> updateBill(@PathVariable Long id, @RequestBody BillCreationRequest request) {
        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        if ("PENDING_APPROVAL".equals(bill.getStatus())) {
            bill.setStatus("UNPAID");
        }
        bill.setCustomerName(request.getCustomerName());
        bill.setCustomerAddress(request.getCustomerAddress());
        bill.setLabourCharge(request.getLabourCharge() != null ? request.getLabourCharge() : BigDecimal.ZERO);
        bill.setBusinessName(request.getBusinessName());
        
        if (request.getCreatedAt() != null && !request.getCreatedAt().isEmpty()) {
            try {
                bill.setCreatedAt(java.time.LocalDate.parse(request.getCreatedAt()).atTime(java.time.LocalTime.now()));
            } catch (Exception e) {
                // ignore
            }
        }

        // Clear existing items and flush orphan removal first to prevent stale state exceptions
        bill.getItems().clear();
        billRepository.saveAndFlush(bill);

        BigDecimal aggregateCost = BigDecimal.ZERO;
        BigDecimal aggregateTotal = BigDecimal.ZERO;

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
                bill.getItems().add(item);
            }
        }

        bill.setMaterialCost(aggregateCost);
        bill.setTotalAmount(aggregateTotal.add(bill.getLabourCharge()));

        Bill updated = billRepository.save(bill);
        String targetName = updated.getCustomer() != null ? updated.getCustomer().getName() : updated.getCustomerName();
        activityLogService.logActivity("Bill Updated", targetName + " Bill Updated");
        return ResponseEntity.ok(updated);
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
        
        // Log conversion
        String convTargetName = updatedBill.getCustomer() != null ? updatedBill.getCustomer().getName() : updatedBill.getCustomerName();
        activityLogService.logActivity("Quotation Converted", convTargetName + " Quotation Converted to Bill");
        
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

        // Log activity
        String payTargetName = bill.getCustomer() != null ? bill.getCustomer().getName() : bill.getCustomerName();
        activityLogService.logActivity("Bill Paid", payTargetName + " Bill Marked as PAID");

        return ResponseEntity.ok(updatedBill);
    }

    @PutMapping("/api/owner/bills/{id}/unpay")
    public ResponseEntity<?> markBillAsPending(@PathVariable Long id) {
        Optional<Bill> billOpt = billRepository.findById(id);
        if (billOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Bill bill = billOpt.get();
        bill.setStatus("UNPAID");
        Bill updatedBill = billRepository.save(bill);

        // Delete associated payments if any
        if (bill.getCustomer() != null) {
            List<Payment> associatedPayments = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(bill.getCustomer().getId());
            for (Payment p : associatedPayments) {
                if (Objects.equals(p.getReferenceId(), bill.getId()) && "MATERIAL_BILL_PAYMENT".equals(p.getPaymentType())) {
                    paymentRepository.delete(p);
                }
            }
        }

        // Log activity
        String unpayTargetName = bill.getCustomer() != null ? bill.getCustomer().getName() : bill.getCustomerName();
        activityLogService.logActivity("Bill Marked Pending", unpayTargetName + " Bill Marked back to pending");

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

        bill.setStatus("PENDING_APPROVAL");
        Bill updatedBill = billRepository.save(bill);

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
        private String customerAddress;
        private String createdAt;
        private Long customerId;
        private Long maintenanceRequestId;
        private BigDecimal labourCharge;
        private String status;
        private String businessName;
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
