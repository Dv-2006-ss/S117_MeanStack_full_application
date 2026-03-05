const Customer = require("../models/Customer");
const ImportLog = require("../models/ImportLog");
const bulkService = require("../services/bulkService"); // ✅ added


// ================= ADD CUSTOMERS =================
exports.addCustomers = async (req, res) => {
  try {
    const data = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const customers = data.map(c => ({
      ...c,
      owner: req.user.id
    }));

    await Customer.insertMany(customers);

    await ImportLog.create({
      owner: req.user.id,
      total: customers.length
    });

    res.json({
      success: true,
      inserted: customers.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Import failed" });
  }
};



// ================= GET CUSTOMERS =================
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ owner: req.user.id });
    return res.json(customers);
  } catch (err) {
    return res.status(500).json({ message: "Fetch failed" });
  }
};



// ================= REPLACE CUSTOMERS =================
exports.replaceCustomers = async (req, res) => {
  try {

    if (!Array.isArray(req.body))
      return res.status(400).json({ message: "Body must be array" });

    await Customer.deleteMany({ owner: req.user.id });

    const customers = req.body.map(c => ({
      ...c,
      owner: req.user.id
    }));

    await Customer.insertMany(customers);

    return res.json({
      success: true,
      message: "Customers replaced",
      count: customers.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Replace failed" });
  }
};

// ================= UPDATE SINGLE CUSTOMER =================
// ================= UPDATE SINGLE CUSTOMER =================
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: id, owner: req.user.id },
      req.body,
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.json({
      success: true,
      customer: updatedCustomer
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Update failed" });
  }
};



// ================= SEND CAMPAIGN =================
exports.sendCampaign = async (req, res, next) => {
  try {
    const { subject, product, offer } = req.body;

    if (!subject || !product || !offer)
      return res.status(400).json({ message: "Missing fields" });

    // ✅ FIXED FIELD NAME HERE
    const customers = await Customer.find({
      userId: req.user.id
    });

    if (!customers.length) {
      return res.status(404).json({
        success: false,
        message: "No customers found"
      });
    }

    const results = await bulkService.sendBulkEmails(
      customers,
      subject,
      (user) => `
        <h2>Hello ${user.name}</h2>
        <p>Special offer on <b>${product}</b></p>
        <h3>${offer}</h3>
      `
    );

    return res.json({
      success: true,
      total: customers.length,
      results
    });

  } catch (err) {
    next(err);
  }


};