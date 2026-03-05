const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // imported fields
  id: String,
  name: String,
  email: String,
  phone: String,
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/   // strict 10 digits
  },
  age: Number

}, { timestamps: true });


// 🔥 prevent duplicate name+email per company
customerSchema.index(
  { name: 1, email: 1, companyId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Customer", customerSchema);
