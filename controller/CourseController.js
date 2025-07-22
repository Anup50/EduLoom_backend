const Course = require("../model/Course");
const cloudinary = require("../utils/cloudinary");
const Tutor = require("../model/Tutor");
const mongoose = require("mongoose");
const Student = require("../model/Student");
const Category = require("../model/Categories");

exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id; // This is the User's _id from the token
    const tutorId = await Tutor.findOne({ userId });
    const {
      courseImage,
      title,
      description,
      duration,
      price,
      categories,
      difficulty,
      startDate,
      startTime,
      outcomes,
      requirements,
    } = req.body;

    // Basic validations
    if (!courseImage || typeof courseImage !== "string")
      return res
        .status(400)
        .json({ error: "Course image is required and must be a valid URL." });
    if (!title || !title.trim())
      return res.status(400).json({ error: "Title is required." });
    if (!difficulty || !difficulty.trim())
      return res.status(400).json({ error: "Difficulty is required." });
    if (!startDate)
      return res.status(400).json({ error: "Start date is required." });
    if (!startTime || !startTime.trim())
      return res.status(400).json({ error: "Start time is required." });

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: "Valid duration is required." });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: "Valid price is required." });
    }

    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Valid start date is required." });
    }

    // Categories - ensure array of trimmed strings or empty array
    let categoriesArray = [];
    if (Array.isArray(categories)) {
      categoriesArray = categories.map((c) => c.trim()).filter(Boolean);
    } else if (typeof categories === "string" && categories.trim()) {
      categoriesArray = [categories.trim()];
    }

    // Parse outcomes from JSON string to array
    let outcomesArray = [];
    if (outcomes) {
      try {
        if (typeof outcomes === "string") {
          outcomesArray = JSON.parse(outcomes);
        } else if (Array.isArray(outcomes)) {
          outcomesArray = outcomes;
        }
        // Ensure it's an array and filter out empty strings
        if (!Array.isArray(outcomesArray)) {
          outcomesArray = [];
        } else {
          outcomesArray = outcomesArray.filter((item) => item && item.trim());
        }
      } catch (error) {
        console.error("Error parsing outcomes:", error);
        return res.status(400).json({ error: "Invalid outcomes format" });
      }
    }

    // Parse requirements from JSON string to array
    let requirementsArray = [];
    if (requirements) {
      try {
        if (typeof requirements === "string") {
          requirementsArray = JSON.parse(requirements);
        } else if (Array.isArray(requirements)) {
          requirementsArray = requirements;
        }
        // Ensure it's an array and filter out empty strings
        if (!Array.isArray(requirementsArray)) {
          requirementsArray = [];
        } else {
          requirementsArray = requirementsArray.filter(
            (item) => item && item.trim()
          );
        }
      } catch (error) {
        console.error("Error parsing requirements:", error);
        return res.status(400).json({ error: "Invalid requirements format" });
      }
    }

    const courseData = {
      courseImage: courseImage.trim(),
      title: title.trim(),
      description: description?.trim() || "",
      tutor: tutorId,
      duration: durationNum,
      price: priceNum,
      isFree: priceNum === 0,
      categories: categoriesArray,
      difficulty: difficulty.trim(),
      startDate: parsedDate,
      startTime: startTime.trim(),
      outcomes: outcomesArray, // Store as array, not string
      requirements: requirementsArray, // Store as array, not string
    };

    // Add detailed logging
    console.log("=== Course Creation Data ===");
    console.log("User ID:", userId);
    console.log("Tutor:", tutorId);
    console.log("Course Data:", JSON.stringify(courseData, null, 2));
    console.log("Categories Array:", categoriesArray);
    console.log("Outcomes Array:", outcomesArray);
    console.log("Requirements Array:", requirementsArray);
    console.log("========================");

    const course = new Course(courseData);
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    console.log(courseData);
    res.status(500).json({ error: "Server error" });
  }
};
// Get all courses
// exports.getCourses = async (req, res) => {
//   try {
//     const courses = await Course.find().populate({
//       path: "tutor",
//       populate: { path: "userId", select: "name" },
//     });

