const PolicyModel = require("../models/policyModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const compareImages = require("../services/imageComparisonService");

const createPolicy = async (req, res) => {
  try {
    const { phoneNumber, type, address, city } = req.body;
    const beforeDamageImage = req.file ? req.file.path : null; // ✅ Store initial image

    if (!phoneNumber || !type || !beforeDamageImage || !address || !city) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const newPolicy = new PolicyModel({
      phoneNumber,
      type,
      address,
      city,
      beforeDamageImage, // ✅ Store original image
      policyId: new mongoose.Types.ObjectId().toHexString(),
      policyStatus: "pending",
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

// ✅ Approve/Reject Policy by Government
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

// ✅ Get Policy Certificate
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

// ✅ Government Approves or Rejects the Claim


const approveRejectClaimByGovernment = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { action } = req.body;

    if (!policyId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid request parameters." });
    }

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) return res.status(404).json({ message: "Policy not found." });

    if (policy.policyStatus !== "waiting for government") {
      return res
        .status(400)
        .json({ message: "Claim must be reviewed by a surveyor first." });
    }

    // Approve or reject claim
    policy.claimDetails.status = action === "approve" ? "approved" : "rejected";
    policy.policyStatus = action === "approve" ? "fulfilled" : "rejected";

    await policy.save();

    return res
      .status(200)
      .json({ message: `Claim ${action}d successfully.`, policy });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = {
  createPolicy,
  approveRejectPolicy,
  claimPolicy,
  getCertificate,
  claimPolicy,
  approveRejectClaimByGovernment,
  reviewClaimBySurveyor,
};
