const mongoose = require("mongoose");

const surveyorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

});

module.exports = mongoose.model("Surveyor", surveyorSchema);
