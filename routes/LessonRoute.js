const express = require("express");
const router = express.Router();
const LessonController = require("../controller/LessonController");
const { uploadLessonVideo } = require("../utils/multerConfig");

// Use uploadLessonVideo for video uploads
router.post(
  "/",
  uploadLessonVideo.single("video"),
  LessonController.createLesson
);
router.get("/", LessonController.getLessons);
router.get("/:id", LessonController.getLessonById);
router.put("/:id", LessonController.updateLesson);
router.delete("/:id", LessonController.deleteLesson);

module.exports = router;
