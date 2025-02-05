const PolicyModel = require("../models/policyModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const compareImages = require("../services/imageComparisonService");
const CustomerModel = require("../models/customerModel");
const {
  generateInsuranceCertificate,
} = require("../services/certificateGenerators");
const NotificationModel = require("../models/NotificationModel");

const insuranceAmounts = {
  home: 500000,
  car: 300000,
  health: 200000,
  other: 400000,
};
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
const getAllPolicies = async (req, res) => {
  try {
    let policies = [];

    // Government can access all policies
    if (req.user.role === "government") {
      policies = await PolicyModel.find();
    }
    // Surveyor or Customer can view their specific policies
    else if (req.user.role === "survey" || req.user.role === "customer") {
      policies = await PolicyModel.find({ userId: req.user.id });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    // Separate policies into two arrays
    const waitingForGovernmentPolicies = policies.filter(
      (policy) => policy.policyStatus === "waiting for government"
    );
    const otherPolicies = policies.filter(
      (policy) => policy.policyStatus !== "waiting for government"
    );

    return res.status(200).json({
      message: "Policies fetched successfully",
      waitingForGovernmentPolicies,
      otherPolicies,
    });
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
    const beforeDamageImage = req.file ? `uploads/${req.file.filename}` : null;

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

    // Format createdAt date
    const createdAtDate = newPolicy.createdAt.toISOString().split("T")[0];

    return res.status(201).json({
      message: "Policy created successfully",
      customer: await CustomerModel.findById(customerId).select(
        "name email phoneNumber"
      ), // Fetch only required customer details
      policy: {
        policyId: newPolicy.policyId,
        type: newPolicy.type,
        address: newPolicy.address,
        city: newPolicy.city,
        insuranceAmount: newPolicy.insuranceAmount,
        policyStatus: newPolicy.policyStatus,
        createdAt: createdAtDate, // Show only the date
        beforeDamageImage: newPolicy.beforeDamageImage, // Include beforeDamageImage in response
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

    const policy = await PolicyModel.findOne({ policyId }).populate(
      "customerId",
      "name email phoneNumber"
    );
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.policyStatus = action === "approve" ? "active" : "rejected";
    await policy.save();

    // Format createdAt date
    const createdAtDate = policy.createdAt.toISOString().split("T")[0];

    return res.status(200).json({
      message: `Policy ${action}d successfully`,
      customer: policy.customerId, // Fetch customer details
      policy: {
        policyId: policy.policyId,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        insuranceAmount: policy.insuranceAmount,
        policyStatus: policy.policyStatus,
        createdAt: createdAtDate, // Show only the date
        beforeDamageImage: policy.beforeDamageImage, // Include beforeDamageImage in response
      },
    });
  } catch (err) {
    console.error("Error in approveRejectPolicy:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};
const claimPolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { damageDescription } = req.body;
    // const damageImage = req.file ? req.file.path : null;
    const damageImage = req.file ? `uploads/${req.file.filename}` : null;

    if (!damageDescription || !damageImage) {
      return res
        .status(400)
        .json({ message: "Damage description and image are required." });
    }

    const policy = await PolicyModel.findOne({ policyId }).populate(
      "customerId",
      "name email phoneNumber"
    );
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    // Generate Claim ID and Date
    const claimId = new mongoose.Types.ObjectId().toHexString();
    const claimDate = new Date().toISOString().split("T")[0]; // Extract only the date

    policy.claimDetails = {
      claimId,
      damageDescription,
      damageImage,
      status: "pending",
      date: claimDate,
    };

    policy.policyStatus = "under review";
    await policy.save();

    // Format createdAt date
    const createdAtDate = policy.createdAt.toISOString().split("T")[0];

    return res.status(201).json({
      message: "Claim request submitted successfully. Surveyor will review it.",
      customer: policy.customerId, // Fetch only customer details
      policy: {
        policyId: policy.policyId,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        insuranceAmount: policy.insuranceAmount,
        policyStatus: policy.policyStatus,
        createdAt: createdAtDate, // Show only the date
        beforeDamageImage: policy.beforeDamageImage, // Include beforeDamageImage in response
      },
      claim: {
        claimId,
        damageDescription,
        damageImage,
        status: "pending",
        date: claimDate, // Show only the date
      },
    });
  } catch (err) {
    console.error("Error in claimPolicy:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
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
const reviewClaimBySurveyor = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { assessment, surveyorComments } = req.body;

    // Find the policy by policyId
    const policy = await PolicyModel.findOne({ policyId }).populate(
      "customerId",
      "name email phoneNumber"
    );

    // Handle case when policy is not found
    if (!policy) return res.status(404).json({ message: "Policy not found." });

    // Ensure the policy is under review before proceeding
    if (policy.policyStatus !== "under review") {
      return res
        .status(400)
        .json({ message: "Claim must be under review first." });
    }

    // Fetch both images
    const originalImagePath = policy.beforeDamageImage;
    const damageImagePath = policy.claimDetails.damageImage;

    // Ensure both images are present
    if (!originalImagePath || !damageImagePath) {
      return res.status(400).json({ message: "Both images are required." });
    }

    try {
      // Compare images using Python API or custom image comparison logic
      const { differencePercentage } = await compareImages(
        originalImagePath,
        damageImagePath
      );

      // Update surveyor report and store damage percentage
      policy.surveyorReport = {
        assessment,
        surveyorComments,
        status: "pending", // Keep it "pending" as it awaits government approval
        damagePercentage: differencePercentage, // <-- This stores the damage percentage
      };

      // Update policy status to "waiting for government"
      policy.policyStatus = "waiting for government";

      // Save the updated policy
      await policy.save();

      // Format the createdAt date to show only the date
      const createdAtDate = policy.createdAt.toISOString().split("T")[0];

      // Respond with the updated policy and damage percentage
      return res.status(200).json({
        message: "Surveyor review submitted. Awaiting government approval.",
        customer: {
          name: policy.customerId.name,
          email: policy.customerId.email,
          phoneNumber: policy.customerId.phoneNumber,
        },
        policy: {
          policyId: policy.policyId,
          type: policy.type,
          address: policy.address,
          city: policy.city,
          insuranceAmount: policy.insuranceAmount,
          policyStatus: policy.policyStatus,
          createdAt: createdAtDate, // Only the date part of createdAt
          beforeDamageImage: policy.beforeDamageImage,
        },
        claimDetails: {
          claimId: policy.claimDetails.claimId,
          damageDescription: policy.claimDetails.damageDescription,
          damageImage: policy.claimDetails.damageImage,
          status: policy.claimDetails.status,
        },
        surveyorReport: {
          assessment: policy.surveyorReport.assessment,
          surveyorComments: policy.surveyorReport.surveyorComments,
          damagePercentage: policy.surveyorReport.damagePercentage, // <-- Include damage percentage here
        },
        damagePercentage: differencePercentage, // Return damage percentage in the top-level response
      });
    } catch (err) {
      return res.status(500).json({ message: "Error comparing images." });
    }
  } catch (err) {
    console.error("Error in reviewClaimBySurveyor:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
};
const getAllClaimPolicy = async (req, res) => {
  try {
    // Fetch policies that contain a claimId (i.e., where a claim has been filed)
    const claimedPolicies = await PolicyModel.find({
      "claimDetails.claimId": { $exists: true },
    });

    if (!claimedPolicies || claimedPolicies.length === 0) {
      return res.status(404).json({ message: "No claimed policies found." });
    }

    return res.status(200).json(claimedPolicies);
  } catch (error) {
    console.error("Error fetching claimed policies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const approveRejectClaimByGovernment = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { action } = req.body;

    if (!mongoose.isValidObjectId(claimId)) {
      return res.status(400).json({ message: "Invalid claim ID format." });
    }

    const policy = await PolicyModel.findOne({
      "claimDetails.claimId": claimId,
    }).populate("customerId", "name email phoneNumber");

    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    if (policy.policyStatus !== "waiting for government") {
      return res
        .status(400)
        .json({ message: "Claim must be reviewed by a surveyor first." });
    }

    let damagePercentage = policy.surveyorReport?.damagePercentage;
    if (!damagePercentage) {
      return res
        .status(400)
        .json({ message: "Damage percentage not found in surveyor report." });
    }

    let payoutAmount = Math.round(
      (damagePercentage / 100) * policy.insuranceAmount
    );

    policy.claimDetails.status = action === "approve" ? "approved" : "rejected";
    policy.claimDetails.payoutAmount = action === "approve" ? payoutAmount : 0;
    policy.policyStatus = action === "approve" ? "fulfilled" : "rejected";
    policy.payoutAmount = action === "approve" ? payoutAmount : 0;

    await policy.save();

    let certificatePath = "";
    if (action === "approve") {
      // Generate Insurance Certificate and get relative path
      certificatePath = await generateInsuranceCertificate(
        policy,
        policy.customerId
      );

      // Send Notification to Customer
      await NotificationModel.create({
        customerId: policy.customerId._id,
        message: `Your insurance claim for ${policy.type} has been approved. Certificate available for download.`,
        certificatePath,
      });
    }

    return res.status(200).json({
      message: `Claim ${action}d successfully. Certificate sent to ${policy.customerId.name}.`,
      customer: {
        name: policy.customerId.name,
        email: policy.customerId.email,
        phoneNumber: policy.customerId.phoneNumber,
      },
      policy: {
        policyId: policy.policyId,
        type: policy.type,
        address: policy.address,
        city: policy.city,
        insuranceAmount: policy.insuranceAmount,
        policyStatus: policy.policyStatus,
        payoutAmount: policy.payoutAmount,
      },
      claimDetails: {
        claimId: policy.claimDetails.claimId,
        damageDescription: policy.claimDetails.damageDescription,
        damageImage: policy.claimDetails.damageImage,
        status: policy.claimDetails.status,
        payoutAmount: policy.claimDetails.payoutAmount,
      },
      certificatePath: action === "approve" ? certificatePath : null, // Provide relative certificate link
    });
  } catch (err) {
    console.error("Error in approveRejectClaimByGovernment:", err.message);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.user.id; // Assuming auth middleware attaches `user` object

    const notifications = await NotificationModel.find({ customerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
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
  getCustomerPolicies,
  getAllClaimPolicy,
  getCustomerNotifications,
};
