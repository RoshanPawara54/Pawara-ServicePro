package com.pawara.servicepro;

import com.pawara.servicepro.dto.ForgotPasswordRequest;
import com.pawara.servicepro.dto.ResetPasswordRequest;
import com.pawara.servicepro.dto.TokenValidationResponse;
import com.pawara.servicepro.model.Customer;
import com.pawara.servicepro.model.User;
import com.pawara.servicepro.repository.UserRepository;
import com.pawara.servicepro.service.EmailService;
import com.pawara.servicepro.service.PasswordResetService;
import com.pawara.servicepro.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    private PasswordEncoder passwordEncoder;
    private PasswordResetService passwordResetService;

    private User sampleUser;
    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        passwordResetService = new PasswordResetServiceImpl(
                userRepository,
                emailService,
                passwordEncoder,
                "http://localhost:5173"
        );

        sampleCustomer = Customer.builder()
                .id(10L)
                .name("Test Hospital")
                .email("test@hospital.com")
                .status("ACTIVE")
                .build();

        sampleUser = User.builder()
                .id(1L)
                .username("testhospital")
                .password(passwordEncoder.encode("OldSecurePassword123!"))
                .role("CUSTOMER")
                .customer(sampleCustomer)
                .build();
    }

    @Test
    @DisplayName("TEST 1: Existing email requests reset - generates token, stores hash only, dispatches email")
    void testForgotPassword_ExistingEmail_Success() {
        when(userRepository.findByEmailIgnoreCase("test@hospital.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        passwordResetService.processForgotPassword("test@hospital.com");

        // Verify User was saved with a 64-character SHA-256 hash and 1-hour expiry
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertNotNull(savedUser.getResetTokenHash());
        assertEquals(64, savedUser.getResetTokenHash().length(), "Token hash must be a 64-character SHA-256 hex string");
        assertNotNull(savedUser.getResetTokenExpiry());
        assertTrue(savedUser.getResetTokenExpiry().isAfter(LocalDateTime.now().plusMinutes(55)));

        // Verify email was dispatched
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetEmail(eq("test@hospital.com"), urlCaptor.capture());

        String resetUrl = urlCaptor.getValue();
        assertTrue(resetUrl.startsWith("http://localhost:5173/reset-password?token="));
        assertFalse(resetUrl.contains(savedUser.getResetTokenHash()), "The email URL must contain the raw token, NOT the hash");
    }

    @Test
    @DisplayName("TEST 2: Non-existing email requests reset - anti-enumeration, no error, no email sent")
    void testForgotPassword_NonExistingEmail_AntiEnumeration() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByCustomer_EmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        // Should complete without exception
        assertDoesNotThrow(() -> passwordResetService.processForgotPassword("nonexistent@example.com"));

        // No user saved, no email sent
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("TEST 3, 4, 5: Token validation with valid, expired, and random tokens")
    void testTokenValidation_Scenarios() {
        // Prepare a valid token and its SHA-256 hash
        when(userRepository.findByUsernameIgnoreCase("testhospital")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        passwordResetService.processForgotPassword("testhospital");

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(any(), urlCaptor.capture());
        String rawToken = urlCaptor.getValue().replace("http://localhost:5173/reset-password?token=", "");

        // Mock findByResetTokenHash for validation
        when(userRepository.findByResetTokenHash(sampleUser.getResetTokenHash())).thenReturn(Optional.of(sampleUser));

        // TEST 3: Valid unexpired token
        boolean isValid = passwordResetService.validateResetToken(rawToken);
        assertTrue(isValid, "Unexpired token must validate to true");

        // TEST 4: Expired token
        sampleUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(5));
        boolean isExpiredValid = passwordResetService.validateResetToken(rawToken);
        assertFalse(isExpiredValid, "Expired token must validate to false");

        // TEST 5: Random invalid token
        when(userRepository.findByResetTokenHash(any())).thenReturn(Optional.empty());
        boolean isRandomValid = passwordResetService.validateResetToken("completely_random_fake_token_1234567890");
        assertFalse(isRandomValid, "Unknown token must validate to false");
    }

    @Test
    @DisplayName("TEST 6, 7, 8, 9, 10: Reset password execution, validation, invalidation, and password match")
    void testResetPassword_Flow() {
        // Step 1: Initiate reset to get raw token
        when(userRepository.findByUsernameIgnoreCase("testhospital")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        passwordResetService.processForgotPassword("testhospital");

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(any(), urlCaptor.capture());
        String rawToken = urlCaptor.getValue().replace("http://localhost:5173/reset-password?token=", "");

        when(userRepository.findByResetTokenHash(sampleUser.getResetTokenHash())).thenReturn(Optional.of(sampleUser));

        // TEST 8: Weak password (< 8 chars) is rejected
        assertThrows(IllegalArgumentException.class, () -> {
            passwordResetService.resetPassword(rawToken, "short");
        }, "Passwords under 8 chars must be rejected");

        // TEST 6: Valid token + valid new password (>= 8 chars) succeeds
        String newRawPassword = "BrandNewSecurePassword2026!";
        assertDoesNotThrow(() -> {
            passwordResetService.resetPassword(rawToken, newRawPassword);
        });

        // Verify token was cleared permanently
        assertNull(sampleUser.getResetTokenHash(), "resetTokenHash must be set to null after reset");
        assertNull(sampleUser.getResetTokenExpiry(), "resetTokenExpiry must be set to null after reset");

        // TEST 10: New password can be verified with BCrypt
        assertTrue(passwordEncoder.matches(newRawPassword, sampleUser.getPassword()), "New password must match BCrypt hash");

        // TEST 9: Old password fails to match
        assertFalse(passwordEncoder.matches("OldSecurePassword123!", sampleUser.getPassword()), "Old password must no longer match");

        // TEST 7: Reusing the same token fails
        when(userRepository.findByResetTokenHash(any())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> {
            passwordResetService.resetPassword(rawToken, "AnotherNewPassword123!");
        }, "Reused token must be rejected");
    }
}
