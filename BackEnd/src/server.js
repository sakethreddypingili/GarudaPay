// Importing required packages
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Getting Routes files
const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const walletRoutes = require("./routes/wallet.routes");
const contactRoutes = require("./routes/contact.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const notificationRoutes = require("./routes/notification.routes");
const adminRoutes = require("./routes/admin.routes");
const { connectDB } = require("./config/db");
const path = require("path");

const app = express();

// Database connection middleware for serverless compatibility
const mongoose = require("mongoose");
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 0) {
        try {
            await connectDB();
        } catch (err) {
            console.error("DB connection error in middleware:", err);
            return next(err);
        }
    }
    next();
});

const cors = require("cors");
app.use(cors({ origin: true, credentials: true }));

// Runs this function before the every incoming requests from the express function object
app.use(express.json()); // Parses string to JS object
app.use(cookieParser()); // Reads JWT Tokens that comes as a cookie

app.use("/api/auth", authRoutes); // Any request starts with /api/auth goes to authRoutes file
app.use("/api/transaction", transactionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Root route serves landing page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../index.html"));
});

// Serve Admin static files
app.use("/admin", express.static(path.join(__dirname, "../../Admin")));
app.use("/Admin", express.static(path.join(__dirname, "../../Admin")));

// Serve FrontEnd static files
app.use(express.static(path.join(__dirname, "../..")));
app.use(express.static(path.join(__dirname, "../../src")));

// If any routes does not matches as per the request then this will run
app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: `Route ${req.method} ${req.path} not found`
        });
    }
    res.status(404).sendFile(path.join(__dirname, "../../src/html/404.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (req.path.startsWith("/api/")) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
    res.status(500).sendFile(path.join(__dirname, "../../src/html/error.html"));
});

const PORT = process.env.PORT || 5055;

// Only listen and connect directly when running locally (not in serverless environments)
if (!process.env.VERCEL) {
    async function start() {
        try {
            await connectDB();
            console.log("Mongoose connected successfully");

            app.listen(PORT, () => {
                console.log(`Server is listening on http://localhost:${PORT}`);
            });
        } catch (e) {
            console.error("Local start error:", e.message);
            process.exit(1);
        }
    }
    start();
}

module.exports = app;
