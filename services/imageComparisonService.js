// backend/services/imageComparisonService.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Function to call the Python API for image comparison
const compareImages = async (image1Path, image2Path) => {
  try {
    const formData = new FormData();
    formData.append("image1", fs.createReadStream(image1Path));
    formData.append("image2", fs.createReadStream(image2Path));

    const response = await axios.post(
      "http://localhost:5000/compare-images",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error comparing images:", error);
    throw new Error("Error comparing images");
  }
};

module.exports = { compareImages };
