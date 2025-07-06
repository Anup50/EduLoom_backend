const express = require("express");
const router = express.Router();
const EnrollmentController = require("../controller/EnrollmentController");

router.post("/", EnrollmentController.createEnrollment);
router.get("/", EnrollmentController.getEnrollments);
router.get("/:id", EnrollmentController.getEnrollmentById);
router.put("/:id", EnrollmentController.updateEnrollment);
router.delete("/:id", EnrollmentController.deleteEnrollment);

module.exports = router;
