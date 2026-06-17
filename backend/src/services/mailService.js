const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS
  }
});

const sendTransactionMail = async ({
  senderEmail,
  receiverEmail,
  amount,
  note,
  senderName,
  receiverName,
  senderBalance,
  receiverBalance
}) => {
  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to: senderEmail,
    subject: "Money Sent Successfully",
    html: `
      <h2 style="color:green">Transaction Successful</h2>
      <p>Hi ${senderName || "there"},</p>
      <p>Amount: ₹${amount}</p>
      <p>Note: ${note || "N/A"}</p>
      <p>Updated Balance: ₹${senderBalance}</p>
    `
  });

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to: receiverEmail,
    subject: "Money Received",
    html: `
      <h2>You received money</h2>
      <p>Hi ${receiverName || "there"},</p>
      <p>Amount: ₹${amount}</p>
      <p>Note: ${note || "N/A"}</p>
      <p>Updated Balance: ₹${receiverBalance}</p>
    `
  });
};

module.exports = sendTransactionMail;