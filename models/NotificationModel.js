// models/NotificationModel.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    certificatePath: {
      type: String,
    },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("Notification", notificationSchema);

module.exports = NotificationModel;
