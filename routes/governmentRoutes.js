const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { getAllPolicies } = require("../controllers/policyController");

const router = express.Router();

router.post("/register", (req, res) => registerUser(req, res, "government"));
router.post("/login", (req, res) => loginUser(req, res, "government"));
router.get("/protected", authMiddleware("government"), (req, res) => {
  res.status(200).json({ message: "Government protected route accessed" });
});


router.get("/policies", authMiddleware("government"), getAllPolicies); // Role-based access


module.exports = router;
