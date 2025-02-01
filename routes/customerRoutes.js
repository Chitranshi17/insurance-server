// const express = require("express");
// const { registerUser, loginUser } = require("../controllers/authController");
// const authMiddleware = require("../middlewares/authMiddleware");
// const {
//   createPolicy,
//   approveRejectPolicy,
// } = require("../controllers/policyController");
// const roleMiddleware = require("../middlewares/roleMiddleware");
// const router = express.Router();

// // Customer routes
// router.post("/register", (req, res) => registerUser(req, res, "customer"));
// router.post("/login", (req, res) => loginUser(req, res, "customer"));
// router.get("/protected", authMiddleware("customer"), (req, res) => {
//   res.status(200).json({ message: "Customer protected route accessed" });
// });

// // Route for creating a policy
// router.post("/create", authMiddleware("customer"), createPolicy);

// // Route for government to approve/reject a policy
// router.post("/approve", authMiddleware("customer"), approveRejectPolicy);

// module.exports = router;



const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createPolicy,
  approveRejectPolicy,
  getCertificate,
  claimPolicy,
} = require("../controllers/policyController");
const upload = require("../middlewares/multerMiddleware");

const router = express.Router();

// Customer routes
router.post("/register", (req, res) => registerUser(req, res, "customer"));
router.post("/login", (req, res) => loginUser(req, res, "customer"));
router.get("/protected", authMiddleware("customer"), (req, res) => {
  res.status(200).json({ message: "Customer protected route accessed" });
});

// // Route for creating a policy
// router.post("/create", authMiddleware("customer"), createPolicy);

// // Route for government to approve/reject a policy
// router.post("/approve", authMiddleware("customer"), approveRejectPolicy);

// router.get(
//   "/certificate/:policyId",
//   authMiddleware("customer"),
//   getCertificate
// );



// ✅ Create Policy (Customer)
router.post("/create", authMiddleware("customer"), upload.single("img"), createPolicy);

// ✅ Approve/Reject Policy (Government)
router.put("/approve-reject/:policyId", authMiddleware("government"), approveRejectPolicy);

// ✅ Claim Policy (Customer -> Government)
router.post(
  "/claim/:policyId",
  authMiddleware("customer"),
  upload.single("damageImage"),
  claimPolicy
);

// ✅ Get Policy Certificate (Customer)
router.get("/certificate/:policyId", authMiddleware("customer"), getCertificate);


module.exports = router;
