const Quiz = require("../model/Quiz");
const Course = require("../model/Course");

exports.createQuiz = async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();

    // Add the quiz to the course's quizzes array
    await Course.findByIdAndUpdate(
      quiz.course,
      { $push: { quizzes: quiz._id } },
      { new: true }
    );

    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Remove the quiz from the course's quizzes array
    await Course.findByIdAndUpdate(
      quiz.course,
      { $pull: { quizzes: quiz._id } },
      { new: true }
    );

    // Delete the quiz
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuizzesByCourseId = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const quizzes = await Quiz.find({ course: courseId });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
