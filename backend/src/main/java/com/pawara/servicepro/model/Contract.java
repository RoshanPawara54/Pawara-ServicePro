package com.pawara.servicepro.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contracts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "monthly_payment_amount", nullable = false)
    private BigDecimal monthlyPaymentAmount;

    @Column(name = "monthly_payment_due_date", nullable = false)
    private Integer monthlyPaymentDueDate; // Day of month (1 to 31)

    @Column(nullable = false)
    private String status; // "ACTIVE", "INACTIVE", "EXPIRED"
}
