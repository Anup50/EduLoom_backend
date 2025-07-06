const express = require("express");
const router = express.Router();
const QuizController = require("../controller/QuizController");

router.post("/", QuizController.createQuiz);
router.get("/", QuizController.getQuizzes);
router.get("/:id", QuizController.getQuizById);
router.put("/:id", QuizController.updateQuiz);
router.delete("/:id", QuizController.deleteQuiz);

module.exports = router;
