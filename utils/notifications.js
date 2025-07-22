const Notification = require("../model/Notification");
const Enrollment = require("../model/Enrollment");
const Course = require("../model/Course");

// Socket event names
const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: "new-notification",
  NOTIFICATION_READ: "notification-read",
  COURSE_NOTIFICATION: "course-notification",
};

const sendRealTimeUpdate = (userId, event, data) => {
  if (!userId) {
    console.error("Invalid userId provided for WebSocket event.");
    return;
  }
  console.log("Sending realtime notification:", { userId, event, data });

  const socketId = global.connectedUsers[userId.toString()];

  if (!global.io) {
    console.error("Socket.io not initialized!");
    return;
  }

  if (socketId) {
    // Send to specific user
    global.io.to(socketId).emit(event, {
      type: event,
      timestamp: new Date(),
      data,
    });
    console.log(`Notification sent to socket ${socketId}`);
  } else {
    console.log(
      `User ${userId} not connected to socket. Notification saved to DB only.`
    );
  }
};

const sendNotification = async (
  userId,
  message,
  type = "booking",
  additionalData = {}
) => {
  try {
    console.log("Creating notification:", {
      userId,
      message,
      type,
      additionalData,
    });

    const notification = new Notification({
      userId,
      message,
      type,
      courseId: additionalData.courseId,
      tutorId: additionalData.tutorId,
    });

    const savedNotification = await notification.save();
    console.log("Notification saved:", savedNotification);

    // Send real-time update with specific event type
    sendRealTimeUpdate(
      userId,
      NOTIFICATION_EVENTS.NEW_NOTIFICATION,
      savedNotification
    );
    return savedNotification;
  } catch (error) {
    console.error("Error in sendNotification:", error);
    throw error;
  }
};

const sendCourseNotification = async (courseId, tutorId, message) => {
  try {
    console.log("Sending course notification:", { courseId, tutorId, message });

    // Get all enrollments for the course
    const enrollments = await Enrollment.find({ course: courseId }).populate(
      "student",
      "userId"
    ); // Get the userId from student

    console.log("Found enrollments:", enrollments);

    if (!enrollments.length) {
      console.log("No students enrolled in this course");
      return {
        success: false,
        message: "No students enrolled in this course",
        studentsNotified: 0,
      };
    }

    // Send notification to each enrolled student
    const notificationPromises = enrollments.map((enrollment) => {
      const notification = sendNotification(
        enrollment.student.userId, // Use the actual userId from the student document
        message,
        "course",
        { courseId, tutorId }
      );
      return notification;
    });

    const notifications = await Promise.all(notificationPromises);
    console.log("All notifications sent:", notifications);

    // Broadcast to all enrolled students
    enrollments.forEach((enrollment) => {
      sendRealTimeUpdate(
        enrollment.student.userId,
        NOTIFICATION_EVENTS.COURSE_NOTIFICATION,
        {
          courseId,
          tutorId,
          message,
          timestamp: new Date(),
        }
      );
    });

    return {
      success: true,
      message: `Notification sent to ${enrollments.length} students`,
      studentsNotified: enrollments.length,
      notifications: notifications,
    };
  } catch (error) {
    console.error("Error in sendCourseNotification:", error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendCourseNotification,
  NOTIFICATION_EVENTS,
};
