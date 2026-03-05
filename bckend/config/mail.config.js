const nodemailer = require("nodemailer");

// Remove strict Gmail enforcement so the platform can use SendGrid, Mailjet, Brevo, or Ethereal safely
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;