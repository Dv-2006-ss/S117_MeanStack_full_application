const emailService = require("../services/email.service");

exports.sendAd = async (req, res, next) => {
  try {
    const { email, name, product, offer } = req.body;

    const html = `
      <h2>Hello ${name}</h2>
      <p>Special offer on <b>${product}</b></p>
      <h3>${offer}</h3>
    `;

    await emailService.sendEmail({
      to: email,
      subject: "Special Offer",
      html
    });

    res.json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (err) {
    next(err);
  }
};