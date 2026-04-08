const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  companyName: user.companyName,
  email: user.email,
  role: user.role,
  timezone: user.timezone,
  notifications: user.notifications,
  brandProfile: user.brandProfile
});


// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      companyName,
      email,
      password,
      brandProfile = {}
    } = req.body;

    if (!name || !companyName || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { name: { $regex: `^${name}$`, $options: "i" } }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      return res.status(400).json({ message: "User with this name already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      companyName,
      email: email.toLowerCase(),
      password: hashedPassword,
      brandProfile: {
        brandVoice: brandProfile.brandVoice || "Clear, practical, and trustworthy",
        primaryOffer: brandProfile.primaryOffer || "",
        audienceDescription: brandProfile.audienceDescription || "",
        preferredChannels: Array.isArray(brandProfile.preferredChannels) && brandProfile.preferredChannels.length
          ? brandProfile.preferredChannels
          : ["email", "sms"]
      }
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔥 ASYNC BACKGROUND TASK: Don't block registration for SMTP speed
    const emailService = require("../services/email.service");
    emailService.sendEmail({
      to: newUser.email,
      subject: "Welcome to CampaignAI",
      html: `
        <div style="font-family: Arial, sans-serif; background: #09111f; color: #f8fafc; padding: 40px; border-radius: 12px;">
          <h1 style="color: #38bdf8;">Welcome to CampaignAI, ${newUser.name}!</h1>
          <p>Your account for <strong>${newUser.companyName}</strong> has been successfully created.</p>
          <p>CampaignAI helps small teams create campaign drafts faster, stay on brand, and launch email and SMS work from one workspace.</p>
          <div style="margin: 30px 0;">
            <a href="http://localhost:4203/login" style="background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open CampaignAI</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">If you didn't create this account, please ignore this email.</p>
        </div>
      `
    }).catch(mailErr => console.error("WELCOME EMAIL FAILED (background):", mailErr.message));

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: serializeUser(newUser)
    });

  } catch (err) {
    console.error("REGISTER ERROR", err);
    res.status(500).json({ message: err.message || "Server error", stack: err.stack });
  }
};



// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" }
    });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ message: "Invalid password" });

    // ✅ FIXED TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: serializeUser(user)
    });

  } catch (err) {
    console.error("LOGIN ERROR", err);
    res.status(500).json({ message: err.message || "Server error", stack: err.stack });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, companyName, role, timezone, brandProfile } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name && name !== user.name) {
      const existingName = await User.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        _id: { $ne: userId }
      });
      if (existingName) {
        return res.status(400).json({ message: "User with this name already exists" });
      }
    }

    if (name) user.name = name;
    if (companyName) user.companyName = companyName;
    if (role) user.role = role;
    if (timezone) user.timezone = timezone;
    if (brandProfile) {
      user.brandProfile = {
        ...user.brandProfile?.toObject?.(),
        ...brandProfile,
        preferredChannels: Array.isArray(brandProfile.preferredChannels) && brandProfile.preferredChannels.length
          ? brandProfile.preferredChannels
          : user.brandProfile?.preferredChannels || ["email", "sms"]
      };
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: serializeUser(user)
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both current and new passwords are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Invalid current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("UPDATE PASSWORD ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE NOTIFICATIONS
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications } = req.body;

    if (!notifications) return res.status(400).json({ message: "Notifications data required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notifications = {
      ...user.notifications,
      ...notifications
    };

    await user.save();

    res.json({ message: "Notifications updated successfully", notifications: user.notifications });
  } catch (err) {
    console.error("UPDATE NOTIFICATIONS ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
};
