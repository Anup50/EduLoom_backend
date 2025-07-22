const QuizResult = require("../model/QuizResult");
const Quiz = require("../model/Quiz");

exports.submitResult = async (req, res) => {
  try {
    const {
      quiz: quizId,
      student: studentId,
      answers,
      score,
      total,
    } = req.body;

    // Check if student has already submitted this quiz
    const existingSubmission = await QuizResult.findOne({
      quiz: quizId,
      student: studentId,
    });

    if (existingSubmission) {
      return res.status(400).json({
        error: "Quiz already submitted",
        message:
          "You have already submitted this quiz. Multiple submissions are not allowed.",
        submittedAt: existingSubmission.submittedAt,
        score: existingSubmission.score,
      });
    }

    // Fetch the quiz to validate answers
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Count correct answers
    let correctAnswers = 0;
    answers.forEach((answer) => {
      const question = quiz.questions.find(
        (q) => q._id.toString() === answer.questionId.toString()
      );
      if (question && answer.selectedOption === question.correctAnswer) {
        correctAnswers++;
      }
    });

    // Calculate percentage score (0-100)
    const totalQuestions = quiz.questions.length;
    const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Check if submitted score is valid
    if (calculatedScore !== score || total !== 100) {
      return res.status(400).json({
        error: "Invalid score submitted",
        expectedScore: calculatedScore,
        submittedScore: score,
        correctAnswers,
        totalQuestions,
        message: "Score should be a percentage out of 100",
      });
    }

    // If validation passes, save the result
    const result = new QuizResult(req.body);
    await result.save();

    // Include pass/fail status in response
    const passed = score >= quiz.passingGrade;
    res.status(201).json({
      ...result.toObject(),
      passed,
      passingGrade: quiz.passingGrade,
    });
  } catch (err) {
    console.error("Error in submitResult:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.getResultsByStudent = async (req, res) => {
  try {
    const results = await QuizResult.find({
      student: req.params.studentId,
    }).populate("quiz");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getResultsByQuiz = async (req, res) => {
  try {
    const results = await QuizResult.find({ quiz: req.params.quizId }).populate(
      {
        path: "student",
        select: "_id name", // Directly select name from User model
      }
    );

    const sanitizedResults = results.map((result) => ({
      score: result.score,
      submittedAt: result.submittedAt,
      student: {
        id: result.student._id,
        name: result.student.name || "Unknown",
      },
    }));

    res.json(sanitizedResults);
  } catch (err) {
    console.error("Error in getResultsByQuiz:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getResultById = async (req, res) => {
  try {
    const result = await QuizResult.findById(req.params.id).populate(
      "student quiz"
    );
    if (!result) return res.status(404).json({ error: "Result not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
