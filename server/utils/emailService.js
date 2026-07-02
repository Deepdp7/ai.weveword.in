import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ── Transporter ────────────────────────────────────────────────────────────────
const createTransporter = () => {
  // If running in development without real SMTP, use Nodemailer's Ethereal preview
  if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com')) {
    console.warn('📧 SMTP not configured — emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ── Send helper ────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    // Fallback — just log for development
    console.log(`\n📧 [EMAIL - DEV MODE]\nTo: ${to}\nSubject: ${subject}\n`);
    return;
  }

  const info = await transporter.sendMail({
    from: `"Waveword AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent: ${info.messageId}`);
};

// ── OTP Email Template ──────────────────────────────────────────────────────────
export const sendOTPEmail = async (email, otp, purpose = 'forgot_password') => {
  const title = purpose === 'forgot_password' ? 'Reset Your Password' : 'Verify Your Email';
  const bodyText = purpose === 'forgot_password'
    ? 'You requested a password reset. Use the OTP below. It expires in <strong>10 minutes</strong>.'
    : 'Welcome! Use this OTP to verify your email address.';

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Arial, sans-serif; }
      .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center; }
      .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
      .header p { color: rgba(255,255,255,0.75); font-size: 14px; margin: 8px 0 0; }
      .body { padding: 36px 32px; }
      .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
      .otp-box { background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
      .otp-code { font-size: 44px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; display: block; }
      .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; }
      .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✦ Waveword AI</h1>
        <p>${title}</p>
      </div>
      <div class="body">
        <p>Hi there,</p>
        <p>${bodyText}</p>
        <div class="otp-box">
          <span class="otp-code">${otp}</span>
        </div>
        <p>If you didn't request this, please ignore this email. Your account remains safe.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Waveword AI. All rights reserved.</p>
        <p style="margin-top: 6px;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  await sendEmail({ to: email, subject: `Your Waveword AI OTP: ${otp}`, html });
};

// ── Welcome Email Template ──────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email, name) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Arial, sans-serif; }
      .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center; }
      .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; }
      .body { padding: 36px 32px; }
      .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
      .feature { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .feature-icon { font-size: 20px; }
      .cta { display: block; margin: 28px auto 0; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; width: fit-content; }
      .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; }
      .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✦ Welcome to Waveword AI!</h1>
      </div>
      <div class="body">
        <p>Hey ${name} 👋,</p>
        <p>We're thrilled to have you on board! Your account has been created successfully. Here's what you can do with Waveword AI:</p>
        <div class="feature"><span class="feature-icon">✍️</span> <span><strong>Studio</strong> — Turn handwriting photos into clean digital text</span></div>
        <div class="feature"><span class="feature-icon">🖊️</span> <span><strong>Signature Generator</strong> — Create professional digital signatures</span></div>
        <div class="feature"><span class="feature-icon">🎬</span> <span><strong>Writing Animator</strong> — Animate your handwriting into a video</span></div>
        <div class="feature"><span class="feature-icon">📄</span> <span><strong>Project Builder</strong> — Compile structured academic documents</span></div>
        <div class="feature"><span class="feature-icon">📂</span> <span><strong>Cloud Library</strong> — Store all generated files securely</span></div>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}" class="cta">Start Creating →</a>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Waveword AI. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  await sendEmail({ to: email, subject: `Welcome to Waveword AI, ${name}! 🎉`, html });
};
