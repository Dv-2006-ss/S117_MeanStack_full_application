const transporter = require("../config/mail.config");

exports.sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.response);
  return info;
};