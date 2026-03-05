const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema({

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  customers: [
    {
      name: String,
      email: String,
      phone: String,
      age: Number
    }
  ]

}, { timestamps: true });


// 🔥 UNIQUE dataset name per user
datasetSchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Dataset", datasetSchema);