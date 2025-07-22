const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    roomId: {
      type: String,
      required: false, // Jitsi/Zoom/other room ID
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: false,
    },
    endTime: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // in minutes or hours
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "canceled"],
      default: "scheduled",
    },
    roomPassword: {
      type: String,
      default: null,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Session || mongoose.model("Session", SessionSchema);
