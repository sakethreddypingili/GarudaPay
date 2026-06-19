const mongoose = require("mongoose");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");

// Helper to get user from request if authenticated, else fallback to demo user
const getUserFromReq = async (req) => {
    if (req.user && req.user.id) {
        const user = await User.findById(req.user.id);
        if (user) return user;
    }
    // Fallback to default demo user
    let user = await User.findOne({ email: 'demo@garudapay.com' });
    if (!user) {
        user = new User({
            name: 'Demo User',
            email: 'demo@garudapay.com',
            password: 'password123',
            balance: 1000.00
        });
        await user.save();
    }
    return user;
};

async function getNotifications(req, res) {
    try {
        const user = await getUserFromReq(req);
        const userId = user._id;

        const txs = await Transaction.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 })
        .limit(10);

        const notifications = txs.map((tx, idx) => {
            const isSender = tx.sender && tx.sender._id.toString() === userId.toString();
            let message = "";
            let icon = "N";

            if (tx.sender && tx.receiver && tx.sender._id.toString() === tx.receiver._id.toString()) {
                message = `Wallet Top-up of ₹${tx.amount} completed successfully.`;
                icon = "W";
            } else if (isSender) {
                message = `Money Sent: ₹${tx.amount} sent to ${tx.receiver ? tx.receiver.name : 'Unknown'}.`;
                icon = "S";
            } else {
                message = `Money Received: ₹${tx.amount} received from ${tx.sender ? tx.sender.name : 'Unknown'}.`;
                icon = "R";
            }

            const dateStr = new Date(tx.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });

            return {
                id: tx._id,
                message: message,
                date: dateStr,
                status: idx === 0 ? "New" : "Read",
                icon: icon
            };
        });

        // Always add a welcome notification
        notifications.push({
            id: "system-welcome",
            message: `Welcome to GarudaPay, ${user.name}! Your account is active.`,
            date: new Date(user.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            status: "Read",
            icon: "N"
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getNotifications
};
