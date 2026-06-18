const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');

// Helper to get or create a default demo user
const getOrCreateDemoUser = async () => {
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

// Helper to get user from request if authenticated, else fallback to demo user
const getUserFromReq = async (req) => {
    if (req.user && req.user.id) {
        const user = await User.findById(req.user.id);
        if (user) {
            return user;
        }
    }
    return await getOrCreateDemoUser();
};

// GET /api/wallet/user
exports.getOrCreateUser = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        res.status(200).json({
            name: user.name,
            email: user.email,
            walletBalance: user.balance,
            walletStatus: 'Active'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/wallet/balance
exports.getWalletBalance = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        res.status(200).json({ balance: user.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/wallet/topup
exports.topupWallet = async (req, res) => {
    try {
        const { amount, method } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Please enter a valid amount.' });
        }

        const user = await getUserFromReq(req);
        user.balance += amount;
        await user.save();

        const ref = 'GP-TX-' + Math.floor(1000 + Math.random() * 9000);
        // Create transaction matching new schema (sender/receiver both = user for self top-up)
        const newTx = new Transaction({
            sender: user._id,
            receiver: user._id,
            amount: amount,
            type: 'credit',
            status: 'completed',
            description: `Wallet Top-up (${method})`,
            reference: ref
        });

        await newTx.save();

        res.status(201).json({
            success: true,
            transaction: {
                transactionId: ref,
                title: newTx.description,
                amount: amount,
                method: method,
                date: newTx.createdAt.toISOString().replace('T', ' ').substring(0, 16)
            },
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/wallet/summary
exports.getWalletSummary = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        const txs = await Transaction.find({
            $or: [{ sender: user._id }, { receiver: user._id }]
        }).sort({ createdAt: -1 });

        const formatted = txs.map(tx => {
            const isSender = tx.sender.toString() === user._id.toString() && tx.type === 'debit';
            return {
                title: tx.description || (isSender ? `UPI Transfer` : `Wallet Top-up`),
                amount: isSender ? -tx.amount : tx.amount,
                date: tx.createdAt.toISOString().replace('T', ' ').substring(0, 16),
                transactionId: tx.reference || tx._id.toString()
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/wallet/transfer
exports.transferWallet = async (req, res) => {
    try {
        const { amount, recipient } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Please enter a valid amount.' });
        }
        if (!recipient) {
            return res.status(400).json({ error: 'Please specify a recipient.' });
        }

        const user = await getUserFromReq(req);
        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        // Try to find if recipient is an existing user by email or name (case-insensitive)
        const recipientUser = await User.findOne({
            $or: [
                { email: recipient.toLowerCase().trim() },
                { name: { $regex: new RegExp(`^${recipient.trim()}$`, 'i') } }
            ]
        });

        user.balance -= amount;
        await user.save();

        let receiverId = user._id; // fallback if recipient is just free text
        if (recipientUser && recipientUser._id.toString() !== user._id.toString()) {
            recipientUser.balance += amount;
            await recipientUser.save();
            receiverId = recipientUser._id;
        }

        const ref = 'GP-TX-' + Math.floor(1000 + Math.random() * 9000);
        // Create transaction matching new schema (sender = user, receiver = receiverId)
        const newTx = new Transaction({
            sender: user._id,
            receiver: receiverId,
            amount: amount,
            type: 'debit',
            status: 'completed',
            description: `UPI Transfer to ${recipient}`,
            reference: ref
        });

        await newTx.save();

        res.status(201).json({
            success: true,
            transaction: {
                transactionId: ref,
                title: newTx.description,
                amount: -amount,
                method: 'UPI',
                date: newTx.createdAt.toISOString().replace('T', ' ').substring(0, 16)
            },
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};