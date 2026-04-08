const mongoose = require("mongoose");

const generatedOutputsSchema = new mongoose.Schema({
  email: {
    subject: String,
    body: String
  },
  sms: {
    message: String
  },
  social: {
    posts: {
      type: [String],
      default: []
    }
  },
  ads: {
    headlines: {
      type: [String],
      default: []
    },
    body: String
  },
  landingPage: {
    headline: String,
    subhead: String,
    cta: String,
    sections: {
      type: [String],
      default: []
    }
  }
}, { _id: false });

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

  goal: {
    type: String,
    default: "promote-an-offer"
  },

  subject: {
    type: String,
    default: ""
  },

  product: String,
  offer: String,
  cta: {
    type: String,
    default: ""
  },

  campaignType: {
    type: String,
    default: "email"
  },

  selectedChannels: {
    type: [String],
    default: ["email"]
  },

  sourceDataset: {
    id: String,
    name: String,
    customerCount: Number
  },

  sourceSegment: {
    type: String,
    default: "All contacts"
  },

  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template"
  },

  htmlContent: String,
  generatedOutputs: {
    type: generatedOutputsSchema,
    default: () => ({})
  },

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
