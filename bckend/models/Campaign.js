const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  product: String,
  offer: String,

  campaignType: {
    type: String,
    default: "email"
  },

  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template"
  },

  htmlContent: String,

  status: {
    type: String,
    default: "draft"
  },

  sentCount: {
    type: Number,
    default: 0
  },

  scheduledAt: Date,

  targetAudience: [{
    type: mongoose.Schema.Types.Mixed
  }],

  deliveryLogs: [{
    _id: false,
    target: String, // email or phone
    status: String, // "sent" or "failed"
    error: String   // reason if failed
  }]

}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema);