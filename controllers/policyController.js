const PolicyModel = require("../models/policyModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const compareImages = require("../services/imageComparisonService");
const customerModel = require("../models/customerModel");

// Predefined insurance amounts based on policy type
const insuranceAmounts = {
  home: 500000,
  car: 300000,
  health: 200000,
  other: 400000,
};

// all customer policy

// const getCustomerPolicies = async (req, res) => {
//   try {
//     // Get the customer ID from the decoded token (from authMiddleware)
//     const customerId = req.user._id; // Ensure this is coming from the token

//     // Fetch customer details
//     const customer = await customerModel.findById(customerId);

//     if (!customer) {
//       return res.status(404).json({ message: "Customer not found" });
//     }

//     // Fetch policies for this customer
//     const policies = await PolicyModel.find({ customerId });

//     if (policies.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No policies found for this customer" });
//     }

//     // Return both customer details and their policies
//     return res.status(200).json({
//       message: "Policies fetched successfully",
//       customer: {
//         name: customer.name,
//         email: customer.email,
//         phoneNumber: customer.phoneNumber,
//         address: customer.address,
//         city: customer.city,
//       },
//       policies: policies,
//     });
//   } catch (err) {
//     console.error("Error in getCustomerPolicies:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error, please try again later." });
//   }
// };

const getCustomerPolicies = async (req, res) => {
  try {
    const customerPolicies = await PolicyModel.find({
      customerId: req.user.id,
    });

    // Return policies with their creation dates
    return res.status(200).json({
      message: "Policies fetched successfully",
      policies: customerPolicies.map((policy) => ({
        ...policy.toObject(),
        createdAt: policy.createdAt, // Include the createdAt field
      })),
    });
  } catch (err) {
    console.error("Error in getCustomerPolicies:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};

// all government policy list
const getAllPolicies = async (req, res) => {
  try {
    // Government can access all policies
    if (req.user.role === "government") {
      const policies = await PolicyModel.find();
      return res.status(200).json({
        message: "Policies fetched successfully",
        policies,
      });
    }

    // Surveyor or Customer can view their specific policies (if needed)
    if (req.user.role === "survey" || req.user.role === "customer") {
      const policies = await PolicyModel.find({ userId: req.user.id });
      return res.status(200).json({
        message: "Policies fetched successfully",
        policies,
      });
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (err) {
    console.error("Error in getAllPolicies:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

const createPolicy = async (req, res) => {
  try {
    const { phoneNumber, type, address, city, customerId } = req.body;
    const beforeDamageImage = req.file ? req.file.path : null;
    if (
      !phoneNumber ||
      !type ||
      !beforeDamageImage ||
      !address ||
      !city ||
      !customerId
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const normalizedType = type.toLowerCase();

    if (!insuranceAmounts[normalizedType]) {
      return res.status(400).json({
        message: "Invalid policy type. Allowed types: home, car, health",
      });
    }

    const newPolicy = new PolicyModel({
      customerId,
      phoneNumber,
      type: normalizedType,
      address,
      city,
      beforeDamageImage,
      policyId: new mongoose.Types.ObjectId().toHexString(),
      policyStatus: "pending",
      insuranceAmount: insuranceAmounts[normalizedType],
    });

    await newPolicy.save();

    return res.status(201).json({
      message: "Policy created successfully",
      policy: {
        ...newPolicy.toObject(),
        createdAt: newPolicy.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in createPolicy:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};

const approveRejectPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!policyId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.policyStatus = action === "approve" ? "active" : "rejected";
    await policy.save();

    return res.status(200).json({
      message: `Policy ${action}d successfully`,
      policy,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};

const getCertificate = async (req, res) => {
  try {
    const { policyId } = req.params;

    if (!policyId) {
      return res.status(400).json({ message: "Policy ID is required." });
    }

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    if (
      policy.policyStatus !== "approved" &&
      policy.policyStatus !== "fulfilled"
    ) {
      return res
        .status(400)
        .json({ message: "Policy is not approved or fulfilled yet." });
    }

    // Ensure the certificates directory exists
    const certificatesDir = path.join(__dirname, "../certificates");
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir);
    }

    // Generate Certificate PDF
    const doc = new PDFDocument();
    const certificatePath = path.join(
      certificatesDir,
      `${policy.policyId}_certificate.pdf`
    );

    // Create a write stream to save the PDF to disk
    const writeStream = fs.createWriteStream(certificatePath);

    // Add content to the certificate PDF
    doc.fontSize(20).text("Insurance Policy Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Policy ID: ${policy.policyId}`);
    doc.text(`Customer Phone Number: ${policy.phoneNumber}`);
    doc.text(`Policy Type: ${policy.type}`);
    doc.text(`Address: ${policy.address}`);
    doc.text(`City: ${policy.city}`);
    doc.text(`Policy Status: ${policy.policyStatus}`);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    if (policy.policyStatus === "fulfilled") {
      doc.text("Policy Fulfilled By the Government", { align: "center" });
    } else if (policy.policyStatus === "approved") {
      doc.text("Policy Approved By the Government", { align: "center" });
    }

    // Pipe the document to the write stream
    doc.pipe(writeStream);

    // Wait until the PDF is fully written
    writeStream.on("finish", () => {
      // Check if the certificate file exists and send it as a response
      if (fs.existsSync(certificatePath)) {
        return res.status(200).sendFile(certificatePath);
      } else {
        return res
          .status(404)
          .json({ message: "Certificate generation failed." });
      }
    });

    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error("Error in getCertificate:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

// const claimPolicy = async (req, res) => {
//   try {
//     const { policyId } = req.params;
//     const { damageDescription } = req.body;
//     const damageImage = req.file ? req.file.path : null; // ✅ Store claim image

//     if (!damageDescription || !damageImage) {
//       return res
//         .status(400)
//         .json({ message: "Damage description and image are required." });
//     }

//     const policy = await PolicyModel.findOne({ policyId });
//     if (!policy) {
//       return res.status(404).json({ message: "Policy not found." });
//     }

//     if (policy.policyStatus !== "active") {
//       return res
//         .status(400)
//         .json({ message: "Only active policies can be claimed." });
//     }

//     policy.claimDetails = {
//       damageDescription,
//       damageImage, // ✅ Store claim image
//       status: "pending",
//     };

//     policy.policyStatus = "under review";
//     await policy.save();

//     return res.status(201).json({
//       message: "Claim request submitted successfully. Surveyor will review it.",
//       policy,
//       claimId: new mongoose.Types.ObjectId().toHexString(),
//     });
//   } catch (err) {
//     console.error("Error in claimPolicy:", err.message);
//     return res
//       .status(500)
//       .json({ message: "Server error, please try again later." });
//   }
// };

const claimPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { damageDescription, claimId } = req.body;
    const damageImage = req.file ? req.file.path : null; // ✅ Store claim image

    if (!damageDescription || !damageImage) {
      return res
        .status(400)
        .json({ message: "Damage description and image are required." });
    }

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    if (policy.policyStatus !== "active") {
      return res
        .status(400)
        .json({ message: "Only active policies can be claimed." });
    }

    // const claimId = new mongoose.Types.ObjectId().toHexString(); // Create unique claimId

    policy.claimDetails = {
      damageDescription,
      damageImage, // ✅ Store claim image
      status: "pending",
      // claimId, // Add claimId
    };

    policy.policyStatus = "under review";
    await policy.save();

    return res.status(201).json({
      message: "Claim request submitted successfully. Surveyor will review it.",
      policy,
      claimId, // Send claimId in response
    });
  } catch (err) {
    console.error("Error in claimPolicy:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

// const reviewClaimBySurveyor = async (req, res) => {
//   try {
//     const { policyId } = req.params;
//     const { assessment, surveyorComments } = req.body;

//     const policy = await PolicyModel.findOne({ policyId });
//     if (!policy) return res.status(404).json({ message: "Policy not found." });

//     if (policy.policyStatus !== "under review") {
//       return res
//         .status(400)
//         .json({ message: "Claim must be under review first." });
//     }

//     // ✅ Fetch both images
//     const originalImagePath = policy.beforeDamageImage;
//     const damageImagePath = policy.claimDetails.damageImage;

//     if (!originalImagePath || !damageImagePath) {
//       return res.status(400).json({ message: "Both images are required." });
//     }

//     try {
//       // ✅ Compare images using Python API
//       const { differencePercentage } = await compareImages(
//         originalImagePath,
//         damageImagePath
//       );

//       policy.surveyorReport = {
//         assessment,
//         surveyorComments,
//         status: "pending",
//         damagePercentage: differencePercentage,
//       };

//       policy.policyStatus = "waiting for government";
//       await policy.save();

//       return res.status(200).json({
//         message: "Surveyor review submitted. Awaiting government approval.",
//         policy,
//         damagePercentage: differencePercentage,
//       });
//     } catch (err) {
//       return res.status(500).json({ message: "Error comparing images." });
//     }
//   } catch (err) {
//     console.error("Error in reviewClaimBySurveyor:", err.message);
//     return res.status(500).json({ message: "Server error." });
//   }
// };

// const approveRejectClaimByGovernment = async (req, res) => {
//   try {
//     const { policyId } = req.params;
//     const { action } = req.body;

//     if (!policyId || !["approve", "reject"].includes(action)) {
//       return res.status(400).json({ message: "Invalid request parameters." });
//     }

//     // Fetch the policy
//     const policy = await PolicyModel.findOne({ policyId });
//     if (!policy) return res.status(404).json({ message: "Policy not found." });

//     if (policy.policyStatus !== "waiting for government") {
//       return res
//         .status(400)
//         .json({ message: "Claim must be reviewed by a surveyor first." });
//     }

//     // ✅ Fetch before and after damage images
//     const originalImagePath = policy.beforeDamageImage;
//     const damageImagePath = policy.claimDetails.damageImage;

//     if (!originalImagePath || !damageImagePath) {
//       return res
//         .status(400)
//         .json({ message: "Both images are required for comparison." });
//     }

//     try {
//       // ✅ Compare images using Python API
//       const { differencePercentage } = await compareImages(
//         originalImagePath,
//         damageImagePath
//       );

//       // ✅ Prepare final government response
//       const responseData = {
//         policyId: policy.policyId,
//         phoneNumber: policy.phoneNumber,
//         type: policy.type,
//         address: policy.address,
//         city: policy.city,
//         beforeDamageImage: originalImagePath,
//         damageImage: damageImagePath,
//         damagePercentage: differencePercentage,
//         policyAmount: policy.insuranceAmount,
//         assessment:
//           policy.surveyorReport?.assessment || "No assessment provided",
//         surveyorComments:
//           policy.surveyorReport?.surveyorComments || "No comments",
//         policyStatus: action === "approve" ? "fulfilled" : "rejected",
//       };

//       // ✅ Approve or reject claim
//       policy.claimDetails.status =
//         action === "approve" ? "approved" : "rejected";
//       policy.policyStatus = responseData.policyStatus;

//       await policy.save();

//       return res.status(200).json({
//         message: `Claim ${action}d successfully.`,
//         data: responseData,
//       });
//     } catch (error) {
//       console.error("Error comparing images:", error.message);
//       return res.status(500).json({ message: "Error comparing images." });
//     }
//   } catch (err) {
//     console.error("Error in approveRejectClaimByGovernment:", err.message);
//     return res
//       .status(500)
//       .json({ message: "Server error, please try again later." });
//   }
// };

// all government controllers

const approveRejectClaimByGovernment = async (req, res) => {
  try {
    const { claimId } = req.params; // Use claimId directly
    const { action } = req.body; // "approve" or "reject"

    if (!claimId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters." });
    }

    // Find the policy using claimId (ensure claimId exists)
    const policy = await PolicyModel.findOne({
      "claimDetails.claimId": claimId,
    }); // Find policy by claimId
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    if (policy.policyStatus !== "waiting for government") {
      return res
        .status(400)
        .json({ message: "Claim must be reviewed by a surveyor first." });
    }

    // Fetch before and after damage images
    const originalImagePath = policy.beforeDamageImage;
    const damageImagePath = policy.claimDetails.damageImage;

    if (!originalImagePath || !damageImagePath) {
      return res
        .status(400)
        .json({ message: "Both images are required for comparison." });
    }

    try {
      // Compare images using Python API or custom image comparison logic
      const { differencePercentage } = await compareImages(
        originalImagePath,
        damageImagePath
      );

      // Calculate payout amount based on damage percentage
      const payoutAmount =
        (differencePercentage / 100) * policy.insuranceAmount;

      // Prepare final government response
      const responseData = {
        policyId: policy.policyId,
        claimId: policy.claimDetails.claimId, // Include claimId in response
        phoneNumber: policy.phoneNumber,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        beforeDamageImage: originalImagePath,
        damageImage: damageImagePath,
        damagePercentage: differencePercentage,
        policyAmount: policy.insuranceAmount,
        payoutAmount: payoutAmount, // Calculated payout amount
        assessment:
          policy.surveyorReport?.assessment || "No assessment provided",
        surveyorComments:
          policy.surveyorReport?.surveyorComments || "No comments",
        policyStatus: action === "approve" ? "fulfilled" : "rejected",
      };

      // Update the policy and claim status based on approval/rejection
      policy.claimDetails.status =
        action === "approve" ? "approved" : "rejected";
      policy.policyStatus = responseData.policyStatus;
      policy.payoutAmount = payoutAmount; // Set the payout amount

      await policy.save();

      return res.status(200).json({
        message: `Claim ${action}d successfully.`,
        data: responseData, // Send all details to government
      });
    } catch (error) {
      console.error("Error comparing images:", error.message);
      return res.status(500).json({ message: "Error comparing images." });
    }
  } catch (err) {
    console.error("Error in approveRejectClaimByGovernment:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

const reviewClaimBySurveyor = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { assessment, surveyorComments } = req.body;

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) return res.status(404).json({ message: "Policy not found." });

    if (policy.policyStatus !== "under review") {
      return res
        .status(400)
        .json({ message: "Claim must be under review first." });
    }

    // Fetch both images
    const originalImagePath = policy.beforeDamageImage;
    const damageImagePath = policy.claimDetails.damageImage;

    if (!originalImagePath || !damageImagePath) {
      return res.status(400).json({ message: "Both images are required." });
    }

    try {
      // Compare images using Python API or custom image comparison logic
      const { differencePercentage } = await compareImages(
        originalImagePath,
        damageImagePath
      );

      // Store the surveyor report and update the claim
      policy.surveyorReport = {
        assessment,
        surveyorComments,
        status: "pending",
        damagePercentage: differencePercentage,
      };

      // Update the policy status to "waiting for government"
      policy.policyStatus = "waiting for government";
      await policy.save();

      // Include claimId in the response
      return res.status(200).json({
        message: "Surveyor review submitted. Awaiting government approval.",
        policy,
        damagePercentage: differencePercentage,
        claimId: policy.claimDetails.claimId, // Include claimId
      });
    } catch (err) {
      return res.status(500).json({ message: "Error comparing images." });
    }
  } catch (err) {
    console.error("Error in reviewClaimBySurveyor:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

const approveClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { decision } = req.body; // "approved" or "rejected"

    // Find the claim by ID
    const claim = await ClaimModel.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Find the policy details linked to this claim
    const policy = await PolicyModel.findOne({ policyId: claim.policyId });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    if (decision === "approved") {
      claim.status = "approved";

      // Calculate the insurance payout based on damage percentage
      const insuranceAmount = policy.insuranceAmount;
      const payoutAmount = (claim.damagePercentage / 100) * insuranceAmount;
      claim.payoutAmount = payoutAmount;
    } else {
      claim.status = "rejected";
      claim.payoutAmount = 0;
    }

    // Save the updated claim
    await claim.save();

    return res.status(200).json({
      message: `Claim ${decision}`,
      claim: {
        claimId: claim._id,
        policyId: claim.policyId,
        damagePercentage: claim.damagePercentage,
        payoutAmount: claim.payoutAmount,
        status: claim.status,
        createdAt: claim.createdAt,
      },
      policy: {
        policyId: policy.policyId,
        customerDetails: policy.customerDetails,
        phoneNumber: policy.phoneNumber,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        policyStatus: policy.policyStatus,
        insuranceAmount: policy.insuranceAmount,
      },
    });
  } catch (err) {
    console.error("Error approving claim:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllPolicies,
  createPolicy,
  approveRejectPolicy,
  claimPolicy,
  getCertificate,
  claimPolicy,
  approveRejectClaimByGovernment,
  reviewClaimBySurveyor,
  getCustomerPolicies,

  approveClaim,
};
