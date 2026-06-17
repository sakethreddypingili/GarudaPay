const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS
  }
});

const sendWelcomeEmail = async ({ to, name }) => {
  const html = `
    <div style="font-family: Arial; max-width: 500px;">
      <h2 style="color: #0E4AA6;">Welcome to GarudaPay, ${name}!</h2>
      <p style="color: #0a882a; font-weight: bold;">Your account has been successfully created.</p>
      <p>You can now top up your wallet and send money instantly.</p>
      <p style="color: #888;">If you did not create this account, contact support immediately.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject: "Welcome to GarudaPay!",
    html
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const html = `
    <div style="font-family: Arial; max-width: 500px;">
      <h2 style="color: #0E4AA6;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your GarudaPay password.</p>
      <p>Click the button below. This link expires in <strong>15 minutes</strong>.</p>
      <a href="${resetUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 28px; background: #0E4AA6; color: #fff; text-decoration: none; border-radius: 24px; font-weight: bold;">Reset Password</a>
      <p style="color: #888;">If you did not request this, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject: "GarudaPay - Password Reset Request",
    html
  });
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};
