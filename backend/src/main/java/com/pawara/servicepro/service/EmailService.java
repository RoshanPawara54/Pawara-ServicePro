package com.pawara.servicepro.service;

public interface EmailService {
    /**
     * Sends a password reset email with the secure reset URL to the specified recipient.
     *
     * @param toEmail  Recipient email address
     * @param resetUrl Secure frontend URL containing the one-time raw reset token
     */
    void sendPasswordResetEmail(String toEmail, String resetUrl);
}
