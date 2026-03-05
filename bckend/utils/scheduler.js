const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const User = require('../models/User');
const bulkService = require('../services/bulkService');

// Run every minute to check for scheduled campaigns
exports.initScheduler = () => {
    console.log("⏰ Initializing Campaign Scheduler...");

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // 1. Acquire "locks" on scheduled campaigns that are ready to run
            // We use updateMany/findOneAndUpdate or simply find and update to prevent multiple workers 
            // from picking the exact same campaign in a clustered SaaS environment.
            const pendingCampaigns = await Campaign.find({
                status: 'scheduled',
                scheduledAt: { $lte: now }
            });

            if (pendingCampaigns.length > 0) {
                console.log(`🚀 Found ${pendingCampaigns.length} scheduled campaign(s) ready to send!`);

                for (const campaign of pendingCampaigns) {
                    try {
                        // Optimistically set to processing
                        // Atomically attempt to claim this campaign
                        const claimedCampaign = await Campaign.findOneAndUpdate(
                            { _id: campaign._id, status: 'scheduled' },
                            { $set: { status: 'processing' } },
                            { new: true }
                        );

                        if (!claimedCampaign) {
                            // Another worker already claimed it
                            continue;
                        }

                        let customers = claimedCampaign.targetAudience || [];
                        if (!customers || customers.length === 0) {
                            customers = await Customer.find({ owner: claimedCampaign.owner });
                        }

                        if (!customers.length) {
                            claimedCampaign.status = 'failed';
                            await claimedCampaign.save();
                            console.log(`❌ Campaign ${claimedCampaign.name} failed: No customers/audience found.`);
                            continue;
                        }

                        const userObj = await User.findById(claimedCampaign.owner);
                        const companyName = userObj ? userObj.companyName : "Velox";
                        const companyEmail = userObj ? userObj.email : process.env.EMAIL_FROM;

                        const message = claimedCampaign.htmlContent || "";
                        const subject = claimedCampaign.subject || claimedCampaign.name;

                        // Check types: campaignType can be comma separated, e.g. "email,sms"
                        const types = (claimedCampaign.campaignType || "email").split(',').map(t => t.trim().toLowerCase());
                        const isSms = types.includes('sms');
                        const isEmail = types.includes('email');

                        console.log(`▶️ Processing Campaign: ${claimedCampaign.name} (Types: ${types.join(', ')}) with ${customers.length} targets.`);

                        const sendPromises = [];

                        if (isSms) {
                            sendPromises.push(
                                bulkService.sendBulkSMS(customers, message, companyName, async (batchResults) => {
                                    const newLogs = batchResults.map(r => ({ target: r.phone, status: r.status, error: r.error }));
                                    const incValue = newLogs.filter(r => r.status === "sent").length;
                                    await Campaign.findByIdAndUpdate(claimedCampaign._id, {
                                        $push: { deliveryLogs: { $each: newLogs } },
                                        $inc: { sentCount: incValue }
                                    });
                                })
                            );
                        }

                        if (isEmail) {
                            sendPromises.push(
                                bulkService.sendBulkEmails(customers, subject, user => {
                                    let content = message || `<p>Hello ${user.name || 'Customer'}</p>`;
                                    return content.replace(/{{name}}/gi, user.name || '');
                                }, companyName, companyEmail, async (batchResults) => {
                                    const newLogs = batchResults.map(r => ({ target: r.email, status: r.status, error: r.error }));
                                    const incValue = newLogs.filter(r => r.status === "sent").length;
                                    await Campaign.findByIdAndUpdate(claimedCampaign._id, {
                                        $push: { deliveryLogs: { $each: newLogs } },
                                        $inc: { sentCount: incValue }
                                    });
                                })
                            );
                        }

                        // Wait for all channels to finish sending
                        // This turns node-cron into a robust processor mimicking a BullMQ/Agenda setup
                        await Promise.allSettled(sendPromises);

                        // Mark as completely done
                        await Campaign.findByIdAndUpdate(claimedCampaign._id, { status: 'sent' });
                        console.log(`✅ Completed dispatch for Campaign: ${claimedCampaign.name}`);

                    } catch (e) {
                        console.error(`Failed to execute scheduled campaign ${campaign._id}`, e);
                        await Campaign.findByIdAndUpdate(campaign._id, { status: 'failed' });
                    }
                }
            }
        } catch (error) {
            console.error("Scheduler Error:", error);
        }
    });
};
