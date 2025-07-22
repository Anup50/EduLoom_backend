const Joi = require("joi");
const mongoose = require("mongoose");

// Helper function to validate ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const noteValidation = {
  createNote: Joi.object({
    course: objectId.required().messages({
      "any.required": "Course ID is required",
      "any.invalid": "Invalid course ID format",
    }),
    lesson: objectId.optional().messages({
      "any.invalid": "Invalid lesson ID format",
    }),
    content: Joi.string().min(1).max(10000).required().messages({
      "string.empty": "Note content cannot be empty",
      "string.min": "Note content must be at least 1 character long",
      "string.max": "Note content cannot exceed 10000 characters",
      "any.required": "Note content is required",
    }),
  }),

  updateNote: Joi.object({
    content: Joi.string().min(1).max(10000).required().messages({
      "string.empty": "Note content cannot be empty",
      "string.min": "Note content must be at least 1 character long",
      "string.max": "Note content cannot exceed 10000 characters",
      "any.required": "Note content is required",
    }),
  }),

  shareNote: Joi.object({
    studentIds: Joi.array().items(objectId).min(1).required().messages({
      "array.min": "At least one student must be selected to share with",
      "any.required": "Student IDs are required",
      "any.invalid": "Invalid student ID format",
    }),
  }),

  noteId: Joi.object({
    id: objectId.required().messages({
      "any.required": "Note ID is required",
      "any.invalid": "Invalid note ID format",
    }),
  }),

  lessonId: Joi.object({
    lessonId: objectId.required().messages({
      "any.required": "Lesson ID is required",
      "any.invalid": "Invalid lesson ID format",
    }),
  }),
};

module.exports = noteValidation;
