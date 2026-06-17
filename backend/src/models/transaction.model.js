const mongoose = require("mongoose");

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
      enum: ["pending", "completed", "failed"],
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
  { timestamps: true }
);

transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
