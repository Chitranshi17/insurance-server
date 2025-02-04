  const PDFDocument = require("pdfkit");
  const fs = require("fs");
  const path = require("path");

  const generatePolicyCertificate = async (policy) => {
    try {
      const {
        customerId,
        policyId,
        type,
        insuranceAmount,
        createdAt,
        claimDetails,
      } = policy;

      // Define certificate path
      const certificatePath = path.join(
        __dirname,
        `../certificates/${policyId}.pdf`
      );

      // Create a PDF document
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(certificatePath));

      // Add content
      doc
        .fontSize(20)
        .text("INSURANCE POLICY CERTIFICATE", { align: "center" })
        .moveDown();

      doc.fontSize(14).text(`Policy Number: ${policyId}`);
      doc.text(`Issue Date: ${new Date(createdAt).toDateString()}`);
      doc.text(`Expiry Date: ${new Date(createdAt).getFullYear() + 1}-12-31`); // Assuming 1-year validity
      doc.moveDown();

      doc.fontSize(16).text("Policyholder Details", { underline: true });
      doc.fontSize(14).text(`Name: ${customerId.name}`);
      doc.text(`Address: ${policy.address}, ${policy.city}`);
      doc.text(`Contact Number: ${customerId.phoneNumber}`);
      doc.text(`Email: ${customerId.email}`);
      doc.moveDown();

      doc.fontSize(16).text("Insurance Coverage Details", { underline: true });
      doc.fontSize(14).text(`Sum Insured: ₹${insuranceAmount}`);
      doc.text(`Policy Type: ${type}`);
      doc.moveDown();

      doc.text("Coverage Includes:");
      doc.text("✔️ Accidental Damage");
      doc.text("✔️ Theft Protection");
      doc.text("✔️ Fire & Natural Disaster Cover");
      doc.text("✔️ Third-Party Liability");
      doc.text("✔️ Personal Accident Cover");
      doc.moveDown();

      doc.fontSize(16).text("Claim Details", { underline: true });
      doc.fontSize(14).text(`Claim ID: ${claimDetails.claimId}`);
      doc.text(`Claim Status: ${claimDetails.status}`);
      doc.text(`Payout Amount: ₹${claimDetails.payoutAmount}`);
      doc.moveDown();

      doc
        .fontSize(14)
        .text(
          "This insurance policy is issued and approved by the Government Insurance Regulatory Authority. Any claims will be processed as per the terms and conditions of the insurance company."
        );
      doc.moveDown();

      doc.text("Authorized Signatory:", { align: "left" });
      doc.text("(Insurance Provider)", { align: "left" });

      // Finalize the PDF
      doc.end();

      return `/certificates/${policyId}.pdf`; // 🔴 Return file path as URL
    } catch (error) {
      console.error("Error generating policy certificate:", error);
      return null;
    }
  };

  module.exports = generatePolicyCertificate;
