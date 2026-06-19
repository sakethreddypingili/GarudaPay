const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");

// GET /api/admin/stats
const getPlatformStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        
        const users = await User.find({ role: "user" });
        const totalBalance = users.reduce((acc, user) => acc + (user.balance || 0), 0);
        
        const totalTransactions = await Transaction.countDocuments({});

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBalance,
                totalTransactions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" }).select("-password");
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/admin/users/:id/balance
const updateUserBalance = async (req, res) => {
    try {
        const { balance } = req.body;
        if (balance === undefined || isNaN(balance) || balance < 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid balance amount."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { balance: parseFloat(balance) },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "User balance updated successfully.",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getPlatformStats,
    getAllUsers,
    updateUserBalance
};
