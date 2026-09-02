const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const playerRoutes = require("./routes/playerRoutes");

const app = express();

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

//Routes
app.use("/api/players", playerRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
