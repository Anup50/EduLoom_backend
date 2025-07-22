const express = require("express");
const Notification = require("../model/Notification");
const { authenticateToken } = require("../security/Auth");
const { sendCourseNotification } = require("../utils/notifications");
const Course = require("../model/Course");
const Tutor = require("../model/Tutor");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  console.log("Fetching notifications for user:", req.user.id);
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.put("/mark-read", authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { isRead: true });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications:", error);
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

// Add this new route for course notifications
router.post("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    console.log("Course notification request:", {
      courseId,
      message,
      userId,
    });

    // Verify the tutor owns this course
    const tutor = await Tutor.findOne({ userId });
    console.log("Found tutor:", tutor);

    if (!tutor) {
      console.log("No tutor found for userId:", userId);
      return res
        .status(403)
        .json({ error: "Only tutors can send course notifications" });
    }

    const course = await Course.findOne({ _id: courseId, tutor: tutor._id });
    console.log("Found course:", course);

    if (!course) {
      console.log("No course found or tutor doesn't own it:", {
        courseId,
        tutorId: tutor._id,
      });
      return res
        .status(403)
        .json({ error: "Course not found or you don't have permission" });
    }

    // Send notification to all enrolled students
    const result = await sendCourseNotification(courseId, tutor._id, message);
    console.log("Notification result:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in course notification route:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

module.exports = router;
