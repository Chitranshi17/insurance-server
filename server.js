const express = require("express");
const connectDB = require("./config/db_config");
const customerRoutes = require("./routes/customerRoutes");
const surveyorRoutes = require("./routes/surveyorRoutes");
const governmentRoutes = require("./routes/governmentRoutes");

const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

//cors
const cors = require("cors");
app.use(cors());

// DB connect
connectDB();

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    msg: "Welcome to the insurance claim management system.",
  });
});

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(cookieParser());
// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/surveyors", surveyorRoutes);
app.use("/api/government", governmentRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
