const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },
    damageDescription: { type: String, required: true },
    damageImage: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "under review", "approved", "rejected"],
      default: "pending",
    },
    payoutAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
