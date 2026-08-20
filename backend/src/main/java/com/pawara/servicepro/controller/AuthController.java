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

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired token"));
        }

        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (user.getCustomer() != null && "TRASHED".equals(user.getCustomer().getStatus())) {
            return ResponseEntity.status(401).body(Map.of("message", "Your Account is no longer active.Please contact Prashansha Electical Services."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        if (user.getCustomer() != null) {
            response.put("customerId", user.getCustomer().getId());
            response.put("customerName", user.getCustomer().getName());
            response.put("customerStatus", user.getCustomer().getStatus());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        String input = request.getUsername().trim();
        Optional<User> userOpt = userRepository.findByUsername(input);

        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getUsername() != null && u.getUsername().equalsIgnoreCase(input))
                    .findFirst();
        }

        // Fallback 1: Customer email
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getCustomer() != null && u.getCustomer().getEmail() != null && u.getCustomer().getEmail().equalsIgnoreCase(input))
                    .findFirst();
        }

        // Fallback 2: Customer Name (e.g. "Sai Hospital" or "sai hospital")
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getCustomer() != null && u.getCustomer().getName() != null && 
                            (u.getCustomer().getName().equalsIgnoreCase(input) || 
                             u.getCustomer().getName().toLowerCase().replaceAll("\\s+", "").equals(input.toLowerCase().replaceAll("\\s+", ""))))
                    .findFirst();
        }

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or password"));
        }

        User user = userOpt.get();
        if (user.getCustomer() != null && "TRASHED".equals(user.getCustomer().getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Your Account is no longer active. Please contact Prashansha Electrical Services."));
        }

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        if (user.getCustomer() != null) {
            response.put("customerId", user.getCustomer().getId());
            response.put("customerName", user.getCustomer().getName());
            response.put("customerStatus", user.getCustomer().getStatus());
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

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (username == null || username.isBlank()) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                username = auth.getName();
            }
        }

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (currentPassword != null && !currentPassword.isBlank()) {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            }
        }

        if (newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 4 characters"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
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
