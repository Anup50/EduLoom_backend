const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "booking",
      "session",
      "payment",
      "communication",
      "system",
      "course",
    ],
    required: true,
  },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // Optional, for course-related notifications
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "Tutor" }, // Optional, for tutor-related notifications
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
