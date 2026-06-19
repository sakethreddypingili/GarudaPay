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
        process.env.JWT_SECRET || "garudapay_secret_key_123",
        { expiresIn: "24h" }
    );

    res.cookie("token", token, {
        httpOnly: true, // browser JavaScript cannot read this cookie, it protects against XSS attacks
        secure: process.env.NODE_ENV === "production", // cookie only sent over HTTPS
        sameSite: "lax", // lax allows cookie across ports on localhost
        maxAge: 24 * 60 * 60 * 1000 // time for which the cookie is valid (24 hours)
    });
    return token;
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
        const token = issueTokenCookie(res, user._id);

        sendWelcomeEmail({
            to: user.email,
            name: user.name
        }).catch(console.error);

        // if everything wents well then this message is sent
        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token: token,
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

        const token = issueTokenCookie(res, user._id);

        // if everything wents well then this message is sent
        res.json({
            success: true,
            message: "Logged in successfully",
            token: token,
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
        // searching for user using userId in the db.
        const user = await User.findById(req.user.id);

        // if the user is not present then it will send a false message
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // if nothing fails user object will be fetched from db
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance,
                preferences: user.preferences,
                createdAt: user.createdAt
            }
        })
    } catch (e) {
        // if any unwanted error comes then it will catch it
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const forgotPassword = async (req, res) => {
    try {
        // getting user email from the provided object body by the client
        const { email } = req.body;

        // If email is not provided by the client, then negative response will be send
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // finding if user email is present in the db
        const user = await User.findOne({ email });

        // creating a generic response for the user, if everything goes will
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

        // if everything wents well then email will be sent whose logic is written in src/config/email.js
        try {
            await sendPasswordResetEmail({
                to: user.email,
                name: user.name,
                resetUrl,
                token: plainToken
            });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            return res.status(500).json({
                success: false,
                message: `Failed to send email: ${emailError.message}`,
                resetUrl: resetUrl
            });
        }

        // finally send the response to user that email has been sent
        res.json(genericResponse);

    } catch (e) {
        // if any unwanted error comes then it will catch it
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}


const resetPassword = async (req, res) => {
    try {
        // this is the token that will be read from the plain token from the resetUrl or headers
        const token = req.params.token || req.headers['x-reset-token'] || req.headers['authorization'] || req.headers['token'];
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is required in headers (e.g. 'x-reset-token')"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "New password is required"
            });
        }

        // password length must be greater than 6 chars
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

        const authToken = issueTokenCookie(res, user._id);

        res.json({
            success: true,
            message: "Password reset successfully. You are now logged in.",
            token: authToken
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        });
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (email.toLowerCase() !== user.email.toLowerCase()) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email is already in use by another account"
                });
            }
        }

        user.name = name;
        user.email = email;
        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                balance: user.balance,
                preferences: user.preferences
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user.id).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await user.isPasswordCorrect(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect current password"
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

const updatePreferences = async (req, res) => {
    try {
        const { theme, notificationsEnabled, currency } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.preferences) {
            if (theme !== undefined) user.preferences.theme = theme;
            if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;
            if (currency !== undefined) user.preferences.currency = currency;
        } else {
            user.preferences = {
                theme: theme || "light",
                notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
                currency: currency || "INR"
            };
        }

        await user.save();

        res.json({
            success: true,
            message: "Preferences updated successfully",
            preferences: user.preferences
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = { 
    register, 
    login, 
    logout, 
    getMe, 
    forgotPassword, 
    resetPassword,
    updateProfile,
    changePassword,
    updatePreferences
}
