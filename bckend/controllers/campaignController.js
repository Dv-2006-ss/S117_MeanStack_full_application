const Campaign = require("../models/Campaign");
const Template = require("../models/Template");
const bulkService = require("../services/bulkService");
const render = require("../utils/templateRenderer");
const User = require("../models/User");

const EXECUTABLE_CHANNELS = ["email", "sms"];

const normalizeArray = (value, fallback = []) =>
  Array.isArray(value) && value.length ? value : fallback;

const serializeCampaign = (campaign) => ({
  _id: campaign._id,
  name: campaign.name,
  goal: campaign.goal,
  subject: campaign.subject,
  product: campaign.product,
  offer: campaign.offer,
  cta: campaign.cta,
  campaignType: campaign.campaignType,
  selectedChannels: campaign.selectedChannels || [],
  sourceDataset: campaign.sourceDataset || null,
  sourceSegment: campaign.sourceSegment,
  status: campaign.status,
  sentCount: campaign.sentCount,
  scheduledAt: campaign.scheduledAt,
  generatedOutputs: campaign.generatedOutputs || {},
  htmlContent: campaign.htmlContent,
  targetAudience: campaign.targetAudience || [],
  deliveryLogs: campaign.deliveryLogs || [],
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt
});

const createGeneratedOutputs = (payload = {}, user = null) => {
  const companyName = user?.companyName || "Your business";
  const brandVoice = payload.brandProfile?.brandVoice || user?.brandProfile?.brandVoice || "clear and practical";
  const audience = payload.audienceDescription || user?.brandProfile?.audienceDescription || "busy customers";
  const offer = payload.offer || user?.brandProfile?.primaryOffer || "your newest offer";
  const cta = payload.cta || "Get started";
  const goalLabel = payload.goalLabel || payload.goal || "promote your offer";
  const channelSet = new Set(normalizeArray(payload.selectedChannels, ["email"]));
  const headline = `${companyName} helps ${audience} ${goalLabel.replace(/-/g, " ")}`;
  const subhead = `Launch faster with a ${brandVoice.toLowerCase()} campaign plan built around ${offer}.`;

  return {
    email: channelSet.has("email")
      ? {
          subject: payload.subject || `${companyName}: ${cta}`,
          body: [
            `<h1>${headline}</h1>`,
            `<p>${subhead}</p>`,
            `<p>Why now: ${offer} gives your audience a clear next step without needing a full marketing team.</p>`,
            `<p><strong>Call to action:</strong> ${cta}</p>`,
            `<p>Suggested close: Reply to this email or click through to claim the offer.</p>`
          ].join("")
        }
      : { subject: "", body: "" },
    sms: channelSet.has("sms")
      ? {
          message: `${companyName}: ${offer}. ${cta}. Reply for details.`
        }
      : { message: "" },
    social: {
      posts: [
        `${headline}. ${cta}.`,
        `Small team, big campaign energy. ${offer} is live now. ${cta}.`,
        `Need a faster way to launch? ${companyName} is built to help ${audience}. ${cta}.`
      ]
    },
    ads: {
      headlines: [
        `${companyName} Campaigns in Minutes`,
        `Launch Faster Without Hiring Help`,
        `${cta} with a Clear Offer`
      ],
      body: `${companyName} helps small teams create email, SMS, and launch-ready campaign assets around ${offer}.`
    },
    landingPage: {
      headline,
      subhead,
      cta,
      sections: [
        "Problem: Campaign setup takes too long for small teams.",
        "Solution: CampaignAI creates guided campaign assets from one brief.",
        "How it works: pick a goal, audience, offer, and channels.",
        "Why it matters: stay consistent, launch faster, and reuse what works."
      ]
    }
  };
};

const upsertTemplate = async (campaign, ownerId, blocks) => {
  if (!Array.isArray(blocks) || !blocks.length) {
    return campaign?.template || null;
  }

  if (campaign?.template) {
    await Template.findByIdAndUpdate(campaign.template, { blocks });
    return campaign.template;
  }

  const template = await Template.create({
    owner: ownerId,
    name: `${campaign?.name || "Campaign"} Template`,
    channel: "email",
    blocks
  });

  return template._id;
};

