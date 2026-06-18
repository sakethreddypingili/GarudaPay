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

async function getDashboardSummary(req, res) {
    try {
        const user = await getUserFromReq(req);
        const userId = user._id;

        // Count total transactions where user is sender or receiver
        const totalTransactions = await Transaction.countDocuments({
            $or: [{ sender: userId }, { receiver: userId }]
        });

        // Calculate total sent (debits where sender is user and receiver is someone else)
        const sentTx = await Transaction.aggregate([
            {
                $match: {
                    sender: userId,
                    type: "debit",
                    receiver: { $ne: userId },
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const totalSent = sentTx.length > 0 ? sentTx[0].total : 0;

        // Calculate total received (credits where receiver is user + debits where receiver is user but sender is someone else)
        const receivedTx = await Transaction.aggregate([
            {
                $match: {
                    receiver: userId,
                    status: "completed",
                    $or: [
                        { type: "credit" },
                        { type: "debit", sender: { $ne: userId } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);
        const totalReceived = receivedTx.length > 0 ? receivedTx[0].total : 0;

        res.json({
            walletBalance: user.balance,
            totalSent,
            totalReceived,
            totalTransactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function getRecentActivity(req, res) {
    try {
        const user = await getUserFromReq(req);
        const userId = user._id;

        const txs = await Transaction.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

        const formattedTransactions = txs.map(tx => {
            const isSender = tx.sender && tx.sender._id.toString() === userId.toString();
            const type = isSender ? "sent" : "received";
            const icon = type === "sent" ? "S" : "R";
            const dateStr = new Date(tx.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            });
            return {
                id: tx._id,
                title: tx.description || (type === "sent" ? `Sent to ${tx.receiver ? tx.receiver.name : 'Unknown'}` : `Received from ${tx.sender ? tx.sender.name : 'Unknown'}`),
                amount: tx.amount,
                type,
                date: dateStr,
                icon
            };
        });

        const activities = [];
        txs.forEach((tx, idx) => {
            const isSender = tx.sender && tx.sender._id.toString() === userId.toString();
            const relativeTime = idx === 0 ? "Just now" : `${idx * 15} min ago`;
            if (isSender) {
                activities.push({
                    id: `act-${tx._id}`,
                    title: "Money Sent",
                    message: `Payment of ₹${tx.amount} completed.`,
                    time: relativeTime,
                    icon: "S"
                });
            } else {
                activities.push({
                    id: `act-${tx._id}`,
                    title: "Money Received",
                    message: `Received ₹${tx.amount} from ${tx.sender ? tx.sender.name : 'Unknown'}.`,
                    time: relativeTime,
                    icon: "R"
                });
            }
        });

        // Add a generic system activity
        activities.push({
            id: "act-sys-1",
            title: "Security Check",
            message: "Account login security verified.",
            time: "Today",
            icon: "N"
        });

        res.json({
            transactions: formattedTransactions,
            activities: activities
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getDashboardSummary,
    getRecentActivity
};
