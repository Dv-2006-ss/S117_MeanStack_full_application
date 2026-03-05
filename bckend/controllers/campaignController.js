const Campaign = require("../models/Campaign");
const Customer = require("../models/Customer");
const Template = require("../models/Template");
const bulkService = require("../services/bulkService");
const render = require("../utils/templateRenderer");
const User = require("../models/User");


/* =====================================================
   BASIC CREATE CAMPAIGN (OLD VERSION - KEPT)
===================================================== */
exports.createCampaign = async (req, res) => {
  try {

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const campaign = await Campaign.create({
      owner: req.user.id,
      name: req.body.name || req.body.subject || "Unnamed Campaign",
      subject: req.body.subject,
      product: req.body.product,
      offer: req.body.offer,
      campaignType: req.body.type || req.body.campaignType || "email",
      htmlContent: req.body.message || req.body.htmlContent || "",
      status: req.body.status || "sent",
      sentCount: req.body.sentCount || req.body.total || 0
    });

    res.json({
      success: true,
      campaign
    });

  } catch (err) {

    console.error("CREATE ERROR:", err);

    res.status(500).json({
      message: "Create failed",
      error: err.message
    });
  }
};



/* =====================================================
   NEW: CREATE EMAIL CAMPAIGN WITH TEMPLATE
===================================================== */
exports.createEmailCampaign = async (req, res) => {
  try {

    const {
      name,
      subject,
      product,
      offer,
      blocks
    } = req.body;

    let campaign = await Campaign.findOne({ owner: req.user.id, name });

    const html = render(blocks);

    if (campaign) {
      if (campaign.template) {
        await Template.findByIdAndUpdate(campaign.template, { blocks, name: name + " Template" });
      } else {
        const template = await Template.create({ owner: req.user.id, name: name + " Template", blocks });
        campaign.template = template._id;
      }
      campaign.htmlContent = html;
      campaign.subject = subject;
      await campaign.save();
    } else {
      const template = await Template.create({
        owner: req.user.id,
        name: name + " Template",
        blocks
      });

      campaign = await Campaign.create({
        owner: req.user.id,
        name,
        subject,
        product,
        offer,
        campaignType: "email",
        template: template._id,
        htmlContent: html
      });
    }

    res.json({
      success: true,
      campaign
    });

  } catch (err) {
    console.error("EMAIL CAMPAIGN ERROR:", err);
    res.status(500).json({
      message: "Email campaign creation failed",
      error: err.message
    });
  }
};



/* =====================================================
   GET USER CAMPAIGNS
===================================================== */
exports.getCampaigns = async (req, res) => {
  try {

    const data = await Campaign.find({ owner: req.user.id })
      .populate('template')
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};



/* =====================================================
   DELETE CAMPAIGN
===================================================== */
exports.deleteCampaign = async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};



