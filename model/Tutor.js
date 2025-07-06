const mongoose = require("mongoose");

const tutorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bio: { type: String, required: true },
  exprience: { type: String, required: true },
  teachingIntrests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  rating: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  dateJoined: { type: Date, default: Date.now },
  profileImage: { type: String },
});

const Tutor = mongoose.models.Tutor || mongoose.model("Tutor", tutorSchema);
module.exports = Tutor;
