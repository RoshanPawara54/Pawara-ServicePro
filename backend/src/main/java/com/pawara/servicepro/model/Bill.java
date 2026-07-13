package com.pawara.servicepro.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_number", nullable = false, unique = true)
    private String billNumber;

    @Column(name = "bill_type", nullable = false)
    private String billType; // "SHOP_QUOTATION", "SHOP_BILL", "MAINTENANCE_MATERIAL_BILL"

    @Column(name = "customer_name")
    private String customerName; // Text for walk-in shop customers

    @Column(name = "customer_address")
    private String customerAddress;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = true)
    private Customer customer; // Links to customers for Maintenance customers

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "maintenance_request_id", nullable = true, unique = true)
    private MaintenanceRequest maintenanceRequest;

    @Column(name = "labour_charge")
    private BigDecimal labourCharge;

    @Column(name = "material_cost")
    private BigDecimal materialCost; // Sum of cost price of all items

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount; // Total selling price (items + labour)

    @Column(name = "business_name")
    private String businessName;

    @Column(nullable = false)
    private String status; // "QUOTATION", "BILL", "UNPAID", "PAID"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<BillItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
