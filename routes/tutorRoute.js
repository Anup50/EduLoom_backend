const express = require("express");
const router = express.Router();
const TutorController = require("../controller/TutorController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { uploadTutor } = require("../utils/multerConfig");

router.get("/", TutorController.getTutors);
router.put(
  "/update-profile",
  authenticateToken,
  uploadTutor.single("profileImage"),
  TutorController.updateTutorProfile
);
router.get("/profile", authenticateToken, TutorController.getTutorProfile);
router.get("/profile/:username", TutorController.getTutorByUsername);

module.exports = router;
