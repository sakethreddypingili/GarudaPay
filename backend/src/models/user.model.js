const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    upiId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false
    },
    balance: {
      type: Number,
      default: 0
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpiry: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model("User", userSchema);
