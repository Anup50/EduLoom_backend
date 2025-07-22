const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  status: {
    type: String,
    enum: ["enrolled", "completed", "cancelled"],
    default: "enrolled",
  },
  paymentStatus: {
    type: String,
    enum: ["free", "paid", "pending", "failed"],
    default: "pending",
  },
  amount: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);
