// const PolicyModel = require("../models/policyModel");
// const mongoose = require("mongoose");
// const fs = require("fs");
// const path = require("path");
// const PDFDocument = require("pdfkit");

// // Create Policy
// const createPolicy = async (req, res) => {
//   try {
//     const { phoneNumber, type, img, address, city } = req.body;

//     if (!phoneNumber || !type || !img || !address || !city) {
//       return res.status(400).json({ message: "Please provide all required fields" });
//     }

//     const newPolicy = new PolicyModel({
//       phoneNumber,
//       type,
//       img,
//       address,
//       city,
//       policyId: new mongoose.Types.ObjectId().toHexString(),
//       policyStatus: "pending",
//     });
//     await newPolicy.save();
//     return res.status(201).json({
//       message: "Policy created successfully",
//       policy: newPolicy,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Server error, please try again later" });
//   }
// };

// // Approve or Reject Policy
// const approveRejectPolicy = async (req, res) => {
//   try {
//     const { policyId, status } = req.body;

//     if (!policyId || !status) {
//       return res.status(400).json({ message: "Policy ID and status are required." });
//     }

//     const policy = await PolicyModel.findOne({ policyId: policyId });

//     if (!policy) {
//       return res.status(404).json({ message: "Policy not found." });
//     }

//     if (!["approved", "rejected"].includes(status.toLowerCase())) {
//       return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
//     }

//     policy.policyStatus = status;
//     await policy.save();

//     if (status.toLowerCase() === "approved") {
//       const doc = new PDFDocument();
//       const filePath = path.join(__dirname, `../certificates/${policy.policyId}_certificate.pdf`);

//       doc.pipe(fs.createWriteStream(filePath));

//       doc.fontSize(25).text("Policy Certificate", { align: "center" });

//       doc.fontSize(18).text(`Policy ID: ${policy.policyId}`, { align: "center" });
//       doc.text(`Issued To: ${policy.phoneNumber}`, { align: "center" });
//       doc.text(`Policy Type: ${policy.type}`, { align: "center" });
//       doc.text(`Address: ${policy.address}`, { align: "center" });
//       doc.text(`City: ${policy.city}`, { align: "center" });
//       doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, { align: "center" });

//       doc.text("\nThis certificate certifies that the insured has successfully purchased the above-mentioned policy with full coverage.", { align: "center" });

//       doc.end();

//       return res.status(200).json({
//         message: "Policy approved successfully",
//         certificateUrl: `/certificates/${policy.policyId}_certificate.pdf`,
//       });
//     }

//     return res.status(200).json({
//       message: "Policy rejected successfully",
//       policy,
//     });
//   } catch (err) {
//     console.error("Error in approveRejectPolicy:", err);
//     return res.status(500).json({ message: "Server error, please try again later." });
//   }
// };

// // Get Policy Certificate (New Method)
// const getCertificate = async (req, res) => {
//   try {
//     const { policyId } = req.params;

//     if (!policyId) {
//       return res.status(400).json({ message: "Policy ID is required." });
//     }

//     const policy = await PolicyModel.findOne({ policyId: policyId });

//     if (!policy) {
//       return res.status(404).json({ message: "Policy not found." });
//     }

//     if (policy.policyStatus !== "approved") {
//       return res.status(400).json({ message: "Policy is not approved yet." });
//     }

//     const certificatePath = path.join(__dirname, `../certificates/${policy.policyId}_certificate.pdf`);

//     if (fs.existsSync(certificatePath)) {
//       return res.status(200).sendFile(certificatePath);
//     } else {
//       return res.status(404).json({ message: "Certificate not found." });
//     }
//   } catch (err) {
//     console.error("Error in getCertificate:", err);
//     return res.status(500).json({ message: "Server error, please try again later." });
//   }
// };

// module.exports = { createPolicy, approveRejectPolicy, getCertificate };



const PolicyModel = require("../models/policyModel");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ✅ Create Policy with Image Upload
const createPolicy = async (req, res) => {
  try {
    const { phoneNumber, type, address, city } = req.body;
    const img = req.file ? req.file.path : null; // Store image path

    if (!phoneNumber || !type || !img || !address || !city) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const newPolicy = new PolicyModel({
      phoneNumber,
      type,
      img,
      address,
      city,
      policyId: new mongoose.Types.ObjectId().toHexString(),
      policyStatus: "pending",
    });

    await newPolicy.save();
    return res.status(201).json({
      message: "Policy created successfully",
      policy: newPolicy,
    });
  } catch (err) {
    console.error(err);
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

    if (policy.policyStatus !== "approved") {
      return res.status(400).json({ message: "Policy is not approved yet." });
    }

    const certificatePath = path.join(
      __dirname,
      `../certificates/${policy.policyId}_certificate.pdf`
    );

    if (fs.existsSync(certificatePath)) {
      return res.status(200).sendFile(certificatePath);
    } else {
      return res.status(404).json({ message: "Certificate not found." });
    }
  } catch (err) {
    console.error("Error in getCertificate:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

// ✅ Customer Requests Policy Claim (with Image Upload)

const claimPolicy = async (req, res) => {
  try {
    console.log("Claim Request Received:", req.body);
    console.log("Uploaded File:", req.file); // Debugging log

    const { policyId } = req.params;
    const { damageDescription } = req.body;
    const damageImage = req.file ? req.file.path : null; // Store image path

    // Check if required fields are present
    if (!damageDescription || !damageImage) {
      return res
        .status(400)
        .json({ message: "Damage description and image are required." });
    }

    // Find the policy in the database
    const policy = await PolicyModel.findOne({ policyId });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found." });
    }

    // Ensure policy is active before allowing claims
    if (policy.policyStatus !== "active") {
      return res
        .status(400)
        .json({ message: "Only active policies can be claimed." });
    }

    // Update claim details and set status to pending for surveyor review
    policy.claimDetails = {
      damageDescription,
      damageImage,
      surveyorStatus: "pending",
    };

    policy.policyStatus = "pending"; // Waiting for surveyor review
    await policy.save();

    return res.status(201).json({
      message:
        "Claim request submitted successfully. Waiting for surveyor approval.",
      policy,
    });
  } catch (err) {
    console.error("Error in claimPolicy:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

// ✅ Surveyor Approves or Rejects the Claim
const reviewClaim = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    const policy = await PolicyModel.findOne({ policyId });
    if (!policy || !policy.claimDetails) {
      return res.status(404).json({ message: "Claim request not found." });
    }

    policy.claimDetails.surveyorStatus = action;
    policy.policyStatus = action === "approve" ? "fulfilled" : "rejected";

    await policy.save();

    return res.status(200).json({
      message: `Claim has been ${action}d by the surveyor.`,
      policy,
    });
  } catch (err) {
    console.error("Error in reviewClaim:", err);
    return res.status(500).json({ message: "Server error, please try again later." });
  }
};

module.exports = {
  createPolicy,
  approveRejectPolicy,
  claimPolicy,
  getCertificate,
  claimPolicy,
  reviewClaim,
};
