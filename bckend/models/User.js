const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "Marketing Manager"
  },
  timezone: {
    type: String,
    default: "UTC+5:30 (India Standard Time)"
  },
  notifications: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    marketingUpdates: { type: Boolean, default: true }
  }
}, { timestamps: true });


// ✅ CASE-INSENSITIVE EMAIL CHECK
UserSchema.pre("save", async function () {
  const existing = await this.constructor.findOne({
    email: { $regex: `^${this.email}$`, $options: "i" }
  });

  if (existing && existing._id.toString() !== this._id.toString()) {
    throw new Error("Email already exists");
  }
});


module.exports = mongoose.model("User", UserSchema);