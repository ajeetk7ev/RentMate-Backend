/**
 * Email Service
 *
 * Centralized email sending using SendGrid.
 * All transactional emails go through this service.
 */
import sgMail from "@sendgrid/mail";
import env from "../config/env.js";
import logger from "../config/logger.js";

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  logger.info("SendGrid configured successfully.");
} else {
  logger.warn("SendGrid API key not found. Email features will be disabled.");
}

class EmailService {
  /**
   * Send a generic email via SendGrid.
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      const msg = {
        to,
        from: {
          email: env.SENDGRID_FROM_EMAIL,
          name: "RentMate",
        },
        subject,
        html,
        text: text || subject,
      };

      await sgMail.send(msg);
      logger.info(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send password reset email with a reset link.
   */
  static async sendResetPasswordEmail(email, resetToken) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; font-size: 28px; margin: 0;">RentMate</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Find your perfect room & roommate</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
            If the button does not work, copy and paste this link into your browser:<br />
            <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          RentMate - Room Rental & Roommate Matching Platform
        </p>
      </div>
    `;

    return await EmailService.sendEmail({
      to: email,
      subject: "Reset Your Password - RentMate",
      html,
      text: `Reset your password by visiting: ${resetUrl}. This link expires in 15 minutes.`,
    });
  }

  /**
   * Send welcome email after signup.
   */
  static async sendWelcomeEmail(email, name) {
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; font-size: 28px; margin: 0;">RentMate</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Find your perfect room & roommate</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Thanks for joining RentMate. Your account has been created successfully.
            Start exploring rooms and find your perfect roommate match.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${env.FRONTEND_URL}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Get Started
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong>Next steps:</strong>
          </p>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>Complete your profile with lifestyle preferences</li>
            <li>Browse available rooms in your city</li>
            <li>Send interest requests to compatible roommates</li>
          </ul>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          RentMate - Room Rental & Roommate Matching Platform
        </p>
      </div>
    `;

    return await EmailService.sendEmail({
      to: email,
      subject: "Welcome to RentMate!",
      html,
      text: `Welcome to RentMate, ${name}! Your account has been created successfully.`,
    });
  }
}

export default EmailService;
