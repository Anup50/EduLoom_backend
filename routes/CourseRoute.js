const express = require("express");
const router = express.Router();
const CourseController = require("../controller/CourseController");
const { uploadCourseImage } = require("../utils/multerConfig");
const { authenticateToken, authorizeRole } = require("../security/Auth");

// Get all difficulties
router.get("/difficulties", CourseController.getDifficulties);
// Create a new course (only teachers)
router.post(
  "/",
  authenticateToken,
  authorizeRole("tutor"),
  CourseController.createCourse
);
// Get all courses
router.get("/", CourseController.getCourses);
router.get("/tutor", authenticateToken, CourseController.getCoursesByTutor);
// Get a course by ID
router.get("/:id", CourseController.getCourseById);
// Update a course (only teachers)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("tutor"),
  uploadCourseImage.single("courseImage"),
  CourseController.updateCourse
);
// Delete a course (only teachers)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("tutor"),
  CourseController.deleteCourse
);

module.exports = router;
