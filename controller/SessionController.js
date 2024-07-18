const Session = require("../model/Session");
const Student = require("../model/Student");
const Tutor = require("../model/Tutor");
const User = require("../model/User");
const Course = require("../model/Course");
const Lesson = require("../model/Lesson");
const Earning = require("../model/Earning");
const Transaction = require("../model/Transaction");
const { sendNotification } = require("../utils/notifications");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { profile } = require("console");
require("dotenv").config();

// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;
const JAAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAAS_API_KEY = process.env.JAAS_API_KEY;
const JAAAS_SECRET = process.env.JAAS_SECRET;
const privateKey = process.env.JAAS_PRIVATE_KEY;

async function getJaaSToken(req, res) {
  try {
    const { lessonId } = req.params;
    const session = await Session.findOne({ lessonId })
      .populate({
        path: "tutorId",
        populate: { path: "userId", select: "name email _id" },
      })
      .populate("courseId");

    if (!session || !session.roomId) {
      return res.status(404).json({ message: "Session or room not found." });
    }

    const user = await User.findById(req.user.id);
    const isTutor = req.user.role === "tutor";

    // Validate access permissions
    if (isTutor) {
      // Check if user is the tutor of this session
      if (session.tutorId.userId._id.toString() !== user._id.toString()) {
        return res
          .status(403)
          .json({ message: "You are not the tutor of this session." });
      }
    } else {
      // Check if user is a student enrolled in the course
      const student = await Student.findOne({ userId: user._id });
      if (!student) {
        return res.status(403).json({ message: "Student profile not found." });
      }

      // Check if student is enrolled in the course
      const isEnrolled = session.courseId.students.some(
        (studentId) => studentId.toString() === student._id.toString()
      );
      if (!isEnrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course." });
      }

      // Check if session is in progress
      if (session.status !== "in-progress") {
        return res
          .status(403)
          .json({ message: "Session is not currently active." });
      }
    }

    const userData = isTutor ? session.tutorId.userId : user;
    const profileData = isTutor ? session.tutorId : user;

    // Use lessonId as room name (same as in startSession)
    const roomName = session.roomId;
    // Temporarily use simple name for testing

    console.log("Debug - session.roomId:", session.roomId);
    console.log("Debug - using roomName:", roomName);

    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: JAAAS_APP_ID,
      room: roomName,
      exp: Math.floor(Date.now() / 1000) + 3600,
      context: {
        user: {
          avatar: profileData.profileImage || "",
          name: userData.name || "User",
          email: userData.email || "",
          id: user._id.toString(),
          moderator: isTutor,
        },
        features: {
          livestreaming: false,
          recording: false,
        },
      },
    };

    console.log("Debug - JWT Payload:", JSON.stringify(payload, null, 2));
    console.log("Debug - JAAS_APP_ID:", JAAAS_APP_ID);
    console.log("Debug - JAAS_SECRET:", JAAAS_SECRET ? "Present" : "Missing");
    console.log("Debug - privateKey:", privateKey ? "Present" : "Missing");

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      header: { kid: JAAAS_SECRET, typ: "JWT" },
    });

    console.log("Debug - Generated token length:", token.length);
    console.log("Debug - Token preview:", token.substring(0, 50) + "...");

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error("Error generating Jitsi JWT token:", error);
    res.status(500).json({ message: "Failed to generate JWT token." });
  }
}

async function getSessionRoom(req, res) {
  try {
    const { lessonId } = req.params;
    const session = await Session.findOne({ lessonId });
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }
    res.status(200).json({
      success: true,
      roomId: session.roomId,
      roomPassword: session.roomPassword,
      startTime: session.startTime,
      status: session.status,
    });
  } catch (error) {
    console.error("Error fetching session room:", error);
    res.status(500).json({ message: "Failed to fetch session room." });
  }
}

