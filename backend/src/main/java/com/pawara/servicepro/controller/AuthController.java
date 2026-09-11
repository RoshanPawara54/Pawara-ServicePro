package com.pawara.servicepro.controller;

import com.pawara.servicepro.model.User;
import com.pawara.servicepro.repository.UserRepository;
import com.pawara.servicepro.security.JwtTokenProvider;
import com.pawara.servicepro.dto.ForgotPasswordRequest;
import com.pawara.servicepro.dto.ResetPasswordRequest;
import com.pawara.servicepro.dto.TokenValidationResponse;
import com.pawara.servicepro.service.PasswordResetService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final PasswordResetService passwordResetService;

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
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(input);

        // Fallback 1: Customer email
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByCustomer_EmailIgnoreCase(input);
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
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request != null && request.getEmail() != null) {
            passwordResetService.processForgotPassword(request.getEmail());
        }

        // Always return generic response to prevent account enumeration
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for this email, a password reset link has been sent."
        ));
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<TokenValidationResponse> validateResetToken(@RequestParam(value = "token", required = false) String token) {
        boolean isValid = passwordResetService.validateResetToken(token);
        return ResponseEntity.ok(TokenValidationResponse.builder().valid(isValid).build());
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request == null || request.getToken() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required."));
        }

        try {
            passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. You can now log in."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
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

        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 8 characters"));
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
}
