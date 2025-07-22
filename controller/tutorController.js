const Tutor = require("../model/Tutor");
const User = require("../model/User");

const Course = require("../model/Course");
const bcryptjs = require("bcryptjs");
const cloudinary = require("../utils/cloudinary");
const Enrollment = require("../model/Enrollment");

const getTutors = async (req, res) => {
  try {
    const {
      minRating,
      maxRating,
      search,
      sortBy,
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      const userSearchQuery = {
        $or: [{ name: { $regex: search, $options: "i" } }],
      };

      const users = await User.find(userSearchQuery).select("_id");
      const userIds = users.map((user) => user._id);

      query.$or = [
        { userId: { $in: userIds } },
        { bio: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minHourlyRate)
      query.hourlyRate = { ...query.hourlyRate, $gte: Number(minHourlyRate) };
    if (maxHourlyRate)
      query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxHourlyRate) };

    if (minRating) query.rating = { ...query.rating, $gte: Number(minRating) };
    if (maxRating) query.rating = { ...query.rating, $lte: Number(maxRating) };

    const sortOptions = {};
    if (sortBy) {
      const validSortFields = ["hourlyRate", "rating", "name"];
      if (validSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
      }
    }

    const tutors = await Tutor.find(query)
      .populate("userId", "name profileImage email")

      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalTutors = await Tutor.countDocuments(query);

    const filteredTutors = tutors.map((tutor) => ({
      id: tutor._id,
      name: tutor.userId?.name,
      profileImage: tutor.profileImage,
      email: tutor.userId?.email,
      bio: tutor.bio,
      description: tutor.description,

      rating: tutor.rating,

      availability: tutor.availability,
    }));

    res.status(200).json({
      message: "Tutors fetched successfully",
      tutors: filteredTutors,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalTutors / limit),
        totalTutors,
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).json({ message: "Failed to fetch tutors" });
  }
};

const updateTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const {
      bio,
      description,
      hourlyRate,
      availability,
      teachingIntrests,
      experience,
    } = req.body;

    const updateFields = {};

    if (bio) updateFields.bio = bio;
    if (description) updateFields.description = description;
    if (hourlyRate) updateFields.hourlyRate = hourlyRate;
    if (availability) updateFields.availability = availability;
    if (experience && Array.isArray(experience)) {
      updateFields.experience = experience
        .map((exp) => exp.trim())
        .filter(Boolean);
    }
    if (teachingIntrests && Array.isArray(teachingIntrests)) {
      updateFields.teachingIntrests = teachingIntrests
        .map((interest) => interest.trim())
        .filter(Boolean);
    }

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "tutor-profile-images",
      });
      updateFields.profileImage = uploadResult.secure_url;
      console.log("uploadResult:", uploadResult);
    }

    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId: tutorId },
      { $set: updateFields },
      { new: true }
    ).populate("userId", "name email profileImage");

    if (!updatedTutor) {
      return res
        .status(404)
        .json({ message: "Tutor not found or unauthorized" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      updatedTutor,
    });
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    res.status(500).json({ message: "Failed to update tutor profile" });
  }
};
const getTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const tutor = await Tutor.findOne({ userId: tutorId }).populate(
      "userId",
      "name email profileImage"
    );

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Get all courses by this tutor
    const courses = await Course.find({ tutor: tutor._id });
    const coursesCount = courses.length;

    // Get total unique students enrolled in tutor's courses
    const enrollments = await Enrollment.find({
      course: { $in: courses.map((course) => course._id) },
    }).distinct("student");

    const totalStudents = enrollments.length;

    // Ensure arrays are properly handled
    const teachingInterests = Array.isArray(tutor.teachingIntrests)
      ? tutor.teachingIntrests.filter((interest) => interest)
      : [];

    const experience = Array.isArray(tutor.experience)
      ? tutor.experience.filter((exp) => exp)
      : [];

    const tutorProfile = {
      id: tutor._id,
      name: tutor.userId.name,
      email: tutor.userId.email,
      profileImage: tutor.profileImage || tutor.userId.profileImage,
      bio: tutor.bio,
      experience: experience,
      teachingIntrests: teachingInterests,
      walletBalance: tutor.walletBalance,
      dateJoined: tutor.dateJoined,
      rating: tutor.rating,
      coursesPublished: coursesCount,
      totalStudents: totalStudents,
    };

    res.status(200).json({
      message: "Tutor profile fetched successfully",
      tutor: tutorProfile,
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    res.status(500).json({ message: "Failed to fetch tutor profile" });
  }
};

const getTutorByUsername = async (req, res) => {
  try {
    const { name } = req.params;
    const user = await User.findOne({ name });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Tutor with the given username not found" });
    }

    const tutor = await Tutor.findOne({ userId: user._id })
      .populate("userId", "name profileImage")
      .populate("name");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const tutorProfile = {
      id: tutor._id,
      name: tutor.userId?.name || "N/A",
      profileImage: tutor.profileImage,
      bio: tutor.bio,

      description: tutor.description,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      // subjects: tutor.subjects.map((subject) => subject.name),
      availability: tutor.availability,
    };

    res.status(200).json({
      message: "Tutor profile fetched successfully",
      tutor: tutorProfile,
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    res.status(500).json({ message: "Failed to fetch tutor profile" });
  }
};

module.exports = {
  getTutors,
  updateTutorProfile,
  getTutorByUsername,
  getTutorProfile,
};
