const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const controller = require("../controllers/datasetController");

router.post("/", protect, controller.saveDataset);
router.get("/", protect, controller.getDatasets);
router.delete("/:id", protect, controller.deleteDataset);
router.put("/:id", protect, controller.updateDataset);

module.exports = router;