const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["mcq", "boolean"],
    required: true,
  },
  options: {
    type: [String],
  },
  correctAnswer: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const quizSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  passingGrade: {
    type: Number,
    required: true,
    min: [0, "Passing grade must be at least 0%"],
    max: [100, "Passing grade cannot exceed 100%"],
  },

  questions: [questionSchema],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Quiz", quizSchema);
