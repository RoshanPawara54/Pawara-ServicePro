package com.pawara.servicepro.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private Bill bill;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice; // Selling price

    @Column(name = "unit_cost")
    private BigDecimal unitCost; // Cost price (for profit calculations)

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice; // quantity * unitPrice
}
