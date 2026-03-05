const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // wait longer before failing
      family: 4 // force IPv4 (fixes Atlas DNS errors)
    });

    console.log("✅ MongoDB Connected:", conn.connection.host);

  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);

    // retry instead of crash
    console.log("🔁 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;