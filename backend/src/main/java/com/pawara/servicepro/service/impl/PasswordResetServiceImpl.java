package com.pawara.servicepro.service.impl;

import com.pawara.servicepro.model.User;
import com.pawara.servicepro.repository.UserRepository;
import com.pawara.servicepro.service.EmailService;
import com.pawara.servicepro.service.PasswordResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final int TOKEN_BYTE_LENGTH = 32; // 256 bits of entropy
    private static final int TOKEN_EXPIRY_HOURS = 1;
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final String frontendUrl;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            @Value("${pawara.app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Override
    @Transactional
    public void processForgotPassword(String emailOrUsername) {
        if (emailOrUsername == null || emailOrUsername.trim().isEmpty()) {
            return;
        }

        String input = emailOrUsername.trim();

        // 1. Look up user by email, username, or customer email using indexed queries
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(input);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsernameIgnoreCase(input);
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByCustomer_EmailIgnoreCase(input);
        }

        // 2. Anti-enumeration: if user is not found, return silently
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent identifier. Returning generic response.");
            return;
        }

        User user = userOpt.get();

        // Check if customer account is trashed
        if (user.getCustomer() != null && "TRASHED".equalsIgnoreCase(user.getCustomer().getStatus())) {
            log.warn("Password reset requested for trashed customer user: {}", user.getUsername());
            return;
        }

        // 3. Generate 256-bit cryptographically secure random token
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // 4. Hash the token with SHA-256 before persisting
        String tokenHash = hashToken(rawToken);
        user.setResetTokenHash(tokenHash);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));
        userRepository.save(user);

        // 5. Determine recipient email address
        String recipientEmail = null;
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            recipientEmail = user.getEmail().trim();
        } else if (user.getCustomer() != null && user.getCustomer().getEmail() != null && !user.getCustomer().getEmail().isBlank()) {
            recipientEmail = user.getCustomer().getEmail().trim();
        } else if (input.contains("@")) {
            recipientEmail = input;
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("User {} does not have an associated email address for password reset dispatch.", user.getUsername());
            return;
        }

        // 6. Build the secure frontend reset URL
        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;

        // 7. Dispatch the password reset email via EmailService
        emailService.sendPasswordResetEmail(recipientEmail, resetUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validateResetToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return false;
        }

        String tokenHash = hashToken(rawToken.trim());
        Optional<User> userOpt = userRepository.findByResetTokenHash(tokenHash);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        return user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isAfter(LocalDateTime.now());
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }

        if (newPassword == null || newPassword.trim().length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters long.");
        }

        String tokenHash = hashToken(rawToken.trim());
        Optional<User> userOpt = userRepository.findByResetTokenHash(tokenHash);

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired password reset link.");
        }

        // Encode new password and permanently invalidate reset token
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        user.setResetTokenHash(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        log.info("Password successfully reset for user: {}", user.getUsername());
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
