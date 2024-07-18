const express = require("express");
const router = express.Router();
const QuizResultController = require("../controller/QuizResultController");

// Submit a quiz result
router.post("/", QuizResultController.submitResult);

// Get all results for a specific student
router.get("/student/:studentId", QuizResultController.getResultsByStudent);

// Get all results for a specific quiz
router.get("/quiz/:quizId", QuizResultController.getResultsByQuiz);

// Get a specific result by ID
router.get("/:id", QuizResultController.getResultById);

module.exports = router;
