const express = require("express");
const {
  getSessionRoom,
  startSession,
  endSession,
  getJaaSToken,
  getStudentSessions,
  getTutorSessions,
  joinSession,
} = require("../controller/SessionController");
const { authenticateToken } = require("../security/Auth");

const router = express.Router();

// Get session room info by lessonId
router.get("/room/:lessonId", authenticateToken, getSessionRoom);
// Tutor starts a session for a lesson
router.put("/start/:lessonId", authenticateToken, startSession);
// Tutor ends a session for a lesson
router.put("/end/:lessonId", authenticateToken, endSession);
// Get JAAS token for a session by lessonId
router.get("/jaas-token/:lessonId", authenticateToken, getJaaSToken);
// Student joins a session (adds to attendees)
router.put("/join/:lessonId", authenticateToken, joinSession);
// Get all sessions for the authenticated student
router.get("/student", authenticateToken, getStudentSessions);
// Get all sessions for the authenticated tutor
router.get("/tutor", authenticateToken, getTutorSessions);

module.exports = router;
