package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.User;
import com.pawara.servicepro.repository.UserRepository;
import com.pawara.servicepro.security.JwtTokenProvider;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password"));
        }

        User user = userOpt.get();
        String token = tokenProvider.generateToken(user.getUsername(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        if (user.getCustomer() != null) {
            response.put("customerId", user.getCustomer().getId());
            response.put("customerName", user.getCustomer().getName());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String usernameOrEmail = body.get("email"); // Front-end will pass the username/email here
        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);

        // Fallback check: look up by customer email if user is a customer
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getCustomer() != null && usernameOrEmail.equalsIgnoreCase(u.getCustomer().getEmail()))
                    .findFirst();
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User with this email/username was not found."));
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1)); // 1 hour expiry
        userRepository.save(user);

        // Log the reset token/link to console (simulating SMTP email send)
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        System.out.println("==================================================");
        System.out.println("PASSWORD RESET REQUEST");
        System.out.println("User: " + user.getUsername());
        System.out.println("Reset URL: " + resetUrl);
        System.out.println("==================================================");

        return ResponseEntity.ok(Map.of(
            "message", "Reset link generated. In development, check the Spring Boot application console for the reset link!",
            "token", token
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByResetToken(request.getToken());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid reset token."));
        }

        User user = userOpt.get();
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token has expired."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login."));
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;
    }
}
