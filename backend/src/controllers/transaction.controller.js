const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const sendTransactionMail = require("../services/mailService");

const getHistory = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const { type, status, from, to, search } = req.query;

    const filter = { $or: [{ sender: userId }, { receiver: userId }] };

    if (type && ["credit", "debit"].includes(type)) filter.type = type;
    if (status && ["pending", "completed", "failed"].includes(status)) {
      filter.status = status;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (search && search.trim()) {
      filter.description = { $regex: search.trim(), $options: "i" };
    }

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const userId = req.user.id;
    const isSender = transaction.sender._id.toString() === userId;
    const isReceiver = transaction.receiver._id.toString() === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this transaction"
      });
    }

    return res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const exportTransactions = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { type, status, from, to, search } = req.query;

    const filter = { $or: [{ sender: userId }, { receiver: userId }] };
    if (type && ["credit", "debit"].includes(type)) filter.type = type;
    if (status && ["pending", "completed", "failed"].includes(status)) filter.status = status;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    if (search && search.trim()) {
      filter.description = { $regex: search.trim(), $options: "i" };
    }

    const transactions = await Transaction.find(filter)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .limit(10000);

    const escape = (value) => {
      const stringValue = String(value ?? "");
      return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
    };

    const headers = ["Date", "Reference", "Type", "Amount (Rs)", "Status", "Sender", "Receiver", "Description"];
    const rows = transactions.map((transaction) => [
      new Date(transaction.createdAt).toLocaleDateString("en-IN"),
      transaction.reference || "",
      transaction.type.toUpperCase(),
      transaction.amount.toFixed(2),
      transaction.status,
      `${transaction.sender.name} (${transaction.sender.email})`,
      `${transaction.receiver.name} (${transaction.receiver.email})`,
      transaction.description || ""
    ]);

    const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
    const filename = `garudapay_transactions_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const sendMoney = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const senderId = req.user.id;
    const { receiver, amount, note } = req.body;
    const transferAmount = Number(amount);

    if (!receiver || !transferAmount) {
      return res.status(400).json({
        success: false,
        message: "Receiver and amount required"
      });
    }

    if (transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    session.startTransaction();

    const sender = await User.findById(senderId).session(session);
    if (!sender) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });
    }

    const receiverUser = await User.findOne({
      $or: [
        { email: receiver },
        { upiId: receiver }
      ]
    }).session(session);

    if (!receiverUser) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });
    }

    if (sender._id.toString() === receiverUser._id.toString()) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Cannot send money to yourself"
      });
    }

    if (sender.balance < transferAmount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    sender.balance -= transferAmount;
    receiverUser.balance += transferAmount;

    await sender.save({ session });
    await receiverUser.save({ session });

    const reference = new mongoose.Types.ObjectId().toString();

    const [debitTransaction, creditTransaction] = await Transaction.create(
      [
        {
          sender: sender._id,
          receiver: receiverUser._id,
          amount: transferAmount,
          type: "debit",
          status: "completed",
          description: note || ""
        },
        {
          sender: sender._id,
          receiver: receiverUser._id,
          amount: transferAmount,
          type: "credit",
          status: "completed",
          description: note || ""
        }
      ],
      { session }
    );

    debitTransaction.reference = `${reference}-debit`;
    creditTransaction.reference = `${reference}-credit`;
    await debitTransaction.save({ session });
    await creditTransaction.save({ session });

    await session.commitTransaction();

    await sendTransactionMail({
      senderEmail: sender.email,
      receiverEmail: receiverUser.email,
      amount: transferAmount,
      note,
      senderName: sender.name,
      receiverName: receiverUser.name,
      senderBalance: sender.balance,
      receiverBalance: receiverUser.balance
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Money sent successfully",
      transactions: {
        debit: debitTransaction,
        credit: creditTransaction
      }
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getHistory,
  getTransactionById,
  exportTransactions,
  sendMoney
};
