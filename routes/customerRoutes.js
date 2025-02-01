const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createPolicy,
  approveRejectPolicy,
  getCertificate,
  claimPolicy,
  reviewClaimBySurveyor,
  approveRejectClaimByGovernment,
  getAllPolicies,
} = require("../controllers/policyController");
const upload = require("../middlewares/multerMiddleware");

const router = express.Router();

// Customer routes
router.post("/register", (req, res) => registerUser(req, res, "customer"));
router.post("/login", (req, res) => loginUser(req, res, "customer"));
router.get("/protected", authMiddleware("customer"), (req, res) => {
  res.status(200).json({ message: "Customer protected route accessed" });
});

// ✅ Create Policy (Customer)
router.post(
  "/create",
  authMiddleware("customer"),
  upload.single("img"),
  createPolicy
);

// ✅ Approve/Reject Policy (Government)
router.put(
  "/approve-reject/:policyId",
  authMiddleware("government"),
  approveRejectPolicy
);

// ✅ Get Policy Certificate (Customer)
router.get(
  "/certificate/:policyId",
  authMiddleware("customer"),
  getCertificate
);

// ✅ Customer requests a claim (Upload damage image)
router.post(
  "/claim/:policyId",
  authMiddleware("customer"),
  upload.single("damageImage"),
  claimPolicy
);

// ✅ Surveyor reviews the claim
router.put(
  "/claim/review/:policyId",
  authMiddleware(["surveyor", "government"]),
  reviewClaimBySurveyor
);

// ✅ Government approves/rejects the claim
router.put(
  "/claim/approve-reject/:policyId",
  authMiddleware("government"),
  approveRejectClaimByGovernment
);

router.get("/policies", authMiddleware("government"), getAllPolicies); // Role-based access

module.exports = router;
