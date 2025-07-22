const Note = require("../model/Note");
const Student = require("../model/Student");
const Course = require("../model/Course");
const Lesson = require("../model/Lesson"); // Added Lesson import
const { sanitizeHTML, isSafeHTML } = require("../utils/sanitizer");

exports.createNote = async (req, res) => {
  try {
    // Get authenticated student
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    console.log("Original content:", req.body.content);

    // Sanitize the HTML content
    const sanitizedContent = sanitizeHTML(req.body.content);

    console.log("Sanitized content:", sanitizedContent);

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Note content is required and cannot be empty after sanitization",
      });
    }

    // Verify that the student is enrolled in the course
    if (!student.enrolledCourses.includes(req.body.course)) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to create notes",
      });
    }

    // Check if note already exists for this student and lesson
    const existingNote = await Note.findOne({
      student: student._id,
      lesson: req.body.lesson,
    });

    if (existingNote) {
      return res.status(400).json({
        success: false,
        message:
          "A note already exists for this lesson. Use update endpoint to modify it.",
        note: existingNote,
      });
    }

    // Create note with sanitized content
    const note = new Note({
      course: req.body.course,
      lesson: req.body.lesson,
      content: sanitizedContent,
      student: student._id,
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      note,
    });
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create note",
      error: err.message,
    });
  }
};

// Get or create note for a lesson (one note per student per lesson)
exports.getOrCreateNote = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find existing note for this student and lesson
    let note = await Note.findOne({
      student: student._id,
      lesson: lessonId,
    })
      .populate("course", "title")
      .populate("lesson", "title");

    if (note) {
      // Note exists, return it
      return res.json({
        success: true,
        message: "Existing note found",
        note: note,
        isNew: false,
      });
    } else {
      // No note exists, create an empty one
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      // Verify student is enrolled in the course
      const course = await Course.findById(lesson.course);
      if (!course || !student.enrolledCourses.includes(course._id)) {
        return res.status(403).json({
          success: false,
          message: "You must be enrolled in this course to create notes",
        });
      }

      // Create empty note
      note = new Note({
        student: student._id,
        course: course._id,
        lesson: lessonId,
        content: "",
        sharedWith: [],
        isShared: false,
      });

      await note.save();

      // Populate the created note
      await note.populate("course", "title");
      await note.populate("lesson", "title");

      return res.json({
        success: true,
        message: "New note created",
        note: note,
        isNew: true,
      });
    }
  } catch (err) {
    console.error("Error getting or creating note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get or create note",
      error: err.message,
    });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("student", "userId")
      .populate("course", "title")
      .populate("lesson", "title");
    res.json({
      success: true,
      notes,
    });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
      error: err.message,
    });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("student", "userId")
      .populate("course", "title")
      .populate("lesson", "title");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.json({
      success: true,
      note,
    });
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch note",
      error: err.message,
    });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Only the author can update the note
    if (String(note.student) !== String(student._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the author can update this note",
      });
    }

    // Sanitize the HTML content
    const sanitizedContent = sanitizeHTML(req.body.content);

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Note content is required and cannot be empty after sanitization",
      });
    }

    // Update the note with sanitized content
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { content: sanitizedContent },
      { new: true }
    )
      .populate("student", "userId")
      .populate("course", "title")
      .populate("lesson", "title");

    res.json({
      success: true,
      message: "Note updated successfully",
      note: updatedNote,
    });
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update note",
      error: err.message,
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Only the author can delete the note
    if (String(note.student) !== String(student._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the author can delete this note",
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: err.message,
    });
  }
};

// Get notes for a lesson (authored by or shared with current student)
exports.getNotesForLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const notes = await Note.find({
      lesson: lessonId,
      $or: [{ student: student._id }, { sharedWith: student._id }],
    })
      .populate("student", "userId")
      .populate("course", "title")
      .populate("lesson", "title")
      .populate("sharedWith", "userId")
      .sort({ createdAt: -1 });

    // Format notes to include sharing information
    const formattedNotes = notes.map((note) => {
      const noteObj = note.toObject();
      return {
        ...noteObj,
        isOwner: note.student._id.toString() === student._id.toString(),
        isSharedWithMe: note.sharedWith?.some(
          (s) => s._id.toString() === student._id.toString()
        ),
        sharedWithCount: note.sharedWith?.length || 0,
      };
    });

    res.json({
      success: true,
      notes: formattedNotes,
      total: notes.length,
    });
  } catch (err) {
    console.error("Error fetching lesson notes:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lesson notes",
      error: err.message,
    });
  }
};

// Get notes shared with the current student
exports.getNotesSharedWithMe = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const notes = await Note.find({ sharedWith: student._id })
      .populate("student", "userId")
      .populate("course", "title")
      .populate("lesson", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
      total: notes.length,
    });
  } catch (err) {
    console.error("Error fetching shared notes:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shared notes",
      error: err.message,
    });
  }
};

// Share a note with other students
exports.shareNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const { studentIds } = req.body;
    const studentId = req.user.id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Only the author can share
    const author = await Student.findOne({ userId: studentId });
    if (!author || String(note.student) !== String(author._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the author can share this note",
      });
    }

    // Check all target students are enrolled in the same course
    const courseId = note.course;
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      enrolledCourses: courseId,
    });

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "All students must be enrolled in the same course",
      });
    }

    // Update note's sharedWith
    note.sharedWith = Array.from(
      new Set([...(note.sharedWith || []), ...studentIds])
    );
    note.isShared = true;
    await note.save();

    // Send notifications to all shared students
    const { sendNotification } = require("../utils/notifications");

    // Get course and lesson details for the notification message
    const course = await Course.findById(note.course).select("title");
    const lesson = await Lesson.findById(note.lesson).select("title");

    // Send notifications to all shared students
    for (const studentId of studentIds) {
      const targetStudent = await Student.findById(studentId);
      if (targetStudent) {
        await sendNotification(
          targetStudent.userId,
          `${author.name || "A student"} shared a note with you from "${
            course.title
          }" - "${lesson.title}"`,
          "communication"
        );
      }
    }

    // Emit socket event to notify recipients (if socket is available)
    if (global.io && global.connectedUsers) {
      studentIds.forEach(async (id) => {
        const targetStudent = await Student.findById(id);
        if (
          targetStudent &&
          global.connectedUsers[targetStudent.userId.toString()]
        ) {
          global.io
            .to(global.connectedUsers[targetStudent.userId.toString()])
            .emit("note-shared", {
              noteId: note._id,
              from: author._id,
              lesson: note.lesson,
              course: note.course,
            });
        }
      });
    }

    res.json({
      success: true,
      message: "Note shared successfully",
      note,
    });
  } catch (err) {
    console.error("Error sharing note:", err);
    res.status(500).json({
      success: false,
      message: "Failed to share note",
      error: err.message,
    });
  }
};

// Test endpoint for sanitization (remove in production)
exports.testSanitization = async (req, res) => {
  try {
    const { content } = req.body;

    console.log("=== SANITIZATION TEST ===");
    console.log("Original:", content);

    const sanitized = sanitizeHTML(content);

    console.log("Sanitized:", sanitized);
    console.log("Length difference:", content.length - sanitized.length);
    console.log("========================");

    res.json({
      original: content,
      sanitized: sanitized,
      lengthDifference: content.length - sanitized.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
