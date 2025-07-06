const Course = require("../model/Course");
const cloudinary = require("../utils/cloudinary");
const Tutor = require("../model/Tutor");
const mongoose = require("mongoose");

// exports.createCourse = async (req, res) => {
//   try {
//     const userId = req.user.id; // This is the User's _id from the token
//     const tutorId = await Tutor.findOne({ userId });
//     const {
//       courseImage,
//       title,
//       description,
//       duration,
//       price,
//       categories,
//       difficulty,
//       startDate,
//       startTime,
//       outcomes,
//       requirements,
//     } = req.body;

//     // Basic validations
//     if (!courseImage)
//       return res.status(400).json({ error: "Course image is required." });
//     if (!title || !title.trim())
//       return res.status(400).json({ error: "Title is required." });
//     if (!difficulty || !difficulty.trim())
//       return res.status(400).json({ error: "Difficulty is required." });
//     if (!startDate)
//       return res.status(400).json({ error: "Start date is required." });
//     if (!startTime || !startTime.trim())
//       return res.status(400).json({ error: "Start time is required." });

//     const durationNum = Number(duration);
//     if (isNaN(durationNum) || durationNum <= 0) {
//       return res.status(400).json({ error: "Valid duration is required." });
//     }

//     const priceNum = Number(price);
//     if (isNaN(priceNum) || priceNum < 0) {
//       return res.status(400).json({ error: "Valid price is required." });
//     }

//     const parsedDate = new Date(startDate);
//     if (isNaN(parsedDate.getTime())) {
//       return res.status(400).json({ error: "Valid start date is required." });
//     }

//     // Categories - ensure array of trimmed strings or empty array
//     let categoriesArray = [];
//     if (Array.isArray(categories)) {
//       categoriesArray = categories.map((c) => c.trim()).filter(Boolean);
//     } else if (typeof categories === "string" && categories.trim()) {
//       categoriesArray = [categories.trim()];
//     }

//     const courseData = {
//       courseImage: courseImage.trim(),
//       title: title.trim(),
//       description: description?.trim() || "",
//       tutor: tutorId,
//       duration: durationNum,
//       price: priceNum,
//       isFree: priceNum === 0,
//       categories: categoriesArray,
//       difficulty: difficulty.trim(),
//       startDate: parsedDate,
//       startTime: startTime.trim(),
//       outcomes: outcomes?.trim() || "",
//       requirements: requirements?.trim() || "",
//     };

//     const course = new Course(courseData);
//     await course.save();

//     res.status(201).json(course);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

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
    if (!courseImage)
      return res.status(400).json({ error: "Course image is required." });
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

    const course = new Course(courseData);
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
    if (outcomes !== undefined) updateData.outcomes = outcomes.trim();
    if (requirements !== undefined)
      updateData.requirements = requirements.trim();

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
