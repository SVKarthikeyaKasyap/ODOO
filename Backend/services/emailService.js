const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // App Password
  },
});

async function sendVerificationEmail(email, name, token) {
  const verificationLink = `http://localhost:5173/verify-email?token=${token}`;

  const mailOptions = {
    from: `"TransitOps" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address - TransitOps',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8; text-align: center;">TransitOps Platform</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for joining TransitOps. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #5f6368;"><a href="${verificationLink}">${verificationLink}</a></p>
        <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #5f6368; text-align: center;">
          If you did not request this verification, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
}

module.exports = { sendVerificationEmail };
