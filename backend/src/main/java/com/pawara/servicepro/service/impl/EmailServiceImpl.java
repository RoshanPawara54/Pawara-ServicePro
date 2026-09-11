package com.pawara.servicepro.service.impl;

import com.pawara.servicepro.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String senderName;

    public EmailServiceImpl(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${pawara.mail.from:noreply@pawaraservicepro.com}") String fromEmail,
            @Value("${pawara.mail.sender-name:Pawara ServicePro}") String senderName) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.senderName = senderName;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Password reset email was not sent via SMTP to recipient: {}", toEmail);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail, senderName);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your Pawara ServicePro Password");

            String htmlContent = buildHtmlContent(resetUrl);
            String textContent = buildPlainTextContent(resetUrl);

            helper.setText(textContent, htmlContent);

            mailSender.send(mimeMessage);
            log.info("Password reset email successfully sent to recipient: {}", toEmail);
        } catch (Exception ex) {
            // Log warning without exposing the secret reset URL or raw token
            log.error("Failed to send password reset email to recipient: {}. Error: {}", toEmail, ex.getMessage());
        }
    }

    private String buildHtmlContent(String resetUrl) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<style>"
                + "body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }"
                + ".container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }"
                + ".header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }"
                + ".header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; color: #f8fafc; }"
                + ".content { padding: 32px 28px; line-height: 1.6; }"
                + ".button-wrapper { text-align: center; margin: 30px 0; }"
                + ".btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; }"
                + ".footer { padding: 20px 28px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }"
                + ".note { font-size: 13px; color: #64748b; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"container\">"
                + "  <div class=\"header\">"
                + "    <h1>Pawara ServicePro</h1>"
                + "  </div>"
                + "  <div class=\"content\">"
                + "    <h2 style=\"margin-top:0; font-size: 18px; color: #0f172a;\">Reset Your Password</h2>"
                + "    <p>Hello,</p>"
                + "    <p>We received a request to reset the password for your Pawara ServicePro account. Click the button below to create a new password:</p>"
                + "    <div class=\"button-wrapper\">"
                + "      <a href=\"" + resetUrl + "\" class=\"btn\" target=\"_blank\">Reset Password</a>"
                + "    </div>"
                + "    <p class=\"note\"><strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong> and can only be used once.<br><br>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>"
                + "  </div>"
                + "  <div class=\"footer\">"
                + "    &copy; " + java.time.Year.now().getValue() + " Pawara ServicePro. All rights reserved."
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }

    private String buildPlainTextContent(String resetUrl) {
        return "Pawara ServicePro - Password Reset\n\n"
                + "We received a request to reset your password.\n\n"
                + "Please use the following link to reset your password:\n"
                + resetUrl + "\n\n"
                + "This link will expire in 1 hour.\n\n"
                + "If you did not request this reset, you can safely ignore this email.\n";
    }
}
