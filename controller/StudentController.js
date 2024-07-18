const Student = require("../model/Student");
const User = require("../model/User");
const cloudinary = require("../utils/cloudinary");

// Fetch all students (Admin only)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "name email  profileImage role")
      .select("-walletBalance"); // Exclude sensitive data like wallet balance

    res.status(200).json({
      message: "Students fetched successfully",
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

// Fetch student profile (Authenticated student)
const getStudentProfile = async (req, res) => {
  console.log("Fetching profile student ", req.user);
  try {
    const studentId = req.user.id;

    const student = await Student.findOne({ userId: studentId }).populate(
      "userId",
      "name email profileImage role"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const responseToSend = {
      id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      profileImage: student.profileImage,
      role: student.userId.role,
      walletBalance: student.walletBalance,
    };
    res.status(200).json({
      message: "Student profile fetched successfully",
      student: responseToSend,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Failed to fetch student profile" });
  }
};

// Get enrolled courses for current student
const getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findOne({ userId: studentId }).populate({
      path: "enrolledCourses",
      populate: [
        {
          path: "tutor",
          select: "_id userId",
          populate: {
            path: "userId",
            select: "name",
          },
        },
        {
          path: "categories",
          select: "name",
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Transform the courses to match the desired format
    const courses = (student.enrolledCourses || []).map((course) => {
      // Calculate popularity based on number of students
      const popularity = course.students ? course.students.length : 0;

      return {
        _id: course._id,
        courseImage: course.courseImage,
        title: course.title,
        description: course.description,
        tutor: {
          _id: course.tutor._id,
          name: course.tutor.userId.name,
        },
        lessons: course.lessons || [],
        quizzes: course.quizzes || [],
        students: course.students || [],
        rating: course.rating || 0,
        duration: course.duration,
        price: course.price,
        isFree: course.isFree,
        categories: course.categories
          ? course.categories.map((cat) => cat.name)
          : [],
        difficulty: course.difficulty,
        requirements: course.requirements || [],
        outcomes: course.outcomes || [],
        startDate: course.startDate,
        startTime: course.startTime,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        __v: course.__v,
        popularity: popularity,
      };
    });

    res.status(200).json({
      message: "Courses fetched successfully",
      courses: courses,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCourses: courses.length,
      },
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ message: "Failed to fetch enrolled courses" });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  console.log("Updating student profile ", req.body);
  try {
    const studentId = req.user.id;
    const { name, email } = req.body;

    let profileImage = req.file?.path;

    // Update the user data
    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      { name, email },
      { new: true }
    );
    console.log("Updated user ", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedStudent = await Student.findOneAndUpdate(
      { userId: studentId },
      { ...(profileImage && { profileImage }) },
      { new: true }
    ).populate("userId", "name email profileImage role");
    res.status(200).json({
      message: "Profile updated successfully",
      updatedStudent,
    });
    console.log("Updated student ", updatedStudent);
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Failed to update student profile" });
  }
};

module.exports = {
  getAllStudents,
  getStudentProfile,
  getEnrolledCourses,
  updateStudentProfile,
};