//     // Transform the tutor field
//     const formattedCourses = courses.map((course) => {
//       let tutorObj = null;
//       if (course.tutor && course.tutor.userId) {
//         tutorObj = {
//           _id: course.tutor._id,
//           name: course.tutor.userId.name,
//         };
//       }
//       return {
//         ...course.toObject(),
//         tutor: tutorObj,
//       };
//     });

//     res.json(formattedCourses);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// exports.getCourses = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 6,
//       search,
//       sortBy = "title",
//       sortOrder = "asc",
//       difficulty,
//       category,
//       categorySlug,
//       isFree,
//     } = req.query;

//     const match = {
//       startDate: { $gte: new Date() }, // only upcoming
//     };

//     if (search) {
//       match.title = { $regex: search, $options: "i" };
//     }

//     if (difficulty) {
//       match.difficulty = difficulty;
//     }

//     if (isFree === "true") match.isFree = true;
//     if (isFree === "false") match.isFree = false;

//     // Category by slug or ObjectId
//     if (categorySlug) {
//       const categoryDoc = await Category.findOne({ slug: categorySlug });
//       if (categoryDoc) {
//         match.categories = { $in: [categoryDoc._id] };
//       } else {
//         return res.json({
//           message: "No courses found for category",
//           courses: [],
//           pagination: {
//             currentPage: Number(page),
//             totalPages: 0,
//             totalCourses: 0,
//           },
//         });
//       }
//     } else if (category && mongoose.Types.ObjectId.isValid(category)) {
//       match.categories = { $in: [new mongoose.Types.ObjectId(category)] };
//     }

//     const sortOptions = {};

//     if (sortBy === "popularity") {
//       sortOptions.popularity = sortOrder === "desc" ? -1 : 1;
//     } else if (sortBy === "recent") {
//       sortOptions.createdAt = -1;
//     } else if (["price", "rating", "title", "difficulty"].includes(sortBy)) {
//       sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     // Aggregation pipeline
//     const pipeline = [
//       { $match: match },
//       {
//         $addFields: {
//           popularity: { $size: "$students" },
//         },
//       },
//       { $sort: sortOptions },
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [{ $skip: skip }, { $limit: Number(limit) }],
//         },
//       },
//     ];

//     const result = await Course.aggregate(pipeline);
//     const courses = result[0].data;
//     const totalCourses = result[0].metadata[0]?.total || 0;

//     // Populate tutor and categories
//     const populatedCourses = await Course.populate(courses, [
//       {
//         path: "tutor",
//         populate: { path: "userId", select: "name" },
//       },
//       {
//         path: "categories",
//         select: "name", // get category names
//       },
//     ]);

//     // Format
//     const formattedCourses = populatedCourses.map((course) => {
//       const tutorObj =
//         course.tutor && course.tutor.userId
//           ? { _id: course.tutor._id, name: course.tutor.userId.name }
//           : null;

//       return {
//         ...course,
//         tutor: tutorObj,
//         categories: course.categories.map((cat) => cat.name),
//       };
//     });

//     res.json({
//       message: "Courses fetched successfully",
//       courses: formattedCourses,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(totalCourses / limit),
//         totalCourses,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching courses:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// exports.getCourses = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 6,
//       search,
//       sortBy = "title",
//       sortOrder = "asc",
//       difficulty,
//       category,
//       categorySlug,
//       isFree,
//     } = req.query;

//     const match = {};

//     if (search) {
//       match.title = { $regex: search, $options: "i" };
//     }

//     if (difficulty) {
//       match.difficulty = difficulty;
//     }

//     if (isFree === "true") match.isFree = true;
//     if (isFree === "false") match.isFree = false;

//     // Handle category filter (by slug or ObjectId)
//     if (categorySlug) {
//       const categoryDoc = await Category.findOne({ slug: categorySlug });
//       if (categoryDoc) {
//         match.categories = { $in: [categoryDoc._id] };
//       } else {
//         // If no category found, return empty
//         return res.json({
//           message: "No courses found for this category",
//           courses: [],
//           pagination: {
//             currentPage: Number(page),
//             totalPages: 0,
//             totalCourses: 0,
//           },
//         });
//       }
//     } else if (category && mongoose.Types.ObjectId.isValid(category)) {
//       match.categories = { $in: [new mongoose.Types.ObjectId(category)] };
//     }

