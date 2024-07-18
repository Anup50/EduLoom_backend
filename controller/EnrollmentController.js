const Enrollment = require("../model/Enrollment");
const Student = require("../model/Student");
const Course = require("../model/Course");
const Tutor = require("../model/Tutor");
const User = require("../model/User");
const Earning = require("../model/Earning");
const { sendNotification } = require("../utils/notifications");

// Platform Commission (20%)
const PLATFORM_COMMISSION = 0.2;

const sendRealTimeUpdate = (userId, event, data) => {
  if (!userId) {
    console.error("Invalid userId provided for WebSocket event.");
    return;
  }

  const socketId = global.connectedUsers[userId.toString()];
  console.log(" Checking connectedUsers:", global.connectedUsers);
  console.log(` Checking for user: ${userId}, Found socket ID:`, socketId);
  if (!global.io) {
    console.error(" io is undefined! WebSocket might not be initialized.");
    return;
  }

  if (socketId) {
    global.io.to(socketId).emit(event, data);
    console.log(` WebSocket Event Sent: ${event} to user ${userId}`);
  } else {
    console.warn(`User ${userId} is not online. Storing notification.`);
    sendNotification(userId, `You have a new ${event}`);
  }
};

const EnrollmentController = {
  async createEnrollment(req, res) {
    console.log("Creating enrollment: ", req.body);
    try {
      const { courseId } = req.body;

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required." });
      }

      // Find student by user ID
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        return res.status(404).json({ message: "Student profile not found." });
      }

      // Find course and populate tutor info
      const course = await Course.findById(courseId).populate({
        path: "tutor",
        populate: { path: "userId", select: "name" },
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found." });
      }

      // Check if student is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: student._id,
        course: courseId,
      });

      if (existingEnrollment) {
        return res.status(400).json({
          message: "You are already enrolled in this course.",
        });
      }

      // Handle free courses
      if (course.isFree) {
        const enrollment = new Enrollment({
          student: student._id,
          course: courseId,
          status: "enrolled",
          paymentStatus: "free",
        });

        await enrollment.save();

        // Update student's enrolledCourses array
        await Student.findByIdAndUpdate(student._id, {
          $addToSet: { enrolledCourses: courseId },
        });

        // Update course students array
        await Course.findByIdAndUpdate(courseId, {
          $addToSet: { students: student._id },
        });

        // Send notification to tutor
        sendNotification(
          course.tutor.userId._id,
          `A new student has enrolled in your course: ${course.title}`
        );

        res.status(201).json({
          success: true,
          message: "Successfully enrolled in free course.",
          enrollment,
        });
        return;
      }

      // Handle paid courses
      if (student.walletBalance < course.price) {
        return res.status(400).json({
          message: "Insufficient wallet balance to enroll in this course.",
        });
      }

      // Deduct course price from student's wallet
      student.walletBalance -= course.price;
      await student.save();

      // Calculate platform commission and tutor earnings
      const platformFee = course.price * PLATFORM_COMMISSION;
      const tutorEarnings = course.price - platformFee;

      // Add earnings to tutor's wallet
      const tutor = await Tutor.findById(course.tutor._id);
      if (tutor) {
        await Tutor.findByIdAndUpdate(course.tutor._id, {
          $inc: { walletBalance: tutorEarnings },
        });
      }

      // Create enrollment
      const enrollment = new Enrollment({
        student: student._id,
        course: courseId,
        status: "enrolled",
        paymentStatus: "paid",
        amount: course.price,
      });

      await enrollment.save();

      // Update student's enrolledCourses array
      await Student.findByIdAndUpdate(student._id, {
        $addToSet: { enrolledCourses: courseId },
      });

      // Update course students array
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { students: student._id },
      });

      // Create earning record for tutor
      const earning = new Earning({
        tutorId: course.tutor._id,
        studentId: student._id,
        amount: tutorEarnings,
        type: "CourseEnrollment",
      });
      await earning.save();

      // Send notifications
      sendNotification(
        student.userId,
        `Successfully enrolled in ${course.title}. Amount deducted: $${course.price}`
      );

      sendNotification(
        course.tutor.userId._id,
        `A new student has enrolled in your course: ${course.title}. You earned $${tutorEarnings}`
      );

      sendRealTimeUpdate(course.tutor.userId._id, "course-enrollment", {
        course: course.title,
        student: student.userId,
        earnings: tutorEarnings,
      });

      res.status(201).json({
        success: true,
        message: "Successfully enrolled in course.",
        enrollment,
        amountPaid: course.price,
        remainingBalance: student.walletBalance,
      });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  },

  async getEnrollments(req, res) {
    try {
      const enrollments = await Enrollment.find()
        .populate("student", "userId")
        .populate("course", "title price")
        .sort({ createdAt: -1 });
      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getEnrollmentById(req, res) {
    try {
      const enrollment = await Enrollment.findById(req.params.id)
        .populate("student", "userId")
        .populate("course", "title description price tutor");

      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateEnrollment(req, res) {
    try {
      const enrollment = await Enrollment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteEnrollment(req, res) {
    try {
      const enrollment = await Enrollment.findById(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      // Remove course from student's enrolledCourses array
      await Student.findByIdAndUpdate(enrollment.student, {
        $pull: { enrolledCourses: enrollment.course },
      });

      // Remove student from course's students array
      await Course.findByIdAndUpdate(enrollment.course, {
        $pull: { students: enrollment.student },
      });

      await Enrollment.findByIdAndDelete(req.params.id);
      res.json({ message: "Enrollment deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get enrollments by student ID
  async getEnrollmentsByStudent(req, res) {
    try {
      const { studentId } = req.params;
      const enrollments = await Enrollment.find({ student: studentId })
        .populate({
          path: "course",
          select: "title description price courseImage tutor",
          populate: {
            path: "tutor",
            select: "userId",
            populate: {
              path: "userId",
              select: "name",
            },
          },
        })
        .populate("student", "userId")
        .sort({ createdAt: -1 });

      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get student's enrolled courses (from Student model)
  async getStudentEnrolledCourses(req, res) {
    try {
      const { studentId } = req.params;
      const student = await Student.findById(studentId).populate({
        path: "enrolledCourses",
        select: "title description price courseImage tutor",
        populate: {
          path: "tutor",
          select: "userId",
          populate: {
            path: "userId",
            select: "name",
          },
        },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(student.enrolledCourses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get current user's enrollments
  async getMyEnrollments(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const student = await Student.findOne({ userId: req.user.id });
      if (!student) {
        return res
          .status(403)
          .json({ message: "Unauthorized. Student profile not found." });
      }

      const enrollments = await Enrollment.find({ student: student._id })
        .populate({
          path: "course",
          select: "title description price courseImage tutor",
          populate: {
            path: "tutor",
            select: "userId",
            populate: {
              path: "userId",
              select: "name",
            },
          },
        })
        .sort({ createdAt: -1 });

      res.status(200).json({ enrollments });
    } catch (error) {
      console.error("Error fetching student enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  },

  // Get tutor's course enrollments
  async getTutorCourseEnrollments(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const tutor = await Tutor.findOne({ userId: req.user.id });
      if (!tutor) {
        return res
          .status(403)
          .json({ message: "Unauthorized. Tutor profile not found." });
      }

      // Find all courses by this tutor
      const courses = await Course.find({ tutor: tutor._id }).select(
        "_id title"
      );

      // Get enrollments for these courses
      const enrollments = await Enrollment.find({
        course: { $in: courses.map((c) => c._id) },
      })
        .populate({
          path: "student",
          select: "userId",
          populate: {
            path: "userId",
            select: "name",
          },
        })
        .populate("course", "title price")
        .sort({ createdAt: -1 });

      res.status(200).json({ enrollments });
    } catch (error) {
      console.error("Error fetching tutor course enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  },
};

module.exports = EnrollmentController;
