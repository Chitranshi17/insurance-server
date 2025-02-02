const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAllPolicies,
  approveRejectPolicy,
  approveRejectClaimByGovernment,
  // approveClaim,
} = require("../controllers/policyController");
const router = express.Router();

router.post("/register", (req, res) => registerUser(req, res, "government"));
router.post("/login", (req, res) => loginUser(req, res, "government"));
router.get("/protected", authMiddleware("government"), (req, res) => {
  res.status(200).json({ message: "Government protected route accessed" });
});

router.get("/policies", authMiddleware("government"), getAllPolicies); // Role-based access
// router.put("/approve-claim/:claimId", authMiddleware("surveyor"), approveClaim);

// ✅ Approve/Reject Policy (Government)
// 2 - access --> update policy create state --> Go for claim --> Customer
router.put(
  "/approve-reject/:policyId",
  authMiddleware("government"),
  approveRejectPolicy
);

// 🟢 Government Approves/Rejects Claim (Only "government" Role Allowed)
router.put(
  "/government/approve-reject/:claimId",
  authMiddleware(["government"]),
  approveRejectClaimByGovernment
);

module.exports = router;
