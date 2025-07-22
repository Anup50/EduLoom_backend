const Lesson = require("../model/Lesson");
const Course = require("../model/Course");
const Session = require("../model/Session");
const cloudinary = require("../utils/cloudinary");

exports.createLesson = async (req, res) => {
  try {
    let videoUrl = "";
    let duration = 0;

    // Handle recorded lesson video upload
    if (req.body.type === "recorded" && req.file) {
      // req.file already contains Cloudinary upload result
      videoUrl = req.file.path || req.file.secure_url;
      duration = req.file.duration || 0; // duration in seconds
    }

    // Use duration from Cloudinary (in seconds), convert to minutes
    const lesson = new Lesson({
      ...req.body,
      videoUrl: videoUrl || req.body.videoUrl,
      duration: duration ? Math.round(duration / 60) : req.body.duration, // fallback to provided duration if not available
    });
    await lesson.save();

    // Add lesson to the course's lessons array
    await Course.findByIdAndUpdate(lesson.course, {
      $push: { lessons: lesson._id },
    });

    // If the lesson is a live class, create a session for it
    if (lesson.type === "live") {
      // Try to get tutorId from request body, or from the course if not provided
      let tutorId = req.body.tutorId;
      if (!tutorId) {
        const course = await Course.findById(lesson.course);
        tutorId = course ? course.tutor : undefined;
      }
      await Session.create({
        lessonId: lesson._id,
        courseId: lesson.course,
        tutorId: tutorId,
        roomId: "", // will be set when session starts
        scheduledDate: lesson.scheduledDate,
        startTime: req.body.startTime || "", // or lesson.startTime if present
        status: "scheduled",
      });
    }

    res.status(201).json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json({ message: "Lesson deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