//     const sortOptions = {};
//     if (sortBy === "popularity") {
//       sortOptions.popularity = sortOrder === "desc" ? -1 : 1;
//     } else if (sortBy === "recent") {
//       sortOptions.createdAt = sortOrder === "desc" ? -1 : 1;
//     } else if (["price", "rating", "title", "difficulty"].includes(sortBy)) {
//       sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
//     } else {
//       // Default sort fallback
//       sortOptions.title = 1;
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     // Normalize today date for comparing startDate
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const pipeline = [
//       {
//         $addFields: {
//           popularity: { $size: { $ifNull: ["$students", []] } },
//           isUpcoming: { $gte: ["$startDate", today] },
//         },
//       },
//       { $match: match },
//       {
//         $sort: {
//           isUpcoming: -1, // upcoming courses first
//           ...sortOptions,
//         },
//       },
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [{ $skip: skip }, { $limit: Number(limit) }],
//         },
//       },
//     ];

//     const result = await Course.aggregate(pipeline);

//     const courses = result[0].data;
//     const totalCourses = result[0].metadata[0]?.total || 0;

//     // Populate tutor and categories
//     const populatedCourses = await Course.populate(courses, [
//       {
//         path: "tutor",
//         populate: { path: "userId", select: "name" },
//       },
//       {
//         path: "categories",
//         select: "name",
//       },
//     ]);

//     // Format output
//     const formattedCourses = populatedCourses.map((course) => {
//       const tutorObj =
//         course.tutor && course.tutor.userId
//           ? { _id: course.tutor._id, name: course.tutor.userId.name }
//           : null;

//       return {
//         ...course,
//         tutor: tutorObj,
//         categories: course.categories.map((cat) => cat.name),
//       };
//     });

//     res.json({
//       message: "Courses fetched successfully",
//       courses: formattedCourses,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(totalCourses / limit),
//         totalCourses,
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching courses:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// Get a course by ID
exports.getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      search,
      sortBy = "title",
      sortOrder = "asc",
      difficulty,
      category,
      categorySlug,
      isFree,
      minPrice, // Changed from priceRange
      maxPrice, // Changed from priceRange
      minRating, // Changed from rating
      maxRating, // Changed from rating
    } = req.query;

    const match = {};

    if (search) {
      match.title = { $regex: search, $options: "i" };
    }

    if (difficulty) {
      match.difficulty = difficulty;
    }

    if (isFree === "true") match.isFree = true;
    if (isFree === "false") match.isFree = false;

    // **FIXED PRICE RANGE FILTERING**
    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice && !isNaN(minPrice)) {
        match.price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(maxPrice)) {
        match.price.$lte = Number(maxPrice);
      }
    }

    // **FIXED RATING FILTERING**
    if (minRating || maxRating) {
      const ratingFilter = {};
      if (minRating && !isNaN(minRating) && Number(minRating) > 0) {
        ratingFilter.$gte = Number(minRating);
      }
      if (maxRating && !isNaN(maxRating)) {
        ratingFilter.$lte = Number(maxRating);
      }

      // Handle courses with and without ratings
      if (Object.keys(ratingFilter).length > 0) {
        match.$or = [
          { rating: ratingFilter },
          {
            rating: { $exists: false },
            $expr: { $gte: [0, Number(minRating || 0)] },
          },
        ];
      }
    }

    // Handle category filter (by slug or ObjectId)
    if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug });
      if (categoryDoc) {
        match.categories = { $in: [categoryDoc._id] };
      } else {
        return res.json({
          message: "No courses found for this category",
          courses: [],
          pagination: {
            currentPage: Number(page),
            totalPages: 0,
            totalCourses: 0,
          },
        });
      }
    } else if (category && mongoose.Types.ObjectId.isValid(category)) {
      match.categories = { $in: [new mongoose.Types.ObjectId(category)] };
    }

    const sortOptions = {};
    if (sortBy === "popularity") {
      sortOptions.popularity = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "recent") {
      sortOptions.createdAt = sortOrder === "desc" ? -1 : 1;
    } else if (["price", "rating", "title", "difficulty"].includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions.title = 1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pipeline = [
      {
        $addFields: {
          popularity: { $size: { $ifNull: ["$students", []] } },
          isUpcoming: { $gte: ["$startDate", today] },
          // **ADD DEFAULT RATING FOR COURSES WITHOUT RATING**
          effectiveRating: { $ifNull: ["$rating", 0] },
        },
      },
      { $match: match },
      {
        $sort: {
          isUpcoming: -1,
          ...sortOptions,
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: Number(limit) }],
        },
      },
    ];

    const result = await Course.aggregate(pipeline);

    const courses = result[0].data;
    const totalCourses = result[0].metadata[0]?.total || 0;

    // Populate tutor and categories
    const populatedCourses = await Course.populate(courses, [
      {
        path: "tutor",
        populate: { path: "userId", select: "name" },
      },
      {
        path: "categories",
        select: "name",
      },
    ]);

    // Format output
    const formattedCourses = populatedCourses.map((course) => {
      const tutorObj =
        course.tutor && course.tutor.userId
          ? { _id: course.tutor._id, name: course.tutor.userId.name }
          : null;

      return {
        ...course,
        tutor: tutorObj,
        categories: course.categories.map((cat) => cat.name),
      };
    });

    // **IMPROVED DEBUG LOGGING**
    console.log("Applied filters:", {
      search,
      difficulty,
      category,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      isFree,
      matchQuery: match,
    });
    console.log(`Found ${totalCourses} courses matching filters`);

    res.json({
      message: "Courses fetched successfully",
      courses: formattedCourses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCourses / limit),
        totalCourses,
      },
    });
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get a course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: "tutor",
        populate: { path: "userId", select: "name" },
      })
      .populate({
        path: "categories",
        select: "name",
      });

    if (!course) return res.status(404).json({ error: "Course not found" });

    // Format the response to match the structure from getCourses
    const tutorObj =
      course.tutor && course.tutor.userId
        ? { _id: course.tutor._id, name: course.tutor.userId.name }
        : null;

    const formattedCourse = {
      ...course.toObject(),
      tutor: tutorObj,
      categories: course.categories.map((cat) => cat.name),
    };

    res.json(formattedCourse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// exports.getCourseById = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) return res.status(404).json({ error: "Course not found" });
//     res.json(course);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const {
      courseImage,
      title,
      description,
      duration,
      price,
      categories,
      difficulty,
      startDate,
      startTime,
      outcomes,
      requirements,
    } = req.body;

    if (title && !title.trim())
      return res.status(400).json({ error: "Title is required." });
    if (difficulty && !difficulty.trim())
      return res.status(400).json({ error: "Difficulty is required." });
    if (startDate && isNaN(new Date(startDate).getTime()))
      return res.status(400).json({ error: "Valid start date is required." });
    if (startTime && !startTime.trim())
      return res.status(400).json({ error: "Start time is required." });

    let durationNum, priceNum, parsedDate;
    if (duration !== undefined) {
      durationNum = Number(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        return res.status(400).json({ error: "Valid duration is required." });
      }
    }
    if (price !== undefined) {
      priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: "Valid price is required." });
      }
    }
    if (startDate !== undefined) {
      parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Valid start date is required." });
      }
    }

    // Categories - ensure array of trimmed strings or empty array
    let categoriesArray;
    if (categories !== undefined) {
      if (Array.isArray(categories)) {
        categoriesArray = categories.map((c) => c.trim()).filter(Boolean);
      } else if (typeof categories === "string" && categories.trim()) {
        categoriesArray = [categories.trim()];
      }
    }

    // Parse outcomes from JSON string to array
    let outcomesArray;
    if (outcomes !== undefined) {
      try {
        if (typeof outcomes === "string") {
          outcomesArray = JSON.parse(outcomes);
        } else if (Array.isArray(outcomes)) {
          outcomesArray = outcomes;
        }
        // Ensure it's an array and filter out empty strings
        if (!Array.isArray(outcomesArray)) {
          outcomesArray = [];
        } else {
          outcomesArray = outcomesArray.filter((item) => item && item.trim());
        }
      } catch (error) {
        console.error("Error parsing outcomes:", error);
        return res.status(400).json({ error: "Invalid outcomes format" });
      }
    }

    // Parse requirements from JSON string to array
    let requirementsArray;
    if (requirements !== undefined) {
      try {
        if (typeof requirements === "string") {
          requirementsArray = JSON.parse(requirements);
        } else if (Array.isArray(requirements)) {
          requirementsArray = requirements;
        }
        // Ensure it's an array and filter out empty strings
        if (!Array.isArray(requirementsArray)) {
          requirementsArray = [];
        } else {
          requirementsArray = requirementsArray.filter(
            (item) => item && item.trim()
          );
        }
      } catch (error) {
        console.error("Error parsing requirements:", error);
        return res.status(400).json({ error: "Invalid requirements format" });
      }
    }

    // Build update data
    const updateData = {};
    if (courseImage !== undefined) updateData.courseImage = courseImage.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (durationNum !== undefined) updateData.duration = durationNum;
    if (priceNum !== undefined) {
      updateData.price = priceNum;
      updateData.isFree = priceNum === 0;
    }
    if (categoriesArray !== undefined) updateData.categories = categoriesArray;
    if (difficulty !== undefined) updateData.difficulty = difficulty.trim();
    if (parsedDate !== undefined) updateData.startDate = parsedDate;
    if (startTime !== undefined) updateData.startTime = startTime.trim();
    if (outcomesArray !== undefined) updateData.outcomes = outcomesArray;
    if (requirementsArray !== undefined)
      updateData.requirements = requirementsArray;

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all difficulties
exports.getDifficulties = (req, res) => {
  res.json(["Beginner", "Intermediate", "Advanced"]);
};

