/* 
This file has mainly four tasks establishing
 - 1. Establishing connection with mailer
 - 2. Creating function for sending welcome mail
 - 3. Creating function for sending password reset mail
 - 4. Creating function for transaction mail
*/

const nodemailer = require("nodemailer");

// Connection to gmail's server. transporter is an object created by nodemailer.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS
    }
})

// Creating sending welcome mail function
const sendWelcomeEmail = async ({ to, name }) => {
    const html = `
        <div style="font-family: Arial; max-width: 500px;">
            <h2 style="color: #0E4AA6;">Welcome to GarudaPay, ${name}!</h2>
            <p style="color: #0a882a; font-weight:bold;">Your Account has been successfully created</p>
            <p>You can now top up your wallet and send money instantly.</p>
            <p style="color: #888>If you did not create this account, contact support immediately.</p>
        </div>
    `;

    // Calling transporter's method given by nodemailer
    await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to,
        subject: "Welcome to GarudaPay!",
        html
    })
}

// Creating password reset mail function
const sendPasswordResetEmail = async ({ to, name, resetUrl, token }) => {
    const html = `
        <div style="font-family: Arial; max-width: 500px;">
            <h2 style="color: #0E4AA6;">Reset Your Password</h2>
            <p>Hi ${name},</p>
            <p>You requested to reset your GarudaPay password.</p>
            <p>Here is your reset token (use it in the <strong>x-reset-token</strong> header):</p>
            <div style="background: #f4f4f4; padding: 12px; font-family: monospace; font-size: 14px; word-break: break-all; border-radius: 4px; margin: 10px 0;">
                ${token}
            </div>
            <p>Or click the button below — this link expires in <strong>15 minutes</strong>.</p>
            <a href="${resetUrl}"
               style="display: inline-block; margin: 16px 0; padding: 12px 28px;
                      background: #0E4AA6; color: #fff; text-decoration: none;
                      border-radius: 24px; font-weight: bold;">
                Reset Password
            </a>
            <p style="color: #888;">
                If you did not request this, ignore this email. 
                Your password will not change.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to,
        subject: "GarudaPay — Password Reset Request",
        html
    });
}


// Creating mail function to send after a transaction
const sendTransactionEmail = async ({ to, name, type, amount, balance }) => {
    const isDebit = type === "debit";

    const subject = isDebit
        ? `₹${amount} debited from your GarudaPay wallet`
        : `₹${amount} credited to your GarudaPay wallet`;

    const html = `
        <div style="font-family: Arial; max-width: 500px;">
            <h2 style="color: #0E4AA6;">Transaction Alert</h2>
            <p>Hi ${name},</p>
            <p>
                ${isDebit
            ? `<strong>₹${amount}</strong> was sent from your wallet.`
            : `<strong>₹${amount}</strong> was added to your wallet.`
        }
            </p>
            <p><strong>Updated Balance:</strong> ₹${balance}</p>
            <p style="color: #888;">
                If you did not initiate this transaction, 
                contact support immediately.
            </p>
        </div>
    `;

    // sending mail to the user
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    })
}


// export the three functions
module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendTransactionEmail
};
