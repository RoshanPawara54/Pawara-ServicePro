package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import com.pawara.servicepro.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
public class RequestController {

    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.pawara.servicepro.service.ActivityLogService activityLogService;

    // --- Customer APIs ---

    @GetMapping("/api/customer/requests")
    public ResponseEntity<?> getCustomerRequests() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        List<MaintenanceRequest> requests = requestRepository.findByCustomerIdOrderByCreatedAtDesc(
                userOpt.get().getCustomer().getId()
        );
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/api/customer/requests")
    public ResponseEntity<?> submitRequest(@RequestBody RequestCreationRequest requestBody) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty() || userOpt.get().getCustomer() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer account not found"));
        }

        Customer customer = userOpt.get().getCustomer();

        // Reject requests from inactive or trashed customers
        if (!"ACTIVE".equals(customer.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Your account is Inactive. Please Contact Prashansha Electrical Services."));
        }

        MaintenanceRequest request = MaintenanceRequest.builder()
                .customer(customer)
                .description(requestBody.getDescription())
                .status("PENDING")
                .build();

        MaintenanceRequest savedRequest = requestRepository.save(request);

        // Notify Owner in real-time via SSE
        Map<String, Object> notificationPayload = new HashMap<>();
        notificationPayload.put("requestId", savedRequest.getId());
        notificationPayload.put("customerName", customer.getName());
        notificationPayload.put("customerType", customer.getCustomerType());
        notificationPayload.put("description", savedRequest.getDescription());
        notificationPayload.put("createdAt", savedRequest.getCreatedAt().toString());

        notificationService.notifyOwner("NEW_REQUEST", notificationPayload);

        return ResponseEntity.ok(savedRequest);
    }

    // --- Owner APIs ---

    @GetMapping("/api/owner/requests")
    public List<MaintenanceRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    @PutMapping("/api/owner/requests/{id}/status")
    public ResponseEntity<?> updateRequestStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<MaintenanceRequest> requestOpt = requestRepository.findById(id);
        if (requestOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("PENDING") && !newStatus.equals("COMPLETED"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value. Use PENDING or COMPLETED"));
        }

        MaintenanceRequest request = requestOpt.get();
        String oldStatus = request.getStatus();
        request.setStatus(newStatus);
        MaintenanceRequest updatedRequest = requestRepository.save(request);

        // Log completion if state transitioned to COMPLETED
        if ("COMPLETED".equals(newStatus) && !"COMPLETED".equals(oldStatus)) {
            activityLogService.logActivity("Maintenance Request Completed", request.getCustomer().getName() + "'s maintainance request Completed");
        }

        return ResponseEntity.ok(updatedRequest);
    }

    @Data
    public static class RequestCreationRequest {
        private String description;
    }
}
