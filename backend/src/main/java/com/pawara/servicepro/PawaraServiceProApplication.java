package com.pawara.servicepro;

import com.pawara.servicepro.model.*;
import com.pawara.servicepro.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

@SpringBootApplication
public class PawaraServiceProApplication {

	@Value("${pawara.admin.seed-password}")
	private String adminSeedPassword;

	public static void main(String[] args) {
		SpringApplication.run(PawaraServiceProApplication.class, args);
	}

	@Bean
	public CommandLineRunner demo(
			UserRepository userRepository,
			CustomerRepository customerRepository,
			ContractRepository contractRepository,
			MaintenanceRequestRepository requestRepository,
			BillRepository billRepository,
			PaymentRepository paymentRepository,
			PasswordEncoder passwordEncoder) {
		return (args) -> {
			// 1. Seed Owner account on first startup
			Optional<User> adminOpt = userRepository.findByUsername("admin");
			if (adminOpt.isEmpty()) {
				User owner = User.builder()
						.username("admin")
						.password(passwordEncoder.encode(adminSeedPassword))
						.role("OWNER")
						.build();
				userRepository.save(owner);
				System.out.println("Seeded owner account: admin");
			}

			// 2. Seed Customer Data if empty
			if (customerRepository.count() == 0) {
				// Customers
				Customer tirupati = Customer.builder()
						.name("Tirupati Hospital")
						.customerType("Hospital")
						.contactPerson("Dr. A. K. Sharma")
						.phone("+91 98765 43210")
						.email("contact@tirupati.org")
						.address("12, Medical Road, Sector 4, City Centre")
						.build();
				tirupati = customerRepository.save(tirupati);

				Customer sai = Customer.builder()
						.name("Sai Hospital")
						.customerType("Hospital")
						.contactPerson("Dr. Mrs. Patil")
						.phone("+91 99988 87776")
						.email("admin@saihospital.com")
						.address("45, Main Avenue, Near Bus Stand")
						.build();
				sai = customerRepository.save(sai);

				Customer abc = Customer.builder()
						.name("ABC Hospital")
						.customerType("Hospital")
						.contactPerson("Mr. Rajesh Kumar")
						.phone("+91 91234 56789")
						.email("info@abchospital.in")
						.address("88, Ring Road, Industrial Area Phase II")
						.build();
				abc = customerRepository.save(abc);

				// User accounts for customers (username matches lowercase stripped name, password is 123)
				userRepository.save(User.builder()
						.username("tirupatihospital")
						.email("contact@tirupati.org")
						.password(passwordEncoder.encode("123"))
						.role("CUSTOMER")
						.customer(tirupati)
						.build());
				userRepository.save(User.builder()
						.username("saihospital")
						.email("admin@saihospital.com")
						.password(passwordEncoder.encode("123"))
						.role("CUSTOMER")
						.customer(sai)
						.build());
				userRepository.save(User.builder()
						.username("abchospital")
						.email("info@abchospital.in")
						.password(passwordEncoder.encode("123"))
						.role("CUSTOMER")
						.customer(abc)
						.build());

				// Contracts
				LocalDate lastMonth = LocalDate.now().minusMonths(1);
				Contract cTirupati = Contract.builder()
						.customer(tirupati)
						.startDate(lastMonth)
						.endDate(LocalDate.now().plusYears(1))
						.monthlyPaymentAmount(new BigDecimal("5000.00"))
						.monthlyPaymentDueDate(5) // Due on the 5th
						.status("ACTIVE")
						.build();
				contractRepository.save(cTirupati);

				Contract cSai = Contract.builder()
						.customer(sai)
						.startDate(lastMonth)
						.endDate(LocalDate.now().plusYears(1))
						.monthlyPaymentAmount(new BigDecimal("3500.00"))
						.monthlyPaymentDueDate(10) // Due on the 10th
						.status("ACTIVE")
						.build();
				contractRepository.save(cSai);

				Contract cAbc = Contract.builder()
						.customer(abc)
						.startDate(lastMonth)
						.endDate(LocalDate.now().plusYears(1))
						.monthlyPaymentAmount(new BigDecimal("6000.00"))
						.monthlyPaymentDueDate(25) // Due on the 25th
						.status("ACTIVE")
						.build();
				contractRepository.save(cAbc);

				// Payments
				// Tirupati paid last month and this month
				paymentRepository.save(Payment.builder()
						.customer(tirupati)
						.paymentType("CONTRACT_PAYMENT")
						.amount(new BigDecimal("5000.00"))
						.paymentDate(LocalDate.now().minusMonths(1).withDayOfMonth(5))
						.notes("June Contract Payment")
						.build());
				paymentRepository.save(Payment.builder()
						.customer(tirupati)
						.paymentType("CONTRACT_PAYMENT")
						.amount(new BigDecimal("5000.00"))
						.paymentDate(LocalDate.now().withDayOfMonth(4))
						.notes("July Contract Payment")
						.build());

				// Sai Hospital paid only last month (unpaid for current month!)
				paymentRepository.save(Payment.builder()
						.customer(sai)
						.paymentType("CONTRACT_PAYMENT")
						.amount(new BigDecimal("3500.00"))
						.paymentDate(LocalDate.now().minusMonths(1).withDayOfMonth(8))
						.notes("June Contract Payment")
						.build());

				// ABC Hospital paid only last month (unpaid for current month!)
				paymentRepository.save(Payment.builder()
						.customer(abc)
						.paymentType("CONTRACT_PAYMENT")
						.amount(new BigDecimal("6000.00"))
						.paymentDate(LocalDate.now().minusMonths(1).withDayOfMonth(24))
						.notes("June Contract Payment")
						.build());

				// Maintenance Requests
				MaintenanceRequest rTirupati = MaintenanceRequest.builder()
						.customer(tirupati)
						.description("Replace burnt out switches in general ward.")
						.status("COMPLETED")
						.build();
				rTirupati = requestRepository.save(rTirupati);

				MaintenanceRequest rSai = MaintenanceRequest.builder()
						.customer(sai)
						.description("Hall light not working. Seems like a ballast issue.")
						.status("PENDING")
						.build();
				requestRepository.save(rSai);

				MaintenanceRequest rAbc = MaintenanceRequest.builder()
						.customer(abc)
						.description("Check distribution board in basement. Power fluctuates frequently.")
						.status("PENDING")
						.build();
				requestRepository.save(rAbc);

				// Bills
				// 1. Material bill for completed Tirupati work
				Bill bTirupati = Bill.builder()
						.billNumber("MB-1001")
						.billType("MAINTENANCE_MATERIAL_BILL")
						.customer(tirupati)
						.maintenanceRequest(rTirupati)
						.labourCharge(new BigDecimal("250.00"))
						.materialCost(new BigDecimal("120.00"))
						.totalAmount(new BigDecimal("550.00"))
						.status("PAID")
						.build();
				
				BillItem item1 = BillItem.builder()
						.bill(bTirupati)
						.itemName("Heavy Duty Switch x2")
						.quantity(new BigDecimal("2.00"))
						.unitPrice(new BigDecimal("150.00"))
						.unitCost(new BigDecimal("60.00"))
						.totalPrice(new BigDecimal("300.00"))
						.build();
				bTirupati.setItems(Arrays.asList(item1));
				bTirupati = billRepository.save(bTirupati);

				paymentRepository.save(Payment.builder()
						.customer(tirupati)
						.paymentType("MATERIAL_BILL_PAYMENT")
						.amount(new BigDecimal("550.00"))
						.paymentDate(LocalDate.now())
						.referenceId(bTirupati.getId())
						.notes("Material bill MB-1001 payment")
						.build());

				// 2. Walk-in shop bill
				Bill bShop = Bill.builder()
						.billNumber("BIL-1002")
						.billType("SHOP_BILL")
						.customerName("Vijay Sharma")
						.labourCharge(BigDecimal.ZERO)
						.materialCost(new BigDecimal("250.00"))
						.totalAmount(new BigDecimal("450.00"))
						.status("BILL")
						.build();

				BillItem shopItem = BillItem.builder()
						.bill(bShop)
						.itemName("LED Tube Light x1")
						.quantity(new BigDecimal("1.00"))
						.unitPrice(new BigDecimal("250.00"))
						.unitCost(new BigDecimal("150.00"))
						.totalPrice(new BigDecimal("250.00"))
						.build();

				BillItem shopItem2 = BillItem.builder()
						.bill(bShop)
						.itemName("Electrical Tape Roll x2")
						.quantity(new BigDecimal("2.00"))
						.unitPrice(new BigDecimal("100.00"))
						.unitCost(new BigDecimal("50.00"))
						.totalPrice(new BigDecimal("200.00"))
						.build();

				bShop.setItems(Arrays.asList(shopItem, shopItem2));
				billRepository.save(bShop);

				// 3. Shop Quotation
				Bill bQuotation = Bill.builder()
						.billNumber("QUO-1003")
						.billType("SHOP_QUOTATION")
						.customerName("Sunil Patel")
						.labourCharge(new BigDecimal("500.00"))
						.materialCost(new BigDecimal("1500.00"))
						.totalAmount(new BigDecimal("3000.00"))
						.status("QUOTATION")
						.build();

				BillItem quoItem = BillItem.builder()
						.bill(bQuotation)
						.itemName("Ceiling Fan 1200mm")
						.quantity(new BigDecimal("1.00"))
						.unitPrice(new BigDecimal("2500.00"))
						.unitCost(new BigDecimal("1500.00"))
						.totalPrice(new BigDecimal("2500.00"))
						.build();
				bQuotation.setItems(Arrays.asList(quoItem));
				billRepository.save(bQuotation);

				System.out.println("Seeded initial mock database objects");
			}
		};
	}
}