const buildCampaignUpdate = async (body, existingCampaign, user) => {
  const selectedChannels = normalizeArray(body.selectedChannels, existingCampaign?.selectedChannels || ["email"]);
  const generatedOutputs = body.generatedOutputs || createGeneratedOutputs(body, user);
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];
  const htmlFromBlocks = blocks.length ? render(blocks) : "";
  const templateId = await upsertTemplate(existingCampaign, user._id, blocks);

  return {
    name: body.name,
    goal: body.goal || existingCampaign?.goal || "promote-an-offer",
    subject: body.subject || generatedOutputs.email?.subject || existingCampaign?.subject || "",
    product: body.product || existingCampaign?.product || "",
    offer: body.offer || existingCampaign?.offer || "",
    cta: body.cta || existingCampaign?.cta || "",
    campaignType: selectedChannels[0] || "email",
    selectedChannels,
    sourceDataset: body.sourceDataset || existingCampaign?.sourceDataset,
    sourceSegment: body.sourceSegment || existingCampaign?.sourceSegment || "All contacts",
    generatedOutputs,
    htmlContent: body.htmlContent || generatedOutputs.email?.body || htmlFromBlocks || existingCampaign?.htmlContent || "",
    status: body.status || existingCampaign?.status || "draft",
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : existingCampaign?.scheduledAt,
    targetAudience: Array.isArray(body.targetAudience) ? body.targetAudience : existingCampaign?.targetAudience || [],
    template: templateId || existingCampaign?.template || undefined
  };
};

const triggerCampaignDelivery = async (campaign, audience, user, io) => {
  const channels = (campaign.selectedChannels || []).filter((channel) => EXECUTABLE_CHANNELS.includes(channel));
  const companyName = user?.companyName || "CampaignAI";
  const companyEmail = user?.email || process.env.EMAIL_FROM || "no-reply@campaignai.app";

  for (const channel of channels) {
    let processed = 0;
    const onProgress = async (batchResults) => {
      const newLogs = batchResults.map((result) => ({
        target: result.email || result.phone,
        status: result.status,
        error: result.error
      }));
      const sentIncrement = newLogs.filter((log) => log.status === "sent").length;
      processed += batchResults.length;

      await Campaign.findByIdAndUpdate(campaign._id, {
        $push: { deliveryLogs: { $each: newLogs } },
        $inc: { sentCount: sentIncrement }
      });

      if (io) {
        io.to("stats_room").emit("campaign:progress", {
          campaignId: campaign._id,
          channel,
          processed,
          total: audience.length,
          percentage: audience.length ? Math.round((processed / audience.length) * 100) : 0
        });
      }
    };

    if (channel === "sms") {
      bulkService.sendBulkSMS(
        audience.filter((entry) => entry.phone),
        campaign.generatedOutputs?.sms?.message || campaign.cta || campaign.offer || campaign.name,
        companyName,
        onProgress
      ).catch(console.error);
      continue;
    }

    bulkService.sendBulkEmails(
      audience.filter((entry) => entry.email),
      campaign.generatedOutputs?.email?.subject || campaign.subject || campaign.name,
      () => campaign.generatedOutputs?.email?.body || campaign.htmlContent || "",
      companyName,
      companyEmail,
      onProgress
    ).catch(console.error);
  }
};

exports.generateCampaignOutputs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const generatedOutputs = createGeneratedOutputs(req.body, user);
    res.json({ success: true, generatedOutputs });
  } catch (err) {
    res.status(500).json({ message: "Generation failed", error: err.message });
  }
};

