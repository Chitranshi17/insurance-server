const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  reviewClaimBySurveyor,
  getAllClaimPolicy,
} = require("../controllers/policyController");
const router = express.Router();

router.post("/register", (req, res) => registerUser(req, res, "surveyor"));
router.post("/login", (req, res) => loginUser(req, res, "surveyor"));

//review by surveyor claim req
router.put(
  "/review/:policyId",
  authMiddleware(["surveyor", "government"]),
  reviewClaimBySurveyor
);

router.get("/claim-policies", authMiddleware("surveyor"), getAllClaimPolicy);

module.exports = router;
