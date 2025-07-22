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
  experience: [{ type: String }], // Array of experience points
  teachingIntrests: [{ type: String }], // Array of teaching interests
});

// Add custom validation for experience field
tempUserSchema.pre("save", function (next) {
  if (
    this.role === "tutor" &&
    (!this.experience || this.experience.length === 0)
  ) {
    return next(
      new Error("At least one experience point is required for tutors")
    );
  }
  next();
});

const TempUser = mongoose.model("TempUser", tempUserSchema);
module.exports = TempUser;
