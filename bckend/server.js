require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const protect = require("./middleware/authMiddleware");
const scheduler = require("./utils/scheduler");

// routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const emailRoutes = require("./routes/email.routes");
const datasetRoutes = require("./routes/datasetRoutes");

const app = express();


// ================= DATABASE & SCHEDULER =================
connectDB();
scheduler.initScheduler();


// ================= DEBUG PING ROUTE =================
app.get("/__ping", (req, res) => {
  res.json({
    ok: true,
    time: Date.now(),
    pid: process.pid
  });
});


// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/datasets", datasetRoutes);

// ================= PRODUCTION DEPLOYMENT =================
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist/frontend/browser");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
} else {
  // ================= HEALTH CHECK =================
  app.get("/", (req, res) => {
    res.send("🚀 Velox Backend Running");
  });
}


// ================= PROTECTED TEST =================
app.get("/protected", protect, (req, res) => {
  res.json({
    message: "🔒 Protected route accessed",
    user: req.user
  });
});


// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // prevents double responses
  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});


// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});