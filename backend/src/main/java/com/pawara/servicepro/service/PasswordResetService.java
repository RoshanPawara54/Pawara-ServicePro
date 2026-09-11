package com.pawara.servicepro.service;

public interface PasswordResetService {
    /**
     * Processes a forgot password request by verifying account existence, generating a secure single-use
     * hashed token, and emailing the reset URL to the account holder.
     *
     * @param emailOrUsername User's email or username
     */
    void processForgotPassword(String emailOrUsername);

    /**
     * Validates whether a given raw token is valid and unexpired.
     *
     * @param rawToken The raw token received from the reset link
     * @return true if valid and active, false otherwise
     */
    boolean validateResetToken(String rawToken);

    /**
     * Resets the user's password using the validated raw token.
     *
     * @param rawToken    The raw token received from the reset link
     * @param newPassword The new password chosen by the user
     */
    void resetPassword(String rawToken, String newPassword);
}
