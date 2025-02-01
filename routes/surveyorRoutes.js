const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Route for Surveyor registration and login (already existing)
router.post("/register", (req, res) => registerUser(req, res, "surveyor"));
router.post("/login", (req, res) => loginUser(req, res, "surveyor"));

// Protected route for Surveyors
router.get("/protected", authMiddleware("surveyor"), (req, res) => {
  res.status(200).json({ message: "Surveyor protected route accessed" });
});

module.exports = router;
