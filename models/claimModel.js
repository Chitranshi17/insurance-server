// const mongoose = require("mongoose");

// const claimSchema = new mongoose.Schema({
//   policyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Policy",
//     required: true,
//   },
//   damageDescription: { type: String, required: true },
//   damageImage: { type: String, required: true }, // URL of the damage image
//   status: {
//     type: String,
//     enum: ["Pending", "Approved", "Rejected"],
//     default: "Pending",
//   },
//   createdAt: { type: Date, default: Date.now },
// });

// const Claim = mongoose.model("Claim", claimSchema);
// module.exports = Claim;


// const mongoose = require("mongoose");

// const claimSchema = new mongoose.Schema({
//   policyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Policy",
//     required: true,
//   },
//   damageDescription: { type: String, required: true },
//   damageImage: { type: String, required: true }, // URL of the damage image
//   status: {
//     type: String,
//     enum: [
//       "Pending",
//       "Surveyor Review",
//       "Waiting for Government",
//       "Approved",
//       "Rejected",
//     ],
//     default: "Pending",
//   },
//   damagePercentage: { type: Number, required: false }, // Damage percentage calculated
//   payoutAmount: { type: Number, required: false, default: 0 }, // Final payout amount
//   createdAt: { type: Date, default: Date.now },
// });

// const Claim = mongoose.model("Claim", claimSchema);
// module.exports = Claim;


const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Policy",
    required: true,
  },
  damageDescription: { type: String, required: true },
  damageImage: { type: String, required: true }, // URL of the damage image
  status: {
    type: String,
    enum: [
      "Pending",
      "Surveyor Review",
      "Waiting for Government",
      "Approved",
      "Rejected",
    ], // Enum values
    default: "Pending", // Default value is 'Pending'
  },
  damagePercentage: { type: Number, required: false },
  payoutAmount: { type: Number, required: false, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Claim = mongoose.model("Claim", claimSchema);
module.exports = Claim;

