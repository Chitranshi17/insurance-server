const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAllPolicies,
  approveRejectPolicy,
  approveRejectClaimByGovernment,
} = require("../controllers/policyController");
const router = express.Router();

router.post("/register", (req, res) => registerUser(req, res, "government"));
router.post("/login", (req, res) => loginUser(req, res, "government"));

// Get All Policy (Government)
router.get("/policies", authMiddleware("government"), getAllPolicies);

// Approve/Reject Policy (Government)
// 2 - access --> update policy create state --> Go for claim --> Customer
router.put(
  "/approve-reject/:policyId",
  authMiddleware("government"),
  approveRejectPolicy
);

// Government Approves/Rejects Claim (Only "government" Role Allowed)
router.put(
  "/claim/approve-reject/:claimId",
  authMiddleware(["government"]),
  approveRejectClaimByGovernment
);

module.exports = router;
