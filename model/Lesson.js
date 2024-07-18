const mongoose = require("mongoose");

// const lessonSchema = new mongoose.Schema({
//   course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
//   title: { type: String, required: true },
//   description: String,
//   type: { type: String, enum: ["live", "recorded"], default: "live" },
//   videoUrl: String, // for recorded lessons
//   scheduledAt: Date, // for live lessons
//   duration: Number, // in minutes
//   createdAt: { type: Date, default: Date.now }
// });
const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["live", "recorded"], default: "live" },
  videoUrl: String,
  scheduledDate: Date, // for live lessons only
  duration: Number, // in minutes
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Lesson", lessonSchema);
