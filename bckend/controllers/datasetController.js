const Dataset = require("../models/Dataset");

// ================= SAVE DATASET =================
exports.saveDataset = async (req, res) => {

    try {

        const { name, customers } = req.body;

        if (!name || !customers || !customers.length) {
            return res.status(400).json({
                message: "Invalid dataset"
            });
        }

        // 🔥 Trim dataset name
        const cleanName = name.trim();

        if (!cleanName) {
            return res.status(400).json({
                message: "Dataset name required"
            });
        }

        // 🔥 Email + Phone patterns
        const emailPattern = /^[^\s@]+@[^\s@]+$/;
        const phonePattern = /^[0-9]{10}$/;

        // 🔥 Prevent duplicate content (deep compare)
        const existingDatasets =
            await Dataset.find({ owner: req.user.id });

        const isDuplicateContent =
            existingDatasets.some(d =>
                JSON.stringify(d.customers) === JSON.stringify(customers)
            );

        if (isDuplicateContent) {
            return res.status(400).json({
                message: "Duplicate dataset content not allowed"
            });
        }

        // 🔥 Prevent duplicate emails inside dataset
        const emailSet = new Set();

        for (let c of customers) {

            if (!c.name || !c.name.trim()) {
                return res.status(400).json({
                    message: "Customer name missing"
                });
            }

            if (!c.email) {
                return res.status(400).json({
                    message: "Customer email missing"
                });
            }

            const normalizedEmail = c.email.trim().toLowerCase();

            if (!emailPattern.test(normalizedEmail)) {
                return res.status(400).json({
                    message: "Invalid email format"
                });
            }

            if (emailSet.has(normalizedEmail)) {
                return res.status(400).json({
                    message: "Duplicate email inside dataset"
                });
            }

            emailSet.add(normalizedEmail);

            // 🔥 Strict 10-digit phone validation
            if (!c.phone || !phonePattern.test(String(c.phone))) {
                return res.status(400).json({
                    message: "Phone must be exactly 10 digits"
                });
            }
        }

        const dataset = await Dataset.create({
            owner: req.user.id,
            name: cleanName,
            customers
        });

        res.json({
            success: true,
            dataset
        });

    } catch (err) {

        // 🔥 Handle duplicate name error (Mongo unique index)
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Dataset name already exists"
            });
        }

        console.error(err);
        res.status(500).json({
            message: "Dataset save failed"
        });
    }
};

// ================= GET DATASETS =================
exports.getDatasets = async (req, res) => {
    try {
        const datasets = await Dataset.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            datasets
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to fetch datasets"
        });
    }
};

// ================= DELETE DATASET =================
exports.deleteDataset = async (req, res) => {
    try {
        const dataset = await Dataset.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!dataset) {
            return res.status(404).json({
                message: "Dataset not found"
            });
        }
        res.json({
            success: true,
            message: "Dataset deleted"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to delete dataset"
        });
    }
};

// ================= UPDATE DATASET =================
exports.updateDataset = async (req, res) => {
    try {
        const { customers } = req.body;

        // Ensure email uniqueness and 10 digit phones for the array just in case
        const emailPattern = /^[^\s@]+@[^\s@]+$/;
        const phonePattern = /^[0-9]{10}$/;
        const emailSet = new Set();

        if (customers && customers.length > 0) {
            for (let c of customers) {
                if (!c.name || !c.name.trim()) return res.status(400).json({ message: "Customer name missing" });
                if (!c.email) return res.status(400).json({ message: "Customer email missing" });

                const normalizedEmail = c.email.trim().toLowerCase();
                if (!emailPattern.test(normalizedEmail)) return res.status(400).json({ message: "Invalid email format" });
                if (emailSet.has(normalizedEmail)) return res.status(400).json({ message: "Duplicate email inside dataset" });
                emailSet.add(normalizedEmail);

                if (!c.phone || !phonePattern.test(String(c.phone))) return res.status(400).json({ message: "Phone must be exactly 10 digits" });
            }
        }

        const dataset = await Dataset.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { customers },
            { new: true }
        );

        if (!dataset) return res.status(404).json({ message: "Dataset not found" });

        res.json({ success: true, dataset });
    } catch (err) {
        console.error("Dataset update error:", err);
        res.status(500).json({ message: "Dataset update failed" });
    }
};