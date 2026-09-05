import nodemailer from 'nodemailer';
import { getBaseUrl } from './utils';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Standard Email Wrapper
 */
const sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Voxy" <support@voxy.com>`,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #00D18F; text-align: center;">Voxy AI</h2>
        ${html}
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Voxy AI. All rights reserved.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

/**
 * 1. Verification Email
 */
export async function sendVerificationEmail(email, name, otp) {
  return sendMail({
    to: email,
    subject: 'Verify your Voxy account',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>Please use the 4-digit code below to verify your account:</p>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
    `,
  });
}

/**
 * 2. Password Reset Email
 * Using Link (Option A)
 */
export async function sendPasswordResetEmail(email, name, tokenIdentifier) {
  const resetLink = `${getBaseUrl()}/reset-password?token=${tokenIdentifier}`;
  return sendMail({
    to: email,
    subject: 'Reset your password',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #00D18F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">Link: ${resetLink}</p>
    `,
  });
}

/**
 * 2b. Password Reset Email with 6-digit OTP
 */
export async function sendPasswordResetOTP(email, name, otp) {
  return sendMail({
    to: email,
    subject: 'Your Voxy Password Reset Code',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>You requested to reset your password for your Voxy account.</p>
      <p>Please enter the following 6-digit verification code:</p>
      <div style="background-color: #0d1117; border: 1px solid #30363d; padding: 24px; text-align: center; border-radius: 12px; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #00D18F; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">This OTP will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.</p>
    `,
  });
}

/**
 * 3. Welcome Email
 */
export async function sendWelcomeEmail(email, name) {
  return sendMail({
    to: email,
    subject: 'Welcome to Voxy 🎉',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>Your account is now verified. Welcome to Voxy! You can now start automating your business communication with AI.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${getBaseUrl()}/login" style="background-color: #00D18F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
      </div>
    `,
  });
}

/**
 * 4. Change Email Verification
 */
export async function sendEmailChangeOTP(email, name, otp) {
  return sendMail({
    to: email,
    subject: 'Verify your new email',
    html: `
      <p>Hi ${name || 'there'},</p>
      <p>You requested to change your account email. Please use the code below to verify your new email address:</p>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #1e293b;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">Expires in 10 minutes.</p>
    `,
  });
}

/**
 * 5. Customer Escalation Alert Email
 */
export async function sendEscalationAlertEmail({
  to,
  businessName,
  customerName,
  customerPhone,
  customerEmail,
  reason,
  conversationId,
  lastMessage,
  urgency = 'normal',
}) {
  const inboxLink = `${getBaseUrl()}/business/inbox`;
  const isUrgent = urgency === 'urgent';
  const badgeColor = isUrgent ? '#ef4444' : '#f59e0b';
  const urgencyLabel = isUrgent ? 'URGENT ESCALATION' : 'CUSTOMER ASSISTANCE REQUESTED';

  return sendMail({
    to,
    subject: `🚨 ${urgencyLabel}: Customer Needs Help — ${businessName || 'Voxy Store'}`,
    html: `
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <span style="background-color: ${badgeColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
          ${urgencyLabel}
        </span>
        <h3 style="color: #0f172a; margin-top: 12px; margin-bottom: 8px;">Human Intervention Requested</h3>
        <p style="color: #334155; font-size: 14px; margin: 0;">
          A customer in your store <strong>${businessName || 'Voxy AI'}</strong> requested human assistance or the AI encountered a scenario requiring your attention.
        </p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 12px 0; color: #1e293b;">Customer & Escalation Details</h4>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #475569;">
          <li style="margin-bottom: 8px;"><strong>Customer:</strong> ${customerName || 'Chat User'} (${customerPhone || customerEmail || 'Web Chat'})</li>
          <li style="margin-bottom: 8px;"><strong>Reason:</strong> ${reason || 'Customer requested human support'}</li>
          ${lastMessage ? `<li style="margin-bottom: 8px;"><strong>Last Customer Message:</strong> <em>"${lastMessage}"</em></li>` : ''}
          ${conversationId ? `<li style="margin-bottom: 8px;"><strong>Conversation ID:</strong> <code>${conversationId}</code></li>` : ''}
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${inboxLink}" style="background-color: #00D18F; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Open Inbox & Respond to Customer
        </a>
      </div>
    `,
  });
}

