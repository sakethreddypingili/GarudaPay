const mongoose = require("mongoose");

// creating schema for storing transaction data in the db
const transactionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, "Amount must be greater than 0"]
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "completed", "faied"],
            default: "pending"
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        reference: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    {
        timestamps: true
    }
)
// Index on sender + createdAt. This helps mongodb to searhc fast
// here serder is userId sorted by newest first
// When user fetches history, MongoDB needs to find all transactions
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 }); // same for the reciever

module.exports = mongoose.model("Transaction", transactionSchema);