exports.getCoursesByTutor = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("Fetching courses for userId:", userId);

    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      console.error("Tutor not found for userId:", userId);
      return res.status(404).json({ error: "Tutor not found for this user." });
    }

    const courses = await Course.find({ tutor: tutor._id });
    return res.json(courses);
  } catch (error) {
    console.error("Error fetching courses for userId:", req.user?._id, error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

// Toggle course completion status
exports.toggleCourseCompletion = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    // Find the tutor for this user
    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found for this user." });
    }

    // Find the course and verify it belongs to this tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutor._id });
    if (!course) {
      return res.status(404).json({
        error: "Course not found or you don't have permission to modify it.",
      });
    }

    // Toggle the completion status
    course.isCompleted = !course.isCompleted;
    course.updatedAt = new Date();

    await course.save();

    res.json({
      message: `Course ${
        course.isCompleted ? "marked as completed" : "marked as incomplete"
      }`,
      course: course,
    });
  } catch (error) {
    console.error("Error toggling course completion:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

// Get students enrolled in a specific course
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Find the course
    const course = await Course.findById(courseId)
      .populate({
        path: "tutor",
        select: "userId",
      })
      .populate({
        path: "students",
        select: "userId profileImage dateJoined",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check permissions
    const isTutor = course.tutor && course.tutor.userId.toString() === userId;
    const isAdmin = req.user.role === "admin";

    // Check if user is enrolled in the course
    const currentStudent = await Student.findOne({ userId });
    const isEnrolled =
      currentStudent &&
      course.students.some(
        (student) => student._id.toString() === currentStudent._id.toString()
      );

    // Authorization: Only tutor, enrolled students, or admin can see the list
    if (!isTutor && !isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view students in this course",
      });
    }

    // Format the response
    const students = (course.students || []).map((student) => ({
      _id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      profileImage: student.profileImage,
      dateJoined: student.dateJoined,
    }));

    res.json({
      success: true,
      courseId: course._id,
      courseTitle: course.title,
      students: students,
      totalStudents: students.length,
      userRole: isTutor ? "tutor" : isEnrolled ? "student" : "admin",
    });
  } catch (err) {
    console.error("Error fetching course students:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course students",
      error: err.message,
    });
  }
};
