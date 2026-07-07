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
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/owner/revenue")
@RequiredArgsConstructor
public class RevenueController {

    private final BillRepository billRepository;
    private final PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<?> getRevenueReport() {
        List<Bill> bills = billRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        BigDecimal totalShopRevenue = bills.stream()
                .filter(b -> "SHOP_BILL".equalsIgnoreCase(b.getBillType()))
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMaterialBillRevenue = bills.stream()
                .filter(b -> "MAINTENANCE_MATERIAL_BILL".equalsIgnoreCase(b.getBillType()))
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalContractRevenue = payments.stream()
                .filter(p -> "CONTRACT_PAYMENT".equalsIgnoreCase(p.getPaymentType()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRevenue = totalShopRevenue.add(totalMaterialBillRevenue).add(totalContractRevenue);

        BigDecimal totalMaterialCost = bills.stream()
                .filter(b -> "SHOP_BILL".equalsIgnoreCase(b.getBillType()) || "MAINTENANCE_MATERIAL_BILL".equalsIgnoreCase(b.getBillType()))
                .map(b -> b.getMaterialCost() != null ? b.getMaterialCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(totalMaterialCost);

        Map<String, MonthlyData> monthlyMap = new TreeMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        LocalDate now = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            String monthKey = now.minusMonths(i).format(monthFormatter);
            monthlyMap.put(monthKey, new MonthlyData(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        }

        for (Bill bill : bills) {
            if ("SHOP_QUOTATION".equalsIgnoreCase(bill.getBillType())) continue;
            String monthKey = bill.getCreatedAt().format(monthFormatter);
            if (monthlyMap.containsKey(monthKey)) {
                MonthlyData data = monthlyMap.get(monthKey);
                data.revenue = data.revenue.add(bill.getTotalAmount());
                data.cost = data.cost.add(bill.getMaterialCost() != null ? bill.getMaterialCost() : BigDecimal.ZERO);
                data.profit = data.revenue.subtract(data.cost);
            }
        }

        for (Payment payment : payments) {
            if (!"CONTRACT_PAYMENT".equalsIgnoreCase(payment.getPaymentType())) continue;
            String monthKey = payment.getPaymentDate().format(monthFormatter);
            if (monthlyMap.containsKey(monthKey)) {
                MonthlyData data = monthlyMap.get(monthKey);
                data.revenue = data.revenue.add(payment.getAmount());
                data.profit = data.revenue.subtract(data.cost);
            }
        }

        List<Map<String, Object>> chartData = new ArrayList<>();
        for (Map.Entry<String, MonthlyData> entry : monthlyMap.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("month", entry.getKey());
            item.put("revenue", entry.getValue().revenue);
            item.put("cost", entry.getValue().cost);
            item.put("profit", entry.getValue().profit);
            chartData.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("totalMaterialCost", totalMaterialCost);
        response.put("grossProfit", grossProfit);
        response.put("totalShopRevenue", totalShopRevenue);
        response.put("totalMaterialBillRevenue", totalMaterialBillRevenue);
        response.put("totalContractRevenue", totalContractRevenue);
        response.put("monthlyBreakdown", chartData);

        return ResponseEntity.ok(response);
    }

    public static class MonthlyData {
        public BigDecimal revenue;
        public BigDecimal cost;
        public BigDecimal profit;

        public MonthlyData(BigDecimal revenue, BigDecimal cost, BigDecimal profit) {
            this.revenue = revenue;
            this.cost = cost;
            this.profit = profit;
        }
    }
}
