package com.pawara.servicepro.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "customer_type", nullable = false)
    private String customerType; // e.g. "Hospital", "School", "Factory", "Hotel"

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;
    private String email;
    private String address;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, TRASHED

    @Column(name = "trashed_at")
    private LocalDateTime trashedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "ACTIVE";
        }
    }

    // Safe getter for old rows that may have null status
    public String getStatus() {
        return status != null ? status : "ACTIVE";
    }
}
