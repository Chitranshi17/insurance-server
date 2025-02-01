const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", (req, res) => registerUser(req, res, "government"));
router.post("/login", (req, res) => loginUser(req, res, "government"));
router.get("/protected", authMiddleware("government"), (req, res) => {
  res.status(200).json({ message: "Government protected route accessed" });
});

module.exports = router;
