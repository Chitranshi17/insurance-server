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





const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
    type: { type: String, required: true },
    img: { type: String, required: true }, // Policy Image
    address: { type: String, required: true },
    city: { type: String, required: true },
    policyId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    policyStatus: {
      type: String,
      enum: ["pending", "approved", "active", "fulfilled", "rejected"],
      default: "pending",
    },
    claimDetails: {
      damageDescription: { type: String },
      damageImage: { type: String }, // Stores path of uploaded image
      surveyorStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
