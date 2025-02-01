// // const mongoose = require("mongoose");

// // const policySchema = new mongoose.Schema(
// //   {
// //     phoneNumber: {
// //       type: String,
// //       required: true,
// //     },
// //     type: {
// //       type: String,
// //       required: true,
// //     },
// //     img: {
// //       type: String,
// //       required: true,
// //     },
// //     address: {
// //       type: String,
// //       required: true,
// //     },
// //     city: {
// //       type: String,
// //       required: true,
// //     },
// //     policyId: {
// //       type: String,
// //       required: true,
// //       unique: true,
// //     },
// //     policyStatus: {
// //       type: String,
// //       enum: ["approved", "rejected", "pending"],
// //       default: "pending",
// //     },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("Policy", policySchema);


// const mongoose = require("mongoose");

// const policySchema = new mongoose.Schema(
//   {
//     phoneNumber: {
//       type: String,
//       required: true,
//     },
//     type: {
//       type: String,
//       required: true,
//     },
//     img: {
//       type: String,
//       required: true,
//     },
//     address: {
//       type: String,
//       required: true,
//     },
//     city: {
//       type: String,
//       required: true,
//     },
//     policyId: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     policyStatus: {
//       type: String,
//       enum: ["approved", "rejected", "pending"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Policy", policySchema);



// const mongoose = require("mongoose");

// const policySchema = new mongoose.Schema(
//   {
//     phoneNumber: {
//       type: String,
//       required: true,
//     },
//     type: {
//       type: String,
//       required: true,
//     },
//     img: {
//       type: String,
//       required: true,
//     },
//     address: {
//       type: String,
//       required: true,
//     },
//     city: {
//       type: String,
//       required: true,
//     },
//     policyId: {
//       type: String,
//       required: true,
//       unique: true,
//       default: () => new mongoose.Types.ObjectId().toString(),
//     },
//     policyStatus: {
//       type: String,
//       enum: ["approved", "rejected", "pending"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Policy", policySchema);





// const mongoose = require("mongoose");

// const policySchema = new mongoose.Schema(
//   {
//     phoneNumber: { type: String, required: true },
//     type: { type: String, required: true },
//     img: { type: String, required: true }, // Policy Image
//     address: { type: String, required: true },
//     city: { type: String, required: true },
//     policyId: {
//       type: String,
//       required: true,
//       unique: true,
//       default: () => new mongoose.Types.ObjectId().toString(),
//     },
//     policyStatus: {
//       type: String,
//       enum: ["pending", "approved", "active", "fulfilled", "rejected"],
//       default: "pending",
//     },
//     claimDetails: {
//       damageDescription: { type: String },
//       damageImage: { type: String }, // Stores path of uploaded image
//       surveyorStatus: {
//         type: String,
//         enum: ["pending", "approved", "rejected"],
//         default: "pending",
//       },
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Policy", policySchema);



// const mongoose = require("mongoose");

// const policySchema = new mongoose.Schema({
//   phoneNumber: { type: String, required: true },
//   type: { type: String, required: true },
//   beforeDamageImage: { type: String, required: true }, // Original policy image
//   address: { type: String, required: true },
//   city: { type: String, required: true },
//   policyId: {
//     type: String,
//     required: true,
//     unique: true,
//     default: () => new mongoose.Types.ObjectId().toString(),
//   },
//   policyStatus: {
//     type: String,
//     enum: ["pending", "approved", "active", "fulfilled", "rejected"],
//     default: "pending",
//   },
//   claimDetails: {
//     damageDescription: { type: String },
//     damageImage: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "under review", "approved", "rejected"],
//       default: "pending",
//     },
//   },
//   surveyorReport: {
//     assessment: { type: String },
//     surveyorComments: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },
//   },
// });

// module.exports = mongoose.model("Policy", policySchema);



// const mongoose = require("mongoose");

// const policySchema = new mongoose.Schema({
//   phoneNumber: { type: String, required: true },
//   type: { type: String, required: true },
//   beforeDamageImage: { type: String, required: true }, // Original image for before damage
//   address: { type: String, required: true },
//   city: { type: String, required: true },
//   policyId: {
//     type: String,
//     required: true,
//     unique: true,
//     default: () => new mongoose.Types.ObjectId().toString(),
//   },
//   policyStatus: {
//     type: String,
//     enum: [
//       "pending",
//       "approved",
//       "active",
//       "fulfilled",
//       "rejected",
//       "under review",
//     ], // Add 'under review'
//     default: "pending",
//   },
//   claimDetails: {
//     damageDescription: { type: String },
//     damageImage: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "under review", "approved", "rejected"],
//       default: "pending",
//     },
//   },
//   surveyorReport: {
//     assessment: { type: String },
//     surveyorComments: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },
//   },
// });

// module.exports = mongoose.model("Policy", policySchema);

const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    phoneNumber: { type: String, required: true },
    type: { type: String, required: true },
    beforeDamageImage: { type: String, required: true }, // Original image for before damage
    address: { type: String, required: true },
    city: { type: String, required: true },
    insuranceAmount: { type: Number, required: true }, // New field
    policyId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    policyStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "active",
        "fulfilled",
        "rejected",
        "under review",
        "waiting for government",
      ], // Added 'waiting for government'
      default: "pending",
    },
    claimDetails: {
      damageDescription: { type: String },
      damageImage: { type: String },
      status: {
        type: String,
        enum: ["pending", "under review", "approved", "rejected"], // Added 'approved' and 'rejected'
        default: "pending",
      },
    },
    surveyorReport: {
      assessment: { type: String },
      surveyorComments: { type: String },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt
  }
);

module.exports = mongoose.model("Policy", policySchema);
