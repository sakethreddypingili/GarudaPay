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
const { connectDB } = require("./config/db");
const path = require("path");

const app = express();

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

// Root route serves landing page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../FrontEnd/landing.html"));
});

// Serve FrontEnd static files
app.use(express.static(path.join(__dirname, "../../FrontEnd")));

// If any routes does not matches as per the request then this will run
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    })
})

const PORT = process.env.PORT || 5055;

// As this function will return a Promise. we will use async and await
async function start() {
    try {
        // We are using await here because connectDB() method will return a promise wo we need to wait until promise resolves
        await connectDB();
        console.log("Mongoose connected successfully");

        app.listen(PORT, () => {
            // listen starts accepting request on PORT = process.env.PORT || 5055;
            // this callback function runs when app is listenting to PORT
            console.log(`Server is listening on http://localhost:${PORT}`);
        })
    } catch (e) {
        // If Promise of the connectDB() method rejects that error is catched here.
        console.error(e.message); // Prints the error message
        process.exit(1); // If the db is not connected then node process is stopped
    }
}

start();
