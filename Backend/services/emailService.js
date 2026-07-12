const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const useRealSmtp = process.env.SMTP_HOST && process.env.SMTP_USER;
  if (useRealSmtp) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Using configured SMTP service:', process.env.SMTP_HOST);
  } else {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal test SMTP account:', testAccount.user);
  }
  return transporter;
}

async function sendVerificationEmail(email, name, token) {
  const mailTransporter = await getTransporter();
  const verifyUrl = `http://localhost:5000/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: '"TransitOps" <no-reply@transitops.com>',
    to: email,
    subject: 'Verify Your Email Address - TransitOps',
    html: `
      <h2>Verify Your Email</h2>
      <p>Hello ${name},</p>
      <p>Please click the link below to verify your email address and activate your account:</p>
      <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log(`Email successfully sent to: ${email}`);

  // If using Ethereal, print the message preview URL
  if (!process.env.SMTP_HOST) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`-----------------------------------------`);
    console.log(`TEST EMAIL SENT! View preview here:`);
    console.log(`${previewUrl}`);
    console.log(`-----------------------------------------`);
    return { previewUrl };
  }

  return { previewUrl: null };
}

module.exports = { sendVerificationEmail };
