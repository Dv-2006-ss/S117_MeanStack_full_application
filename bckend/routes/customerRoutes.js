const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const controller = require("../controllers/customerController");

router.get("/", protect, controller.getCustomers);
router.post("/", protect, controller.addCustomers);
router.put("/", protect, controller.replaceCustomers);
router.put("/:id", protect, controller.updateCustomer);
module.exports = router;