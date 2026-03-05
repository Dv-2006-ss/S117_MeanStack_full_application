const Campaign = require("../models/Campaign");

exports.getAnalytics = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      companyId: req.user
    });

    const totalCampaigns = campaigns.length;

    const sentCampaigns = campaigns.filter(
      c => c.status === "Sent"
    ).length;

    const draftCampaigns = campaigns.filter(
      c => c.status === "Draft"
    ).length;

    const totalReach = campaigns.reduce(
      (sum, c) => sum + c.sentCount,
      0
    );

    res.json({
      totalCampaigns,
      sentCampaigns,
      draftCampaigns,
      totalReach
    });

  } catch (err) {
    res.status(500).json({
      message: "Analytics error"
    });
  }
};
