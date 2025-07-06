const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "tutor"], required: true },
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  profileImage: { type: String },
  bio: { type: String },
  exprience: { type: String, required: true },
  teachingIntrests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

const TempUser = mongoose.model("TempUser", tempUserSchema);
module.exports = TempUser;
