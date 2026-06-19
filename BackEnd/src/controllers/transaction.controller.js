const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");

// get all transactions for the logged in user
const getHistory = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // pagination setup
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const { type, status, from, to, search } = req.query;

        // every query starts with, show me MY transactions only
        const filter = {
            $or: [{ sender: userId }, { receiver: userId }]
        };

        // apply filters only if they were actually sent
        if (type && ["credit", "debit"].includes(type)) {
            filter.type = type;
        }

        if (status && ["pending", "completed", "failed"].includes(status)) {
            filter.status = status;
        }

        // date range, if user wants transactions between two dates
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999); // include the full last day
                filter.createdAt.$lte = toDate;
            }
        }

        // search inside description field, case insensitive
        if (search && search.trim()) {
            filter.description = {
                $regex: search.trim(),
                $options: "i"
            };
        }

        // running both queries together is faster than one after another
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

        res.json({
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

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// get a single transaction by its id
// only the sender or receiver of that transaction can see it
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        // check if id is even a valid mongodb id before querying
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

        // make sure the person asking is actually part of this transaction
        const userId = req.user.id;
        const isSender = transaction.sender._id.toString() === userId;
        const isReceiver = transaction.receiver._id.toString() === userId;

        if (!isSender && !isReceiver) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this transaction"
            });
        }

        res.json({
            success: true,
            data: transaction
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

// export transactions as a csv file download
// supports same filters as getHistory but no pagination
const exportTransactions = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { type, status, from, to, search } = req.query;

        // same filter logic as getHistory
        const filter = {
            $or: [{ sender: userId }, { receiver: userId }]
        };

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

        // no pagination for export, get everything but cap at 10000 for safety
        const transactions = await Transaction.find(filter)
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .sort({ createdAt: -1 })
            .limit(10000);

        // wrap values in quotes if they contain a comma
        const escape = (val) => {
            const str = String(val ?? "");
            return str.includes(",") ? `"${str}"` : str;
        };

        const headers = [
            "Date",
            "Reference",
            "Type",
            "Amount (Rs)",
            "Status",
            "Sender",
            "Receiver",
            "Description"
        ];

        const rows = transactions.map(txn => [
            new Date(txn.createdAt).toLocaleDateString("en-IN"),
            txn.reference || "",
            txn.type.toUpperCase(),
            txn.amount.toFixed(2),
            txn.status,
            `${txn.sender.name} (${txn.sender.email})`,
            `${txn.receiver.name} (${txn.receiver.email})`,
            txn.description || ""
        ]);

        const csv = [
            headers.map(escape).join(","),
            ...rows.map(row => row.map(escape).join(","))
        ].join("\n");

        // these headers tell the browser to download this as a file
        const filename = `garudapay_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        res.send(csv);

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
};

module.exports = {
    getHistory,
    getTransactionById,
    exportTransactions
};
