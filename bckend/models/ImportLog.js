const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  companyId: mongoose.Schema.Types.ObjectId,
  total: Number,
  duplicates: Number,
  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model("ImportLog", schema);