exports.getCampaignOverview = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.id }).sort({ updatedAt: -1 }).limit(5);
    const allCampaigns = await Campaign.find({ owner: req.user.id });
    const datasets = new Set(
      allCampaigns
        .map((campaign) => campaign.sourceDataset?.name)
        .filter(Boolean)
    );

    const summary = allCampaigns.reduce((acc, campaign) => {
      acc.totalCampaigns += 1;
      acc.audienceReached += campaign.sentCount || 0;
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {
      totalCampaigns: 0,
      audienceReached: 0,
      draft: 0,
      scheduled: 0,
      sent: 0
    });

    res.json({
      success: true,
      overview: {
        totalCampaigns: summary.totalCampaigns,
        draftCount: summary.draft,
        scheduledCount: summary.scheduled,
        sentCount: summary.sent,
        audienceReached: summary.audienceReached,
        activeDatasets: datasets.size,
        nextRecommendedAction: datasets.size
          ? "Create a new campaign brief"
          : "Import a customer dataset to start your first campaign",
        recentCampaigns: campaigns.map(serializeCampaign)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Overview fetch failed", error: err.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let campaign = req.body._id
      ? await Campaign.findOne({ _id: req.body._id, owner: req.user.id })
      : null;

    const update = await buildCampaignUpdate(req.body, campaign, user);

    if (campaign) {
      Object.assign(campaign, update);
      await campaign.save();
    } else {
      campaign = await Campaign.create({
        owner: req.user.id,
        ...update
      });
    }

    res.json({ success: true, campaign: serializeCampaign(campaign) });
  } catch (err) {
    res.status(500).json({ message: "Campaign save failed", error: err.message });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    res.json(campaigns.map(serializeCampaign));
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user.id });
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const audience = Array.isArray(req.body.targetAudience) && req.body.targetAudience.length
      ? req.body.targetAudience
      : campaign.targetAudience || [];

    if (!audience.length) {
      return res.status(400).json({ message: "Campaign audience is empty" });
    }

    const isScheduled = !!req.body.scheduledAt;
    campaign.status = isScheduled ? "scheduled" : "sent";
    campaign.scheduledAt = isScheduled ? new Date(req.body.scheduledAt) : undefined;
    campaign.targetAudience = audience;
    campaign.deliveryLogs = [];
    campaign.sentCount = 0;
    await campaign.save();

    if (!isScheduled) {
      const user = await User.findById(req.user.id);
      await triggerCampaignDelivery(campaign, audience, user, req.app.get("io"));
    }

    res.json({
      success: true,
      campaign: serializeCampaign(campaign),
      message: isScheduled ? "Campaign scheduled" : "Campaign send started"
    });
  } catch (err) {
    res.status(500).json({ message: "Send failed", error: err.message });
  }
};

exports.createEmailCampaign = async (req, res) => {
  try {
    const htmlContent = render(req.body.blocks || []);
    req.body.selectedChannels = ["email"];
    req.body.generatedOutputs = {
      ...(req.body.generatedOutputs || {}),
      email: {
        subject: req.body.subject || req.body.name,
        body: htmlContent
      }
    };
    req.body.htmlContent = htmlContent;
    return exports.createCampaign(req, res);
  } catch (err) {
    res.status(500).json({ message: "Email creation failed", error: err.message });
  }
};

exports.getCampaignHistory = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(campaigns.map((campaign) => ({
      _id: campaign._id,
      name: campaign.name,
      type: campaign.campaignType,
      types: campaign.selectedChannels || [campaign.campaignType],
      status: campaign.status,
      total: campaign.sentCount,
      date: campaign.createdAt,
      deliveryLogs: campaign.deliveryLogs || []
    })));
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

exports.saveCampaignHistory = async (req, res) => {
  try {
    const generatedOutputs = {
      email: {
        subject: req.body.subject || req.body.name,
        body: req.body.message || ""
      },
      sms: {
        message: req.body.type === "sms" ? req.body.message || "" : ""
      },
      social: { posts: [] },
      ads: { headlines: [], body: "" },
      landingPage: { headline: "", subhead: "", cta: "", sections: [] }
    };

    req.body.selectedChannels = req.body.types || [req.body.type || "email"];
    req.body.generatedOutputs = generatedOutputs;
    req.body.targetAudience = req.body.audience || [];
    req.body.status = req.body.status === "Complete"
      ? "sent"
      : req.body.status === "Scheduled"
        ? "scheduled"
        : "draft";
    req.body.scheduledAt = req.body.scheduledDate;

    const createRes = {
      json: (payload) => payload,
      status: (code) => ({
        json: (payload) => ({ statusCode: code, ...payload })
      })
    };

    const saved = await exports.createCampaign(req, createRes);
    if (req.body.status === "sent" || req.body.status === "scheduled") {
      req.params = { ...(req.params || {}), id: saved.campaign._id };
      return exports.sendCampaign(req, res);
    }

    res.json({ success: true, history: saved.campaign });
  } catch (err) {
    res.status(500).json({ message: "Modernized save failed", error: err.message });
  }
};

exports.deleteCampaignHistory = exports.deleteCampaign;
