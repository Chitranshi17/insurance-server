const PolicyModel = require("../models/policyModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const compareImages = require("../services/imageComparisonService");


// Predefined insurance amounts based on policy type
const insuranceAmounts = {
  home: 500000,
  car: 300000,
  health: 200000,
  other: 400000,
};



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
    const { phoneNumber, type, address, city } = req.body;
    const beforeDamageImage = req.file ? req.file.path : null; // ✅ Store initial image

    // Validate required fields
    if (!phoneNumber || !type || !beforeDamageImage || !address || !city) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Convert type to lowercase to prevent case sensitivity issues
    const normalizedType = type.toLowerCase();

    // Validate policy type
    if (!insuranceAmounts[normalizedType]) {
      return res.status(400).json({
        message: "Invalid policy type. Allowed types: home, car, health",
      });
    }

    const newPolicy = new PolicyModel({
      phoneNumber,
      type: normalizedType, // ✅ Store type in lowercase for consistency
      address,
      city,
      beforeDamageImage, // ✅ Store original image
      policyId: new mongoose.Types.ObjectId().toHexString(),
      policyStatus: "pending",
      insuranceAmount: insuranceAmounts[normalizedType], // ✅ Assign predefined amount
    });

    await newPolicy.save();

    return res.status(201).json({
      message: "Policy created successfully",
      policy: newPolicy,
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

const claimPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { damageDescription } = req.body;
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

    policy.claimDetails = {
      damageDescription,
      damageImage, // ✅ Store claim image
      status: "pending",
    };

    policy.policyStatus = "under review";
    await policy.save();

    return res.status(201).json({
      message: "Claim request submitted successfully. Surveyor will review it.",
      policy,
    });
  } catch (err) {
    console.error("Error in claimPolicy:", err.message);
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

    // ✅ Fetch both images
    const originalImagePath = policy.beforeDamageImage;
    const damageImagePath = policy.claimDetails.damageImage;

    if (!originalImagePath || !damageImagePath) {
      return res.status(400).json({ message: "Both images are required." });
    }

    try {
      // ✅ Compare images using Python API
      const { differencePercentage } = await compareImages(
        originalImagePath,
        damageImagePath
      );

      policy.surveyorReport = {
        assessment,
        surveyorComments,
        status: "pending",
        damagePercentage: differencePercentage,
      };

      policy.policyStatus = "waiting for government";
      await policy.save();

      return res.status(200).json({
        message: "Surveyor review submitted. Awaiting government approval.",
        policy,
        damagePercentage: differencePercentage,
      });
    } catch (err) {
      return res.status(500).json({ message: "Error comparing images." });
    }
  } catch (err) {
    console.error("Error in reviewClaimBySurveyor:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};

const approveRejectClaimByGovernment = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { action } = req.body;

    if (!policyId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters." });
    }

    // Fetch the policy
    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) return res.status(404).json({ message: "Policy not found." });

    if (policy.policyStatus !== "waiting for government") {
      return res
        .status(400)
        .json({ message: "Claim must be reviewed by a surveyor first." });
    }

    // ✅ Fetch before and after damage images
    const originalImagePath = policy.beforeDamageImage;
    const damageImagePath = policy.claimDetails.damageImage;

    if (!originalImagePath || !damageImagePath) {
      return res
        .status(400)
        .json({ message: "Both images are required for comparison." });
    }

    try {
      // ✅ Compare images using Python API
      const { differencePercentage } = await compareImages(
        originalImagePath,
        damageImagePath
      );

      // ✅ Prepare final government response
      const responseData = {
        policyId: policy.policyId,
        phoneNumber: policy.phoneNumber,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        beforeDamageImage: originalImagePath,
        damageImage: damageImagePath,
        damagePercentage: differencePercentage,
        assessment:
          policy.surveyorReport?.assessment || "No assessment provided",
        surveyorComments:
          policy.surveyorReport?.surveyorComments || "No comments",
        policyStatus: action === "approve" ? "fulfilled" : "rejected",
      };

      // ✅ Approve or reject claim
      policy.claimDetails.status =
        action === "approve" ? "approved" : "rejected";
      policy.policyStatus = responseData.policyStatus;

      await policy.save();

      return res.status(200).json({
        message: `Claim ${action}d successfully.`,
        data: responseData,
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

module.exports = {
  getAllPolicies,
  createPolicy,
  approveRejectPolicy,
  claimPolicy,
  getCertificate,
  claimPolicy,
  approveRejectClaimByGovernment,
  reviewClaimBySurveyor,
};
