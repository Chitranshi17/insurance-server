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
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Claim = mongoose.model("Claim", claimSchema);
module.exports = Claim;
