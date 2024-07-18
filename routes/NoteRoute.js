const express = require("express");
const router = express.Router();
const NoteController = require("../controller/NoteController");
const { authenticateToken } = require("../security/Auth");
const validationMiddleware = require("../middleware/validationMiddleware");
const noteValidation = require("../validation/NoteValidation");

router.post(
  "/",
  authenticateToken,
  validationMiddleware(noteValidation.createNote),
  NoteController.createNote
);
router.get("/", NoteController.getNotes);
router.get(
  "/lesson/:lessonId",
  authenticateToken,
  validationMiddleware(noteValidation.lessonId, "params"),
  NoteController.getNotesForLesson
);
router.get(
  "/my-note/:lessonId",
  authenticateToken,
  validationMiddleware(noteValidation.lessonId, "params"),
  NoteController.getOrCreateNote
);
router.get("/shared", authenticateToken, NoteController.getNotesSharedWithMe);
router.post(
  "/:id/share",
  authenticateToken,
  validationMiddleware(noteValidation.shareNote),
  NoteController.shareNote
);
router.get(
  "/:id",
  validationMiddleware(noteValidation.noteId, "params"),
  NoteController.getNoteById
);
router.put(
  "/:id",
  authenticateToken,
  validationMiddleware(noteValidation.updateNote),
  NoteController.updateNote
);
router.delete(
  "/:id",
  authenticateToken,
  validationMiddleware(noteValidation.noteId, "params"),
  NoteController.deleteNote
);

// Test endpoint (remove in production)
router.post("/test-sanitization", NoteController.testSanitization);

module.exports = router;
