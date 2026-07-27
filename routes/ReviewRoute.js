const express = require("express");
const {
  giveReview,
  getReviewsByTutorUsername,
} = require("../controller/ReviewController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/give", authenticateToken, giveReview);
router.get("/tutor/:username", getReviewsByTutorUsername);

module.exports = router;
