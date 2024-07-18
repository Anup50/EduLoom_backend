const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletBalance: { type: Number, default: 0 },
  profileImage: { type: String },
  dateJoined: { type: Date, default: Date.now },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

module.exports =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