/* =====================================================
   SEND CAMPAIGN
===================================================== */
exports.sendCampaign = async (req, res, next) => {
  try {

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    // only owner can send
    if (campaign.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const customers = await Customer.find({ owner: req.user.id });

    if (!customers.length)
      return res.status(400).json({ message: "No customers" });



    /* ===========================================
       Use Template HTML if exists
    =========================================== */

    let emailContent;

    if (campaign.htmlContent) {
      emailContent = campaign.htmlContent;
    } else {
      emailContent = `
       <h2>Hello {{name}}</h2>
       <p>Special offer on <b>${campaign.product}</b></p>
       <h3>${campaign.offer}</h3>
     `;
    }


    const userObj = await User.findById(req.user.id);
    const companyName = userObj ? userObj.companyName : "Velox";
    const companyEmail = userObj ? userObj.email : process.env.EMAIL_FROM;

    const results = await bulkService.sendBulkEmails(
      customers,
      campaign.subject,
      user => emailContent.replace("{{name}}", user.name),
      companyName,
      companyEmail
    );


    campaign.status = "sent";
    campaign.sentCount = customers.length;
    await campaign.save();


    res.json({
      success: true,
      sent: customers.length
    });

  } catch (err) {
    next(err);
  }
};

/* =====================================================
   HISTORY
===================================================== */
exports.getCampaignHistory = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.id })
      .populate('template')
      .sort({ createdAt: -1 });

    // Let CampaignHistory access it and display it
    const history = campaigns.map(c => ({
      _id: c._id,
      name: c.name,
      type: c.campaignType || 'email',
      types: c.campaignType ? c.campaignType.split(',') : ['email'], // Array format for UI
      status: c.status === 'sent' || c.status === 'Complete' ? 'Complete' : (c.status === 'scheduled' ? 'Scheduled' : 'Draft'),
      total: c.sentCount || 0,
      date: c.createdAt,
      scheduledAt: c.scheduledAt,
      loop: false,
      deliveryLogs: c.deliveryLogs || [],
      message: c.htmlContent || "",
      template: c.template
    }));

    res.json(history);
  } catch (err) {
    console.error("GET HISTORY ERROR", err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

exports.saveCampaignHistory = async (req, res) => {
  try {
    const { name, subject, message, type, types, status, total, date, loop, audience, scheduledDate } = req.body;

    // Save directly to the Campaigns Collection
    let campaign = await Campaign.findOne({ owner: req.user.id, name });

    if (campaign) {
      let newType = campaign.campaignType;
      if (newType && !newType.includes(type)) {
        newType = newType + ',' + type;
      } else if (!newType) {
        newType = type;
      }

      let newStatus = "draft";
      if (status === "Complete") newStatus = "sent";
      if (status === "Scheduled") newStatus = "scheduled";

      const updateData = {
        campaignType: newType,
        status: newStatus
      };
      if (scheduledDate) updateData.scheduledAt = new Date(scheduledDate);
      if (audience && audience.length) updateData.targetAudience = audience;

      if (message) updateData.htmlContent = message;
      if (subject) updateData.subject = subject;

      campaign = await Campaign.findByIdAndUpdate(campaign._id, {
        $set: updateData
      }, { new: true });
    } else {
      let newStatus = "draft";
      if (status === "Complete") newStatus = "sent";
      if (status === "Scheduled") newStatus = "scheduled";

      campaign = await Campaign.create({
        owner: req.user.id,
        name,
        subject: subject || name,
        campaignType: type,
        status: newStatus,
        scheduledAt: scheduledDate ? new Date(scheduledDate) : undefined,
        targetAudience: audience || [],
        sentCount: total,
        htmlContent: message || "",
      });
    }

    // 🔥 Trigger NodeJS Background Task to securely send the Emails or SMS payloads via SMTP and textbelt to Real World targets 
    if (status === "Complete" && !scheduledDate && audience && audience.length > 0) {

      // Get User's Company Name and Email to use as Sender ID instead of standard env var
      const userObj = await User.findById(req.user.id);
      const companyName = userObj ? userObj.companyName : "Velox";
      const companyEmail = userObj ? userObj.email : process.env.EMAIL_FROM;

      if (type === "sms") {
        // Send SMS without awaiting UI response
        bulkService.sendBulkSMS(audience, message, companyName, async (batchResults) => {
          const newLogs = batchResults.map(r => ({ target: r.phone, status: r.status, error: r.error }));
          const incValue = newLogs.filter(r => r.status === "sent").length;
          await Campaign.findByIdAndUpdate(campaign._id, {
            $push: { deliveryLogs: { $each: newLogs } },
            $inc: { sentCount: incValue }
          });
        }).catch(console.error);
      } else {
        // Send Email without awaiting UI response
        bulkService.sendBulkEmails(audience, subject || name, user => {
          let content = message || `<p>Hello ${user.name || 'Customer'}</p>`;
          return content.replace(/{{name}}/gi, user.name || '');
        }, companyName, companyEmail, async (batchResults) => {
          const newLogs = batchResults.map(r => ({ target: r.email, status: r.status, error: r.error }));
          const incValue = newLogs.filter(r => r.status === "sent").length;
          await Campaign.findByIdAndUpdate(campaign._id, {
            $push: { deliveryLogs: { $each: newLogs } },
            $inc: { sentCount: incValue }
          });
        }).catch(console.error);
      }
    }

    // Return mapped object exactly like history object for instantaneous frontend payload matching
    return res.json({
      success: true,
      history: {
        _id: campaign._id,
        name: campaign.name,
        type: campaign.campaignType,
        types: campaign.campaignType ? campaign.campaignType.split(',') : [type],
        status: status === "Scheduled" ? "Scheduled" : "Complete",
        total: campaign.sentCount,
        date: campaign.createdAt,
        scheduledAt: campaign.scheduledAt,
        loop: false,
        deliveryLogs: campaign.deliveryLogs || []
      }
    });

  } catch (err) {
    console.error("SAVE CAMPAIGN ERROR", err);
    res.status(500).json({ message: "Save failed", error: err.message });
  }
};

exports.deleteCampaignHistory = async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};