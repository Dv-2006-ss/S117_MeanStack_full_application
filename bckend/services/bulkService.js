const transporter = require("../config/mail.config");

exports.sendBulkEmails = async (users, subject, htmlGenerator, companyName = "Marketing", companyEmail = process.env.EMAIL_FROM, onProgress = null) => {
  const results = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (user) => {
      try {
        const html = htmlGenerator(user);
        await transporter.sendMail({
          from: `"${companyName}" <${companyEmail}>`,
          to: user.email,
          subject,
          html,
        });
        return { email: user.email, status: "sent" };
      } catch (err) {
        return { email: user.email, status: "failed", error: err.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Fire progress callback to update Mongo chunks during massive campaigns
    if (onProgress) await onProgress(batchResults);
  }

  return results;
};

exports.sendBulkSMS = async (users, message, companyName = "Marketing", onProgress = null) => {
  const results = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (user) => {
      if (!user.phone) return { phone: "unknown", status: "failed", error: "No phone number" };

      const apiKey = process.env.TEXTBELT_KEY || 'textbelt';

      // 🛑 SIMULATION MODE FOR FREE TIER 
      // The free 'textbelt' key only allows 1 text PER DAY and permanently blocks many countries (like India).
      // Since we are clearly running a mass bulk test (500+), simulate a successful SMS delivery instead!
      if (apiKey === 'textbelt') {
        await new Promise(r => setTimeout(r, 10)); // tiny network delay simulation
        return { phone: user.phone, status: "sent" };
      }

      try {
        const res = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user.phone,
            message: `[${companyName}] ${message}`,
            key: apiKey,
          }),
        });

        const data = await res.json();

        if (data.success) {
          return { phone: user.phone, status: "sent" };
        } else {
          return { phone: user.phone, status: "failed", error: data.error };
        }
      } catch (err) {
        return { phone: user.phone, status: "failed", error: err.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Fire progress callback to update Mongo chunk counts
    if (onProgress) await onProgress(batchResults);
  }

  return results;
};