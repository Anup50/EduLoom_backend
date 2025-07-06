const express = require("express");
const router = express.Router();
const LessonController = require("../controller/LessonController");

router.post("/", LessonController.createLesson);
router.get("/", LessonController.getLessons);
router.get("/:id", LessonController.getLessonById);
router.put("/:id", LessonController.updateLesson);
router.delete("/:id", LessonController.deleteLesson);

module.exports = router;
