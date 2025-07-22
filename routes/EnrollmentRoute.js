const express = require("express");
const router = express.Router();
const EnrollmentController = require("../controller/EnrollmentController");
const { authenticateToken } = require("../security/Auth");

router.post("/", authenticateToken, EnrollmentController.createEnrollment);
router.get("/", EnrollmentController.getEnrollments);
router.get(
  "/my-enrollments",
  authenticateToken,
  EnrollmentController.getMyEnrollments
);
router.get(
  "/tutor-enrollments",
  authenticateToken,
  EnrollmentController.getTutorCourseEnrollments
);
router.get("/student/:studentId", EnrollmentController.getEnrollmentsByStudent);
router.get(
  "/student/:studentId/courses",
  EnrollmentController.getStudentEnrolledCourses
);
router.get("/:id", EnrollmentController.getEnrollmentById);
router.put("/:id", authenticateToken, EnrollmentController.updateEnrollment);
router.delete("/:id", authenticateToken, EnrollmentController.deleteEnrollment);

module.exports = router;
