const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transaction.routes");
const walletRoutes = require("./routes/wallet.routes");
const { connectDB } = require("./config/db");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/wallet", walletRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

const PORT = process.env.PORT || 7000;

async function start() {
  try {
    await connectDB();
    console.log("Mongoose connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

start();
