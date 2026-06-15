const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
    sendWelcomeEmail,
    sendPasswordResetEmail
} = require("../config/email");

// created cookie for the user
const issueTokenCookie = (res, userId) => {
    // Creates the token, storing the user's id so we can identify them later
    const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("token", token, {
        httpOnly: true, // browser JavaScript cannot read this cookie, it protects against XSS attacks
        secure: process.env.NODE_ENV === "production", // cookie only sent over HTTPS
        sameSite: "strict", // strict means cookie is never sent
        maxAge: 7 * 24 * 60 * 60 * 1000 // time for which the cookie is valid
    })

}

// registering user
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // basic validation before registration
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            })
        }

        // making sure that password length is more than 6 chars
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // verifying whether user already exists or not
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // creating user. The password will get hashed automatically in the user.model.js
        const user = await User.create({ name, email, password });

        // this will log them in immidiately after signup
        issueTokenCookie(res, user._id);

        sendWelcomeEmail({
            to: user.email,
            name: user.name
        }).catch(console.error);

        // if everything wents well then this message is sent
        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance
            }
        });
    } catch (e) {
        res.status(400).json({
            success: false,
            message: e.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // basic user details validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            })
        }


        const user = await User.findOne({ email }).select("+password");

        // if user does not exist then send a message.
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User does not exist, please check your email and password."
            })
        }

        // Use the method we defined in user.model.js
        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        issueTokenCookie(res, user._id);

        // if everything wents well then this message is sent
        res.json({
            success: true,
            message: "Logged in successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance
            }
        });


    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const logout = (req, res) => {
    // this immidiately expires the cookie in the browser
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    // if everything wents well then this message is sent
    res.json({
        success: true,
        message: "Logged out successfully"
    })

}

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance,
                createdAt: user.createdAt
            }
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


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
            message: "If an account with that email exist. a reset link will be sent."
        }

        if (!user) {
            return res.json(genericResponse);
        }
        // Generate a secure random token, and goes into email url
        const plainToken = crypto.randomBytes(32).toString("hex");

        // gets hashed and stored in the database, just like password
        const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");


        // storing hash and expiry on the user document
        user.resetPasswordToken = hashedToken;
        // 15 minutes for resetting the password
        user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);


        // here we are just updating two fields with partial validation
        await user.save({ validateBeforeSave: false });

        // building the plain token
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${plainToken}`;

        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl
        })

        res.json(genericResponse);

    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const resetPassword = async (req, res) => {
    try {

        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "New password is required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: new Date() }
        }).select("+resetPasswordToken +resetPasswordExpiry");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or has expired"
            });
        }

        user.password = password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;


        await user.save();

        issueTokenCookie(res, user._id);

        res.json({
            success: true,
            message: "Password reset successfully. You are now logged in."
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword }
