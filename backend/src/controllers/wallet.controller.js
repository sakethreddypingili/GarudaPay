const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");

const getOrCreateDemoUser = async () => {
  let user = await User.findOne({ email: "demo@garudapay.com" });
  if (!user) {
    user = new User({
      name: "Demo User",
      email: "demo@garudapay.com",
      password: "password123",
      balance: 1000.0
    });
    await user.save();
  }
  return user;
};

const getOrCreateUser = async (req, res) => {
  try {
    const user = await getOrCreateDemoUser();
    return res.status(200).json({
      name: user.name,
      email: user.email,
      walletBalance: user.balance,
      walletStatus: "Active"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const user = await getOrCreateDemoUser();
    return res.status(200).json({ balance: user.balance });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const topUp = async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Please enter a valid amount." });
    }

    const user = await getOrCreateDemoUser();
    user.balance += amount;
    await user.save();

    const ref = "GP-TX-" + Math.floor(1000 + Math.random() * 9000);
    const newTx = new Transaction({
      sender: user._id,
      receiver: user._id,
      amount: amount,
      type: "credit",
      status: "completed",
      description: `Wallet Top-up (${method})`,
      reference: ref
    });

    await newTx.save();

    return res.status(201).json({
      success: true,
      transaction: {
        transactionId: ref,
        title: newTx.description,
        amount: amount,
        method: method,
        date: newTx.createdAt.toISOString().replace("T", " ").substring(0, 16)
      },
      newBalance: user.balance
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getWalletSummary = async (req, res) => {
  try {
    const user = await getOrCreateDemoUser();
    const txs = await Transaction.find({
      $or: [{ sender: user._id }, { receiver: user._id }]
    }).sort({ createdAt: -1 });

    const formatted = txs.map((tx) => {
      const isSender =
        tx.sender.toString() === user._id.toString() && tx.type === "debit";
      return {
        title: tx.description || (isSender ? "UPI Transfer" : "Wallet Top-up"),
        amount: isSender ? -tx.amount : tx.amount,
        date: tx.createdAt.toISOString().replace("T", " ").substring(0, 16),
        transactionId: tx.reference || tx._id.toString()
      };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const transferWallet = async (req, res) => {
  try {
    const { amount, recipient } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Please enter a valid amount." });
    }
    if (!recipient) {
      return res.status(400).json({ error: "Please specify a recipient." });
    }

    const user = await getOrCreateDemoUser();
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    user.balance -= amount;
    await user.save();

    const ref = "GP-TX-" + Math.floor(1000 + Math.random() * 9000);
    const newTx = new Transaction({
      sender: user._id,
      receiver: user._id,
      amount: amount,
      type: "debit",
      status: "completed",
      description: `UPI Transfer to ${recipient}`,
      reference: ref
    });

    await newTx.save();

    return res.status(201).json({
      success: true,
      transaction: {
        transactionId: ref,
        title: newTx.description,
        amount: -amount,
        method: "UPI",
        date: newTx.createdAt.toISOString().replace("T", " ").substring(0, 16)
      },
      newBalance: user.balance
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrCreateUser,
  getWalletBalance,
  topUp,
  getWalletSummary,
  transferWallet
};
