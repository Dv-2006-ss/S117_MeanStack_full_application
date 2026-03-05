const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
    createCampaign,
    getCampaigns,
    deleteCampaign,
    sendCampaign,
    createEmailCampaign,
    getCampaignHistory,
    saveCampaignHistory,
    deleteCampaignHistory
} = require("../controllers/campaignController");

router.post("/", protect, createCampaign);
router.get("/", protect, getCampaigns);
router.delete("/:id", protect, deleteCampaign);
router.post("/send/:id", protect, sendCampaign);
router.post("/email", protect, createEmailCampaign); // NEW ROUTE FOR TESTING EMAIL SENDING

// ================= HISTORY =================
router.get("/history", protect, getCampaignHistory);
router.post("/history", protect, saveCampaignHistory);
router.delete("/history/:id", protect, deleteCampaignHistory);

module.exports = router;