async function startSession(req, res) {
  try {
    const { lessonId } = req.params;
    const session = await Session.findOne({ lessonId }).populate("tutorId");
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }
    if (session.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Session has already started or ended." });
    }
    const user = await User.findById(req.user.id);
    const isTutor = session.tutorId.userId.toString() === user._id.toString();
    if (!isTutor) {
      return res
        .status(403)
        .json({ message: "Only tutors can start sessions." });
    }

    // Use lessonId as room name for simplicity
    const roomId = lessonId;
    const roomPassword = crypto.randomBytes(8).toString("hex");

    session.status = "in-progress";
    session.startTime = new Date();
    session.roomId = roomId;
    session.roomPassword = roomPassword;
    await session.save();

    console.log("Debug - Created roomId:", roomId);

    sendNotification(session.tutorId.userId, "You have started the session.");
    res.status(200).json({
      success: true,
      message: "Session started successfully.",
      session: { roomId, roomPassword, startTime: session.startTime },
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ message: "Failed to start session." });
  }
}

async function endSession(req, res) {
  try {
    const { lessonId } = req.params;
    const session = await Session.findOne({ lessonId }).populate("tutorId");
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }
    if (session.status !== "in-progress") {
      return res.status(400).json({ message: "Session is not ongoing." });
    }
    const user = await User.findById(req.user.id);
    const isTutor = session.tutorId.userId.toString() === user._id.toString();
    if (!isTutor) {
      return res.status(403).json({ message: "Only tutors can end sessions." });
    }
    const endTime = new Date();
    const durationInMs = endTime - new Date(session.startTime);
    const durationInHours = durationInMs / (1000 * 60 * 60);
    session.duration = durationInHours;
    session.status = "completed";
    session.endTime = endTime;
    await session.save();
    res.status(200).json({
      success: true,
      message: "Session ended successfully.",
      duration: durationInHours,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ message: "Failed to end session." });
  }
}

// Student joins a session (adds to attendees if enrolled in the course)
async function joinSession(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const student = await Student.findOne({ userId });
    if (!student) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Student not found." });
    }
    const session = await Session.findOne({ lessonId });
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }
    // Check enrollment
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }
    const course = await Course.findById(session.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    const isEnrolled = course.students.some(
      (studentId) => studentId.toString() === student._id.toString()
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course." });
    }
    // Add to attendees if not already present
    if (!session.attendees.includes(student._id)) {
      session.attendees.push(student._id);
      await session.save();
    }
    res
      .status(200)
      .json({ success: true, message: "Joined session successfully." });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ message: "Failed to join session." });
  }
}

const getTutorSessions = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ userId: req.user.id });
    if (!tutor) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Tutor not found." });
    }

    const sessions = await Session.find({ tutorId: tutor._id })
      .populate("lessonId", "title") // Only get title from lesson
      .populate("courseId", "title") // Only get title from course
      .lean() // Convert to plain JavaScript object
      .exec();

    // Transform the data before sending
    const simplifiedSessions = sessions.map((session) => ({
      _id: session._id,
      scheduledDate: session.scheduledDate,
      startTime: session.startTime || "",
      status: session.status,
      lessonId: {
        _id: session.lessonId?._id,
        title: session.lessonId?.title || "Untitled Lesson",
      },
      courseId: {
        _id: session.courseId?._id,
        title: session.courseId?.title || "Untitled Course",
      },
    }));

    res.status(200).json({ success: true, sessions: simplifiedSessions });
  } catch (error) {
    console.error("Error fetching tutor sessions:", error);
    res.status(500).json({ message: "Failed to fetch tutor sessions." });
  }
};

const getStudentSessions = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Student not found." });
    }

    // Get all courses the student is enrolled in
    const enrolledCourses = await Course.find({ students: student._id });
    const courseIds = enrolledCourses.map((course) => course._id);

    // Find all sessions from enrolled courses
    const sessions = await Session.find({
      courseId: { $in: courseIds },
    })
      .populate("lessonId", "title")
      .populate("courseId", "title")
      .lean()
      .exec();

    // Transform the data before sending
    const simplifiedSessions = sessions.map((session) => ({
      _id: session._id,
      scheduledDate: session.scheduledDate,
      startTime: session.startTime || "",
      status: session.status,
      lessonId: {
        _id: session.lessonId?._id,
        title: session.lessonId?.title || "Untitled Lesson",
      },
      courseId: {
        _id: session.courseId?._id,
        title: session.courseId?.title || "Untitled Course",
      },
    }));

    res.status(200).json({ success: true, sessions: simplifiedSessions });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    res.status(500).json({ message: "Failed to fetch student sessions." });
  }
};

module.exports = {
  getSessionRoom,
  startSession,
  endSession,
  getJaaSToken,
  getTutorSessions,
  getStudentSessions,
  joinSession,
};
