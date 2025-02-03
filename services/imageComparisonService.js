const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const compareImages = async (originalImagePath, damageImagePath) => {
  try {
    if (!fs.existsSync(originalImagePath) || !fs.existsSync(damageImagePath)) {
      throw new Error("One or both image files are missing.");
    }
    const formData = new FormData();
    formData.append("image1", fs.createReadStream(originalImagePath));
    formData.append("image2", fs.createReadStream(damageImagePath));

    const response = await axios.post(
      "http://127.0.0.1:5000/compare-images",
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    return response.data;
  } catch (error) {
    console.error("Error comparing images:", error.message);
    throw new Error("Error comparing images: " + error.message);
  }
};

module.exports = compareImages;
