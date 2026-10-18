const nodemailer = require('nodemailer');
const crypto = require('crypto');
const offerLetterService = require('./offerLetterService');
const pdfService = require('./pdfService');

/**
 * Universal Email Service for Nebula Hub
 * Supports live SMTP transports (Gmail, AWS SES, SendGrid, Mailgun, custom SMTP)
 * with automatic fallback to simulated dev transport when credentials are not configured.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initializes or refreshes the nodemailer SMTP transport
   */
  initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
      console.log(`[EmailService] Configured live SMTP transport via ${host}:${port} (${user})`);
    } else {
      this.transporter = null;
      console.log('[EmailService] SMTP credentials not fully configured in .env. Email service initialized in simulated dev mode.');
    }
  }

  /**
   * Checks whether SMTP transport is configured with credentials
   */
  isConfigured() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  /**
   * Verifies SMTP connection if configured
   */
  async verifyConnection() {
    if (!this.isConfigured() || !this.transporter) {
      return { configured: false, message: 'SMTP not configured in environment.' };
    }
    try {
      await this.transporter.verify();
      return { configured: true, connected: true };
    } catch (err) {
      console.error('[EmailService] SMTP verification failed:', err.message);
      return { configured: true, connected: false, error: err.message };
    }
  }

  /**
   * Universal sender method with live SMTP or development simulation fallback
   */
  async sendMail({ to, subject, html, text, attachments = [] }) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER || '"Nebula Talent Acquisition" <no-reply@nebula.com>';

    if (this.isConfigured() && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          html,
          attachments,
        });

        console.log(`[EmailService] Live email dispatched successfully. ID: ${info.messageId} -> To: ${to}`);
        return {
          success: true,
          simulated: false,
          messageId: info.messageId,
          recipient: to,
          subject,
        };
      } catch (err) {
        console.error(`[EmailService] Failed to dispatch SMTP email to ${to}:`, err.message);
        // Fallback simulation in case of SMTP runtime network error so request does not crash
        return {
          success: false,
          simulated: false,
          error: err.message,
          recipient: to,
          subject,
        };
      }
    }

    // ── Simulated Dev Transport (Console / Mock delivery) ──
    const simMessageId = `sim-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('✉️  [SIMULATED EMAIL DISPATCH] (No SMTP credentials configured)');
    console.log(`  To:      ${to}`);
    console.log(`  From:    ${from}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Msg ID:  ${simMessageId}`);
    console.log('────────────────────────────────────────────────────────────\n');

    return {
      success: true,
      simulated: true,
      messageId: simMessageId,
      recipient: to,
      subject,
      note: 'Simulated delivery - configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for live internet delivery.',
    };
  }

  /**
   * Generates and dispatches a high-polish, branded Offer Letter email to candidate
   */
  async sendOfferLetterEmail({ candidate, offer, signUrl, jobOpening, department, organization }) {
    const candidateName = candidate?.fullName || offer?.candidateName || 'Valued Candidate';
    const candidateEmail = candidate?.email || offer?.candidateEmail;

    if (!candidateEmail) {
      console.warn('[EmailService] Cannot send offer letter: candidate has no email address.');
      return { success: false, error: 'Candidate email address is missing.' };
    }

    const orgName = organization?.name || 'Nebula Technologies';
    const designation = offer.designation || jobOpening?.title || 'Team Member';
    const deptName = department?.name || 'Operations';
    const currency = offer.currency || 'USD';
    const totalCtc = offer.totalCtc || offer.offeredSalary || 0;
    const formattedSalary = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(totalCtc);

    const joiningDateFormatted = offer.joiningDate
      ? new Date(offer.joiningDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Mutually agreed start date';

    const validUntilFormatted = offer.validUntil
      ? new Date(offer.validUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '7 days from receipt';

    const subject = `Job Offer: ${designation} at ${orgName} (${offer.offerCode || 'OFFER'})`;

    // Modern, responsive HTML email template matching Nebula Design Language
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 10px;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: #131b2e;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 32px;
      text-align: center;
    }
    .logo-badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .header-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 8px 0;
    }
    .header-sub {
      color: #e0e7ff;
      font-size: 15px;
      margin: 0;
    }
    .body-content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 16px;
    }
    .intro-p {
      color: #94a3b8;
      font-size: 15px;
      margin-bottom: 24px;
    }
    .highlight-card {
      background: #1a243b;
      border: 1px solid #2d3748;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #28334e;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 13px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      text-align: right;
    }
    .compensation-badge {
      color: #10b981;
      font-size: 18px;
      font-weight: 800;
    }
    .cta-container {
      text-align: center;
      margin: 34px 0 24px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
      letter-spacing: 0.5px;
    }
    .security-notice {
      background: rgba(59, 130, 246, 0.08);
      border-left: 4px solid #3b82f6;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin-top: 24px;
      font-size: 13px;
      color: #93c5fd;
    }
    .footer {
      background: #0d1322;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
    }
    .footer-link {
      color: #818cf8;
      text-decoration: none;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">${orgName}</div>
        <h1 class="header-title">Congratulations!</h1>
        <p class="header-sub">We are pleased to extend an Official Offer of Employment</p>
      </div>

      <div class="body-content">
        <div class="greeting">Dear ${candidateName},</div>
        <p class="intro-p">
          Following our interview rounds, our hiring team and leadership were thoroughly impressed with your technical expertise, track record, and cultural alignment. On behalf of <strong>${orgName}</strong>, we are thrilled to offer you the position of <strong>${designation}</strong>!
        </p>

        <div class="highlight-card">
          <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #28334e;">
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Position</td>
              <td style="color: #f8fafc; font-size: 14px; font-weight: 700; text-align: right;">${designation}</td>
            </tr>
            <tr style="border-bottom: 1px solid #28334e;">
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Department</td>
              <td style="color: #f8fafc; font-size: 14px; font-weight: 700; text-align: right;">${deptName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #28334e;">
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Total Compensation (CTC)</td>
              <td style="color: #10b981; font-size: 18px; font-weight: 800; text-align: right;">${formattedSalary} / yr</td>
            </tr>
            <tr style="border-bottom: 1px solid #28334e;">
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Expected Start Date</td>
              <td style="color: #f8fafc; font-size: 14px; font-weight: 700; text-align: right;">${joiningDateFormatted}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase;">Offer Valid Until</td>
              <td style="color: #f59e0b; font-size: 14px; font-weight: 700; text-align: right;">${validUntilFormatted}</td>
            </tr>
          </table>
        </div>

        <p class="intro-p" style="text-align: center; margin-bottom: 8px;">
          Please click below to review your detailed compensation package, benefits schedule, and digitally sign your offer:
        </p>

        <div class="cta-container">
          <a href="${signUrl}" class="cta-button" target="_blank">Review & Digitally Sign Offer</a>
        </div>

        <div class="security-notice">
          🔒 <strong>Secure E-Sign Link:</strong> This invitation contains an encrypted cryptographic token reserved strictly for ${candidateEmail}. No login or account creation is required to sign.
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 24px; word-break: break-all;">
          If the button above does not work, copy and paste this secure URL directly into your web browser:<br>
          <a href="${signUrl}" class="footer-link">${signUrl}</a>
        </p>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px 0;">Sent by ${orgName} Talent Acquisition &bull; Nebula Enterprise Hub</p>
        <p style="margin: 0;">This email is confidential and intended solely for the recipient. If received in error, please notify the sender immediately.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Generate formal branded PDF Offer Letter attachment
    const attachments = [];
    try {
      const pdfBuffer = await pdfService.generateOfferLetterPdf({
        offer,
        organization,
        candidate,
        signUrl,
      });

      attachments.push({
        filename: `Offer_Letter_${offer.offerCode || 'OFFER'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
      console.log(`[EmailService] Generated & attached PDF Offer Letter (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    } catch (pdfErr) {
      console.warn('[EmailService] Could not generate PDF attachment, attempting HTML fallback:', pdfErr.message);
      try {
        const letterHtml = offerLetterService.generateOfferLetterHtml({
          offer,
          organization,
          candidate,
        });
        if (letterHtml) {
          attachments.push({
            filename: `Offer_Letter_${offer.offerCode || 'OFFER'}.html`,
            content: letterHtml,
            contentType: 'text/html',
          });
        }
      } catch (letterErr) {
        console.warn('[EmailService] Could not generate fallback HTML attachment:', letterErr.message);
      }
    }

    return await this.sendMail({
      to: candidateEmail,
      subject,
      html: emailHtml,
      attachments,
    });
  }
}

module.exports = new EmailService();
