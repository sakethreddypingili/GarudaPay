const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require("../config/email");

const issueTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    const user = await User.create({ name, email, password });
    issueTokenCookie(res, user._id);

    sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User does not exist, please check your email and password."
      });
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    issueTokenCookie(res, user._id);

    return res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const logout = (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  return res.json({
    success: true,
    message: "Logged out successfully"
  });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });
    const genericResponse = {
      success: true,
      message: "If an account with that email exists, a reset link will be sent."
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const plainToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(plainToken)
      .digest("hex");
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${plainToken}`;
    sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl
    }).catch(() => {});

    return res.json(genericResponse);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired"
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword
};
